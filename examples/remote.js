var EtherPortClient = require('etherport-client').EtherPortClient;
var RemoteIO = require('remote-io');
var RaspiIO = require('raspi-io');
var io = new RaspiIO();

io.on('ready', function() {
    console.log("ready");

    var sp = new EtherPortClient({
        host: '192.168.178.70',
        port: 41234
    });


    //listen for remote firmata messages
    var remoteIO = new RemoteIO({
        serial: sp,
        io: io
    });
});