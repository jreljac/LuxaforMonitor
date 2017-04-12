//A simple file for testing & turning the Luxafor off
//EXAMPLES:
//To turn the LED off: node luxaforPower.js off
//To turn the LED on: node luxaforPower.js on
//To turn the LED on and make it yellow: node luxaforPower.js on 255 255 0

var Luxafor = require("luxafor")();
var mode    = process.argv[2];
var R, G, B;

if(mode==="off") {
    R = 0;
    G = 0;
    B = 0;
} else {
    if(process.argv.length==3) {
        R = 255;
        G = 255;
        B = 255;
    } else {
        R = process.argv[3];
        G = process.argv[4];
        B = process.argv[5];
    }
}

Luxafor.init(function () {
    Luxafor.setColor(R, G, B, function(){});
}); 