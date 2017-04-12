//Changable variables
var startTime       = 5;                    //Starting time - military time
var endTime         = 21;                   //Ending time - military time
var includeDays     = [1,2,3,4,5];          //Days of the week to run 0=Sunday
var counterInterval = 60;                   //Run the check every x seconds - this should not be a crazy low number
var upKeyword       = "Success";            //URL should show "Success"
var logFilePath     = "/home/pi/";
var urlsToCheck     = ["http://url.com/luxaforMonitor.php|My URL",
                        "http://url2.com/luxaforMonitor.php|My URL 2",
                        "http://url3.com/luxaforMonitor.php|My URL 3"];

//From here on down should run as is but change if necessary
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
    if(includeDays.includes(current_day)) {
        //If we are between startTime and endTime
        if(current_hour>startTime && current_hour<endTime) {
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
                    cb(null, body); // First param indicates error, null=> no error
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

//First, set the light to yellow as we start things up
Luxafor.init(function () {
    Luxafor.setColor(255, 255, 0, function () { });
});

logFileName = _getDTStamp("logName") + ".log";
theLogFile  = logFilePath + logFileName;
startMsg    = "Starting to monitor at " + _getDTStamp();
            _logEntry(theLogFile, startMsg);
serverMsg   = "  Checking the following servers every " + counterInterval + " seconds";
            _logEntry(theLogFile, serverMsg);

for(eachURL of urlsToCheck) {
    thisURL = eachURL.split("|");
    urlMsg  = "    " + thisURL[1] + " at " + thisURL[0];
            _logEntry(theLogFile, urlMsg);
}

//Then run again every x seconds
//Multiple the interval by 1000 to get JS seconds
counterInterval = counterInterval * 1000;

//From: http://stackoverflow.com/a/11063489/99401
setInterval(function(){ 
    async.map(urlsToCheck, fetch, function(err, results){
        if(err){

        } else {
            for(each of results) {
                if(each!==upKeyword) {
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
}, counterInterval);
//Repeat every x seconds until ...