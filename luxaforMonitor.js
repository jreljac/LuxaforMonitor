var config          = require("./luxaforMonitor.config");
var async           = require("async");
const fs            = require("fs");
var Luxafor         = require("luxafor")();
var request         = require("request");
var offDay          = "Not monitoring - not a work day";
var offTime         = "Not monitoring - outside of work hours";
var offMsg          = "";
var logFileName     = "";
var startMsg        = "";
var serverMsg       = "";
var urlMsg          = "";
var urlErrMsg       = "";
var hasError        = "";
var logToConsole    = false;

if(process.argv.length===3 && process.argv[2]==="true") {
    logToConsole = true
}

var getNetworkIPs = (function () {
    //From: http://stackoverflow.com/a/3742915/99401
    var ignoreRE = /^(127\.0\.0\.1|::1|fe80(:1)?::1(%.*)?)$/i;
    var exec = require("child_process").exec;
    var cached;
    var command;
    var filterRE;

    switch (process.platform) {
    case "win32":
        command     = "ipconfig";
        filterRE    = /\bIPv[46][^:\r\n]+:\s*([^\s]+)/g;
        break;
    case "darwin":
        command     = "ifconfig";
        filterRE    = /\binet\s+([^\s]+)/g;
        break;
    default:
        command     = "ifconfig";
        filterRE    = /\binet\b[^:]+:\s*([^\s]+)/g;
        break;
    }

    return function (callback, bypassCache) {
        if (cached && !bypassCache) {
            callback(null, cached);
            return;
        }
        // system call
        exec(command, function (error, stdout, sterr) {
            cached = [];
            var ip;
            var matches = stdout.match(filterRE) || [];
            
            for (var i = 0; i < matches.length; i++) {
                ip = matches[i].replace(filterRE, '$1')
                if (!ignoreRE.test(ip)) {
                    cached.push(ip);
                }
            }
            callback(error, cached);
        });
    };
})();

function _sendIP(emailUser, emailPassword, emailTo) {
    "use strict";

    var nodemailer  = require("nodemailer");
    var os          = require("os");
    var hostname    = os.hostname();

    getNetworkIPs(function (error, ip) {
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: emailUser,
                pass: emailPassword
            }
        });

        // setup email data with unicode symbols
        let mailOptions = {
            from: emailUser, // sender address
            to: emailTo, // list of receivers
            subject: hostname + " IP Address: " + ip, // Subject line
            text: hostname + " IP Address: " + ip, // plain text body
            html: hostname + " IP Address: <strong>" + ip + "</strong>" // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if(error) {
                return console.log(error);
            }
        });
        if(error) {
            console.log("error:", error);
        }
    }, false);  
}

function _padIN(input) {
    //For padding minutes and seconds
    return input < 10 ? "0" + input : input;
};

function _getDTStamp(mode) {
    //One place to organize a date time stamp

    var date = new Date();
    var current_year    = date.getFullYear();
    var current_month   = date.getMonth();
        current_month++;
        current_month   = _padIN(current_month);
    var current_date    = _padIN(date.getDate());
    var current_hour    = date.getHours();
    var current_minutes = _padIN(date.getMinutes());
    var current_seconds = _padIN(date.getSeconds());
    var current_DTStamp;

    switch(mode) {
        case "logName":
            //YYYY_mm_dd
            current_DTStamp = current_year + "_" + current_month + "_" + current_date;
            break;
        case "complete":
        default:
            //hh:mm:ss mm/dd/YYYY
            current_DTStamp = current_hour + ":" + current_minutes + ":" + current_seconds + " " + current_month + "/" + current_date + "/" + current_year;
            break;
    }
    
    return current_DTStamp;
}

function _logEntry(logPathAndName, logData) {
    //Log to console if necessary
    if(logToConsole===true) {
        console.log(logData);
    }

    //Write logData to logPathAndName
    fs.appendFile(logPathAndName, logData + "\n", function (err) {
        if(err) throw err;
    });
}

var fetch = function(file, cb) {
    //Set up the date object, we use to limit when things are on
    var date            = new Date();
    var current_hour    = date.getHours();
    var current_day     = date.getDay();

    //If we are on a day that is included in the setup
    if(config.includeDays.includes(current_day)) {
        //If we are between startTime and endTime
        if(current_hour>config.startTime && current_hour<config.endTime) {
            var fileBits    = file.split("|");
                offMsg      = "";
                hasError    = false;

            request.get(fileBits[0], function(err, response, body){
                if(err) {
                    cb(err);
                } else {
                    if(body!=="Success") {
                        body = fileBits[1] + " DOWN"
                    }
                    cb(null, body);
                } 
            });
        } else {
            //Turn off since we're not in "work" hours
            Luxafor.init(function () {
                Luxafor.setColor(0, 0, 0, function () { });
            });

            if(offMsg!==offTime) {
                _logEntry(offTime);
            }
            offMsg = offTime;
        }
    } else {
        //Turn off since we're not on a "work" day
        Luxafor.init(function () {
            Luxafor.setColor(0, 0, 0, function () { });
        });

        if(offMsg!==offDay) {
            _logEntry(offDay);
        }
        offMsg = offDay;
    }
}

if(process.argv.length>=3 && process.argv[2]!=="true") {
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
} else {
    if(config.sendMailOnStart===true) {
        _sendIP(config.emailUser, config.emailPassword, config.emailTo);
    };

    //Set the light to yellow as we start things up
    Luxafor.init(function () {
        Luxafor.setColor(255, 255, 0, function () { });
    });

    logFileName = _getDTStamp("logName") + ".log";
    theLogFile  = config.logFilePath + logFileName;
    startMsg    = "Starting to monitor at " + _getDTStamp();
                _logEntry(theLogFile, startMsg);
    serverMsg   = "  Checking the following servers every " + config.counterInterval + " seconds";
                _logEntry(theLogFile, serverMsg);

    for(eachURL of config.urlsToCheck) {
        thisURL = eachURL.split("|");
        urlMsg  = "    " + thisURL[1] + " at " + thisURL[0];
                _logEntry(theLogFile, urlMsg);
    }

    //Then run again every x seconds
    //Multiple the interval by 1000 to get JS seconds
    var setCounterInterval = config.counterInterval * 1000;

    //From: http://stackoverflow.com/a/11063489/99401
    setInterval(function(){ 
        async.map(config.urlsToCheck, fetch, function(err, results){
            if(err){

            } else {
                for(each of results) {
                    if(each!==config.upKeyword) {
                        //Missing keyword, turn the light red and set the hasError variable to true
                        Luxafor.init(function () {
                            Luxafor.setLuxaforColor(Luxafor.colors.red, function () { });
                        });

                        logFileName = _getDTStamp("logName") + ".log";
                        urlErrMsg   = ".." + each + " at " + _getDTStamp();
                            _logEntry(theLogFile, urlErrMsg);
                        hasError = true
                    } else {
                        if(hasError!=true) {
                            //If all are good turn the light green
                            Luxafor.init(function () {
                                Luxafor.setLuxaforColor(Luxafor.colors.green, function () { });
                            });
                        }
                    }
                }
            }
        });
    }, setCounterInterval);
    //Repeat every x seconds until ...
}