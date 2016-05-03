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