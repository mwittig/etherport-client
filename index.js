'use strict';

var net = require('net'),
    util = require('util'),
    events = require('events'),
    debug = require('debug')('etherport-client');


function EtherPortClient(opts) {
    events.EventEmitter.call(this);

    if (typeof opts === 'undefined' || typeof opts.host === 'undefined' || typeof opts.port === 'undefined') {
        throw new Error('Expected object with "host" and "port" settings');
    }
    this.path = 'Connecting to host:port: ' + opts.host + ':' + opts.port;
    this.name = 'EtherPortClient';
    this.host = opts.host;
    this.port = opts.port;

    this._reconnectTimeoutSecs = opts.reconnectTimeout || 15;
    this._queue = [];
    this._socket = null;
    this._reconnectTimer = null;

    this._tcp = new net.Socket();
    this._tcp.on('connect', this._onConnectHandler());
    this._tcp.on('data', this._onDataHandler());
    this._tcp.on('error', this._onErrorHandler());
    this._tcp.on('timeout', this._onTimeoutHandler());
    this._tcp.on('close', this._onCloseHandler());
    this._connect();
}
util.inherits(EtherPortClient, events.EventEmitter);

EtherPortClient.prototype._connect = function () {
    debug(this.path);
    this._tcp.setNoDelay(true);
    this._tcp.setTimeout(5000);
    this._tcp.connect(this.port, this.host);
};

EtherPortClient.prototype._reconnect = function () {
    var self = this;

    if (self._reconnectTimeoutSecs > 0) {
        debug(util.format('Reconnect after %d second(s)', self._reconnectTimeoutSecs));
        if (this._reconnectTimer === null) {
            this._reconnectTimer = setTimeout(function () {
                self._reconnectTimer = null;
                self._connect();
            }, self._reconnectTimeoutSecs * 1000)
        }
    }

};

EtherPortClient.prototype._flushTo = function (socket) {
    if (this._socket === null) {
        this._socket = socket;
        this.emit('open');
        //this._socket.on("drain");
    }
    if (this._queue.length) {
        this._queue.forEach(function (buffer) {
            this._socket.write(buffer);
        }, this);

        this._queue.length = 0;
    }
};

EtherPortClient.prototype._onConnectHandler = function () {
    var self = this;

    return function () {
        debug('Socket connected');
        self._tcp.setTimeout(0);
        self._flushTo(self._tcp);
    }
};

EtherPortClient.prototype._onDataHandler = function () {
    var self = this;

    return function (data) {
        debug('Message received:', data.length, 'byte(s)');
        self.emit('data', data);
    };
};

EtherPortClient.prototype._onErrorHandler = function () {
    var self = this;

    return function (error) {
        debug('Error:', error);
        if (self._socket !== null) {
            self._socket = null;
        }
        self._reconnect();
    }
};

EtherPortClient.prototype._onTimeoutHandler = function () {
    var self = this;

    return function () {
        debug('Connection timeout');
        if (self._socket !== null) {
            self._socket = null;
        }
        self._tcp.destroy();
        self._reconnect();
    }
};

EtherPortClient.prototype._onCloseHandler = function () {
    var self = this;

    return function () {
        debug('Socket closed');
        if (self._socket !== null) {
            self._socket = null;
            self._reconnect();
        }
    }
};

EtherPortClient.prototype.write = function (buffer, callback) {
    if (!Buffer.isBuffer(buffer)) {
        buffer = new Buffer(buffer);
    }
    if (this._socket === null) {
        debug('Message queued:', buffer.length, 'byte(s)');
        this._queue.push(buffer);
    }
    else {
        debug('Message written:', buffer.length, 'byte(s)');
        this._socket.write(buffer);
    }
    if (typeof callback === "function") {
        process.nextTick(callback)
    }
};

//
// Local Helper Object to wait for the open event on two Serial Port objects 
//

function OpenEventObserver(clientPort, serverPort) {
    events.EventEmitter.call(this);

    this.isClientPortOpen = false;
    this.isServerPortOpen = false;

    clientPort.on('open', this._clientPortOpenHandler(this));
    serverPort.on('open', this._serverPortOpenHandler(this));
}
util.inherits(OpenEventObserver, events.EventEmitter);

OpenEventObserver.prototype._clientPortOpenHandler = function (self) {
    return function() {
        self.isClientPortOpen = true;
        if (self.isServerPortOpen) {
            self.emit('open');
        }
    }
};

OpenEventObserver.prototype._serverPortOpenHandler = function (self) {
    return function() {
        self.isServerPortOpen = true;
        if (self.isClientPortOpen) {
            self.emit('open');
        }
    }
};

//
// Helper function to chain Serial Port objects
//

function chainSerialPorts(clientPort, serverPort) {
    var observer = new OpenEventObserver(clientPort, serverPort);

    function serverPortWrite(data) {
        try {
            debug('writing to serverPort', data);
            if (! Buffer.isBuffer(data)) {
                data = new Buffer(data);
            }
            serverPort.write(data);
        }
        catch (ex) {
            debug('error reading message', ex);
        }
    }

    function clientPortWrite(data) {
        try {
            debug('writing to clientPort', data);
            if (! Buffer.isBuffer(data)) {
                data = new Buffer(data);
            }
            clientPort.write(data);
        }
        catch (ex) {
            debug('error reading message', ex);
        }
    }

    observer.once('open', function (data) {
        serverPort.on('data', function (data) {
            clientPortWrite(data);
        });

        clientPort.on('data', function (data) {
            serverPortWrite(data);
        });
    });
}

module.exports.EtherPortClient = EtherPortClient;
module.exports.chainSerialPorts = chainSerialPorts;