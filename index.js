'use strict';

var net = require("net"),
    util = require("util"),
    events = require("events");

function EtherPortClient(opts) {
    events.EventEmitter.call(this);

    if (typeof opts === "undefined" || typeof opts.host === "undefined" || typeof opts.port === "undefined") {
        throw new Error("Expected object with 'host' and 'port' settings");
    }
    this.path = "Connecting to host:port: " + opts.host + ':' + opts.port;
    this.name = "EtherPortClient";

    var self = this;
    this.state = {
        queue: [],
        socket: null,
        flushTo: function(socket) {
            if (this.socket === null) {
                this.socket = socket;
                self.emit("open");
            }
            if (this.queue.length) {
                this.queue.forEach(function(buffer) {
                    self.socket.write(buffer);
                }, this);

                this.queue.length = 0;
            }
        }
    };

    var tcp = new net.Socket();
    tcp.setNoDelay(true);
    tcp.connect(opts.port, opts.host, function() {
        console.log('XXX Connected');
        state.flushTo(tcp);
        tcp.on("data", function(data) {
            console.log('XXX Data', data.length);
            this.emit("data", data);
        }.bind(this));
    }.bind(this));
}


EtherPortClient.prototype.write = function(buffer) {

    if (this.state.socket === null) {
        this.state.queue.push(buffer);
    } 
    else {
        this.state.socket.write(buffer);
    }
};


module.exports = EtherPortClient;