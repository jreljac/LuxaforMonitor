# LuxaforMonitor 
A node.js app for monitoring web site availability with visual alerting using a [Luxafor](http://luxafor.com/) LED device.

<!-- TOC -->

- [About](#about)
- [Requirements](#requirements)
- [Settings](#settings)
- [Usage](#usage)

<!-- /TOC -->

About
=====
Initially used to turn a [Raspberry Pi](https://www.raspberrypi.org/) into a basic web monitoring tool.  My goal was to have a monitor with a visual way to identify if a remote server was down.  I was already getting emails/txt messages if/when downtime happened but ocassionally I'd miss those if email was turned off and/or phone was muted, in drawer, etc...

The light simply turns red if any one of the monitored servers goes offline for any reason.  It looks for a specific keyword from the URL (see `luxaforMonitor.php` as an example), if the key word exisits it turns the light green, if not it turns the light red.  If one monitored server is down the red light flips on - you have to determine which server is down (the log file is helpfull here but hopefully you are also alerted in other ways)

I didn't want to run this 24x7x365 so it allows for setting a daily start end end time as well as a setting to have it run on only specific days of the week (no need to run it before 7:00 AM or after 6:00 PM or on Saturday & Sunday in my case.)

Requirements
============
Requires node async, fs and request

```
npm install async
npm install fs
npm install request
```
Also requires node-luxafor: https://github.com/dave-irvine/node-luxafor

```
npm install luxafor
```
  which  requires node-usb: https://github.com/nonolith/node-usb
  
```
npm install usb
```

Settings
========
Found in `luxaforMonitor.config`

```
var startTime       = 7;                //Monitor start time
var endTime         = 18;               //Monitor end time - will only monitor between these times
var includeDays     = [1,2,3,4,5];      //An array of days of the week to run Sunday=0, Saturday=6
var counterInterval = 60;               //Run the check every x seconds
var upKeyword       = "Success";        //Key word to look for
var logFilePath     = "/home/user/";    //Log file path

//An array of URLs to check
//Each value should be URL|Friendly name
//URL is what is monitored, Friendly name is what gets logged
var urlsToCheck = ["http://url.com/luxaforMonitor.php|My URL",
                    "http://url2.com/luxaforMonitor.php|My URL 2",
                    "http://url3.com/luxaforMonitor.php|My URL 3"]; 
```
Usage
=====
Standard use

```
node /home/user/luxaforMonitor
```
Run with logging to console in addition to .log file

```
node /home/user/luxaforMonitor true
```
Seems the best thing to do is to add

```
node /home/user/luxaforMonitor.js
```
to the /etc/rc.local file so it autostarts if the system reboots for any reason.
[http://raspberrypi.stackexchange.com/a/9734/65427](http://raspberrypi.stackexchange.com/a/9734/65427)

Additionally, you can run 

```
#node ~/luxaforPower off            //Turns it off
#node ~/luxaforPower on             //Turns it on (white)
#node ~/luxaforPower on 255 255 0   //Turns it on (yellow)
```
to turn off and test the Luxafor