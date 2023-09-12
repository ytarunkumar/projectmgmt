let moment = require("moment");
const meteringLogger = require("../logger/Logger").meteringLogger;
const appLogger = require("../logger/Logger").applicationLogger;
const configData = require('../config/Config.json');
const schedule = require('node-schedule');
const cron = require('cron-validator');
const { populateRecurringTask, getIPProjects, watcherDailySummary } = require("../services/PMSServices");
let startDateTime;
let endDateTime;
let diffInMS;
let moduleName = 'PROJECTMANAGEMENT'

module.exports = {
    //cron job for running recurring tasks
    recurringTaskCronJob: async function () {
        let loggedUser = "admin";
        let tenant = "SYSTEM";
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        appLogger.logMessage("info", "Cron job for recurring tasks initiated", "Scheduler", "recurringTaskCronJob", "System", tenant, moduleName);
        try {
            let convCronTime = configData.CronJob.populateRecurringTasks;
            if (cron.isValidCron(convCronTime)){
                const job = schedule.scheduleJob(convCronTime, async () => {
                    if (Object.keys(schedule.scheduledJobs).length > 1) {
                        appLogger.logMessage("debug","Initiated Populate recurring task as scheduled "+Object.keys(schedule.scheduledJobs).length,"Scheduler","recurringTaskCronJob",loggedUser, tenant, moduleName);
                        job.cancel(true);
                    }
                    let date = moment().format("YYYY-MM-DD");
                    await populateRecurringTask(date, loggedUser, tenant)
                    
                })
            }else{
                appLogger.logMessage("error", "Malformed cron time : "+convCronTime, "Scheduler", "recurringTaskCronJob", loggedUser, tenant, moduleName);
            }       
            endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
            diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
            meteringLogger.logMessage(tenant, loggedUser, "Scheduler", "recurringTaskCronJob", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (e) {
            appLogger.logMessage("error", e.message, "Scheduler", "recurringTaskCronJob", loggedUser, tenant, moduleName);
        }
    },
    //cron job for sending client summary report
    sendClientReportCronJob: async function () {
        let loggedUser = "admin";
        let tenant = "SYSTEM";
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        appLogger.logMessage("info", "Cron job for sending client report initiated", "Scheduler", "sendClientReportCronJob", "System", tenant, moduleName);
        try {
            let convCronTime = configData.CronJob.sendClientReportCronJob;
            if (cron.isValidCron(convCronTime)){
                const job = schedule.scheduleJob(convCronTime, async () => {
                    if (Object.keys(schedule.scheduledJobs).length > 1) {
                        appLogger.logMessage("debug","Initiated sending client report as scheduled "+Object.keys(schedule.scheduledJobs).length,"Scheduler","sendClientReportCronJob",loggedUser, tenant, moduleName);
                        job.cancel(true);
                    }
                    await getIPProjects(loggedUser, tenant);
                })
            }else{
                appLogger.logMessage("error", "Malformed cron time : "+convCronTime, "Scheduler", "sendClientReportCronJob", loggedUser, tenant, moduleName);
            }       
            endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
            diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
            meteringLogger.logMessage(tenant, loggedUser, "Scheduler", "sendClientReportCronJob", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (e) {
            appLogger.logMessage("error", e.message, "Scheduler", "sendClientReportCronJob", loggedUser, tenant, moduleName);
        }
    },
    //cron job for sending watcher summary report
    sendWatcherReportCronJob: async function () {
        let loggedUser = "admin";
        let tenant = "SYSTEM";
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        appLogger.logMessage("info", "Cron job for sending watcher report initiated", "Scheduler", "sendWatcherReportCronJob", "System", tenant, moduleName);
        try {
            let convCronTime = configData.CronJob.sendWatcherReportCronJob;
            if (cron.isValidCron(convCronTime)){
                const job = schedule.scheduleJob(convCronTime, async () => {
                    if (Object.keys(schedule.scheduledJobs).length > 1) {
                        appLogger.logMessage("debug","Initiated sending client report as scheduled "+Object.keys(schedule.scheduledJobs).length,"Scheduler","sendWatcherReportCronJob",loggedUser, tenant, moduleName);
                        job.cancel(true);
                    }
                    await watcherDailySummary(loggedUser, tenant);
                })
            }else{
                appLogger.logMessage("error", "Malformed cron time : "+convCronTime, "Scheduler", "sendWatcherReportCronJob", loggedUser, tenant, moduleName);
            }       
            endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
            diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
            meteringLogger.logMessage(tenant, loggedUser, "Scheduler", "sendWatcherReportCronJob", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (e) {
            appLogger.logMessage("error", e.message, "Scheduler", "sendWatcherReportCronJob", loggedUser, tenant, moduleName);
        }
    }
}