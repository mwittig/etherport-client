# etherport-client

Client-side virtual serial port for Rick Waldron's [Etherport](https://github.com/rwaldron/etherport). 
Etherport-client is used to implement firmata-compatible boards and tethering hubs to control a board 
by a remote entity.
 
## Usage Examples

The following usage examples can also be found in the `examples` directory of this package/project. 
 Note, you'll need to manually install the required packages to run the examples 
 (see `require` statements in the example code).

### Tethering a Johnny Five IO-Plugin
 
Create an `EtherPortClient` with `host` and `port` properties referring to the peer transport endpoint of the
`EtherPort` instance. Next, bind the resulting object to an IO-plugin using 
[remote-io](https://github.com/monteslu/remote-io) (see example below).

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


### Tethering a Serial Port (Chaining)

You can also simply chain Serial Port objects. For example, if you have a host with an Arduino board connected via 
USB and you want to access the Arduino board from a remote computer, you chain the Serial Ports on the host as follows.

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

### Using StandardFirmataWiFi with ESP8266
 
By default, StandardFirmataWiFi with ESP8266 is a TCP Server. Thus, you'll need a TCP client transport for J5.
 
    var five = require("johnny-five");
    var EtherPortClient = require("etherport-client").EtherPortClient;
    // update host to the IP address for your ESP board
    var board = new five.Board({
        port: new EtherPortClient({
            host: "10.0.0.17",
            port: 3030
        }),
        timeout: 1e5,
        repl: false
    });
   
    board.on("ready", function() {
        console.log("READY!");
        var led = new five.Led(2);
        led.blink(500);
    });
   
## Debugging 
 
For debugging purposes the [debug package](https://github.com/visionmedia/debug) with topic "etherport-client" is used.
 
## License
 
[The MIT License (MIT), Copyright (c) 2015-2019 Marcus Wittig](https://github.com/mwittig/etherport-client/blob/master/LICENSE)
 
 
 
 
