/*
 * @Author: smitha.nandakumar 
 * @Date: 2020-05-20 16:34:54 
 * @Last Modified by: Abhijith K P
 * @Last Modified time: 2023-04-26 18:20:11
 */

'use strict';

let winston = require('winston');
require('winston-daily-rotate-file');
const configData = require('../config/Config.json');
const { format } = require('logform');


const myformat = winston.format.combine(
  winston.format.align(),
  winston.format.printf(info => `${info.message}`)
);

const comName = configData.app.componentName|| "PMS" ;
const tenantId = configData.app.tenantId|| "GapBlueLabs";
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

const dir = configData.logger.dirName || "../../logs/projectManagement";


let appTransport = new (winston.transports.DailyRotateFile)({
    // filename : comName+'_'+ tenantId +'_'+ 'Application.log%DATE%',
    filename : comName+'_'+ tenantId +'_'+ 'Application_%DATE%.log',
    dirname: dir,
    zippedArchive : true,
    datePattern: datePattern,
    maxSize: maxSize, // 1MB
    maxFiles: maxFiles
  });

  let meteringTransport = new (winston.transports.DailyRotateFile)({
    // filename : comName+'_'+ tenantId +'_'+ 'Metering.log%DATE%',
    filename : comName+'_'+ tenantId +'_'+ 'Metering_%DATE%.log',
    dirname: dir,
    datePattern: datePattern,
    zippedArchive : true,
    maxSize: maxSize, // 5MB
    maxFiles: maxFiles
  });

  let heartBeatTransport = new (winston.transports.DailyRotateFile)({
    // filename : configData.app.componentNameHB+'_'+ tenantId +'_'+ 'HeartBeat.log%DATE%',
    filename : configData.app.componentNameHB+'_'+ tenantId +'_'+ 'HeartBeat_%DATE%.log',
    dirname: dir,
    datePattern: datePattern,
    zippedArchive : true,
    maxSize: maxSize, // 5MB
    maxFiles: maxFiles
  });

  const heartBeatLogger = winston.createLogger({  
    level: logLevel,
    exitOnError : false,
    format:myformat,
    transports: [
      heartBeatTransport
    ]
  });

  const applicationLogger = winston.createLogger({  
    level: logLevel,
    exitOnError : false,
    format:myformat,
    transports: [
      appTransport
    ]
  });

  const meteringLogger = winston.createLogger({  
    level: logLevel,
    exitOnError : false,
    format:myformat,
    transports: [
      meteringTransport
    ]
  });
  
/*
* @param {logLevel} 
* @param {message} 
*
*/
  applicationLogger.logMessage = function(messageLogLevel,message,className,funcName,email,tenant,module)
  {
    const timeStamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
    const level = messageLogLevel;

  /*
  Message format
  <timeStamp>|INFO|tenant-id|user-id|ComponentName|ClassName|FunctionName|message
  */
    if(funcName=="")
    {
      funcName ="NEED TO UPDATE FUNCTION NAME";
    }
     if(className == "")
    {
        className="NEED TO UPDATE CLASS NAME";
    }
    if(email =="")
    {
      email = "NEED TO UPDATE EMAIL";
    }
    if(module =="")
    {
      module = "NEED TO UPDATE MODULE";
    }
    
    const logMsg =  timeStamp+" | "+level.toUpperCase()+" | "+tenant+" | "+email+" | "+module+" | "+className+" | "+funcName+" | "+message+" | ";
    
    applicationLogger.log(level, logMsg);

  }


meteringLogger.logMessage= function(tenant,userId,serviceCategory,serviceName,requestStartDate,responseEndDate,requestDurationInMsec,module)
{
  const timeStamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
    /*
  Message format
  <timeStamp>|INFO|METERING|tenant-id|user-id|ComponentName|ServiceCategory|ServiceName|RequestStartDate|ResponseEndDate|RequestDurationInMsec

  */
  const logMsg =  timeStamp+"|"+" INFO "+"|"+" METERING "+"|"+tenant+" | "+userId+" | "+module+" | "+serviceCategory+" | "+serviceName+" | "+requestStartDate+" | "+responseEndDate+" | "+requestDurationInMsec+" | ";
  
  meteringLogger.log("info", logMsg);

}

heartBeatLogger.logMessage = function(messageLogLevel,message,className,funcName,email,tenant)
{
  const timeStamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
  const level = messageLogLevel;

/*
Message format
<timeStamp>|INFO|tenant-id|user-id|ComponentName|ClassName|FunctionName|message
*/
  if(funcName=="")
  {
    funcName ="NEED TO UPDATE FUNCTION NAME";
  }
   if(className == "")
  {
      className="NEED TO UPDATE CLASS NAME";
  }
  if(email =="")
  {
    email = "NEED TO UPDATE EMAIL";
  }
  
  const logMsg =  timeStamp+" | "+level.toUpperCase()+" | "+tenant+" | "+email+" | "+comName+" | "+className+" | "+funcName+" | "+message+" | ";
  
  heartBeatLogger.log(level, logMsg);

}
  module.exports = {
      applicationLogger:applicationLogger,
      meteringLogger:meteringLogger,
      heartBeatLogger:heartBeatLogger
    }
  

