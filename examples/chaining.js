var EtherPortClient = require('etherport-client').EtherPortClient;
var chainSerialPorts = require('etherport-client').chainSerialPorts;
var SerialPort = require("serialport").SerialPort;

chainSerialPorts(
    new EtherPortClient({
        host: '192.168.178.70',
        port: 41234
    }),
    new SerialPort("/dev/ttyUSB1", {
        baudrate: 57600
    })
);