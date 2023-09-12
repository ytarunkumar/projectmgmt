/*
 * @Author: smitha.nandakumar 
 * @Date: 2020-05-20 16:34:54 
 * @Last Modified by: Abhijith K P
 * @Last Modified time: 2023-04-26 13:02:29
 */

'use strict';

var winston = require('winston');
require('winston-daily-rotate-file');
const configData = require('../config/Config.json');
const { format } = require('logform');


const myformat = winston.format.combine(
  winston.format.align(),
  winston.format.printf(info => `${info.message}`)
);

const comName = configData.app.componentName || "GoalsBotServer";
const tenantId = configData.app.tenantId || "GabBlueLabs";
const datePattern = configData.logger.datePattern || "YYYY-MM-DD";
const maxSize = configData.logger.maxsize || "5m";
const maxFiles = configData.logger.maxFiles || "15d";

//if the log level is set as info, all the log level equal and less than that will be printed.
//ie info, warn & error will get printed.
/*const level= { 
    error: 0, 
    warn: 1, 
    info: 2, 
    http: 3,
    verbose: 4, 
    debug: 5, 
    silly: 6 
  }
  */
const logLevel = configData.logger.logLevel || 'debug';

const dir = configData.logger.dirName || "../../logs/projectmanagement";


var appTransport = new (winston.transports.DailyRotateFile)({
  // filename: comName + '_' + tenantId + '_' + 'Redis.log%DATE%',
  filename: comName + '_' + tenantId + '_' + 'Redis_%DATE%.log',
  dirname: dir,
  datePattern: datePattern,
  maxsize: maxSize, // 5MB
  maxFiles: maxFiles
});


const applicationLogger = winston.createLogger({
  level: logLevel,
  exitOnError: false,
  format: myformat,
  transports: [
    appTransport
  ]
});

/*
* @param {logLevel} 
* @param {message} 
*
*/
applicationLogger.logMessage = function (messageLogLevel, message, className, funcName, email) {
  const timeStamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
  const level = messageLogLevel;

  /*
  Message format
  <timeStamp>|INFO|tenant-id|user-id|ComponentName|ClassName|FunctionName|message
  */
  if (funcName == "") {
    funcName = "NEED TO UPDATE FUNCTION NAME";
  }
  if (className == "") {
    className = "NEED TO UPDATE CLASS NAME";
  }
  if (email == "") {
    email = "NEED TO UPDATE EMAIL";
  }

  const logMsg = timeStamp + " | " + level.toUpperCase() + " | " + tenantId + " | " + email + " | " + comName + " | " + className + " | " + funcName + " | " + message + " | ";

  applicationLogger.log(level, logMsg);

}

module.exports = {
  applicationLogger: applicationLogger
}


