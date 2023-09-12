let appLogger = require('../logger/Logger').applicationLogger;
let meteringLogger = require('../logger/Logger').meteringLogger;
let mysqlQueries = require('../queries/PMSQueries');
let dbOperations = require('../../common/connection/mysql/DbOperations');
const moment = require('moment');
const { loggers } = require('winston');
const ResponseHandler = require('../../common/main/ResponseHandler');
const config = require('../config/Config.json');
const axios = require('axios');
const apiConfig = require('../config/APISignature.json');
const fs = require('fs')
const path = require('path');
const pdf = require("pdf-creator-node");
const https = require('https');
let pmsServices = require('../services/PMSServices');
const mailConfig = require("../../common/config/MailConfig.json");
const { sendMails } = require('../../common/main/Mailer');
const mongoOperations = require('../../common/connection/mongodb/MongoOperations');

let startDateTime;
let endDateTime;
let diffInMS;
let moduleName = 'PM'
module.exports = {
    //ASSIGN PROJECT OWNER WHEN THE NEW PROJECT IS CREATED
    assignProjectOwner: async function (req, projectId) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let out = {
            status: "Success",
            message: "Successfully created project and assigned " + req.body.loggedUser + " as project owner."
        }
        try {
            appLogger.logMessage("debug", "assignProjectOwner function called", "PMSSupport", "assignProjectOwner", req.body.loggedUser, req.body.tenant)
            let result = await dbOperations.executeQuery(mysqlQueries.checkRoleExists, ['PROJECT MANAGER',req.body.tenantId], req.body.loggedUser, "assignProjectOwner", false, null, req.body.tenant,appLogger,meteringLogger,moduleName);
            if(result != undefined && result != null && result.length > 0){
                let query = mysqlQueries.assignProjectOwnerQuery;
                let param = [req.body.tenantId, projectId, moment().format('YYYY-MM-DD'), "OWNER",result[0].ID];
                result = await dbOperations.executeQuery(query, param, req.body.loggedUser, "assignProjectOwner", true, [2, 6, 7], req.body.tenant,appLogger,meteringLogger,moduleName);
                if (result) {
                    if (result.affectedRows < 1) {
                        appLogger.logMessage("error", "Failed to insert to project team. The data received from server is: " + JSON.stringify(result), "PMSSupport", "assignProjectOwner", req.body.loggedUser, req.body.tenant);
                        out.status = "Failed";
                        out.message = "Successfully created project but failed to assign the owner. Please assign it separately.";
                    } else {
                        appLogger.logMessage("debug", "Successfully created project and assigned the owner.", "PMSSupport", "assignProjectOwner", req.body.loggedUser, req.body.tenant);
                    }
                } else {
                    appLogger.logMessage("error", "Failed to assign project owner. null/undefined received from server.", "PMSSupport", "assignProjectOwner", req.body.loggedUser, req.body.tenant);
                    out.status = "Failed";
                    out.message = "Successfully created project but failed to assign project owner please assign it seperately.";
                }
            }
        } catch (error) {
            appLogger.logMessage("error", "Failed to assign project due to: " + JSON.stringify(error.message), "PMSSupport", "assignProjectOwner", req.body.email, req.body.tenant);
            out.status = "Failed";
            out.message = "Project created but failed to assign project owner. Please assign project owner seperately";
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(req.body.tenant, req.body.loggedUser, "PMSSupport", "assignProjectOwner", startDateTime, endDateTime, diffInMS);
        return out;
    },
    isTaskNameExists: async function (taskName, tenantId, projectId, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let response = null;
        try {
            appLogger.logMessage("info", "isTaskNameExists function begins", "PMSSupport", "isTaskNameExists", loggedUser, tenant, moduleName);

            let query = mysqlQueries.taskNameExistsQuery;
            let param = [
                tenantId,
                projectId,
                taskName
            ];
            let result = await dbOperations.executeQuery(query, param, loggedUser, "isTaskNameExists", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result != null && result != undefined && result != 'error ') {
                if (result.length != null && result.length != undefined) {
                    response = result.length;
                    appLogger.logMessage("info", "Task name fetched", "PMSSupport", "isTaskNameExists", loggedUser, tenant, moduleName);

                }
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "isTaskNameExists", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in isTaskNameExists ", +error.message, "PMSSupport", "isTaskNameExists", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "isTaskNameExists finished", "PMSSupport", "isTaskNameExists", loggedUser, tenant, moduleName);
        return response;
    },
    isProjectNameExists: async function (projectName,projectTypeCode, tenantId, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let response = null;
        try {
            appLogger.logMessage("info", "isProjectNameExists function begins", "PMSSupport", "isProjectNameExists", loggedUser, tenant, moduleName);
            projectName=projectName.trim()
            let query = mysqlQueries.projectNameExistsQuery;
            let param = [
                tenantId,
                projectName.toLowerCase(),
                projectTypeCode
            ];
            let result = await dbOperations.executeQuery(query, param, loggedUser, "isProjectNameExists", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result != null && result != undefined && result != 'error ') {
                if (result.length != null && result.length != undefined) {
                    response = result.length;
                }
                appLogger.logMessage("info", "isProjectNameExists function result", +JSON.stringify(result), "PMSSupport", "isProjectNameExists", loggedUser, tenant, moduleName);

            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "isProjectNameExists", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  isProjectNameExists" + error.message, "PMSSupport", "isProjectNameExists", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "isProjectNameExists function completed", "PMSSupport", "isProjectNameExists", loggedUser, tenant, moduleName);
        return response;
    },
    closeAllTasks: async function (projectId, statusTypeCode, email, tenant) {
        let out = {
            status: "Success",
            message: "Successfully closed all the tasks",
            data: []
        }
        try {
            appLogger.logMessage("debug", "closeAllTasks called with the projectId: " + projectId + ", statusTypeCode: " + statusTypeCode, "PMSSupport", "closeAllTasks", email, tenant)
            let query = mysqlQueries.closeAllTasksQuery;
            let param = [statusTypeCode, projectId];
            let result = await dbOperations.executeQuery(query, param, email, "closeAllTasks", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result) {
                if (result.affectedRows > 0) {
                    appLogger.logMessage("debug", "All tasks under the given projects are updated", "PMSSupport", "closeTasks", email, tenant);
                } else {
                    appLogger.logMessage("debug", "All tasks are already closed", "PMSSupport", "closeTasks", email, tenant);
                    out.message = "All tasks are already closed";
                }
            } else {
                appLogger.logMessage("error", "Failed to close all tasks", "PMSSupport", "closeAllTasks", email, tenant);
                out.status = "Failed";
                out.message = "Internal Server Error";
            }
        } catch (error) {
            appLogger.logMessage("error", "Failed to delete all tasks due to: " + JSON.stringify(error.message), "PMSSupport", "closeAllTasks", email, tenant);
            out.status = "Failed";
            out.message = "Internal server error";
            out.data = JSON.stringify(error.message);
        }
        appLogger.logMessage("debug", "Response after executing closeAllTasks: " + JSON.stringify(out), "PMSSupport", "closeAllTasks", email, tenant);
        return out;
    },
    closeProjectTeams: async function (projectId, email, tenant) {
        let out = {
            status: "Success",
            message: "Successfully updated projectTeam end date",
            data: []
        }
        try {
            appLogger.logMessage("debug", "closeProjectTeam called with the projectId: " + projectId, "PMSSupport", "closeProjectTeams", email, tenant);
            let query = mysqlQueries.closeProjectTeamQuery;
            let param = [projectId];
            let result = await dbOperations.executeQuery(query, param, email, "closeProjectTeam", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result) {
                if (result.affectedRows > 0) {
                    appLogger.logMessage("debug", "successfully end dated the project team", "PMSSupport", "closeProjectTeams", email, tenant);
                } else {
                    appLogger.logMessage("debug", "Failed to close project team due to no project found with the given id: " + projectId, "PMSSupport", "closeProjectTeams", email, tenant);
                    out.status = "Failed";
                    out.message = "Failed to close project due to invalid project(No project found with the given id: " + projectId + ")";
                }
            } else {
                appLogger.logMessage("error", "Failed to close project team", "PMSSupport", "closeProjectTeams", email, tenant);
                out.status = "Failed";
                out.message = "Internal server error: Failed to end date project team data";
            }
        } catch (error) {
            appLogger.logMessage("error", "Failed to close project teams due to: " + JSON.stringify(error.message), "PMSSupport", "closeProjectTeams", email, tenant);
            out.status = "Failed";
            out.message = "Internal server error";
            out.data = JSON.stringify(error.message);
        }
        appLogger.logMessage("debug", "Response send after closeProjectTeams: " + JSON.stringify(out), "PMSSupport", "closeProjectTeams", email, tenant);
        return out;
    },
    getUserId: async function (email, tenant) {
        let out = {
            type: "Success",
            message: "Successfully fetched userId",
            data: []
        }
        try {
            appLogger.logMessage("debug", "getUserId called with email: " + email, "PMSSupport", "getUserId", email, tenant);
            let query = mysqlQueries.getUserId;
            let param = [email];
            let result = await dbOperations.executeQuery(query, param, email, "getUserId", false, [], tenant,appLogger,meteringLogger,moduleName);
            if (result) {
                if (Array.isArray(result)) {
                    if (result.length > 0) {
                        out.data = {
                            "userId": result[0].ID
                        }

                    } else {
                        out.type = "Warning";
                        out.message = "Invalid user: " + email;
                    }
                } else {
                    appLogger.logMessage("error", "Invalid output received from server", "PMSSupport", "getUserId", email, tenant);
                    out.type = "Warning";
                    out.message = "Invalid output received from server";
                }
            } else {
                appLogger.logMessage("error", "Failed to fetch user id", "PMSSupport", "getUserId", email, tenant);
                out.type = "Warning";
                out.message = "Invalid user id received from server";
            }
        } catch (error) {
            appLogger.logMessage("error", "Failed to fetch userId due to: " + JSON.stringify(error.message), "PMSSupport", "getUserId", email, tenant);
            out.type = "Failure";
            out.message = "Internal server error";
            out.data = JSON.stringify(error.message);
        }
        return out;
    },

    isLookupExists: async function (body, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let response = null;
        try {
            appLogger.logMessage("info", "isLookup function begins", "PMSSupport", "isLookupExists", loggedUser);

            let query = mysqlQueries.lookupExistsQuery;
            let parsedLookupData = JSON.parse(body.lookupData);
            let param = [
                body.tenantId,
                body.lookupType,
                parsedLookupData.lookupCode,
                parsedLookupData.displayValue
                // body.lookupData.lookupCode,
                // body.lookupData.displayValue   
            ]
            let result = await dbOperations.executeQuery(query, param, loggedUser, "isLookupExists", false, null, tenant,appLogger,meteringLogger,moduleName);

            if (result != null && result != undefined && result != 'error ') {
                if (result.length != null && result.length != undefined) {
                    response = result.length;
                }
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "islookupExists", startDateTime, endDateTime, diffInMS);
        } catch (error) {
            appLogger.logMessage("error", "Failed to check whether lookup name already exists ", "PMSSupport", "isLookupExists", loggedUser);

        }
        return response;
    },

    isLookupFieldExists: async function (body, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let response = null;
        try {
            appLogger.logMessage("info", "isLookup function begins", "PMSSupport", "isLookupExists", loggedUser);
            let query = mysqlQueries.lookupExistsQuery;
            let records = []
            let param = [];
            param.push(body.tenantId);
            param.push(body.lookupType);
            let lookupCode = [];
            let displayValue = [];
            if (body.lookupData) {
                if (Array.isArray(body.lookupData)) {
                    for (let data of body.lookupData) {
                        lookupCode.push(data.lookupCode);
                        displayValue.push(data.displayValue);
                    }
                    param.push(lookupCode);
                }
            }
            let result = await dbOperations.executeQuery(query, param, loggedUser, "isLookupExists", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result != null && result != undefined && result != 'error ') {
                if (result.length != null && result.length != undefined) {
                    response = result.length;
                }
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "islookupExists", startDateTime, endDateTime, diffInMS);
        } catch (error) {
            appLogger.logMessage("error", "Failed to check whether lookup name already exists ", "PMSSupport", "isLookupExists", loggedUser);

        }
        return response;
    },
    formatLookupData: async function (data, email, tenant) {
        let result;
        try {
            result = {};
            let finalArr = [], tempObj, lookupIndex;
            for (let value of data) {
                tempObj = {};
                let index = finalArr.findIndex(object => object.tenantId === value.TENANT_ID);
                if (index < 0) {
                    tempObj["tenantName"] = value.TENANT_NAME;
                    tempObj["tenantId"] = value.TENANT_ID;
                    tempObj["lookupTypes"] = []
                    if (value.LOOKUP_ID != undefined && value.LOOKUP_ID != null) {
                        tempObj.lookupTypes.push({
                            "lookupType": value.LOOKUP_TYPE,
                            "lookupCode": value.LOOKUP_CODE,
                            "lookupDisplayValue": value.DISPLAY_VALUE,
                            "lookupId": value.LOOKUP_ID
                        })
                        tempObj["TOTAL_COUNT"] = 1;
                    } else {
                        tempObj["TOTAL_COUNT"] = 0;
                    }
                    finalArr.push(tempObj);
                } else {
                    finalArr[index].lookupTypes.push({
                        "lookupType": value.LOOKUP_TYPE,
                        "lookupCode": value.LOOKUP_CODE,
                        "lookupDisplayValue": value.DISPLAY_VALUE,
                        "lookupId": value.LOOKUP_ID
                    })
                    finalArr[index].TOTAL_COUNT = finalArr[index].TOTAL_COUNT + 1
                }
            }
            if (finalArr.length > 0) {
                result["lookups"] = finalArr;
                result = await ResponseHandler.sendResponse("Success", "Lookup data fetched successfully.", 200, result, true, "editMapTenantFeature", tenant, email);
            } else {
                result = await ResponseHandler.sendResponse("Success", "Failed to fetch lookup data.", 400, result, true, "editMapTenantFeature", tenant, email);
            }
        } catch (error) {
            appLogger.logMessage("error", "Failed format lookup data due to: " + JSON.stringify(error.message), "PMSSupport", "formatLookupData", email, tenant);
            result = await ResponseHandler.sendResponse("Failure", e.message, 500, null, false, "editMapTenantFeature", tenant, email);
        }
        return result;
    },



    //close the task in project_team 
    closeTaskAssigned: async function (query, param, pos, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let response = false;
        try {
            appLogger.logMessage("info", "closeTaskAssigned function begins", "PMSSupport", "closeTaskAssigned", loggedUser, tenant, moduleName);
            let result = await dbOperations.executeQuery(query, param, loggedUser, "closeTaskAssigned", true, pos, tenant,appLogger,meteringLogger,moduleName);
            if (result != null && result != undefined && result != 'error ') {
                response = true;
                appLogger.logMessage("info", "Closed the task", "PMSSupport", "closeTaskAssigned", loggedUser, tenant, moduleName);

            } else
                appLogger.logMessage("debug", "Result of closeTaskAssigned is " + JSON.stringify(result), "PMSSupport", "closeTaskAssigned", loggedUser, tenant, moduleName);
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "closeTaskAssigned", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Failed to close task in gpm_project_team " + error.message, "PMSSupport", "closeTaskAssigned", loggedUser);
        }
        appLogger.logMessage("info", "closeTaskAssigned function completed", "PMSSupport", "closeTaskAssigned", loggedUser, tenant, moduleName);
        return response;
    },

    //check user assigned with same task
    isTaskAssigned: async function (body, loggedUser, tenant) {
        appLogger.logMessage("info", "isTaskAssigned function called", "PMSSupport", "isTaskAssigned", loggedUser, tenant, moduleName);
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let out = {
            status: "Success",
            message: "User is not assigned with the task",
            code: '200',
            data: []
        }
        try {
            let query = mysqlQueries.isTaskAssigned;
            let param = [
                body.userId,
                body.taskId,
                body.projectId,
                body.tenantId,
            ];
            let result = await dbOperations.executeQuery(query, param, body.loggedUser, "isTaskAssigned", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result != null && result != undefined && result != "Error") {
                if (result.length == 0) {
                    appLogger.logMessage("debug", "Task is  not assigned to the user. Result received after executing the query: " + JSON.stringify(result), "PMSSupport", "isTaskAssigned", loggedUser, tenant, moduleName);
                    out.data = [{ 'notAssigned': true }]
                } else {
                    appLogger.logMessage("debug", "User is already assigned with the task. Result received after executing the query: " + JSON.stringify(result), "PMSSupport", "isTaskAssigned", loggedUser, tenant, moduleName);
                    out.message = "User is already assigned with task"
                    out.data = [{ 'notAssigned': false }]
                }
            } else {
                appLogger.logMessage("debug", "Failed to check assigned task . Result received after executing the query: " + JSON.stringify(result), "PMSSupport", "isTaskAssigned", loggedUser, tenant, moduleName);
                out.status = "Warning"
                out.message = "Failed to check assigned task"
                out.code = 404
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "isTaskassigned", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Failed to check assigned task due to " + error.message, "PMSSupport", "isTaskAssigned", loggedUser);
            out.status = "Failure"
            out.message = "Internal server error " + error.message
            out.code = 500
        }
        appLogger.logMessage("info", "isTaskAssigned is completed  ", "PMSSupport", "isTaskAssigned", loggedUser, tenant, moduleName);
        return out;
    },

    getTasksDueExpired: async function (payload) {
        return new Promise(async function (resolve, reject) {
            appLogger.logMessage("debug", "getTasksDueExpired function called with payload: " + JSON.stringify(payload), "PMSSupport", "getTasksDueExpired", payload.loggedUser, payload.tenant, moduleName);
            startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            let res = {
                status: "Success",
                message: "Successfully fetched tasks which due date is expired",
                data: []
            }
            try {
                let param = [];
                let query;
                if (String(payload.role).toLowerCase() == "project_manager") {
                    query = mysqlQueries.taskDueDateExpiredByPM;
                    param = [payload.tenantId, payload.projectId]
                } else if (String(payload.role).toLowerCase() == "employee") {
                    query = mysqlQueries.taskDueDateExpiredByEmp;
                    param = [payload.tenantId, payload.projectId, payload.loggedUserId];
                } else {
                    appLogger.logMessage("debug", "Failed to fetch due expired tasks due to invalid role given: " + payload.role, "PMSSupport", "getTasksDueExpired", payload.loggedUser, payload.tenant, moduleName);
                    out.status = "Failed";
                    out.message = "Invalid role given: " + payload.role;
                    return out;
                }
                let result = await dbOperations.executeQuery(query, param, payload.loggedUser, "getTaskDueExpired", false, null, payload.tenant,appLogger,meteringLogger,moduleName);
                if (result) {
                    if (Array.isArray(result)) {
                        res.data = result;
                    } else {
                        appLogger.logMessage("error", "Failed to fetch tasks expired due to invalid response from server", "PMSSupport", "getTasksDueExpired", payload.loggedUser, payload.tenant, moduleName);
                        res.status = "Failed";
                        res.message = "Failed to fetch tasks expired due to invalid response from server";
                    }
                } else {
                    appLogger.logMessage("error", "Failed to fetch tasks which due expired due to invalid response received from server", "PMSSupport", "getTasksDueExpired", payload.loggedUser, payload.tenant, moduleName);
                    res.status = "Failed";
                    res.message = "Failed to fetch tasks which due date expired due to invalid response received from server";
                }
            } catch (error) {
                appLogger.logMessage("error", "Failed to fetch tasks which due date expired due to: " + JSON.stringify(error.message), payload.loggedUser, "PMSSupport", "getTasksDueExpired", payload.loggedUser, payload.tenant, moduleName);
                res.status = "Failed";
                res.message = "Interal server error";
                res.data = JSON.stringify(error.message);
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(payload.tenant, payload.loggedUser, "PMSSupport", "getTasksDueExpired", startDateTime, endDateTime, diffInMS, moduleName);
            resolve(res);
        })
    },

    getTasksDueToday: async function (payload) {
        appLogger.logMessage("debug", "getTasksDueToday function called with payload: " + JSON.stringify(payload), "PMSSupport", "getTasksDueToday", payload.loggedUser, payload.tenant, moduleName);
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let out = {
            status: "Success",
            message: "Successfully fetched tasks which due date is today",
            data: []
        }
        try {
            let param = [];
            let query;
            if (String(payload.role).toLowerCase() == "project_manager") {
                query = mysqlQueries.taskDueDateTodayPM;
                param = [payload.tenantId, payload.projectId]
            } else if (String(payload.role).toLowerCase() == "employee") {
                query = mysqlQueries.taskDueDateTodayEmp;
                param = [payload.tenantId, payload.projectId, payload.loggedUserId];
            } else {
                appLogger.logMessage("debug", "Failed to fetch due today tasks due to invalid role given: " + payload.role, "PMSSupport", "getTasksDueToday", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Invalid role given: " + payload.role;
                return out;
            }
            let result = await dbOperations.executeQuery(query, param, payload.loggedUser, "getTasksDueToday", false, null, payload.tenant,appLogger,meteringLogger,moduleName);
            if (result) {
                if (Array.isArray(result)) {
                    out.data = result;
                } else {
                    appLogger.logMessage("error", "Failed to fetch today expiring tasks due to invalid response from server", "PMSSupport", "getTasksDueToday", payload.loggedUser, payload.tenant, moduleName);
                    out.status = "Failed";
                    out.message = "Failed to fetch today expiring tasks due to invalid response from server";
                }
            } else {
                appLogger.logMessage("error", "Failed to fetch today expiring tasks due to invalid response received from server", "PMSSupport", "getTasksDueToday", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Failed to fetch today expiring tasks due to invalid response received from server";
            }
        } catch (error) {
            appLogger.logMessage("error", "Failed to fetch today expiring tasks due to: " + JSON.stringify(error.message), payload.loggedUser, "PMSSupport", "getTasksDueToday", payload.loggedUser, payload.tenant, moduleName);
            out.status = "Failed";
            out.message = "Interal server error";
            out.data = JSON.stringify(error.message);
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(payload.tenant, payload.loggedUser, "PMSSupport", "getTasksDueToday", startDateTime, endDateTime, diffInMS, moduleName);
        return out;
    },

    getTasksDueIsUpcoming: async function (payload) {
        appLogger.logMessage("debug", "getTasksDueIsUpcoming function called with payload: " + JSON.stringify(payload), "PMSSupport", "getTasksDueIsUpcoming", payload.loggedUser, payload.tenant, moduleName);
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let out = {
            status: "Success",
            message: "Successfully fetched tasks which due date is upcoming",
            data: []
        }
        try {
            let param = [];
            let query;
            if (String(payload.role).toLowerCase() == "project_manager") {
                query = mysqlQueries.taskDueDateInDayPM;
                param = [payload.tenantId, payload.projectId, config.dayPriorNotify];
            } else if (String(payload.role).toLowerCase() == "employee") {
                query = mysqlQueries.taskDueDateInDayEmp;
                param = [payload.tenantId, payload.projectId, payload.loggedUserId, config.dayPriorNotify];
            } else {
                appLogger.logMessage("debug", "Failed to fetch tasks expiring soon due to invalid role given: " + payload.role, "PMSSupport", "getTasksDueIsUpcoming", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Invalid role given: " + payload.role;
                return out;
            }
            let result = await dbOperations.executeQuery(query, param, payload.loggedUser, "getTasksDueIsUpcoming", false, null, payload.tenant,appLogger,meteringLogger,moduleName,appLogger,meteringLogger,moduleName);
            if (result) {
                if (Array.isArray(result)) {
                    out.data = result;
                } else {
                    appLogger.logMessage("error", "Failed to fetch tasks expiring soon due to invalid response from server", "PMSSupport", "getTasksDueIsUpcoming", payload.loggedUser, payload.tenant, moduleName);
                    out.status = "Failed";
                    out.message = "Failed to fetch tasks expiring soon due to invalid response from server";
                }
            } else {
                appLogger.logMessage("error", "Failed to fetch tasks expiring soon due to invalid response received from server", "PMSSupport", "getTasksDueIsUpcoming", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Failed to fetch tasks expiring soon due to invalid response received from server";
            }
        } catch (error) {
            appLogger.logMessage("error", "Failed to fetch tasks expiring soon due to: " + JSON.stringify(error.message), payload.loggedUser, "PMSSupport", "getTasksDueIsUpcoming", payload.loggedUser, payload.tenant, moduleName);
            out.status = "Failed";
            out.message = "Interal server error";
            out.data = JSON.stringify(error.message);
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(payload.tenant, payload.loggedUser, "PMSSupport", "getTasksDueIsUpcoming", startDateTime, endDateTime, diffInMS, moduleName);
        return out;
    },

    getTasksExeedsEffort: async function (payload) {
        appLogger.logMessage("debug", "getTasksExeedsEffort function called with payload: " + JSON.stringify(payload), "PMSSupport", "getTasksExeedsEffort", payload.loggedUser, payload.tenant, moduleName);
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let out = {
            status: "Success",
            message: "Successfully fetched tasks which exeeds the effort",
            data: []
        }
        try {
            let param = [];
            let query;
            if (String(payload.role).toLowerCase() == "project_manager") {
                query = mysqlQueries.taskEffortsExeedsPM;
                param = [payload.tenantId, payload.projectId]
            } else if (String(payload.role).toLowerCase() == "employee") {
                query = mysqlQueries.taskEffortsExeedsEmp;
                param = [payload.tenantId, payload.projectId, payload.loggedUserId];
            } else {
                appLogger.logMessage("debug", "Failed to fetch tasks exeeds the effort due to invalid role given: " + payload.role, "PMSSupport", "getTasksExeedsEffort", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Invalid role given: " + payload.role;
                return out;
            }
            let result = await dbOperations.executeQuery(query, param, payload.loggedUser, "getTasksExeedsEffort", false, null, payload.tenant,appLogger,meteringLogger,moduleName);
            if (result) {
                if (Array.isArray(result)) {
                    out.data = result;
                } else {
                    appLogger.logMessage("error", "Failed to fetch tasks exeeds the effort due to invalid response from server", "PMSSupport", "getTasksExeedsEffort", payload.loggedUser, payload.tenant, moduleName);
                    out.status = "Failed";
                    out.message = "Failed to fetch tasks exeeds the effort due to invalid response from server";
                }
            } else {
                appLogger.logMessage("error", "Failed to fetch tasks exeeds the effort due to invalid response received from server", "PMSSupport", "getTasksExeedsEffort", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Failed to fetch tasks exeeds the effort due to invalid response received from server";
            }
        } catch (error) {
            appLogger.logMessage("error", "Failed to fetch tasks exeeds the effort due to: " + JSON.stringify(error.message), payload.loggedUser, "PMSSupport", "getTasksExeedsEffort", payload.loggedUser, payload.tenant, moduleName);
            out.status = "Failed";
            out.message = "Interal server error";
            out.data = JSON.stringify(error.message);
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(payload.tenant, payload.loggedUser, "PMSSupport", "getTasksExeedsEffort", startDateTime, endDateTime, diffInMS, moduleName);
        return out;
    },

    getTasksNotStarted: async function (payload) {
        appLogger.logMessage("debug", "getTasksNotStarted function called with payload: " + JSON.stringify(payload), "PMSSupport", "getTasksNotStarted", payload.loggedUser, payload.tenant, moduleName);
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let out = {
            status: "Success",
            message: "Successfully fetched tasks which NotStarted",
            data: []
        }
        try {
            let param = [];
            let query;
            if (String(payload.role).toLowerCase() == "project_manager") {
                query = mysqlQueries.taskNotStartedPM;
                param = [payload.tenantId, payload.projectId]
            } else if (String(payload.role).toLowerCase() == "employee") {
                query = mysqlQueries.taskNotStartedEmp;
                param = [payload.tenantId, payload.projectId, payload.loggedUserId];
            } else {
                appLogger.logMessage("debug", "Failed to fetch tasks not started due to invalid role given: " + payload.role, "PMSSupport", "getTasksNotStarted", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Invalid role given: " + payload.role;
                return out;
            }
            let result = await dbOperations.executeQuery(query, param, payload.loggedUser, "getTasksNotStarted", false, null, payload.tenant,appLogger,meteringLogger,appLogger,meteringLogger,moduleName);
            if (result) {
                if (Array.isArray(result)) {
                    out.data = result;
                } else {
                    appLogger.logMessage("error", "Failed to fetch tasks not started due to invalid response from server", "PMSSupport", "getTasksNotStarted", payload.loggedUser, payload.tenant, moduleName);
                    out.status = "Failed";
                    out.message = "Failed to fetch tasks not started due to invalid response from server";
                }
            } else {
                appLogger.logMessage("error", "Failed to fetch tasks not started due to invalid response received from server", "PMSSupport", "getTasksNotStarted", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Failed to fetch tasks not started due to invalid response received from server";
            }
        } catch (error) {
            appLogger.logMessage("error", "Failed to fetch tasks not started due to: " + JSON.stringify(error.message), payload.loggedUser, "PMSSupport", "getTasksNotStarted", payload.loggedUser, payload.tenant, moduleName);
            out.status = "Failed";
            out.message = "Interal server error";
            out.data = JSON.stringify(error.message);
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(payload.tenant, payload.loggedUser, "PMSSupport", "getTasksNotStarted", startDateTime, endDateTime, diffInMS, moduleName);
        return out;
    },

    getProjectsDueExpired: async function (payload) {
        return new Promise(async function (resolve, reject) {
            appLogger.logMessage("debug", "getProjectsDueExpired function called with payload: " + JSON.stringify(payload), "PMSSupport", "getProjectsDueExpired", payload.loggedUser, payload.tenant, moduleName);
            startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            let res = {
                status: "Success",
                message: "Successfully fetched projects which due date is expired",
                data: []
            }
            try {
                let param = [];
                let query;
                if (String(payload.role).toLowerCase() == "project_manager") {
                    query = mysqlQueries.projectDueDateExpiredByPM;
                    param = [payload.loggedUserId, payload.tenantId]
                } else if (String(payload.role).toLowerCase() == "employee") {
                    query = mysqlQueries.projectDueDateExpiredByEmp;
                    param = [payload.tenantId, payload.loggedUserId];
                } else {
                    appLogger.logMessage("debug", "Failed to fetch due expired projects due to invalid role given: " + payload.role, "PMSSupport", "getProjectsDueExpired", payload.loggedUser, payload.tenant, moduleName);
                    out.status = "Failed";
                    out.message = "Invalid role given: " + payload.role;
                    return out;
                }
                let result = await dbOperations.executeQuery(query, param, payload.loggedUser, "getProjectsDueExpired", false, null, payload.tenant,appLogger,meteringLogger,moduleName);
                if (result) {
                    if (Array.isArray(result)) {
                        res.data = result;
                    } else {
                        appLogger.logMessage("error", "Failed to fetch projects expired due to invalid response from server", "PMSSupport", "getProjectsDueExpired", payload.loggedUser, payload.tenant, moduleName);
                        res.status = "Failed";
                        res.message = "Failed to fetch projects expired due to invalid response from server";
                    }
                } else {
                    appLogger.logMessage("error", "Failed to fetch projects which due expired due to invalid response received from server", "PMSSupport", "getProjectsDueExpired", payload.loggedUser, payload.tenant, moduleName);
                    res.status = "Failed";
                    res.message = "Failed to fetch projects which due date expired due to invalid response received from server";
                }
            } catch (error) {
                appLogger.logMessage("error", "Failed to fetch projects which due date expired due to: " + JSON.stringify(error.message), payload.loggedUser, "PMSSupport", "getProjectsDueExpired", payload.loggedUser, payload.tenant, moduleName);
                res.status = "Failed";
                res.message = "Interal server error";
                res.data = JSON.stringify(error.message);
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(payload.tenant, payload.loggedUser, "PMSSupport", "getProjectsDueExpired", startDateTime, endDateTime, diffInMS, moduleName);
            resolve(res);
        })
    },
    getProjectsDueToday: async function (payload) {
        appLogger.logMessage("debug", "getProjectsDueToday function called with payload: " + JSON.stringify(payload), "PMSSupport", "getProjectsDueToday", payload.loggedUser, payload.tenant, moduleName);
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let out = {
            status: "Success",
            message: "Successfully fetched projects which due date is today",
            data: []
        }
        try {
            let param = [];
            let query;
            if (String(payload.role).toLowerCase() == "project_manager") {
                query = mysqlQueries.projectDueDateTodayPM;
                param = [payload.loggedUserId, payload.tenantId]
            } else if (String(payload.role).toLowerCase() == "employee") {
                query = mysqlQueries.projectDueDateTodayEmp;
                param = [payload.tenantId, payload.loggedUserId];
            } else {
                appLogger.logMessage("debug", "Failed to fetch due today projetcs due to invalid role given: " + payload.role, "PMSSupport", "getProjectsDueToday", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Invalid role given: " + payload.role;
                return out;
            }
            let result = await dbOperations.executeQuery(query, param, payload.loggedUser, "getProjectsDueToday", false, null, payload.tenant,appLogger,meteringLogger,moduleName);
            if (result) {
                if (Array.isArray(result)) {
                    out.data = result;
                } else {
                    appLogger.logMessage("error", "Failed to fetch today expiring projects due to invalid response from server", "PMSSupport", "getProjectsDueToday", payload.loggedUser, payload.tenant, moduleName);
                    out.status = "Failed";
                    out.message = "Failed to fetch today expiring projetcs due to invalid response from server";
                }
            } else {
                appLogger.logMessage("error", "Failed to fetch today expiring projects due to invalid response received from server", "PMSSupport", "getProjectsDueToday", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Failed to fetch today expiring projects due to invalid response received from server";
            }
        } catch (error) {
            appLogger.logMessage("error", "Failed to fetch today expiring projects due to: " + JSON.stringify(error.message), payload.loggedUser, "PMSSupport", "getProjectsDueToday", payload.loggedUser, payload.tenant, moduleName);
            out.status = "Failed";
            out.message = "Interal server error";
            out.data = JSON.stringify(error.message);
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(payload.tenant, payload.loggedUser, "PMSSupport", "getProjectsDueToday", startDateTime, endDateTime, diffInMS, moduleName);
        return out;
    },
    getProjectsDueIsUpcoming: async function (payload) {
        appLogger.logMessage("debug", "getProjectsDueIsUpcoming function called with payload: " + JSON.stringify(payload), "PMSSupport", "getProjectsDueIsUpcoming", payload.loggedUser, payload.tenant, moduleName);
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let out = {
            status: "Success",
            message: "Successfully fetched projects which due date is upcoming",
            data: []
        }
        try {
            let param = [];
            let query;
            if (String(payload.role).toLowerCase() == "project_manager") {
                query = mysqlQueries.projectDueDateInDayPM;
                param = [payload.loggedUserId, payload.tenantId, config.dayPriorNotify];
            } else if (String(payload.role).toLowerCase() == "employee") {
                query = mysqlQueries.projectDueDateInDayEmp;
                param = [payload.tenantId, payload.loggedUserId, config.dayPriorNotify];
            } else {
                appLogger.logMessage("debug", "Failed to fetch project expiring soon due to invalid role given: " + payload.role, "PMSSupport", "getProjectsDueIsUpcoming", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Invalid role given: " + payload.role;
                return out;
            }
            let result = await dbOperations.executeQuery(query, param, payload.loggedUser, "getProjectsDueIsUpcoming", false, null, payload.tenant,appLogger,meteringLogger,moduleName);
            if (result) {
                if (Array.isArray(result)) {
                    out.data = result;
                } else {
                    appLogger.logMessage("error", "Failed to fetch projects expiring soon due to invalid response from server", "PMSSupport", "getProjectsDueIsUpcoming", payload.loggedUser, payload.tenant, moduleName);
                    out.status = "Failed";
                    out.message = "Failed to fetch project expiring soon due to invalid response from server";
                }
            } else {
                appLogger.logMessage("error", "Failed to fetch projects expiring soon due to invalid response received from server", "PMSSupport", "getTasksDueIsUpcoming", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Failed to fetch projects expiring soon due to invalid response received from server";
            }
        } catch (error) {
            appLogger.logMessage("error", "Failed to fetch projects expiring soon due to: " + JSON.stringify(error.message), payload.loggedUser, "PMSSupport", "getProjectsDueIsUpcoming", payload.loggedUser, payload.tenant, moduleName);
            out.status = "Failed";
            out.message = "Interal server error";
            out.data = JSON.stringify(error.message);
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(payload.tenant, payload.loggedUser, "PMSSupport", "getProjectsDueIsUpcoming", startDateTime, endDateTime, diffInMS, moduleName);
        return out;
    },
    getProjectsNotStarted: async function (payload) {
        appLogger.logMessage("debug", "getProjectsNotStarted function called with payload: " + JSON.stringify(payload), "PMSSupport", "getProjectsNotStarted", payload.loggedUser, payload.tenant, moduleName);
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let out = {
            status: "Success",
            message: "Successfully fetched projects which is not started",
            data: []
        }
        try {
            let param = [];
            let query;
            if (String(payload.role).toLowerCase() == "project_manager") {
                query = mysqlQueries.projectNotStartedPM;
                param = [payload.loggedUserId, payload.tenantId];
            } else if (String(payload.role).toLowerCase() == "employee") {
                query = mysqlQueries.projectNotStartedEmp;
                param = [payload.tenantId, payload.loggedUserId];
            } else {
                appLogger.logMessage("debug", "Failed to fetch project not started due to invalid role given: " + payload.role, "PMSSupport", "getProjectsNotStarted", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Invalid role given: " + payload.role;
                return out;
            }
            let result = await dbOperations.executeQuery(query, param, payload.loggedUser, "getProjectsNotStarted", false, null, payload.tenant,appLogger,meteringLogger,moduleName);
            if (result) {
                if (Array.isArray(result)) {
                    out.data = result;
                } else {
                    appLogger.logMessage("error", "Failed to fetch projects not started due to invalid response from server", "PMSSupport", "getProjectsNotStarted", payload.loggedUser, payload.tenant, moduleName);
                    out.status = "Failed";
                    out.message = "Failed to fetch project not started due to invalid response from server";
                }
            } else {
                appLogger.logMessage("error", "Failed to fetch projects not started due to invalid response received from server", "PMSSupport", "getProjectsNotStarted", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Failed to fetch projects not started due to invalid response received from server";
            }
        } catch (error) {
            appLogger.logMessage("error", "Failed to fetch projects not started due to: " + JSON.stringify(error.message), payload.loggedUser, "PMSSupport", "getProjectsNotStarted", payload.loggedUser, payload.tenant, moduleName);
            out.status = "Failed";
            out.message = "Interal server error";
            out.data = JSON.stringify(error.message);
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(payload.tenant, payload.loggedUser, "PMSSupport", "getProjectsNotStarted", startDateTime, endDateTime, diffInMS, moduleName);
        return out;
    },
    sendWhatsappNotification: async function (payload, loggedUser, tenant) {
        appLogger.logMessage("debug", "sendWhatsappNotification invoked with the payload: " + JSON.stringify(payload), "PMSSupport", "sendWhatsappNotification", loggedUser, tenant, moduleName);
        let out = {
            status: "Success",
            message: "Successfully send notification to employees",
            data: []
        }
        try {
            let notifiedUsers = [];
            for (let user of payload) {
                const options = {
                    url: 'https://pms.gnie.ai:7052/onboardUser',
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json;charset=UTF-8'
                    },
                    data: {
                        "tenantName":"pms",
                        "recipients":[user.WHATSAPP_NUMBER],
                        "taskId":user.TASK_ID,
                        "email":user.EMAIL,
                        "taskStatus":"NotStarted",
                        "projectId":user.PROJECT_ID,
                        "assignedBy":user.ASSIGNED_USER_NAME,
                        "description":user.TASK_DESCRIPTION,
                        "tenantId":user.TENANT_ID,
                        "loggedUserId":user.USER_ID,
                        "estimatedStartDate":user.ESTIMATED_START_DATE,
                        "dueDate":user.ESTIMATED_COMPLETION_DATE,
                        "textMessage":{
                            "firstTask":true,
                            "taskName":user.TASK_NAME,
                            "projectName":user.PROJECT_NAME
                            },
                        "whatsappId":user.WHATSAPP_ID
                    }
                };

                axios(options)
                    .then(response => {
                        console.log(response.status);
                        appLogger.logMessage("debug","Whatsapp notification send to: "+user.USER_NAME+" and the response status is: "+response.status,"PMSSupport","sendWhatsappNotification",loggedUser,tenant,moduleName);
                        notifiedUsers.push(user.USER_NAME);
                    });
            }
            appLogger.logMessage("debug","Notifications has been sent to: "+JSON.stringify(notifiedUsers),"PMSSupport","sendWhatsappNotification",loggedUser,tenant,moduleName);
            out.status = "Success";
            out.message = "Notifications has been sent to: "+JSON.stringify(notifiedUsers);
        } catch (error) {
            appLogger.logMessage("error", "Failed to send notifications to employees due to: " + JSON.stringify(error.message), "PMSSupport", "sendWhatsappNotification", loggedUser, tenant, moduleName);
            out.status = "Failed";
            out.message = "Failed to send notifications to employees due to: " + JSON.stringify(error.message);
        }
        return out;
    },

    getTasksDueExpiredEmp: async function (payload) {
        return new Promise(async function (resolve, reject) {
            appLogger.logMessage("debug", "getTasksDueExpiredEmp function called with payload: " + JSON.stringify(payload), "PMSSupport", "getTasksDueExpiredEmp", payload.loggedUser, payload.tenant, moduleName);
            startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            let res = {
                status: "Success",
                message: "Successfully fetched tasks which due date is expired",
                data: []
            }
            try {
                let param = [];
                let query;
              if (String(payload.role).toLowerCase() == "employee") {
                    query = mysqlQueries.allTasksDueDateExpiredByEmp;
                    param = [payload.tenantId, payload.loggedUserId];
                } else {
                    appLogger.logMessage("debug", "Failed to fetch due expired tasks due to invalid role given: " + payload.role, "PMSSupport", "getTasksDueExpiredEmp", payload.loggedUser, payload.tenant, moduleName);
                    out.status = "Failed";
                    out.message = "Invalid role given: " + payload.role;
                    return out;
                }
                let result = await dbOperations.executeQuery(query, param, payload.loggedUser, "getTasksDueExpiredEmp", false, null, payload.tenant,appLogger,meteringLogger,moduleName);
                if (result) {
                    if (Array.isArray(result)) {
                        res.data = result;
                    } else {
                        appLogger.logMessage("error", "Failed to fetch tasks expired due to invalid response from server", "PMSSupport", "getTasksDueExpiredEmp", payload.loggedUser, payload.tenant, moduleName);
                        res.status = "Failed";
                        res.message = "Failed to fetch tasks expired due to invalid response from server";
                    }
                } else {
                    appLogger.logMessage("error", "Failed to fetch tasks which due expired due to invalid response received from server", "PMSSupport", "getTasksDueExpiredEmp", payload.loggedUser, payload.tenant, moduleName);
                    res.status = "Failed";
                    res.message = "Failed to fetch tasks which due date expired due to invalid response received from server";
                }
            } catch (error) {
                appLogger.logMessage("error", "Failed to fetch tasks which due date expired due to: " + JSON.stringify(error.message), payload.loggedUser, "PMSSupport", "getTasksDueExpiredEmp", payload.loggedUser, payload.tenant, moduleName);
                res.status = "Failed";
                res.message = "Interal server error";
                res.data = JSON.stringify(error.message);
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(payload.tenant, payload.loggedUser, "PMSSupport", "getTasksDueExpiredEmp", startDateTime, endDateTime, diffInMS, moduleName);
            resolve(res);
        })
    },

    getTasksDueTodayEmp: async function (payload) {
        appLogger.logMessage("debug", "getTasksDueTodayEmp function called with payload: " + JSON.stringify(payload), "PMSSupport", "getTasksDueTodayEmp", payload.loggedUser, payload.tenant, moduleName);
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let out = {
            status: "Success",
            message: "Successfully fetched tasks which due date is today",
            data: []
        }
        try {
            let param = [];
            let query;
           if (String(payload.role).toLowerCase() == "employee") {
                query = mysqlQueries.allTaskDueDateTodayEmp;
                param = [payload.tenantId, payload.loggedUserId];
            } else {
                appLogger.logMessage("debug", "Failed to fetch due today tasks due to invalid role given: " + payload.role, "PMSSupport", "getTasksDueTodayEmp", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Invalid role given: " + payload.role;
                return out;
            }
            let result = await dbOperations.executeQuery(query, param, payload.loggedUser, "getTasksDueTodayEmp", false, null, payload.tenant,appLogger,meteringLogger,moduleName);
            if (result) {
                if (Array.isArray(result)) {
                    out.data = result;
                } else {
                    appLogger.logMessage("error", "Failed to fetch today expiring tasks due to invalid response from server", "PMSSupport", "getTasksDueTodayEmp", payload.loggedUser, payload.tenant, moduleName);
                    out.status = "Failed";
                    out.message = "Failed to fetch today expiring tasks due to invalid response from server";
                }
            } else {
                appLogger.logMessage("error", "Failed to fetch today expiring tasks due to invalid response received from server", "PMSSupport", "getTasksDueTodayEmp", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Failed to fetch today expiring tasks due to invalid response received from server";
            }
        } catch (error) {
            appLogger.logMessage("error", "Failed to fetch today expiring tasks due to: " + JSON.stringify(error.message), payload.loggedUser, "PMSSupport", "getTasksDueTodayEmp", payload.loggedUser, payload.tenant, moduleName);
            out.status = "Failed";
            out.message = "Interal server error";
            out.data = JSON.stringify(error.message);
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(payload.tenant, payload.loggedUser, "PMSSupport", "getTasksDueTodayEmp", startDateTime, endDateTime, diffInMS, moduleName);
        return out;
    },

    getTasksDueIsUpcomingEmp: async function (payload) {
        appLogger.logMessage("debug", "getTasksDueIsUpcomingEmp function called with payload: " + JSON.stringify(payload), "PMSSupport", "getTasksDueIsUpcomingEmp", payload.loggedUser, payload.tenant, moduleName);
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let out = {
            status: "Success",
            message: "Successfully fetched tasks which due date is upcoming",
            data: []
        }
        try {
            let param = [];
            let query;
            if (String(payload.role).toLowerCase() == "employee") {
                query = mysqlQueries.allTaskDueDateInDayEmp;
                param = [payload.tenantId, payload.loggedUserId, config.dayPriorNotify];
            } else {
                appLogger.logMessage("debug", "Failed to fetch tasks expiring soon due to invalid role given: " + payload.role, "PMSSupport", "getTasksDueIsUpcomingEmp", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Invalid role given: " + payload.role;
                return out;
            }
            let result = await dbOperations.executeQuery(query, param, payload.loggedUser, "getTasksDueIsUpcomingEmp", false, null, payload.tenant,appLogger,meteringLogger,moduleName);
            if (result) {
                if (Array.isArray(result)) {
                    out.data = result;
                } else {
                    appLogger.logMessage("error", "Failed to fetch tasks expiring soon due to invalid response from server", "PMSSupport", "getTasksDueIsUpcomingEmp", payload.loggedUser, payload.tenant, moduleName);
                    out.status = "Failed";
                    out.message = "Failed to fetch tasks expiring soon due to invalid response from server";
                }
            } else {
                appLogger.logMessage("error", "Failed to fetch tasks expiring soon due to invalid response received from server", "PMSSupport", "getTasksDueIsUpcomingEmp", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Failed to fetch tasks expiring soon due to invalid response received from server";
            }
        } catch (error) {
            appLogger.logMessage("error", "Failed to fetch tasks expiring soon due to: " + JSON.stringify(error.message), payload.loggedUser, "PMSSupport", "getTasksDueIsUpcomingEmp", payload.loggedUser, payload.tenant, moduleName);
            out.status = "Failed";
            out.message = "Interal server error";
            out.data = JSON.stringify(error.message);
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(payload.tenant, payload.loggedUser, "PMSSupport", "getTasksDueIsUpcomingEmp", startDateTime, endDateTime, diffInMS, moduleName);
        return out;
    },

    getTasksExeedsEffortEmp: async function (payload) {
        appLogger.logMessage("debug", "getTasksExeedsEffortEmp function called with payload: " + JSON.stringify(payload), "PMSSupport", "getTasksExeedsEffortEmp", payload.loggedUser, payload.tenant, moduleName);
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let out = {
            status: "Success",
            message: "Successfully fetched tasks which exeeds the effort",
            data: []
        }
        try {
            let param = [];
            let query;
           if (String(payload.role).toLowerCase() == "employee") {
                query = mysqlQueries.allTaskEffortsExeedsEmp;
                param = [payload.tenantId, payload.loggedUserId];
            } else {
                appLogger.logMessage("debug", "Failed to fetch tasks exeeds the effort due to invalid role given: " + payload.role, "PMSSupport", "getTasksExeedsEffortEmp", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Invalid role given: " + payload.role;
                return out;
            }
            let result = await dbOperations.executeQuery(query, param, payload.loggedUser, "getTasksExeedsEffortEmp", false, null, payload.tenant,appLogger,meteringLogger,moduleName);
            if (result) {
                if (Array.isArray(result)) {
                    out.data = result;
                } else {
                    appLogger.logMessage("error", "Failed to fetch tasks exeeds the effort due to invalid response from server", "PMSSupport", "getTasksExeedsEffortEmp", payload.loggedUser, payload.tenant, moduleName);
                    out.status = "Failed";
                    out.message = "Failed to fetch tasks exeeds the effort due to invalid response from server";
                }
            } else {
                appLogger.logMessage("error", "Failed to fetch tasks exeeds the effort due to invalid response received from server", "PMSSupport", "getTasksExeedsEffortEmp", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Failed to fetch tasks exeeds the effort due to invalid response received from server";
            }
        } catch (error) {
            appLogger.logMessage("error", "Failed to fetch tasks exeeds the effort due to: " + JSON.stringify(error.message), payload.loggedUser, "PMSSupport", "getTasksExeedsEffortEmp", payload.loggedUser, payload.tenant, moduleName);
            out.status = "Failed";
            out.message = "Interal server error";
            out.data = JSON.stringify(error.message);
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(payload.tenant, payload.loggedUser, "PMSSupport", "getTasksExeedsEffortEmp", startDateTime, endDateTime, diffInMS, moduleName);
        return out;
    },

    getTasksNotStartedEmp: async function (payload) {
        appLogger.logMessage("debug", "getTasksNotStartedEmp function called with payload: " + JSON.stringify(payload), "PMSSupport", "getTasksNotStartedEmp", payload.loggedUser, payload.tenant, moduleName);
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let out = {
            status: "Success",
            message: "Successfully fetched tasks which NotStarted",
            data: []
        }
        try {
            let param = [];
            let query;
            if (String(payload.role).toLowerCase() == "employee") {
                query = mysqlQueries.allTaskNotStartedEmp;
                param = [payload.tenantId, payload.loggedUserId];
            } else {
                appLogger.logMessage("debug", "Failed to fetch tasks not started due to invalid role given: " + payload.role, "PMSSupport", "getTasksNotStartedEmp", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Invalid role given: " + payload.role;
                return out;
            }
            let result = await dbOperations.executeQuery(query, param, payload.loggedUser, "getTasksNotStartedEmp", false, null, payload.tenant,appLogger,meteringLogger,moduleName);
            if (result) {
                if (Array.isArray(result)) {
                    out.data = result;
                } else {
                    appLogger.logMessage("error", "Failed to fetch tasks not started due to invalid response from server", "PMSSupport", "getTasksNotStartedEmp", payload.loggedUser, payload.tenant, moduleName);
                    out.status = "Failed";
                    out.message = "Failed to fetch tasks not started due to invalid response from server";
                }
            } else {
                appLogger.logMessage("error", "Failed to fetch tasks not started due to invalid response received from server", "PMSSupport", "getTasksNotStartedEmp", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Failed to fetch tasks not started due to invalid response received from server";
            }
        } catch (error) {
            appLogger.logMessage("error", "Failed to fetch tasks not started due to: " + JSON.stringify(error.message), payload.loggedUser, "PMSSupport", "getTasksNotStartedEmp", payload.loggedUser, payload.tenant, moduleName);
            out.status = "Failed";
            out.message = "Interal server error";
            out.data = JSON.stringify(error.message);
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(payload.tenant, payload.loggedUser, "PMSSupport", "getTasksNotStartedEmp", startDateTime, endDateTime, diffInMS, moduleName);
        return out;
    },
    getTasksOpenEmp: async function (payload) {
        appLogger.logMessage("debug", "getTasksNotStartedEmp function called with payload: " + JSON.stringify(payload), "PMSSupport", "getTasksNotStartedEmp", payload.loggedUser, payload.tenant, moduleName);
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let out = {
            status: "Success",
            message: "Successfully fetched tasks which NotStarted",
            data: []
        }
        try {
            let param = [];
            let query;
            if (String(payload.role).toLowerCase() == "employee") {
                query = mysqlQueries.allTaskOpenEmp;
                param = [payload.tenantId, payload.loggedUserId];
            } else {
                appLogger.logMessage("debug", "Failed to fetch tasks not started due to invalid role given: " + payload.role, "PMSSupport", "getTasksNotStartedEmp", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Invalid role given: " + payload.role;
                return out;
            }
            let result = await dbOperations.executeQuery(query, param, payload.loggedUser, "getTasksNotStartedEmp", false, null, payload.tenant,appLogger,meteringLogger,moduleName);
            if (result) {
                if (Array.isArray(result)) {
                    out.data = result;
                } else {
                    appLogger.logMessage("error", "Failed to fetch tasks not started due to invalid response from server", "PMSSupport", "getTasksNotStartedEmp", payload.loggedUser, payload.tenant, moduleName);
                    out.status = "Failed";
                    out.message = "Failed to fetch tasks not started due to invalid response from server";
                }
            } else {
                appLogger.logMessage("error", "Failed to fetch tasks not started due to invalid response received from server", "PMSSupport", "getTasksNotStartedEmp", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Failed to fetch tasks not started due to invalid response received from server";
            }
        } catch (error) {
            appLogger.logMessage("error", "Failed to fetch tasks not started due to: " + JSON.stringify(error.message), payload.loggedUser, "PMSSupport", "getTasksNotStartedEmp", payload.loggedUser, payload.tenant, moduleName);
            out.status = "Failed";
            out.message = "Interal server error";
            out.data = JSON.stringify(error.message);
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(payload.tenant, payload.loggedUser, "PMSSupport", "getTasksNotStartedEmp", startDateTime, endDateTime, diffInMS, moduleName);
        return out;
    },

    getTasksonHoldEmp: async function (payload) {
        appLogger.logMessage("debug", "getTasksonHoldEmp function called with payload: " + JSON.stringify(payload), "PMSSupport", "getTasksonHoldEmp", payload.loggedUser, payload.tenant, moduleName);
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let out = {
            status: "Success",
            message: "Successfully fetched tasks which NotStarted",
            data: []
        }
        try {
            let param = [];
            let query;
            if (String(payload.role).toLowerCase() == "employee") {
                query = mysqlQueries.onHoldEmp;
                param = [payload.tenantId, payload.loggedUserId];
            } else {
                appLogger.logMessage("debug", "Failed to fetch tasks not started due to invalid role given: " + payload.role, "PMSSupport", "getTasksonHoldEmp", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Invalid role given: " + payload.role;
                return out;
            }
            let result = await dbOperations.executeQuery(query, param, payload.loggedUser, "getTasksonHoldEmp", false, null, payload.tenant,appLogger,meteringLogger,moduleName);
            if (result) {
                if (Array.isArray(result)) {
                    out.data = result;
                } else {
                    appLogger.logMessage("error", "Failed to fetch tasks not started due to invalid response from server", "PMSSupport", "getTasksonHoldEmp", payload.loggedUser, payload.tenant, moduleName);
                    out.status = "Failed";
                    out.message = "Failed to fetch tasks not started due to invalid response from server";
                }
            } else {
                appLogger.logMessage("error", "Failed to fetch tasks not started due to invalid response received from server", "PMSSupport", "getTasksonHoldEmp", payload.loggedUser, payload.tenant, moduleName);
                out.status = "Failed";
                out.message = "Failed to fetch tasks not started due to invalid response received from server";
            }
        } catch (error) {
            appLogger.logMessage("error", "Failed to fetch tasks not started due to: " + JSON.stringify(error.message), payload.loggedUser, "PMSSupport", "getTasksonHoldEmp", payload.loggedUser, payload.tenant, moduleName);
            out.status = "Failed";
            out.message = "Interal server error";
            out.data = JSON.stringify(error.message);
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(payload.tenant, payload.loggedUser, "PMSSupport", "getTasksonHoldEmp", startDateTime, endDateTime, diffInMS, moduleName);
        return out;
    },

    isSubTaskNameExists: async function (subTaskName, taskId, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let response = null;
        try {
            appLogger.logMessage("info", "isSubTaskNameExists function begins", "PMSSupport", "isSubTaskNameExists", loggedUser, tenant, moduleName);

            let query = mysqlQueries.subTaskNameExistsQuery;
            let param = [
                taskId,
                subTaskName
            ];
            let result = await dbOperations.executeQuery(query, param, loggedUser, "isSubTaskNameExists", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result != null && result != undefined && result != 'Error') {
                if (result.length != null && result.length != undefined) {
                    response = result.length;
                }
                appLogger.logMessage("info", "isSubTaskNameExists function result", +JSON.stringify(result), "PMSSupport", "isSubTaskNameExists", loggedUser, tenant, moduleName);

            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "isSubTaskNameExists", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  isSubTaskNameExists" + error.message, "PMSSupport", "isSubTaskNameExists", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "isSubTaskNameExists function completed", "PMSSupport", "isSubTaskNameExists", loggedUser, tenant, moduleName);
        return response;
    },
    getTasks: async function (email, tenant, projectId, statusArray, conditions) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let out = {
            status: "Success",
            message: "Successfully fetched tasks",
            data: []
        }
        try {
            let payload = {
                "conditions": conditions,
                "projectId": projectId,
                "statuses": statusArray,
                "email": email,
                "tenant": tenant
            }
            out = await this.fetchTodoLists(payload);

        } catch (error) {
            appLogger.logMessage("error", "Failed to fetch tasks for todo list due to: " + JSON.stringify(error.message), "PMSSupport", "getTasks", email, tenant, moduleName);
            out.status = "Failed";
            out.message = "Failed to fetch tasks due to " + JSON.stringify(error.message);
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, email, "PMSSupport", "getTasks", startDateTime, endDateTime, diffInMS, moduleName);
        return out;
    },
    fetchTodoLists:async function(payload){
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        appLogger.logMessage("debug","fetchTodoLists called with the payload: "+JSON.stringify(payload),"PMSSupport","fetchTodoLists",payload.email,payload.tenant,moduleName);
        let out = {
            status:"Success",
            message:"Successfully fetched todo list",
            data:[]
        }
        try {
            let conditions = payload.conditions;
            let resultArray = [];
            if(conditions){
                for (let condition of conditions) {
                    if(payload.projectId){
                        //specific project's tasks
                        let param = [];
                        for(let val of apiConfig.typeDefinition[condition.type]){
                            if(val!=null){
                                param.push(condition[val])
                            }
                        }
                        param.push(payload.statuses);
                        param.push(payload.projectId);
                        let result = await dbOperations.executeQuery(mysqlQueries[condition.name],param,payload.email,"getTodoList",false,null,payload.tenant,appLogger,meteringLogger,moduleName);
                        let temp = {};
                        temp[condition.name] = result;
                        resultArray.push(temp);
                    }else{
                        let param = [];
                        for(let val of apiConfig.typeDefinition[condition.type]){
                            if(val!=null){
                                param.push(condition[val])
                            }
                        }
                        param.push(payload.statuses);
                        let result = await dbOperations.executeQuery(mysqlQueries[condition.name],param,payload.email,"getTodoList",false,null,payload.tenant,appLogger,meteringLogger,moduleName);
                        let temp = {};
                        temp[condition.name] = result;
                        resultArray.push(temp);
                    }
                }
                out = await this.filterTodoLists(resultArray,payload.email,payload.tenant,conditions)
            }else{
                let result = await dbOperations.executeQuery(mysqlQueries.tasksAssignedTo, [payload.email, payload.statuses], payload.email, "getTodoList", false, null, payload.tenant,appLogger,meteringLogger,moduleName);
                let outData = await this.groupBy(result, "STATUS");
                out.data = outData;
            }
          
        } catch (error) {
            out.status = "Failed";
            out.message = "Failed to fetch todo list due to: "+JSON.stringify(error.message);
            appLogger.logMessage("error","Failed to fetch todo list due to: "+JSON.stringify(error.message),"PMSSupport","fetchTodoLists",payload.email,payload.tenant,moduleName);
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(payload.tenant, payload.email, "PMSSupport", "fetchTodoLists", startDateTime, endDateTime, diffInMS, moduleName);
        return out;
    },
    filterTodoLists:async function(taskList,email,tenant,conditions){
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let out = {
            status:"Success",
            message:"Successfully filtered the tasks",
            data: []
        }
        try {
            appLogger.logMessage("debug","filterTodoLists called with conditions: "+JSON.stringify(conditions),"PMSSupport","filterTodoLists",email,tenant,moduleName);
            let nonDependantTasks = [];
            let dependantTasks = [];
            for(let condition of conditions){
                if(condition.criteriaOp == null){
                    for(let tasks of taskList){
                        if(tasks[condition.name]){
                            for(let task of tasks[condition.name]){
                                if(!nonDependantTasks.some(obj => obj.ID === task.ID)){
                                    nonDependantTasks.push(task);
                                }
                            }
                        }
                    }
                }else{
                    for(let tasks of taskList){
                        let association = condition.association;
                        if(tasks[condition.name]){
                            let associateArr = [];
                            for(let row of taskList){
                                if(row[association]){
                                    associateArr = row[association];
                                }
                            }
                            for(let task of tasks[condition.name]){
                                for(let task2 of associateArr){
                                    if(JSON.stringify(task) === JSON.stringify(task2)){
                                        if(!dependantTasks.some(obj => obj.ID === task.ID)){
                                            dependantTasks.push(task);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            let resultArray = [];
            for(let task of dependantTasks){
                if(!resultArray.some(obj => obj.ID === task.ID)){
                    resultArray.push(task);
                }
            }
            for(let task of nonDependantTasks){
                if(!resultArray.some(obj => obj.ID === task.ID)){
                    resultArray.push(task);
                }
            }
            out.data = resultArray;
        } catch (error) {
            out.status = "Failed";
            out.message = "Failed to filter todo list due to: "+JSON.stringify(error.message);
            appLogger.logMessage("error","Failed to filter todo list due to: "+JSON.stringify(error.message),"PMSSupport","filterTodoLists",email,tenant,moduleName);
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, email, "PMSSupport", "filterTodoLists", startDateTime, endDateTime, diffInMS, moduleName);
        return out;
    },
    groupBy:async function(objectArray, property) {
        return objectArray.reduce((acc, obj) => {
           const key = obj[property];
           if (!acc[key]) {
              acc[key] = [];
           }
           // Add object to list for given key's value
           acc[key].push(obj);
           return acc;
        }, {});
    },
    onBoardAndAssignTask: async function (taskId, projectId, userId, loggedUser, tenant, isOnboard,tenantId) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let functionName = "onBoardAndAssignTask";
        appLogger.logMessage("debug", functionName + " is called with projectId: " + projectId + " and userId: " + userId + " and isOnboard: " + isOnboard, "PMSSupport", functionName, loggedUser, tenant, moduleName);
        let out = {
            status: "Success",
            message: "Successfully notified the user via whatsapp"
        }
        try {
            let query = "";
            let param = [];
            if (isOnboard) {
                appLogger.logMessage("info", "Onboarding user: " + userId + " to the project: " + projectId, "PMSSupport", functionName, loggedUser, tenant, moduleName);
                query = mysqlQueries.getProjectDataToNotify;
                param = [projectId, userId];
            } else {
                query = mysqlQueries.getTasksDataToNotify;
                param = [tenantId,taskId];
                appLogger.logMessage("debug", "Assigning task to the user: " + userId + " to the task: " + taskId, "PMSSupport", functionName, loggedUser, tenant, moduleName);
            }
            let result = await dbOperations.executeQuery(query, param, loggedUser, "fetching user to send notification for onboard/assigntask", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result) {
                if (Array.isArray(result)) {
                    if (result.length > 0) {
                        let payload = {};
                        let endPoint = "";
                        if (isOnboard) {
                            payload = {
                                "projectName": result[0].PROJECT_NAME,
                                "userName": result[0].FULL_NAME,
                                "projectId": result[0].PROJECT_ID,
                                "userEmail": result[0].USER_EMAIL,
                                "whatsappNumber": result[0].WHATSAPP_NUMBER,
                                "tenant": result[0].TENANT_NAME,
                                "tenantId": result[0].TENANT_ID,
                                "loggedUserId":result[0].USER_ID,
                                "whatsappId":result[0].WHATSAPP_ID
                            }
                            endPoint = config.whatsAppServerUrl + config.whatsAppEndpoints.onboardUser;
                        } else {
                            payload = {
                                "userName": result[0].FULL_NAME,
                                "projectName": result[0].PROJECT_NAME,
                                "taskId": result[0].TASK_ID,
                                "projectId": result[0].PROJECT_ID,
                                "taskName": result[0].TASK_NAME,
                                "taskDescription": result[0].TASK_DESCRIPTION,
                                "expectedCompletionDate": result[0].ESTIMATED_COMPLETION_DATE,
                                "userEmail": result[0].EMAIL,
                                "taskStatus": result[0].STATUS,
                                "whatsappNumber": result[0].WHATSAPP_NUMBER,
                                "tenant": result[0].TENANT_NAME,
                                "tenantId": result[0].TENANT_ID,
                                "whatsappId":result[0].WHATSAPP_ID,
                                "subStatus":result[0].subStatus
                            }
                            endPoint = config.whatsAppServerUrl + config.whatsAppEndpoints.assignTask;
                        }
                        var configuration = {
                            method: 'post',
                            url: endPoint,
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            data: payload
                        };
                        axios(configuration)
                            .then(function (response) {
                                appLogger.logMessage("debug","Response after whatsapp api call: "+JSON.stringify(response.data),"PMSSupport",functionName,loggedUser,tenant,moduleName);
                                out = response.data;
                                return out;
                            })
                            .catch(function (error) {
                                out.status = "Failed";
                                out.message = "Failed to notify user due to: " + JSON.stringify(error.message)
                                appLogger.logMessage("debug",out.message,"PMSSupport",functionName,loggedUser,tenant,moduleName);
                                return out;
                            });

                    } else {
                        out.status = "Failed";
                        out.message = "Failed to send notification due to no users found to notify";
                        appLogger.logMessage("debug", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
                        return out;
                    }
                } else {
                    out.status = "Failed";
                    out.message = "Invalid response from the server";
                    appLogger.logMessage("debug", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
                    return out;
                }
            } else {
                out.status = "Failed";
                out.message = "Failed to notify the users due to invalid response from the server";
                appLogger.logMessage("debug", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
                return out;
            }
        } catch (error) {
            out.status = "Failed";
            out.message = "Failed to notify the user due to: " + JSON.stringify(error.message);
            appLogger.logMessage("error", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
            return out;
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "filterTodoLists", startDateTime, endDateTime, diffInMS, moduleName);
    },

    //update actual effort  of task when worklog is submitted
    updateActualEffort: async function (taskId,tenantId,loggedUserId,loggedUser,tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let response = false;
        try {
            appLogger.logMessage("info", "updateActualEffort function begins", "PMSSupport", "updateActualEffort", loggedUser, tenant, moduleName);

            let query = mysqlQueries.getWorkLog;
            let param = [
                taskId,
                loggedUserId,
                tenantId
            ];
            let result = await dbOperations.executeQuery(query, param, loggedUser, "updateActualEffort", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result != null && result != undefined && result != 'Error') {
                appLogger.logMessage("debug", "worklog hours of the day fetched ", +JSON.stringify(result), "PMSSupport", "updateActualEffort", loggedUser, tenant, moduleName);
                let query1 = mysqlQueries.updateActualEffort;
                let hours=result[0].TOTAL_HOURS
                let param1 = [
                    hours,
                    loggedUserId,
                    taskId,
                    tenantId
                ];

                let result1 = await dbOperations.executeQuery(query1, param1, loggedUser, "updateActualEffort", false, null, tenant,appLogger,meteringLogger,moduleName);
                if(result1 != null && result1 != undefined && result1 != 'Error'){
                    if(result1){
                        appLogger.logMessage("info", "Actual effort of the task  updated successfully ", "PMSSupport", "updateActualEffort", loggedUser, tenant, moduleName);
                        response=true
                    }else{
                        appLogger.logMessage("info", "Failed to update actual effort of the task ", "PMSSupport", "updateActualEffort", loggedUser, tenant, moduleName);

                    }
                }else{
                    appLogger.logMessage("info", "Failed to update actual effort of the task ", "PMSSupport", "updateActualEffort", loggedUser, tenant, moduleName);

                }

            }else{
                appLogger.logMessage("info", "Failed to fetch hours logged ", "PMSSupport", "updateActualEffort", loggedUser, tenant, moduleName);

            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "updateActualEffort", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  updateActualEffort" + error.message, "PMSSupport", "updateActualEffort", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "updateActualEffort function completed", "PMSSupport", "updateActualEffort", loggedUser, tenant, moduleName);
        return response;
    },

    //fetch  dependancy tasks of a task
    getDependencyTask: async function (taskId,tenantId,loggedUser,tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let response = false;
        let dependencyTasks={}
        try {
            appLogger.logMessage("info", "getDependencyTask function begins", "PMSSupport", "getDependencyTask", loggedUser, tenant, moduleName);

            let query = mysqlQueries.getDependencyTask;
            let param = [
                taskId,
                tenantId
            ];
            let predecessorArray=[]
            let successorArray=[]
            let sIdArray=[]
            let pIdArray=[]
            let result = await dbOperations.executeQuery(query, param, loggedUser, "getDependencyTask", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result != null && result != undefined && result != 'Error') {
                if(result.length>0){
                    appLogger.logMessage("debug", "dependency tasks are fetched successfully ", +JSON.stringify(result), "PMSSupport", "getDependencyTask", loggedUser, tenant, moduleName);
                    for(let data of result){
                        if(data.PREDECESSOR_TASK_ID!=null && data.PREDECESSOR_TASK_ID!=undefined){
                            let obj={'TASK_ID':data.PREDECESSOR_TASK_ID,'TASK_NAME':data.TASK_NAME,
                                'TASK_DESCRIPTION':data.TASK_DESCRIPTION,'TASK_STATUS':data.TASK_STATUS_TYPE_CODE,
                                'CANNOT_START':data.CANNOT_START,'CANNOT_COMPLETE':data.CANNOT_COMPLETE}
                                pIdArray.push(data.PREDECESSOR_TASK_ID)
                                predecessorArray.push(obj)
                        }else if(data.SUCCESSOR_TASK_ID!=null && data.SUCCESSOR_TASK_ID!=undefined){
                            let obj={'TASK_ID':data.SUCCESSOR_TASK_ID,'TASK_NAME':data.TASK_NAME,
                                'TASK_DESCRIPTION':data.TASK_DESCRIPTION ,'TASK_STATUS':data.TASK_STATUS_TYPE_CODE,
                                'CANNOT_START':data.CANNOT_START,'CANNOT_COMPLETE':data.CANNOT_COMPLETE}
                                sIdArray.push(data.SUCCESSOR_TASK_ID)
                                successorArray.push(obj)
                        }
                    }
                }else{
                    appLogger.logMessage("info", "No  dependency  task available ", "PMSSupport", "getDependencyTask", loggedUser, tenant, moduleName);
                }
                
                dependencyTasks={'PREDECESSOR':predecessorArray,'SUCCESSOR':successorArray,
                'sIdArray':sIdArray,'pIdArray':pIdArray  }
            }else{
                appLogger.logMessage("info", "Failed to fetch hours logged ", "PMSSupport", "getDependencyTask", loggedUser, tenant, moduleName);

            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "getDependencyTask", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  getDependencyTask" + error.message, "PMSSupport", "getDependencyTask", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "getDependencyTask function completed", "PMSSupport", "getDependencyTask", loggedUser, tenant, moduleName);
        return  dependencyTasks
    },

    //check whether the successor tasks are completed or not 
    checkCompletedOrNot: async function (taskIdArray,tenantId,loggedUser,tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let isCompleted=true
        try {
            appLogger.logMessage("info", "checkCompletedOrNot function begins", "PMSSupport", "checkCompletedOrNot", loggedUser, tenant, moduleName);
            let query = mysqlQueries.checkCompletedOrNot;
            let param = [
                taskIdArray,
                tenantId,
            ];
            let result = await dbOperations.executeQuery(query, param, loggedUser, "checkCompletedOrNot", false, null, tenant,appLogger,meteringLogger,moduleName);
            if(result != null && result != undefined && result != "error"){
                for( let x of result){
                    // check whether  any of the successor tasks are not completed , if so set isCompleted flag as false
                    if(x.TASK_STATUS_TYPE_CODE=='IP' || x.TASK_STATUS_TYPE_CODE=='NS' || x.TASK_STATUS_TYPE_CODE=='OPEN' || x.TASK_STATUS_TYPE_CODE=='HOLD' ){
                        isCompleted=false
                        break
                    }
                }
                
            }
            
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "getDependencyTask", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  getDependencyTask" + error.message, "PMSSupport", "getDependencyTask", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "getDependencyTask function completed", "PMSSupport", "getDependencyTask", loggedUser, tenant, moduleName);
        return  isCompleted
    },

    // check whether the task is a predecessor of another task, id so  check whether that task is 
    // completed or not, if it is not completed , set canStart is false
    predecessorOrNot: async function (taskId,tenantId,loggedUser,tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let taskIdArray=[]
        try {
            appLogger.logMessage("info", "predecessorOrNot function begins", "PMSSupport", "predecessorOrNot", loggedUser, tenant, moduleName);
            let query = mysqlQueries.predecessorOrNot;
            let param = [
                taskId,
                tenantId,
            ];
            let result = await dbOperations.executeQuery(query, param, loggedUser, "predecessorOrNot", false, null, tenant,appLogger,meteringLogger,moduleName);
            if(result != null && result != undefined && result != "error"){
                if(result.length>0){
                    appLogger.logMessage("info", "The task  is the  predecessor of  some other tasks", "PMSSupport", "predecessorOrNot", loggedUser, tenant, moduleName);
                    // given task  is a predecessor of some other task
                    for( let x of result){
                        taskIdArray.push(x.TASK_ID)
                    }
                }
                
            }else{
                appLogger.logMessage("info", "Failed to check  whether the task is a predecessor of any other tasks", "PMSSupport", "predecessorOrNot", loggedUser, tenant, moduleName);

            }
            
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "predecessorOrNot", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  predecessorOrNot" + error.message, "PMSSupport", "predecessorOrNot", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "predecessorOrNot function completed", "PMSSupport", "predecessorOrNot", loggedUser, tenant, moduleName);
        return  taskIdArray
    },
    isMilestoneExists: async function (milestoneName, projectId, tenantId, loggedUser, tenant, isEdit, milestoneId) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let response = null;
        try {
            appLogger.logMessage("info", "isMilestoneExists function begins", "PMSSupport", "isMilestoneExists", loggedUser, tenant, moduleName);
            let query = mysqlQueries.milestoneExistsQuery;
            let param = [tenantId,milestoneName.toUpperCase().trim(),projectId];
            if(isEdit){
                query += "AND ID != ?";
                param.push(milestoneId)
            }
            let result = await dbOperations.executeQuery(query, param, loggedUser, "isMilestoneExists", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result != null && result != undefined && result != 'error ') {
                if (result.length != null && result.length != undefined) {
                    response = result.length;
                }
                appLogger.logMessage("info", "isMilestoneExists function result", +JSON.stringify(result), "PMSSupport", "isMilestoneExists", loggedUser, tenant, moduleName);

            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "isMilestoneExists", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  isMilestoneExists" + error.message, "PMSSupport", "isMilestoneExists", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "isMilestoneExists function completed", "PMSSupport", "isMilestoneExists", loggedUser, tenant, moduleName);
        return response;
    },
    isModuleExists: async function (module, projectId, tenantId, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let response = null;
        try {
            appLogger.logMessage("info", "isModuleExists function begins", "PMSSupport", "isModuleExists", loggedUser, tenant, moduleName);
            let query = mysqlQueries.moduleExistsQuery;
            let param = [tenantId,module,projectId];
            let result = await dbOperations.executeQuery(query, param, loggedUser, "isModuleExists", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result != null && result != undefined && result != 'error ') {
                if (result.length != null && result.length != undefined) {
                    response = result.length;
                }
                appLogger.logMessage("info", "isModuleExists function result", +JSON.stringify(result), "PMSSupport", "isModuleExists", loggedUser, tenant, moduleName);

            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "isModuleExists", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  isModuleExists" + error.message, "PMSSupport", "isModuleExists", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "isModuleExists function completed", "PMSSupport", "isMilestoneExists", loggedUser, tenant, moduleName);
        return response;
    },
    notifyProjectManager: async function (taskId, userId,statusTypeCode, loggedUser, tenant,tenantId,approvalRequired) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let functionName = "notifyProjectManager";
        appLogger.logMessage("info", "notifyProjectManager support function is started", functionName, loggedUser, tenant, moduleName);
        let out = {
            status: "Success",
            message: "Successfully notified the project manager via whatsapp"
        }
        try {
            let query = "",sub,message;
            let param = [];
            query = mysqlQueries.getManagerDataToNotify;
            param = [taskId];
            appLogger.logMessage("debug", "Assigning task to the user: " + userId + " to the task: " + taskId, "PMSSupport", functionName, loggedUser, tenant, moduleName);
            let result = await dbOperations.executeQuery(query, param, loggedUser, "fetching user to send notification for onboard/assigntask", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result) {
                if (Array.isArray(result)) {
                    if (result.length > 0) {
                        let payload = {};
                        let endPoint = "";
                        let msg=""
                        // check it is task status change to inform project manager
                        if(statusTypeCode=='IP'){
                            msg=  result[0].ASSIGNED_TO_NAME+" has started ' "+result[0].TASK_NAME+" ' in ' "+result[0].PROJECT_NAME +" ' project"
                        }else if(statusTypeCode=='HOLD'){
                          msg=  result[0].ASSIGNED_TO_NAME+" has holed ' "+result[0].TASK_NAME+" ' in ' "+result[0].PROJECT_NAME +" ' project"
                        }else if(statusTypeCode=='COM'){
                            if(approvalRequired != undefined && approvalRequired != null){
                                if(approvalRequired == 'Y'){
                                    msg= "You have a pending approval of task '"+ result[0].TASK_NAME+"' in the '"+result[0].PROJECT_NAME +"' project, which has been completed by "+result[0].ASSIGNED_TO_NAME+"."
                                    sub = mailConfig.task.approval.sub;
                                    sub = sub.replace("{projectName}",result[0].PROJECT_NAME)
                                    sub = sub.replace("{taskId}",result[0].TASK_ID)
                                    message = mailConfig.task.approval.message;
                                    message = message.replace("{projectName}",result[0].PROJECT_NAME)
                                    message = message.replace("{taskId}",result[0].TASK_ID)
                                    message = message.replace("{taskName}",result[0].TASK_NAME)
                                    message = message.replace("{taskDescription}",result[0].TASK_DESCRIPTION)
                                    sendMails(result, null, null, sub, message, loggedUser, tenant, null, false, tenantId, appLogger, meteringLogger, moduleName)
                                    await this.notifyInApp(result[0].ASSIGNED_TO, result[0].Id, msg,taskId,'TASK',tenantId,loggedUser,tenant)
                                }   else{
                                    msg=  result[0].ASSIGNED_TO_NAME+" has completed ' "+result[0].TASK_NAME+" ' in ' "+result[0].PROJECT_NAME +" ' project"
                                }
                            }else{
                                msg=  result[0].ASSIGNED_TO_NAME+" has completed ' "+result[0].TASK_NAME+" ' in ' "+result[0].PROJECT_NAME +" ' project"
                            }
                        }
                        payload = {
                            "message":msg,
                            "loggedUser":loggedUser,
                            "whatsappNumber": result[0].PM_WHATSAPP_NUMBER,
                            "tenant": result[0].TENANT_NAME,
                            "tenantId": result[0].TENANT_ID,
                            "whatsappId":result[0].WHATSAPP_ID
                        }
                        endPoint = config.whatsAppServerUrl + config.whatsAppEndpoints.notifyUser;
                    
                        var configuration = {
                            method: 'post',
                            url: endPoint,
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            data: payload
                        };
                        axios(configuration)
                            .then(function (response) {
                                appLogger.logMessage("debug","Response after whatsapp api call: "+JSON.stringify(response.data),"PMSSupport",functionName,loggedUser,tenant,moduleName);
                                out = response.data;
                                return out;
                            })
                            .catch(function (error) {
                                out.status = "Failed";
                                out.message = "Failed to notify user due to: " + JSON.stringify(error.message)
                                appLogger.logMessage("debug",out.message,"PMSSupport",functionName,loggedUser,tenant,moduleName);
                                return out;
                            });

                    } else {
                        out.status = "Failed";
                        out.message = "Failed to send notification due to no users found to notify";
                        appLogger.logMessage("debug", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
                        return out;
                    }
                } else {
                    out.status = "Failed";
                    out.message = "Invalid response from the server";
                    appLogger.logMessage("debug", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
                    return out;
                }
            } else {
                out.status = "Failed";
                out.message = "Failed to notify the users due to invalid response from the server";
                appLogger.logMessage("debug", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
                return out;
            }
        } catch (error) {
            out.status = "Failed";
            out.message = "Failed to notify the user due to: " + JSON.stringify(error.message);
            appLogger.logMessage("error", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
            return out;
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "filterTodoLists", startDateTime, endDateTime, diffInMS, moduleName);
    },

    getTeamMailData: async function ( projectId, tenantId, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let response = null;
        let mailDataArray=[]
        try {
            appLogger.logMessage("info", "getTeamMailData function begins", "PMSSupport", "getTeamMailData", loggedUser, tenant, moduleName);
            let query = mysqlQueries.getTeamMailData;
            let param = [tenantId,projectId];
            let result = await dbOperations.executeQuery(query, param, loggedUser, "getTeamMailData", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result != null && result != undefined && result != 'error ') {
                if (result.length>0) {
                    for(let data of result){
                        let obj={'Id':data.ID,'Email':data.EMAIL}
                        mailDataArray.push(obj)
                        obj={}
                    }
                    response=mailDataArray
                }
                appLogger.logMessage("info", "getTeamMailData function result", +JSON.stringify(result), "PMSSupport", "getTeamMailData", loggedUser, tenant, moduleName);

            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "getTeamMailData", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  getTeamMailData" + error.message, "PMSSupport", "getTeamMailData", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "getTeamMailData function completed", "PMSSupport", "getTeamMailData", loggedUser, tenant, moduleName);
        return response;
    },

    // check whether any subtask exists under task
    anySubTaskExits: async function ( taskId, status,tenantId, loggedUserId,loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let response = false;
        
        try {
            appLogger.logMessage("info", "anySubTaskExits function begins", "PMSSupport", "anySubTaskExits", loggedUser, tenant, moduleName);
            if(status=='HOLD'){
                // main task status is changed to HOLD all its subtask should be in HOLD
                let query = mysqlQueries.updateSubTaskStatus;
                let param = ['HOLD',loggedUserId,tenantId,taskId];
                let result = await dbOperations.executeQuery(query, param, loggedUser, "anySubTaskExits", false,null, tenant,appLogger,meteringLogger,moduleName);
                if (result != null && result != undefined && result != 'error ') {
                    if(result){
                        response=true
                    }
                }
            }else if(status=='IP'){
                //main task is resumed all its subtask should be in OPEN
                let query = mysqlQueries.updateSubTaskStatus;
                    let param = ['OPEN',loggedUserId,tenantId,taskId,];
                    let result = await dbOperations.executeQuery(query, param, loggedUser, "anySubTaskExits", false, null, tenant,appLogger,meteringLogger,moduleName);
                    if (result != null && result != undefined && result != 'error ') {
                        if(result){
                            response=true
                        }
                    }
            }else if(status=='COM'){
                // to complete main task  check whether any subtak exits and its status is IP/OPEN/HOLD
                let query = mysqlQueries.anySubTaskExits;
                let param = [tenantId,taskId];
                let result = await dbOperations.executeQuery(query, param, loggedUser, "anySubTaskExits", false, null, tenant,appLogger,meteringLogger,moduleName);
                if (result != null && result != undefined && result != 'error '){
                    for(let data of result){
                        if(data.TASK_STATUS_TYPE_CODE=='IP' || data.TASK_STATUS_TYPE_CODE=='OPEN' || data.TASK_STATUS_TYPE_CODE=='HOLD'){
                            response=true // main task can not be completed until subtask completed
                            break
                        }
                    }
                }
                
            }else if(status=='CLOSED'){
                // any subtask exits under the Main task . main task can not be closed 
                let query = mysqlQueries.anySubTaskExits;
                let param = [tenantId,taskId];
                let result = await dbOperations.executeQuery(query, param, loggedUser, "anySubTaskExits", false, null, tenant,appLogger,meteringLogger,moduleName);
                if (result != null && result != undefined && result != 'error ') {
                if (result.length>0) {
                    response=true
                }
            }
            }
            
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "anySubTaskExits", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  anySubTaskExits" + error.message, "PMSSupport", "anySubTaskExits", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "anySubTaskExits function completed", "PMSSupport", "anySubTaskExits", loggedUser, tenant, moduleName);
        return response;
    },

    // check whether any task or issue still active in the project
    anyActiveTasksOrIssueUnderProject: async function ( projectId, tenantId, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let response = null;
        let countObj={}
        try {
            appLogger.logMessage("info", "anyActiveTasksOrIssueUnderProject function begins", "PMSSupport", "anyActiveTasksOrIssueUnderProject", loggedUser, tenant, moduleName);
            let query = mysqlQueries.anyActiveTasksUnderProject;
            let param = [tenantId,projectId];
            let result = await dbOperations.executeQuery(query, param, loggedUser, "anyActiveTasksOrIssueUnderProject", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result != null && result != undefined && result != 'error ') {
                countObj['TASK_COUNT']=result[0].TASK_COUNT
                appLogger.logMessage("info", "Task count fetched successfully ", +JSON.stringify(result), "PMSSupport", "anyActiveTasksOrIssueUnderProject", loggedUser, tenant, moduleName);

            }
            query = mysqlQueries.anyActiveIssueUnderProject;
            param = [tenantId,projectId];
            result = await dbOperations.executeQuery(query, param, loggedUser, "anyActiveTasksOrIssueUnderProject", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result != null && result != undefined && result != 'error ') {
                countObj['ISSUE_COUNT']=result[0].ISSUE_COUNT
                appLogger.logMessage("info", "Issue count fetched successfully ", +JSON.stringify(result), "PMSSupport", "anyActiveTasksOrIssueUnderProject", loggedUser, tenant, moduleName);

            }
            response=countObj
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "anyActiveTasksOrIssueUnderProject", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  anyActiveTasksOrIssueUnderProject" + error.message, "PMSSupport", "anyActiveTasksUnderProject", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "anyActiveTasksOrIssueUnderProject function completed", "PMSSupport", "anyActiveTasksOrIssueUnderProject", loggedUser, tenant, moduleName);
        return response;
    },
    //close all issues under project 
    closeAllIssues: async function (projectId,loggedUserId,loggedUser,tenantId,tenant) {
        let out = {
            status: "Success",
            message: "Successfully closed all the issues",
            data: []
        }
        try {
            appLogger.logMessage("debug", "closeAllIssues called ", "PMSSupport", "closeAllIssues", loggedUser, tenant)
            let query = mysqlQueries.closeAllIssueQuery;
            let param = [loggedUserId, projectId,tenantId];
            let result = await dbOperations.executeQuery(query, param, loggedUser, "closeAllIssues", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result) {
                if (result.affectedRows>0) {
                    appLogger.logMessage("info", "All issues under the given projects are updated", "PMSSupport", "closeAllIssues", loggedUser, tenant);
                } else {
                    appLogger.logMessage("info", "All issues are already closed", "PMSSupport", "closeAllIssues", loggedUser, tenant);
                    out.message = "All issues are already closed";
                }
            } else {
                appLogger.logMessage("error", "Failed to close all issues", "PMSSupport", "closeAllIssues", loggedUser, tenant);
                out.status = "Failure";
                out.message = "Internal Server Error";
            }
        } catch (error) {
            appLogger.logMessage("error", "Failed to close all issues due to: " + JSON.stringify(error.message), "PMSSupport", "closeAllIssues", loggedUser, tenant);
            out.status = "Failure";
            out.message = "Internal server error";
            out.data = JSON.stringify(error.message);
        }
        appLogger.logMessage("debug", "Response after executing closeAllIssues: " + JSON.stringify(out), "PMSSupport", "closeAllIssues", loggedUser, tenant);
        return out;
    },
    // get project owner data to notify if automated task is not assigned to employee
    getProjectOwnerDetails: async function (projectId,loggedUser,tenantId,tenant) {
        let out = {
            status: "Success",
            message: "Successfully fetched project owner details",
            data: []
        }
        try {
            appLogger.logMessage("debug", "getProjectOwnerDetails called ", "PMSSupport", "getProjectOwnerDetails", loggedUser, tenant)
            let query = mysqlQueries.getProjectOwnerToNotify;
            let param = [tenantId, projectId];
            let result = await dbOperations.executeQuery(query, param, loggedUser, "getProjectOwnerDetails", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result!=undefined && result!=null && result!='Error') {
                if (result.length>0) {
                    let res=[]
                    appLogger.logMessage("info", "Project owner details fetched successfully", "PMSSupport", "getProjectOwnerDetails", loggedUser, tenant);
                    for(let owner of result){
                        let obj={'Id':owner.ID,'Email':owner.EMAIL}
                        res.push(obj)
                    }
                    out.data=res
                } else {
                    appLogger.logMessage("info", "No owners exists", "PMSSupport", "getProjectOwnerDetails", loggedUser, tenant);
                    out.message = "All issues are already closed";
                }
            } else {
                appLogger.logMessage("error", "Failed to fetch owners", "PMSSupport", "closeAllIssues", loggedUser, tenant);
                out.status = "Failure";
                out.message = "Internal Server Error";
            }
        } catch (error) {
            appLogger.logMessage("error", "Failed to fetch project owners: " + JSON.stringify(error.message), "PMSSupport", "getProjectOwnerDetails", loggedUser, tenant);
            out.status = "Failure";
            out.message = "Internal server error";
            out.data = JSON.stringify(error.message);
        }
        appLogger.logMessage("debug", "Response after executing getProjectOwnerDetails: " + JSON.stringify(out), "PMSSupport", "getProjectOwnerDetails", loggedUser, tenant);
        return out;
    },


    //IS GROUP NAME EXISTS
    isGroupNameExists: async function (group,projectId, tenantId, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let response = null;
        try {
            appLogger.logMessage("info", "isGroupNameExists function begins", "PMSSupport", "isGroupNameExists", loggedUser, tenant, moduleName);
            let groupName=group.trim()
            let query = mysqlQueries.isGroupNameExists;
            let param = [
                tenantId,
                projectId,
                groupName.toUpperCase()
            ];
            let result = await dbOperations.executeQuery(query, param, loggedUser, "isGroupNameExists", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result != null && result != undefined && result != 'error ') {
                if (result.length != null && result.length != undefined) {
                    response = result;
                }
                appLogger.logMessage("info", "isGroupNameExists function result", +JSON.stringify(result), "PMSSupport", "isGroupNameExists", loggedUser, tenant, moduleName);

            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "isGroupNameExists", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  isGroupNameExists" + error.message, "PMSSupport", "isGroupNameExists", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "isGroupNameExists function completed", "PMSSupport", "isGroupNameExists", loggedUser, tenant, moduleName);
        return response;
    },
    groupStatusChange: async function (projectId, groupId, tenantId, loggedUserId, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let response = null;
        try {
            let query,param
            appLogger.logMessage("info", "groupStatusChange function begins", "PMSSupport", "groupStatusChange", loggedUser, tenant, moduleName);
            let newStatus=null
            query = mysqlQueries.getStatusCountOfTask;
            param = [projectId,groupId,tenantId];
            let result = await dbOperations.executeQuery(query, param, loggedUser, "groupStatusChange", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result != null && result != undefined && result != 'error ') {
                if (result.length != null && result.length != undefined) {
                    let total = Object.values(result[0]).reduce((a, b) => a + b, 0)
                    appLogger.logMessage("info", "Status of the group fetched", "PMSSupport", "groupStatusChange", loggedUser, tenant, moduleName);
                    if(total==result[0].NS){
                        newStatus='NS'
                    }else if(total==result[0].IP || Number(result[0].IP) > 0 || total==result[0].OPEN){
                        newStatus='IP'
                    }else if(total==result[0].HOLD){
                        newStatus='HOLD'
                    }else if(total==result[0].COM){
                        newStatus='COM'
                    }else if(Number(result[0].NS) > 0 || Number(result[0].OPEN) > 0 || Number(result[0].HOLD) > 0){
                        newStatus='IP'
                    }else if(Number(result[0].COM) > 0 ){
                        newStatus='COM'
                    }else{
                        newStatus ='NS'
                    }
                }
            }
            if(newStatus!=null){
                query = mysqlQueries.updateGroupStatus;
                param = [newStatus,loggedUserId,tenantId,groupId];
                result = await dbOperations.executeQuery(query, param, loggedUser, "groupStatusChange", false, null, tenant,appLogger,meteringLogger,moduleName);
                if(result!=undefined &&result!=null){
                    if(result.affectedRows>0){
                        response =  result
                        appLogger.logMessage("info", "Group status changed" , "PMSSupport", "groupStatusChange", loggedUser, tenant, moduleName);
                    }else{
                        response =  result
                        appLogger.logMessage("info", "Failed to change group status changed" , "PMSSupport", "groupStatusChange", loggedUser, tenant, moduleName);
                    }
                }
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "groupStatusChange", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  groupStatusChange" + error.message, "PMSSupport", "groupStatusChange", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "groupStatusChange function completed", "PMSSupport", "groupStatusChange", loggedUser, tenant, moduleName);
        return response;
    },
    mainTaskStatusChange: async function (mainTaskId,loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let newStatus = null;
        try {
            let query,param
            appLogger.logMessage("info", "mainTaskStatusChange function begins", "PMSSupport", "mainTaskStatusChange", loggedUser, tenant, moduleName);
            query = mysqlQueries.getStatusCountOfSubByMainTask;
            param = [mainTaskId,mainTaskId];
            let result = await dbOperations.executeQuery(query, param, loggedUser, "getStatusCountOfSubByMainTask", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result != null && result != undefined && result != 'error ') {
                if (result.length != null && result.length != undefined) {
                    let total = Object.values(result[0]).reduce((a, b) => a + b, 0)
                    appLogger.logMessage("info", "Status of the sub task fetched", "PMSSupport", "mainTaskStatusChange", loggedUser, tenant, moduleName);
                    if(total==result[0].NS){
                        newStatus='NS'
                    }else if(total==result[0].IP || Number(result[0].IP) > 0){
                        newStatus='IP'
                    }else if(total==result[0].OPEN){
                        newStatus='OPEN'
                    }else if(total==result[0].HOLD){
                        newStatus='HOLD'
                    }else if(total==result[0].COM){
                        newStatus='IP'
                    }else if(total==result[0].CLOSED){
                        if(result[0].STATUS=='NS'){
                            newStatus='NS'
                        }else{
                            newStatus='IP'

                        }
                    }else if(Number(result[0].NS) > 0 || Number(result[0].OPEN) > 0 || Number(result[0].HOLD) > 0){
                        newStatus='IP'
                    }else if(Number(result[0].COM) > 0){
                        newStatus='IP'
                    }else{
                        newStatus ='NS'
                    }
                    if(newStatus!=null){
                        result = await dbOperations.executeQuery(mysqlQueries.updateMainTaskStatus, [newStatus,mainTaskId], loggedUser, "updateMainTaskStatus", false, null, tenant,appLogger,meteringLogger,moduleName);
                        if(result!=undefined &&result!=null){
                            if(result.affectedRows>0){
                                appLogger.logMessage("info", "Main Task status changed" , "PMSSupport", "updateMainTaskStatus", loggedUser, tenant, moduleName);
                            }
                        }
                    }
                }
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "mainTaskStatusChange", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  mainTaskStatusChange" + error.message, "PMSSupport", "mainTaskStatusChange", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "mainTaskStatusChange function completed", "PMSSupport", "mainTaskStatusChange", loggedUser, tenant, moduleName);
        return newStatus;
    },

     //SET START DATE AND END DATE OF GROUP
     setStartDateEndDateOfGroup: async function (body, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let response = null;
        try {
            appLogger.logMessage("info", "setStartDateEndDateOfGroup function begins", "PMSSupport", "setStartDateEndDateOfGroup", loggedUser, tenant, moduleName);
            let query = mysqlQueries.getStartDateEndDateOfTask;
            let param = [
                body.tenantId,
                body.groupId,
                body.projectId,
                "MAIN"
                
            ];
            let result = await dbOperations.executeQuery(query, param, loggedUser, "setStartDateEndDateOfGroup", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result != null && result != undefined && result != 'error ') {
                appLogger.logMessage("info", " Minimum start date and  maximum end date of task fetched " +JSON.stringify(result),"PMSSupport", "setStartDateEndDateOfGroup", loggedUser, tenant, moduleName);

                if (result.length != null && result.length != undefined) {
                    let startDate=result[0].START_DATE
                    let endDate=result[0].END_DATE
                    let query = mysqlQueries.setStartDateEndDateOfGroup;
                    let param = [
                        startDate,
                        endDate,
                        body.loggedUserId,
                        body.groupId,
                        body.projectId,
                        body.tenantId
                    ];
                    let result1 = await dbOperations.executeQuery(query, param, loggedUser, "setStartDateEndDateOfGroup", false, null, tenant,appLogger,meteringLogger,moduleName);
                    if (result1 != null && result1 != undefined && result1 != 'error ') {
                        appLogger.logMessage("info", " Start date and end date of group is updated ","PMSSupport", "setStartDateEndDateOfGroup", loggedUser, tenant, moduleName);
                        if(result1){
                            response=true
                        }
                    }
                }

            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "setStartDateEndDateOfGroup", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  setStartDateEndDateOfGroup" + error.message, "PMSSupport", "setStartDateEndDateOfGroup", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "setStartDateEndDateOfGroup function completed", "PMSSupport", "setStartDateEndDateOfGroup", loggedUser, tenant, moduleName);
        return response;
    },

    //SET START DATE AND END DATE OF GROUP
    setStartDateEndDateOfMainTask: async function (body,loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let response = null;
        try {
            appLogger.logMessage("info", "setStartDateEndDateOfMainTask function begins", "PMSSupport", "setStartDateEndDateOfMainTask", loggedUser, tenant, moduleName);
            
            let query = mysqlQueries.getStartDateEndDateOfSubTask;
                let param = [
                    body.tenantId,
                    body.projectId,body.mainTaskId,
                    "SUB"
                    
                ];
                let result = await dbOperations.executeQuery(query, param, loggedUser, "setStartDateEndDateOfMainTask", false, null, tenant,appLogger,meteringLogger,moduleName);
                if (result != null && result != undefined && result != 'error ') {
                    appLogger.logMessage("info", " Minimum start date and  maximum end date of  subtask fetched " +JSON.stringify(result),"PMSSupport", "setStartDateEndDateOfMainTask", loggedUser, tenant, moduleName);
                    let param=[]
                    if (result.length != null && result.length != undefined) {
                        query=mysqlQueries.getTaskDetails
                        param=[body.mainTaskId]
                        let mainResult = await dbOperations.executeQuery(query, param, loggedUser, "setStartDateEndDateOfMainTask", false, null, tenant,appLogger,meteringLogger,moduleName);
                        if (mainResult != null && mainResult != undefined && mainResult != 'Error') {
                            if(mainResult.length>0){
                               let endDate
                                let startDate=moment(result[0].START_DATE).format('YYYY-MM-DD')
                                if(moment(mainResult[0].ESTIMATED_COMPLETION_DATE).format('YYYY-MM-DD') < moment(result[0].END_DATE).format('YYYY-MM-DD')){
                                    endDate=moment(result[0].END_DATE).format('YYYY-MM-DD')
                                }else{
                                    endDate=moment(mainResult[0].ESTIMATED_COMPLETION_DATE).format('YYYY-MM-DD')
                                }
                                let query = mysqlQueries.setStartDateEndDateOfTask;
                                
                                if(body.taskStatusTypeCode=='IP'  || body.taskStatusTypeCode=='HOLD' ){
                                    param = [startDate,body.actualCompletionDate,body.estimatedStartDate,body.estimatedCompletionDate,body.loggedUserId,body.mainTaskId,body.projectId,body.tenantId
                                    ];
                                    
                                }else if(body.taskStatusTypeCode=='COM'){
                                    param = [startDate,endDate,body.estimatedStartDate,body.estimatedCompletionDate,body.loggedUserId,body.mainTaskId,body.projectId,body.tenantId
                                    ];
                                }
                                else if(body.taskStatusTypeCode=='NS' ||body.taskStatusTypeCode=='OPEN' ){
            
                                    if(body.mainTaskStatus=='NS' ||body.mainTaskStatus =='OPEN'){
                                        param = [startDate,endDate,
                                            startDate,endDate,
                                            body.loggedUserId,body.mainTaskId,
                                            body.projectId,body.tenantId
                                        ];
                                    }else if(body.mainTaskStatus=='IP'){
                                        param = [startDate,body.actualCompletionDate,body.estimatedStartDate,body.estimatedCompletionDate,body.loggedUserId,body.mainTaskId,body.projectId,body.tenantId
                                        ];
                                    }
                                    
            
                                    
                                }else if(body.taskStatusTypeCode=='CLOSED'){
                                    param = [startDate, endDate,
                                        startDate, endDate,
                                        body.loggedUserId, body.mainTaskId,
                                        body.projectId, body.tenantId
                                    ];
                                 }
                                
                                let result1 = await dbOperations.executeQuery(query, param, loggedUser, "setStartDateEndDateOfMainTask", false, null, tenant,appLogger,meteringLogger,moduleName);
                                if (result1 != null && result1 != undefined && result1 != 'error ') {
                                    appLogger.logMessage("info", " Start date and end date of  main task  updated ","PMSSupport", "setStartDateEndDateOfMainTask", loggedUser, tenant, moduleName);
                                    if(result1){
                                        response=true
                                    }
                                }
                            }else{
                                appLogger.logMessage("info", "Failed to fetch main task details " +JSON.stringify(result),"PMSSupport", "setStartDateEndDateOfMainTask", loggedUser, tenant, moduleName);

                            }
                        }else{
                            appLogger.logMessage("info", "Failed to fetch main task details " +JSON.stringify(result),"PMSSupport", "setStartDateEndDateOfMainTask", loggedUser, tenant, moduleName);

                        }
        

                        
                    }else{
                        appLogger.logMessage("info", "Failed to fetch  sub task details " +JSON.stringify(result),"PMSSupport", "setStartDateEndDateOfMainTask", loggedUser, tenant, moduleName);

                    }
    
                }
            
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "setStartDateEndDateOfMainTask", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  setStartDateEndDateOfMainTask" + error.message, "PMSSupport", "setStartDateEndDateOfMainTask", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "setStartDateEndDateOfMainTask function completed", "PMSSupport", "setStartDateEndDateOfMainTask", loggedUser, tenant, moduleName);
        return response;
    },


    taskDateChange: async function (body, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let response = null;
        try {
            appLogger.logMessage("info", "taskDateChange function begins", "PMSSupport", "taskDateChange", loggedUser, tenant, moduleName);
            if(body.mainTaskId!=null && body.mainTaskId!=undefined && body.type=='SUB'){
                let query1 = mysqlQueries.getMainTaskStatus;
            let param1 = [
                body.tenantId,
                body.mainTaskId
            ];
            let result1 = await dbOperations.executeQuery(query1, param1, loggedUser, "setStartDateEndDateOfMainTask", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result1 != null && result1 != undefined && result1 != 'error ') {
                body.mainTaskStatus=result1[0].TASK_STATUS_TYPE_CODE
                // change  actual start date and end date of main task according to the dates of sub task
                let subTaskResult=await this.setStartDateEndDateOfMainTask(body,loggedUser,tenant)
                if(subTaskResult){
                    appLogger.logMessage("info", "Start date and end date  of main task  updated  " , "PMSSupport", "taskDateChange", loggedUser, tenant, moduleName);
                    let groupResult=await this.setStartDateEndDateOfGroup(body,loggedUser,tenant)
                    if(groupResult){
                        appLogger.logMessage("info", "Group start date and end date are updated  " , "PMSSupport", "taskDateChange", loggedUser, tenant, moduleName);
                        response=true
                    }else{
                        appLogger.logMessage("info", "Failed to update  start date and end date of group ", "PMSSupport", "taskDateChange", loggedUser, tenant, moduleName);
                    }
                }else{
                    appLogger.logMessage("info", "Failed to update  start date and end date of main task ", "PMSSupport", "taskDateChange", loggedUser, tenant, moduleName);
                }
            }else{
                appLogger.logMessage("info", "Failed to  status of tak ","PMSSupport", "setStartDateEndDateOfMainTask", loggedUser, tenant, moduleName);
                response=false
            }
                
            }
            if(body.type=='MAIN'){
                //change group start date and end date 
                let groupResult=await this.setStartDateEndDateOfGroup(body,loggedUser,tenant)
                if(groupResult){
                    appLogger.logMessage("info", "Group start date and end date are updated  " , "PMSSupport", "taskDateChange", loggedUser, tenant, moduleName);
                    response=true
                }else{
                    appLogger.logMessage("info", "Failed to update  start date and end date of group ", "PMSSupport", "taskDateChange", loggedUser, tenant, moduleName);
                    response=false
                }
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "taskDateChange", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  taskDateChange" + error.message, "PMSSupport", "taskDateChange", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "taskDateChange function completed", "PMSSupport", "taskDateChange", loggedUser, tenant, moduleName);
        return response;
    },

    taskStatusChange: async function (body, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        try {
            appLogger.logMessage("info", "taskStatusChange function begins", "PMSSupport", "taskStatusChange", loggedUser, tenant, moduleName);
            if(body.type=='SUB'){
                await this.mainTaskStatusChange(body.mainTaskId, loggedUser, tenant)
            }
            await this.groupStatusChange(body.projectId,body.groupId, body.tenantId, body.loggedUserId, loggedUser, tenant)
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "taskStatusChange", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  taskStatusChange" + error.message, "PMSSupport", "taskStatusChange", loggedUser, tenant, moduleName);
        }
        appLogger.logMessage("info", "taskStatusChange function completed", "PMSSupport", "taskStatusChange", loggedUser, tenant, moduleName);
    },
    // CHANGE GROUP ID OF SUB TASK IF THE MAIN TASK GROUP ID IS CHANGED
    changeSubTaskGroup: async function (groupId,loggedUserId,tenantId,mainTaskId ,loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let response = null;
        try {
            appLogger.logMessage("info", "changeSubTaskGroup function begins", "PMSSupport", "changeSubTaskGroup", loggedUser, tenant, moduleName);
            let query = mysqlQueries.changeSubTaskGroup;
            let param = [
                groupId,
                loggedUserId,
                tenantId,
                mainTaskId,
            ];
            let result = await dbOperations.executeQuery(query, param, loggedUser, "changeSubTaskGroup", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result != null && result != undefined && result != 'error ') {
                appLogger.logMessage("info", "Group id of sub task updated ", +JSON.stringify(result), "PMSSupport", "changeSubTaskGroup", loggedUser, tenant, moduleName);
                if (result) {
                    response = true;
                }
            }else{
                appLogger.logMessage("info", "Failed to update group of sub task ", +JSON.stringify(result), "PMSSupport", "changeSubTaskGroup", loggedUser, tenant, moduleName);
                response=false
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "changeSubTaskGroup", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  changeSubTaskGroup" + error.message, "PMSSupport", "changeSubTaskGroup", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "changeSubTaskGroup function completed", "PMSSupport", "changeSubTaskGroup", loggedUser, tenant, moduleName);
        return response;
    },

    // ADD  SUB TASK TO MILESTONE 
    addSubTaskToMilestone: async function (mainTaskId,subTaskId,loggedUserId,tenantId,loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let response = false;
        try {
            appLogger.logMessage("info", "addSubTaskToMilestone function begins", "PMSSupport", "addSubTaskToMilestone", loggedUser, tenant, moduleName);
            let query = mysqlQueries.isMainTaskAddedToMilestone;
            let param = [
                mainTaskId,
                tenantId,
            ];
            let result = await dbOperations.executeQuery(query, param, loggedUser, "addSubTaskToMilestone", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result != null && result != undefined && result != 'error ') {
                appLogger.logMessage("info", "Milestone details of main task fetched  ", "PMSSupport", "addSubTaskToMilestone", loggedUser, tenant, moduleName);
                if (result.length>0) {
                    let milestoneId=result[0].MILESTONE_ID
                    query = mysqlQueries.addTaskToMilestone;
                    let param=[]
                    let record=[]
                    record.push(tenantId)
                    record.push(milestoneId)
                    record.push(subTaskId)
                    record.push(moment().format('YYYY-MM-DD'))
                    record.push(loggedUserId)
                    record.push(loggedUserId)
                    param.push(record)
                    let result1 = await dbOperations.executeQuery(query,[param], loggedUser, "addTaskToMilestone", false, null, tenant,appLogger,meteringLogger,moduleName)
                    if (result1 != undefined && result1 != null && result!='Error'){
                        if(result1.affectedRows>0){
                            appLogger.logMessage("info", " Sub task added to the milestone successfully", "PMService", "addTaskToMilestone", loggedUser, tenant, moduleName);
                            response=true
                        }else{
                            appLogger.logMessage("info", "Failed to  add sub  task to milestone.", "PMService", "removeFavouriteProject", loggedUser, tenant, moduleName);
                            response=false
                        }
                    }
                }else{
                    response=true
                    appLogger.logMessage("info", "Main task of the sub task is not addded to any milestone ", "PMSSupport", "addSubTaskToMilestone", loggedUser, tenant, moduleName);

                }
            }else{
                appLogger.logMessage("info", "Failed to fetch  milestone details  of main task sub task ", "PMSSupport", "addSubTaskToMilestone", loggedUser, tenant, moduleName);
                response=false
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "addSubTaskToMilestone", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  addSubTaskToMilestone" + error.message, "PMSSupport", "addSubTaskToMilestone", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "addSubTaskToMilestone function completed", "PMSSupport", "addSubTaskToMilestone", loggedUser, tenant, moduleName);
        return response;
    },
    createTemplateTasks: async function (groups, projectId, tenantId, loggedUser, loggedUserId, tenant) {
        return new Promise(async function (resolve, reject) {
            startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            let out = {
                status: "Success",
                message: "Successfully created groups/task and subTasks based on the template"
            }
            appLogger.logMessage("debug", "createTemplateTask called", "PMSSupport", "createTemplateTasks", loggedUser, tenant, moduleName);
            try {
                let group_order = 0 
                for (let group of groups) {
                    let groupName = group.groupName;
                    group_order += 1
                    let groupDescription = group.description || groupName || null;
                    //checking the group already exists in the same project under the tenant
                    let query = mysqlQueries.checkGroupExists;
                    let param = [String(groupName).toLowerCase(), projectId, tenantId]
                    let groupRes = await dbOperations.executeQuery(query, param, loggedUser, "getGroups", false, null, tenant,appLogger,meteringLogger,moduleName);
                    let existsTasks = [];
                    if (groupRes) {
                        if (groupRes.length > 0) {
                            appLogger.logMessage("debug", "The group: " + groupName + " is already exists in the project", "PMSSupport", "createTemplateTasks", loggedUser, tenant, moduleName);
                        } else {
                            query = mysqlQueries.insertGroup;
                            let startDateArr = [];
                            let endDateArr = [];
                            for (let task of group.tasks) {
                                if (!startDateArr.includes(task.estimatedStartDate)) {
                                    startDateArr.push(task.estimatedStartDate);
                                }
                                if (!endDateArr.includes(task.estimatedCompletionDate)) {
                                    endDateArr.push(task.estimatedCompletionDate);
                                }
                            }
                            let sortedStartDateArr = startDateArr.sort((a, b) => new moment(a).format('DD-MM-YYYY') - new moment(b).format('DD-MM-YYYY'))
                            let sortedEndDateArr = endDateArr.sort((a, b) => new moment(a).format('DD-MM-YYYY') - new moment(b).format('DD-MM-YYYY'))
                            let groupStartDate = moment(sortedStartDateArr[0], "DD-MM-YYYY").format("YYYY-MM-DD");
                            let groupEndDate = moment(sortedEndDateArr[sortedEndDateArr.length - 1], "DD-MM-YYYY").format("YYYY-MM-DD");
                            param = [tenantId, projectId, groupName, groupDescription,group_order, groupStartDate, groupEndDate, loggedUserId, loggedUserId];
                            groupRes = await dbOperations.executeQuery(query, param, loggedUser, "insertGroup", false, null, tenant,appLogger,meteringLogger,moduleName);
                            if (groupRes) {
                                let groupId = groupRes.insertId;
                                query = mysqlQueries.checkIfTaskExists;

                                for (let task of group.tasks) {
                                    let param = [String(task.taskName).toLowerCase(), projectId, groupId];
                                    let taskExists = await dbOperations.executeQuery(query, param, loggedUser, "checkIfTaskExists", false, null,tenant,appLogger,meteringLogger,moduleName);
                                    if (taskExists) {
                                        if (taskExists.length > 0) {
                                            if (!existsTasks.includes(task.taskName)) {
                                                existsTasks.push(task.taskName);
                                            }
                                            appLogger.logMessage("debug", task.taskName + " is already exists under the given project and group", "PMSSupport", "createTemplateTask", loggedUser, tenant, moduleName);
                                        } else {
                                            let taskInsQuery = mysqlQueries.insertTask;
                                            let taskParam = [projectId, tenantId, task.taskName, task.description, "MAIN",
                                                groupId, "RES", loggedUserId,task.priority,task.orderOfExecution, moment(task.estimatedStartDate, "DD-MM-YYYY").format("YYYY-MM-DD"), moment(task.estimatedCompletionDate, "DD-MM-YYYY").format("YYYY-MM-DD"), task.durationInDays * 8,
                                                moment(task.estimatedStartDate, "DD-MM-YYYY").format("YYYY-MM-DD"), moment(task.estimatedCompletionDate, "DD-MM-YYYY").format("YYYY-MM-DD"), loggedUserId, loggedUserId];
                                            let insTask = await dbOperations.executeQuery(taskInsQuery, taskParam, loggedUser, "insertTaskFromTemplate", false, null, tenant,appLogger,meteringLogger,moduleName);
                                            if (insTask) {

                                                if (task.subTasks.length > 0) {
                                                    let taskId = insTask.insertId;
                                                    let subTaskParam = [];
                                                    for (let subTask of task.subTasks) {
                                                        let row = [projectId, tenantId, subTask.subTaskName, subTask.subTaskDescription, "SUB", taskId,
                                                            groupId, "RES", "NS", loggedUserId, "HIGH", subTask.orderOfExecution, true, moment(subTask.estimatedStartDate, "DD-MM-YYYY").format("YYYY-MM-DD"), moment(subTask.estimatedCompletionDate, "DD-MM-YYYY").format("YYYY-MM-DD"), subTask.durationInDays * 8,
                                                            moment(subTask.estimatedStartDate, "DD-MM-YYYY").format("YYYY-MM-DD"), moment(subTask.estimatedCompletionDate, "DD-MM-YYYY").format("YYYY-MM-DD"), loggedUserId, loggedUserId];
                                                        subTaskParam.push(row);
                                                    }
                                                    let subTaskInsertion = await dbOperations.executeQuery(mysqlQueries.insertSubTasks, [subTaskParam], loggedUser, "insertSubTaskFromTemplate", false, null, tenant,appLogger,meteringLogger,moduleName);
                                                    if (subTaskInsertion) {
                                                        appLogger.logMessage("debug", "Successfully inserted subTasks for: " + task.taskName, "PMSSupport", "createTemplateTasks", loggedUser, tenant, moduleName);
                                                    } else {
                                                        appLogger.logMessage("debug", 'Failed to insert subTasks due to internal server error', "PMSSupport", "createTemplateTasks", loggedUser, tenant, moduleName);
                                                    }
                                                }
                                            } else {
                                                appLogger.logMessage("debug", "Failed to insert task: " + task.taskName + " due to internal server error", "PMSSupport", "createTemplateTasks", loggedUser, tenant, moduleName);
                                            }
                                        }
                                    } else {
                                        appLogger.logMessage("debug", "Failed to check if task exists due to internal server error", "PMSSupport", "createTemplateTasks", loggedUser, tenant, moduleName);
                                    }
                                }
                            } else {
                                appLogger.logMessage("debug", "Failed to insert group: " + groupName + " due to internal server error", "PMSSupport", "createTemplateTask", loggedUser, tenant, moduleName);
                            }
                        }
                    } else {
                        out.status = "Failure";
                        out.message = "Failed to fetch groups due to invalid response from the server";
                        appLogger.logMessage("debug", out.message, "PMSSupport", "createTemplateTask", loggedUser, tenant, moduleName);
                    }
                }

            } catch (error) {
                out.status = "Failure";
                out.message = "Failed to create template due to: " + JSON.stringify(error.message);
                appLogger.logMessage("error", out.message, "PMSSupport", "createTemplateTasks", loggedUser, tenant, moduleName);
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "setStartDateEndDateOfMainTask", startDateTime, endDateTime, diffInMS, moduleName);
            resolve(out);
        })
    },
    notifyNewOwner: async function (ownerEmail,projectName,tenantId, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let functionName = "notifyProjectManager";
        appLogger.logMessage("info", "notifyNewOwner support function is started", functionName, loggedUser, tenant, moduleName);
        let out = {
            status: "Success",
            message: "Successfully notified the owner via whatsapp"
        }
        try {
            let query = "";
            let param = [];
            query = mysqlQueries.getUserId;
            param = [ownerEmail];
            appLogger.logMessage("debug", "Inform new project owner: " + ownerEmail , "PMSSupport", functionName, loggedUser, tenant, moduleName);
            let result = await dbOperations.executeQuery(query, param, loggedUser, "notifyNewOwner", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result) {
                if (Array.isArray(result)) {
                    if (result.length > 0) {
                        let payload = {};
                        let endPoint = "";
                        let msg=""
                        // inform new project owner about the role update
                        msg=  "You have been assigned  as project owner of the ' "+projectName +" ' project"

                        payload = {
                            "message":msg,
                            "loggedUser":loggedUser,
                            "whatsappNumber": result[0].WHATSAPP_NUMBER,
                            "tenant": tenant,
                            "tenantId": tenantId,
                            "whatsappId":result[0].WHATSAPP_ID
                        }
                        endPoint = config.whatsAppServerUrl + config.whatsAppEndpoints.notifyUser;
                    
                        var configuration = {
                            method: 'post',
                            url: endPoint,
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            data: payload
                        };
                        axios(configuration)
                            .then(function (response) {
                                appLogger.logMessage("debug","Response after whatsapp api call: "+JSON.stringify(response.data),"PMSSupport",functionName,loggedUser,tenant,moduleName);
                                out = response.data;
                                return out;
                            })
                            .catch(function (error) {
                                out.status = "Failed";
                                out.message = "Failed to notify user due to: " + JSON.stringify(error.message)
                                appLogger.logMessage("debug",out.message,"PMSSupport",functionName,loggedUser,tenant,moduleName);
                                return out;
                            });

                    } else {
                        out.status = "Failed";
                        out.message = "Failed to send notification due to no users found to notify";
                        appLogger.logMessage("debug", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
                        return out;
                    }
                } else {
                    out.status = "Failed";
                    out.message = "Invalid response from the server";
                    appLogger.logMessage("debug", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
                    return out;
                }
            } else {
                out.status = "Failed";
                out.message = "Failed to notify the users due to invalid response from the server";
                appLogger.logMessage("debug", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
                return out;
            }
        } catch (error) {
            out.status = "Failed";
            out.message = "Failed to notify the user due to: " + JSON.stringify(error.message);
            appLogger.logMessage("error", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
            return out;
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "filterTodoLists", startDateTime, endDateTime, diffInMS, moduleName);
    },


   //edit recurring task
   editRecurringTask: async function (body,loggedUser, tenant) {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let response = false;
    let result
    try {
        appLogger.logMessage("info", "editRecurringTask function begins", "PMSSupport", "editRecurringTask", loggedUser, tenant, moduleName);
        if(body.type=="MAIN" && body.ruleObj){
            body.ruleObj=JSON.parse(body.ruleObj)
            //fetch sub task 
            let nextOccuranceDate=moment(body.estimatedStartDate).add(body.ruleObj.VALUE,'d').format('YYYY-MM-DD')

            let query=mysqlQueries.getSubTask
            let param=[
                body.taskId,['OPEN','IP','HOLD'],body.tenantId
                ]
                let taskIdArray=[]
            let taskIdResult = await dbOperations.executeQuery(query, param, loggedUser, "editRecurringTask", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (taskIdResult != null && taskIdResult != undefined && taskIdResult != 'error ') {
                appLogger.logMessage("info", " Sub task fetched successfully. ", "PMSSupport", "editRecurringTask", loggedUser, tenant, moduleName);
                if(taskIdResult.length>0){
                    for(let item of taskIdResult){
                        taskIdArray.push(item.ID)
                    }
                }
                
                taskIdArray.push(body.taskId)

            }
            //check whether the task is already recurring
            
            query=mysqlQueries.getRecurringData
            param=[body.taskId,body.tenantId]
            result = await dbOperations.executeQuery(query,param, loggedUser, "editRecurringTask", false,null, tenant,appLogger,meteringLogger,moduleName)
            if(result !=undefined && result!=null && result!='Error'){
                appLogger.logMessage("info", "Main task details fetched ", "PMSSupport", "editRecurringTask", loggedUser, tenant, moduleName);
                param=[]

                if(result.length>0){
                    // task is already recurring. so update rule
                    query=mysqlQueries.updateRecurringData
                    param=[
                        body.ruleObj.ID,
                        nextOccuranceDate,body.estimatedStartDate,
                        body.recurringEndDate,taskIdArray,body.tenantId
                        ]
                        result = await dbOperations.executeQuery(query, param, loggedUser, "editRecurringTask", true, [5], tenant,appLogger,meteringLogger,moduleName);
                        if (result != null && result != undefined && result != 'error ') {
                            if(result.affectedRows>0){
                                appLogger.logMessage("info", "Task updated  successfully. ", "PMSSupport", "editRecurringTask", loggedUser, tenant, moduleName);
                                response=true
                            }
                            appLogger.logMessage("info", "Failed to update recurring task  ", "PMSSupport", "editRecurringTask", loggedUser, tenant, moduleName);
                            
                        }else{
                            appLogger.logMessage("info", "Failed to fetch  milestone details  of main task sub task ", "PMSSupport", "editRecurringTask", loggedUser, tenant, moduleName);
                            response=false
                        }

                }else{

                    // set task as recurring. insert new row for task and fetch all its sub task
                    // which are open and In progress
                    
                    query=mysqlQueries.addRecurringData
                    for(let id of taskIdArray){
                        let record=[]
                        record.push(body.tenantId)
                        record.push(id)
                        record.push(body.ruleObj.ID)
                        record.push(nextOccuranceDate)
                        record.push(body.estimatedStartDate)
                        record.push(body.recurringEndDate)
                        record.push(body.loggedUserId)
                        record.push(body.loggedUserId)
                        record.push(1)
                        param.push(record)

                    }
                    result = await dbOperations.executeQuery(query, [param], loggedUser, "editRecurringTask", true, [5], tenant,appLogger,meteringLogger,moduleName);
                    if (result != null && result != undefined && result != 'error ') {
                        if(result.affectedRows>0){
                            appLogger.logMessage("info", "Task updated  successfully. ", "PMSSupport", "editRecurringTask", loggedUser, tenant, moduleName);
                            response=true
                        }
                        appLogger.logMessage("info", "Failed to update recurring task  ", "PMSSupport", "editRecurringTask", loggedUser, tenant, moduleName);
                        
                    }else{
                        appLogger.logMessage("info", "Failed to fetch  milestone details  of main task sub task ", "PMSSupport", "editRecurringTask", loggedUser, tenant, moduleName);
                        response=false
                    }


                }
                

            }
            
            
            
        }else{
            appLogger.logMessage("info", "No change in the recurring rule of task", "PMSSupport", "editRecurringTask", loggedUser, tenant, moduleName);

        }
        
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "editRecurringTask", startDateTime, endDateTime, diffInMS, moduleName);
    } catch (error) {
        appLogger.logMessage("error", "Error occured in  editRecurringTask" + error.message, "PMSSupport", "editRecurringTask", loggedUser, tenant, moduleName);

    }
    appLogger.logMessage("info", "editRecurringTask function completed", "PMSSupport", "editRecurringTask", loggedUser, tenant, moduleName);
    return response;
    },
    
    populateTasks: async function (validDay, currentdate, groupRes, ruletype, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        appLogger.logMessage("info", "populateTasks support initiated.", "PMSSupport", "populateTasks", loggedUser, tenant, moduleName);
        let result;
        try {
            let param, endDate, groupType, subTask = [], updateDateQuery, ids, taskName,status,skipDate;
            let query = mysqlQueries.createTasks;
            // group based on main task and sub task
            groupType = groupRes[ruletype].reduce((hash, obj) => ({ ...hash, [obj["TYPE"]]: (hash[obj["TYPE"]] || []).concat(obj) }), {})
            for (let task of groupType["MAIN"]) {
                skipDate = (task.SKIP_DATES != undefined && task.SKIP_DATES != null) ? task.SKIP_DATES.split(",") : [];
                if(!skipDate.includes(currentdate)){
                    param = [], ids = []
                    if (groupType.hasOwnProperty("SUB")) {
                        // get sub task of main task
                        subTask = groupType["SUB"].filter(x => x.MAIN_TASK_ID == task.TASK_ID)
                        ids = ids.concat(subTask.map(x => x.ID))
                    }
                    ids = ids.concat([task].map(x => x.ID))
                    updateDateQuery = mysqlQueries.updateNextOcuurenceDate;
                    updateDateQuery = updateDateQuery.replace("@StrParam1", "'" + ids.join("','") + "'")
                    if(validDay){
                        //execute when execution day is valid
                        //calculate end date based on estimate effort
                        endDate = moment(currentdate).add(Math.round(task.ESTIMATED_EFFORT / 8)-1, 'd').format("YYYY-MM-DD")
                        if(moment(currentdate).format("DD MMM YYYY") != moment(endDate).format("DD MMM YYYY")){
                            taskName = task.TASK_NAME + " (" + moment(currentdate).format("DD MMM YYYY") + " - " + moment(endDate).format("DD MMM YYYY") + ")"
                        }else{
                            taskName = task.TASK_NAME + " (" + moment(currentdate).format("DD MMM YYYY")+")"
                        }
                        status = (task.ASSIGNED_TO != null && task.ASSIGNED_TO != undefined) ? "OPEN" : "NS";
                        // push main task params
                        param.push([task.PROJECT_ID, task.TENANT_ID, taskName, task.TASK_DESCRIPTION, task.TASK_TYPE_CODE, task.ASSIGNED_TO,
                        task.CREATED_BY, status, task.PRIORITY_TYPE_CODE, task.CAN_CONTINUE, task.ORDER_OF_EXECUTION, task.IS_AUTOMATED, currentdate, endDate, task.ESTIMATED_EFFORT,
                            currentdate, endDate, 0, task.CREATED_BY, task.CREATED_BY, task.TYPE, task.MAIN_TASK_ID, task.GROUP_ID])
                        result = await dbOperations.executeQuery(query, [param], loggedUser, "createTask", false, null, tenant,appLogger,meteringLogger,moduleName);
                        if (result != undefined && result != null && result.affectedRows > 0) {
                            param = []
                            if (subTask.length > 0) {
                                subTask.forEach(x => {
                                    status = (x.ASSIGNED_TO != null && x.ASSIGNED_TO != undefined) ? "OPEN" : "NS";
                                    //calculate end date based on estimate effort
                                    endDate = moment(currentdate).add(Math.round(x.ESTIMATED_EFFORT / 8)-1, 'd').format("YYYY-MM-DD")
                                    // push all sub task params of main task
                                    param.push([x.PROJECT_ID, x.TENANT_ID, x.TASK_NAME, x.TASK_DESCRIPTION, x.TASK_TYPE_CODE, x.ASSIGNED_TO,
                                    x.CREATED_BY, status, x.PRIORITY_TYPE_CODE, x.CAN_CONTINUE, x.ORDER_OF_EXECUTION, x.IS_AUTOMATED, currentdate, endDate, x.ESTIMATED_EFFORT,
                                        currentdate, endDate, 0, x.CREATED_BY, x.CREATED_BY, x.TYPE, result.insertId, x.GROUP_ID])
                                })
                                result = await dbOperations.executeQuery(query, [param], loggedUser, "createTask", false, null, tenant,appLogger,meteringLogger,moduleName);
                            }
                            // update the next occurence date based on rule value
                            result = await dbOperations.executeQuery(updateDateQuery, [moment(currentdate).add(Number(task.VALUE), 'd').format("YYYY-MM-DD"),task.RECURRING_COUNT+1], loggedUser, "updateNextOcuurenceDate", false, null, tenant,appLogger,meteringLogger,moduleName);
                            if (result != undefined && result != null && result.affectedRows > 0) {
                                result = await ResponseHandler.sendResponse("Success", "Successfully created " + ruletype + " recurring tasks.", 200, null, false, "populateTasks", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                            } else {
                                result = await ResponseHandler.sendResponse("Warning", "Failed to create recurring tasks.", 400, null, false, "populateTasks", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                            }
                        } else {
                            result = await ResponseHandler.sendResponse("Warning", "Failed to create recurring tasks.", 400, null, false, "populateTasks", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                        }
                    }else{
                        // increment by 1 day if it is holiday based on type
                        result = await dbOperations.executeQuery(updateDateQuery, [moment(currentdate).add(1, 'd').format("YYYY-MM-DD")], loggedUser, "updateNextOcuurenceDate", false, null, tenant,appLogger,meteringLogger,moduleName);
                        if (result != undefined && result != null && result.affectedRows > 0) {
                            result = await ResponseHandler.sendResponse("Success", "Successfully postponed recurring tasks creation due to holiday.", 200, null, false, "populateTasks", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                        } else {
                            result = await ResponseHandler.sendResponse("Warning", "Failed to postponed recurring tasks.", 400, null, false, "populateTasks", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                        }
                    }
                }
            }
            endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
            diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "populateTasks", startDateTime, endDateTime, diffInMS, moduleName);
            appLogger.logMessage("info", "populateTasks support completed.", "PMSSupport", "populateTasks", loggedUser, tenant, moduleName, moduleName);
        } catch (e) {
            appLogger.logMessage("error", e.message, "PMSSupport", "populateTasks", loggedUser, tenant, moduleName);
            result = await ResponseHandler.sendResponse("Failure", e.message, 500, null, false, "populateTasks", tenant, loggedUser, moduleName,appLogger,meteringLogger);
        }
        return result;
    },

    //check  group of  new task is recurring . if recurring compare the recurring rule of the task with 
    // rule of newly created task . if both are matching add the task to the recurring table and the group
    // if both rules are different , give warning to the user 
    //edit recurring task
   checkRecurringGroup: async function (body,loggedUser, tenant) {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let response = false;
    let result
    try {
        appLogger.logMessage("info", "checkRecurringGroup function begins", "PMSSupport", "checkRecurringGroup", loggedUser, tenant, moduleName);
        
            if(body.ruleObj !=undefined&& body.ruleObj!=null){
                body.ruleObj=JSON.parse(body.ruleObj)
                if(body.type=="MAIN"){
                    let emptyRule=[],rule=[]
                    let query=mysqlQueries.getGroupRule
                    let param=[body.groupId,body.projectId,body.tenantId]
                    let groupResult = await dbOperations.executeQuery(query, param, loggedUser, "checkRecurringGroup", false, null, tenant,appLogger,meteringLogger,moduleName);
                    appLogger.logMessage("info", "Recursive data of task in the group fetched", "PMSSupport", "checkRecurringGroup", loggedUser, tenant, moduleName);
                    if (groupResult != null && groupResult != undefined && groupResult != 'error ') {
                        
                        if(groupResult.length>0){
                            // alteast one task is in the group
                            for(let data of groupResult){
                                if(data.RULE_ID==null){
                                    emptyRule.push(data.ID)
            
                                }else{
                                    rule.push(data.RULE_ID)
                                }
                                
                            }
                            if(emptyRule.length>0){
                                // there are task in the group  which are not recursive. so the group is not recursive
                            }
                            if(rule.length>0){
                                // task from the group is recursive and fetch the rule id of the task and compare 
                                // with rule id of the new task
                                appLogger.logMessage("info", "Group is not a recursive group", "PMSSupport", "checkRecurringGroup", loggedUser, tenant, moduleName);
            
                                let ruleId=rule[0]
                                if(body.ruleObj.ID==ruleId){
                                    //  rule of new task match with rule of tasks in the group
                                    appLogger.logMessage("info", "Rule of tasks in the group and  rule of new task is same.", "PMSSupport", "checkRecurringGroup", loggedUser, tenant, moduleName);
                                    result = await ResponseHandler.sendResponse("Success", "Rule of tasks in the group and  rule of new task is same.", 200, null, false, "checkRecurringGroup", tenant, loggedUser, moduleName,appLogger,meteringLogger);
            
                                }else{
                                    //  rule of new task and existing task in the group id different . give warning to the user
                                    appLogger.logMessage("info", "Rule of tasks in the group and  rule of new task  are different.", "PMSSupport", "checkRecurringGroup", loggedUser, tenant, moduleName);
                                    result = await ResponseHandler.sendResponse("Warning", "Rule of tasks in the group and  rule of new task  are different.", 400, null, false, "checkRecurringGroup", tenant, loggedUser, moduleName,appLogger,meteringLogger);
             
                                }
            
                            }else{
                                appLogger.logMessage("info", "No recurring task in group.", "PMSSupport", "checkRecurringGroup", loggedUser, tenant, moduleName);
                                result = await ResponseHandler.sendResponse("Success", "No recurring task in group.", 200, null, false, "checkRecurringGroup", tenant, loggedUser, moduleName,appLogger,meteringLogger);
    
                            }
                        }else{
                            appLogger.logMessage("info", "Group doesn't have any task.", "PMSSupport", "checkRecurringGroup", loggedUser, tenant, moduleName);
                            result = await ResponseHandler.sendResponse("Success", "Group doesn't have any task.", 200, null, false, "checkRecurringGroup", tenant, loggedUser, moduleName,appLogger,meteringLogger);
             
                        }
                        
                    }
                }else{
                    appLogger.logMessage("info", " Task is a sub task.", "PMSSupport", "checkRecurringGroup", loggedUser, tenant, moduleName);
                    result = await ResponseHandler.sendResponse("Success", "Task is a sub task.", 200, null, false, "checkRecurringGroup", tenant, loggedUser, moduleName,appLogger,meteringLogger);
        
                }
            }else{
                // this task is not recursive
                appLogger.logMessage("info", "The task is  not recursive.", "PMSSupport", "checkRecurringGroup", loggedUser, tenant, moduleName);
                result = await ResponseHandler.sendResponse("Success", "The task is  not recursive.", 200, null, false, "checkRecurringGroup", tenant, loggedUser, moduleName,appLogger,meteringLogger);
    
            }
        
        
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "checkRecurringGroup", startDateTime, endDateTime, diffInMS, moduleName);
    } catch (error) {
        result = await ResponseHandler.sendResponse("Error", "Error occured "+JSON.stringify(error), 500, null, false, "checkRecurringGroup", tenant, loggedUser, moduleName,appLogger,meteringLogger);
        appLogger.logMessage("error", "Error occured in  checkRecurringGroup" + error.message, "PMSSupport", "checkRecurringGroup", loggedUser, tenant, moduleName);

    }
    appLogger.logMessage("info", "checkRecurringGroup function completed", "PMSSupport", "checkRecurringGroup", loggedUser, tenant, moduleName);
    return result;
    },

    notifyProjectManagerforCreation: async function (taskId, userId, loggedUser, tenant,tenantId,type,issue_Name,project_Name,severity,createdBy,convertedTo) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let functionName = "notifyProjectManagerforCreation";
        appLogger.logMessage("info", "notifyProjectManagerforCreation support function is started", functionName, loggedUser, tenant, moduleName);
        let out = {
            status: "Success",
            message: "Successfully notified the project manager via whatsapp"
        }
        try {
            let query = "";
            let param = [];
            if(type == 'TASK'){
                query = mysqlQueries.getMangersData;
                param = [tenantId,taskId,userId,];
            appLogger.logMessage("debug", "Task/Issue Created: " + userId , "PMSSupport", functionName, loggedUser, tenant, moduleName);
            let result = await dbOperations.executeQuery(query, param, loggedUser, "fetching user to send notification for creating task", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result ) {
                if (Array.isArray(result)) {
                    if (result.length > 0) {
                        let payload = {};
                        let endPoint = "";
                        let msg=""
                        msg=  result[0].CREATED_BY_NAME+" has created a task called' "+result[0].TASK_NAME+" ' in ' "+result[0].PROJECT_NAME +" ' project"
                        payload = {
                            "message":msg,
                            "loggedUser":loggedUser,
                            "whatsappNumber": result[0].PM_WHATSAPP_NUMBER,
                            "tenant": result[0].TENANT_NAME,
                            "tenantId": result[0].TENANT_ID,
                            "whatsappId":result[0].WHATSAPP_ID
                        }
                        endPoint = config.whatsAppServerUrl + config.whatsAppEndpoints.notifyUser;
                    
                        var configuration = {
                            method: 'post',
                            url: endPoint,
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            data: payload
                        };
                        axios(configuration)
                            .then(function (response) {
                                appLogger.logMessage("debug","Response after whatsapp api call: "+JSON.stringify(response.data),"PMSSupport",functionName,loggedUser,tenant,moduleName);
                                out = response.data;
                                return out;
                            })
                            .catch(function (error) {
                                out.status = "Failed";
                                out.message = "Failed to notify user due to: " + JSON.stringify(error.message)
                                appLogger.logMessage("debug",out.message,"PMSSupport",functionName,loggedUser,tenant,moduleName);
                                return out;
                            });

                    } else {
                        out.status = "Failed";
                        out.message = "Failed to send notification due to no users found to notify";
                        appLogger.logMessage("debug", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
                        return out;
                    }
                } else {
                    out.status = "Failed";
                    out.message = "Invalid response from the server";
                    appLogger.logMessage("debug", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
                    return out;
                }
            } else {
                out.status = "Failed";
                out.message = "Failed to notify the users due to invalid response from the server";
                appLogger.logMessage("debug", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
                return out;
            }
            }else if(type == 'ISSUE'){
            query= mysqlQueries.getIsueMangerDetails;
            param = [userId];
            appLogger.logMessage("debug", "Issue Created: " + userId , "PMSSupport", functionName, loggedUser, tenant, moduleName);
            let result = await dbOperations.executeQuery(query, param, loggedUser, "fetching user to send notification for Issue creation", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result ) {
                if (Array.isArray(result)) {
                    if (result.length > 0) {
                        let payload = {};
                        let endPoint = "";
                        let msg="" 
                        if(convertedTo != null && convertedTo != undefined && convertedTo == "TASK"){
                            msg= createdBy+" has converted a task to issue  called ' "+ issue_Name +" ' in ' "+project_Name + " ' project with severity as " + severity
                        }else{                
                        msg= createdBy+" has created an issue called ' "+ issue_Name +" ' in ' "+project_Name + " ' project with severity as " + severity
                        }
                        payload = {
                            "message":msg,
                            "loggedUser":loggedUser,
                            "whatsappNumber": result[0].PM_WHATSAPP_NUMBER,
                            "tenant": result[0].TENANT_NAME,
                            "tenantId": result[0].TENANT_ID,
                            "whatsappId":result[0].WHATSAPP_ID
                        }
                        endPoint = config.whatsAppServerUrl + config.whatsAppEndpoints.notifyUser;
                    
                        var configuration = {
                            method: 'post',
                            url: endPoint,
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            data: payload
                        };
                        axios(configuration)
                            .then(function (response) {
                                appLogger.logMessage("debug","Response after whatsapp api call: "+JSON.stringify(response.data),"PMSSupport",functionName,loggedUser,tenant,moduleName);
                                out = response.data;
                                return out;
                            })
                            .catch(function (error) {
                                out.status = "Failed";
                                out.message = "Failed to notify user due to: " + JSON.stringify(error.message)
                                appLogger.logMessage("debug",out.message,"PMSSupport",functionName,loggedUser,tenant,moduleName);
                                return out;
                            });

                    } else {
                        out.status = "Failed";
                        out.message = "Failed to send notification due to no users found to notify";
                        appLogger.logMessage("debug", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
                        return out;
                    }
                } else {
                    out.status = "Failed";
                    out.message = "Invalid response from the server";
                    appLogger.logMessage("debug", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
                    return out;
                }
            } else {
                out.status = "Failed";
                out.message = "Failed to notify the users due to invalid response from the server";
                appLogger.logMessage("debug", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
                return out;
            }
        }
        } catch (error) {
            out.status = "Failed";
            out.message = "Failed to notify the user due to: " + JSON.stringify(error.message);
            appLogger.logMessage("error", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
            return out;
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "filterTodoLists", startDateTime, endDateTime, diffInMS, moduleName);
    },

    // UPDATE ATTCHMENTS WHEN THE ISSUE OR TASK IS CONVERTED
    updateAttachment: async function (newTaskId,loggedUserId, tenantId, loggedUser, tenant,type) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let result;
        let param
        try {
            appLogger.logMessage("info", "updateAttachment function begins", "PMSSupport", "updateAttachment", loggedUser, tenant, moduleName);
            let query = mysqlQueries.updateAttachment;
            if(type == 'TASK'){
                param = [
                    newTaskId,
                    "A1001",
                    loggedUserId,
                    loggedUserId,
                    [newTaskId],
                    tenantId,
                    
                ];
            }else if(type == 'ISSUE'){
                param = [
                    newTaskId,
                    "A1005",
                    loggedUserId,
                    loggedUserId,
                    [newTaskId],
                    tenantId,
                    
                ];
            }

            result = await dbOperations.executeQuery(query, param, loggedUser, "updateAttachment", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result != null && result != undefined && result != 'error ') {
                result = await ResponseHandler.sendResponse("Success", " Attachment updated successfully", 200, null, false, "updateAttachment", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                appLogger.logMessage("info", "attchement of issue updated with new task id ", "PMSSupport", "updateAttachment", loggedUser, tenant, moduleName);

            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "updateAttachment", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            result = await ResponseHandler.sendResponse("Error", "Error occured "+JSON.stringify(error), 500, null, false, "updateAttachment", tenant, loggedUser, moduleName,appLogger,meteringLogger);
            appLogger.logMessage("error", "Error occured in  updateAttachment" + error.message, "PMSSupport", "updateAttachment", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "updateAttachment function completed", "PMSSupport", "updateAttachment", loggedUser, tenant, moduleName);
        return result;
    },

    // UPDATE COMMENTS WHEN THE ISSUE OR TASK IS CONVERTED
    updateComment: async function (Id,loggedUserId, tenantId, loggedUser, tenant,type) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let result;
        let param
        try {
            appLogger.logMessage("info", "updateComment function begins", "PMSSupport", "updateComment", loggedUser, tenant, moduleName);
            let query = mysqlQueries.updateComment;
            if(type == 'TASK'){
                param = [
                    Id,
                    "A1001",
                    loggedUserId,
                    loggedUserId,
                    [Id],
                    tenantId,
                    
                ];
            }else if(type == 'ISSUE'){
                param = [
                    Id,
                    "A1005",
                    loggedUserId,
                    loggedUserId,
                    [Id],
                    tenantId,
                    
                ];
            }

            result = await dbOperations.executeQuery(query, param, loggedUser, "updateComment", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result != null && result != undefined && result != 'error ') {
                result = await ResponseHandler.sendResponse("Success", " Comment updated successfully", 200, null, false, "updateComment", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                appLogger.logMessage("info", "Comment is updated with new task id ", "PMSSupport", "updateComment", loggedUser, tenant, moduleName);

            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "updateComment", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            result = await ResponseHandler.sendResponse("Error", "Error occured "+JSON.stringify(error), 500, null, false, "updateComment", tenant, loggedUser, moduleName,appLogger,meteringLogger);
            appLogger.logMessage("error", "Error occured in  updateComment" + error.message, "PMSSupport", "updateComment", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "updateComment function completed", "PMSSupport", "updateComment", loggedUser, tenant, moduleName);
        return result;
    },

    // UPDATE TASKS ORDER OF EXECUTION CREATED VIA TEMPLATE
    updateTemplateTasks: async function(req, data, loggedUser, tenant){
            startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            let result
            appLogger.logMessage("info", "update order of execution of task function begins", "PMSSupport", "updateTemplateTasks", loggedUser, tenant, moduleName);
            try {
                if(data.taskId !=  null && data.taskId != undefined){
                    result = await dbOperations.executeQuery(mysqlQueries.getTaskDetails, data.taskId, loggedUser, "convertTaskToIssue", true, null, tenant, appLogger, meteringLogger, moduleName)
                    if(result != undefined && result != null && result.length > 0){
                        if(result[0].IS_AUTOMATED == 1){
                            result = await dbOperations.executeQuery(mysqlQueries.updateAutomatedProjectDetail,[ data.projectId,result[0].ORDER_OF_EXECUTION], loggedUser, "convertTaskToIssue", true, null, tenant, appLogger, meteringLogger, moduleName)
                            if(result != undefined && result != null && result.affectedRows > 0){
                                result = await ResponseHandler.sendResponse("Success", "Update task details created via template.", 200, null, false, "updateTemplateTasks", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                                appLogger.logMessage("info", "Update task details created via template.", "PMSSupport", "updateTemplateTasks", loggedUser, tenant, moduleName);
                            }else{                            
                                result = await ResponseHandler.sendResponse("Warning", "Failed to update task details created via template", 200, null, false, "updateTemplateTasks", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                                appLogger.logMessage("info", "Task is not created via template", "PMSSupport", "updateTemplateTasks", loggedUser, tenant, moduleName);
                            }
                        }else{
                            result = await ResponseHandler.sendResponse("Success", "Task is not created via template", 200, null, false, "updateTemplateTasks", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                            appLogger.logMessage("info", "Task is not created via template", "PMSSupport", "updateTemplateTasks", loggedUser, tenant, moduleName);
                        }
                    }else{
                        appLogger.logMessage("info", "Failed to fetch task  created via template", "PMSSupport", "updateTemplateTasks", loggedUser, tenant, moduleName);
                    }
                }else{
                    appLogger.logMessage("info", "Invalid params.", "PMSSupport", "updateTemplateTasks", loggedUser, tenant, moduleName);
                }
                
                endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
                diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
                meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "updateTemplateTasks", startDateTime, endDateTime, diffInMS, moduleName);
            } catch (error) {
                result = await ResponseHandler.sendResponse("Error", "Error occured "+JSON.stringify(error), 500, null, false, "updateTemplateTasks", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                appLogger.logMessage("error", "Error occured in  updateTemplateTasks" + error.message, "PMSSupport", "updateTemplateTasks", loggedUser, tenant, moduleName);
        
            }
            appLogger.logMessage("info", "updateTemplateTasks function completed", "PMSSupport", "updateTemplateTasks", loggedUser, tenant, moduleName);
            return result;
    },

    // UPDATE LOG WORK OF SUB TASK TO MAIN TASK
     updateMainTaskEffort: async function (body, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let result;
        try {
            appLogger.logMessage("info", "updateMainTaskEffort function begins", "PMSSupport", "updateMainTaskEffort", loggedUser, tenant, moduleName);
            let query = mysqlQueries.getMainTaskEffort
            param=[body.mainTaskId,body.tenantId]
            if(body.type == 'SUB'){
                result = await dbOperations.executeQuery(query, param, loggedUser, "updateMainTaskEffort", false, null, tenant,appLogger,meteringLogger,moduleName);
                if (result != null && result != undefined && result != 'Error ') {
                    if(result.length>0){
                        appLogger.logMessage("info", "Sum of effort of sub task fetched ", "PMSSupport", "updateMainTaskEffort", loggedUser, tenant, moduleName);
                        //update sum of effort  as the effort of main task
                        let actualEffort
                        if(result[0].TOTAL_EFFORT==null || result[0].TOTAL_EFFORT==undefined){
                            actualEffort=0
                        }else{
                            actualEffort=result[0].TOTAL_EFFORT
                        }
                        query=mysqlQueries.updateMainTaskEffort
                        param=[actualEffort,body.loggedUserId,body.mainTaskId,body.tenantId]
                        result = await dbOperations.executeQuery(query, param, loggedUser, "updateMainTaskEffort", false, null, tenant,appLogger,meteringLogger,moduleName);
                        if (result != null && result != undefined && result != 'Error ') {
                            if(result.affectedRows>0){
                                appLogger.logMessage("info", " Actual effort of main task updated successfully ", "PMSSupport", "updateMainTaskEffort", loggedUser, tenant, moduleName);
                                result = await ResponseHandler.sendResponse("Success", "Actual effort of main task updated successfully.", 200, null, false, "updateMainTaskEffort", tenant, loggedUser, moduleName,appLogger,meteringLogger);

                            }else{
                                appLogger.logMessage("info", " Failed to update actual effort of main task. ", "PMSSupport", "updateMainTaskEffort", loggedUser, tenant, moduleName);
                                result = await ResponseHandler.sendResponse("Warning", "Failed to update actual effort of main task.", 200, null, false, "updateMainTaskEffort", tenant, loggedUser, moduleName,appLogger,meteringLogger);

                            }
                        }else{
                            appLogger.logMessage("info", " Failed to update actual effort of main task. ", "PMSSupport", "updateMainTaskEffort", loggedUser, tenant, moduleName);
                            result = await ResponseHandler.sendResponse("Warning", "Failed to update actual effort of main task.", 200, null, false, "updateMainTaskEffort", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                        }

                    }else{
                        appLogger.logMessage("info", " Failed to fetch actual effort of sub task. ", "PMSSupport", "updateMainTaskEffort", loggedUser, tenant, moduleName);
                        result = await ResponseHandler.sendResponse("Warning", "Failed to update actual effort of main task.", 200, null, false, "updateMainTaskEffort", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                    }
    
                }else{
                    appLogger.logMessage("info", " Failed to fetch actual effort of main task. ", "PMSSupport", "updateMainTaskEffort", loggedUser, tenant, moduleName);
                    result = await ResponseHandler.sendResponse("Warning", "Failed to update actual effort of main task.", 200, null, false, "updateMainTaskEffort", tenant, loggedUser, moduleName,appLogger,meteringLogger);

                }
            }else{
                appLogger.logMessage("info", "Task is not a sub task. ", "PMSSupport", "updateMainTaskEffort", loggedUser, tenant, moduleName);
                result = await ResponseHandler.sendResponse("Warning", "Task is ot a sub task.", 200, null, false, "updateMainTaskEffort", tenant, loggedUser, moduleName,appLogger,meteringLogger);
 
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "updateMainTaskEffort", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            result = await ResponseHandler.sendResponse("Error", "Error occured "+JSON.stringify(error), 500, null, false, "updateMainTaskEffort", tenant, loggedUser, moduleName,appLogger,meteringLogger);
            appLogger.logMessage("error", "Error occured in  updateMainTaskEffort" + error.message, "PMSSupport", "updateMainTaskEffort", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "updateMainTaskEffort function completed", "PMSSupport", "updateMainTaskEffort", loggedUser, tenant, moduleName);
        return result;
    },
    generateClientPdf: async function (fileName, destinationPath, url, result, image, tenantName, loggedUser, tenant,showAttachment,projectName) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let out = {
            "status": "Failed",
            "message": "Failed to generate PDF",
            "data": '',
            "isFile": false
        }
        try {
            let data = result.data;
            if(showAttachment){
                data += "<br><br><p style= 'width:530px;word-wrap:break-word;'>Please use this <a href='"+url+"' style='font-weight:bold;color:blue;text-decoration:underline;'>link </a> to view attachments</p>"
            }
            appLogger.logMessage("info", "generateClientPdf function begins", "PMSSupport", "generateClientPdf", loggedUser, tenant, moduleName);
            let PdfContent = fs.readFileSync(path.join(__dirname,'../Templates/ClientSummaryPdf.html'), 'utf8');
            PdfContent = PdfContent.replace("{{image}}",image)
            PdfContent = PdfContent.replace("{{projectName}}",projectName)
            PdfContent = PdfContent.replace("{{tenantName}}",tenantName)
            PdfContent = PdfContent.replace("{{currentDate}}",moment().format("DD MMM YYYY"))
            let PdfBlankContent = fs.readFileSync(path.join(__dirname,'../Templates/ContentBlankPage.html'), 'utf8');
            data = data.split("\n")
            let pageNo = 0, countLimit, count = 0;
            let sentenceLimit = 42;
            let content = []
            for (let i = 0; i < data.length; i ++) {
                countLimit = (pageNo == 0) ? 35 : 45;
                count = count + Math.ceil(data[i].length/sentenceLimit)
                if(count >= countLimit){
                    if(pageNo == 0)
                        PdfContent = PdfContent.replace("{{data}}",content.join("<br>"))
                    else
                        PdfContent = PdfContent + PdfBlankContent.replace("{{data}}",content.join("<br>"))
                    count = Math.ceil(data[i].length/sentenceLimit)
                    pageNo++
                    content = []
                    content.push(data[i])
                }else{
                    content.push(data[i])
                }
            }
            if(content.length > 0){
                if(pageNo == 0)
                    PdfContent = PdfContent.replace("{{data}}",content.join("<br>"))
                else
                    PdfContent = PdfContent + PdfBlankContent.replace("{{data}}",content.join("<br>"))
            }
            await this.generatePdf(PdfContent, destinationPath, fileName, loggedUser, tenant);
            out.status = "Success";
            out.message = "PDFs Generated Successfully";
            out.data = fileName;
            out.isFile = true;
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "generateClientPdf", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            out.status = "Failed";
            appLogger.logMessage("error", "Error occured in  generateClientPdf" + error.message, "PMSSupport", "generateClientPdf", loggedUser, tenant, moduleName);
        }
        appLogger.logMessage("info", "generateClientPdf function completed", "PMSSupport", "generateClientPdf", loggedUser, tenant, moduleName);
        return out;
    },

    // CREATE  TASK FOR MISCELLANEOUS EXPENSES IN A PROJECT
    createMiscellaneousTask: async function (body, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let result;
        try {
            appLogger.logMessage("info", "createMiscellaneousTask function begins", "PMSSupport", "createMiscellaneousTask", loggedUser, tenant, moduleName);
            let query,param=[]
            // body['groupName']='Miscellaneous'
            // body['projectId']=body.projectID
            // let groupResult = await pmsServices.createGroup(body,body.loggedUser, body.tenant)
            // if (groupResult.type.toUpperCase() == 'SUCCESS') {
            //     body['groupId'] = groupResult.data[0].ID
                body['taskName']='Expense'+moment().format('DD-MM-YYYY- HHmmssSSS');
                body['taskStatusTypeCode']='COM'
                query = mysqlQueries.createTask;
                param = [
                    body.projectID,
                    body.tenantId,
                    body.taskName,
                    body.description,//body.taskDescription,
                    body.taskTypeCode|| 'IT',
                    body.taskStatusTypeCode,
                    'MEDIUM',//body.priorityTypeCode
                    body.expenseDate,//body.estimatedStartDate,
                    body.expenseDate,//body.estimatedCompletionDate,
                    body.estimatedEffort || 8,
                    body.expenseDate,//body.actualStartDate
                    body.expenseDate,//body.body.actualEndDate
                    body.actualEffort || 8,
                    'MAIN',//body.type
                    null,// body.mainaskId
                    body.groupId,
                    body.assignedTo || null,
                    body.tag||null
                ];
                result = await dbOperations.executeQuery(query, param, loggedUser, "createMiscellaneousTask", true, [6, 15, 16], tenant, appLogger, meteringLogger, moduleName);
                appLogger.logMessage("info", "Result of task creation"+JSON.stringify(result), "PMSSupport", "createMiscellaneousTask", loggedUser, tenant, moduleName);
                if(result != null && result != undefined && result != 'Error '){
                    if(result.affectedRows>0){
                        body['taskID']=result.insertId
                        let updateTaskObj = {
                            'actualCompletionDate': body.expenseDate,
                            'estimatedStartDate': body.expenseDate,
                            'estimatedCompletionDate': body.expenseDate,
                            'taskStatusTypeCode': body.taskStatusTypeCode, 'mainTaskStatus': body.mainTaskStatus,
                            'groupId': body.groupId, 'mainTaskId': null, 'projectId': body.projectId,
                            'type': 'MAIN', 'loggedUserId': body.loggedUserId, 'tenantId': body.tenantId
                        }
    
                        await this.taskDateChange(updateTaskObj, body.loggedUser, body.tenant)
                        await this.taskStatusChange(updateTaskObj, body.loggedUser, body.tenant)
                        result = await ResponseHandler.sendResponse("Success", "New miscellaneous task  is created  for miscellaneous expenses ", 200, body, true, "createMiscellaneousTask", tenant, loggedUser, moduleName,appLogger,meteringLogger);
    
                    }else{
                        appLogger.logMessage("info", "Failed to create task"+JSON.stringify(result), "PMSSupport", "createMiscellaneousTask", loggedUser, tenant, moduleName);
                        result = await ResponseHandler.sendResponse("Warning", "Failed to create task", 400, null, false, "createMiscellaneousTask", tenant, loggedUser, moduleName,appLogger,meteringLogger);

                    }
                    

                }else{
                    appLogger.logMessage("info", "Failed to create task"+JSON.stringify(result), "PMSSupport", "createMiscellaneousTask", loggedUser, tenant, moduleName);
                    result = await ResponseHandler.sendResponse("Warning", "Failed to create task", 400, null, false, "createMiscellaneousTask", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                }

            // }else{
            //     appLogger.logMessage("info", "Failed to create group", "PMSSupport", "createMiscellaneousTask", loggedUser, tenant, moduleName);
            //     result = await ResponseHandler.sendResponse("Warning", "Failed to create group ", 400, null, false, "createMiscellaneousTask", tenant, loggedUser, moduleName,appLogger,meteringLogger);
            // }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "createMiscellaneousTask", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            result = await ResponseHandler.sendResponse("Error", "Error occured "+JSON.stringify(error), 500, null, false, "createMiscellaneousTask", tenant, loggedUser, moduleName,appLogger,meteringLogger);
            appLogger.logMessage("error", "Error occured in  createMiscellaneousTask" + error.message, "PMSSupport", "createMiscellaneousTask", loggedUser, tenant, moduleName);

        }
        appLogger.logMessage("info", "createMiscellaneousTask function completed", "PMSSupport", "createMiscellaneousTask", loggedUser, tenant, moduleName);
        return result;
    },
    sendSummaryPdf: async function (result,fileName,loggedUser, tenant,appLogger, meteringLogger, moduleName) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let out = {
            "status": "Failed",
            "message": "Failed to send PDF",
            "data": '',
            "isFile": false
        }
        try {
            let res
            if(result != null && result != undefined && result != 'Error ' && result.length > 0){
                for(let data of result){
                    let body = {
                        "whatsappNumber": data.WHATSAPP_NUMBER,
                        "url": config.clientSummaryPdf+fileName,
                        "tenant": data.TENANT_NAME,
                        "loggedUser": data.EMAIL,
                        "tenantId": data.TENANT_ID,
                        "whatsappId": data.WHATSAPP_ID,
                        "filename":fileName
                    }
                    res = await axios.post(config.whatsAppServerUrl + config.whatsAppEndpoints.sendDocument, body);
                }
                if(res.data.status.toUpperCase() == "SUCCESS"){
                    fs.unlink(path.join(__dirname,'../public/clientDocs/'+fileName), (err) => {
                        if (err) {
                            console.error('Error occurred while removing file:', err);
                        } else {
                            console.log('File removed successfully!');
                        }
                    });
                }
            }
            out.status = "Success";
            out.message = "PDFs send Successfully";
            out.data = fileName;
            out.isFile = true;
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "sendSummaryPdf", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            out.status = "Failed";
            appLogger.logMessage("error", "Error occured in  sendSummaryPdf" + error.message, "PMSSupport", "sendSummaryPdf", loggedUser, tenant, moduleName);
        }
        appLogger.logMessage("info", "sendSummaryPdf function completed", "PMSSupport", "sendSummaryPdf", loggedUser, tenant, moduleName);
        return out;
    },
    generateDefaultMilestone : async function(projectId,tenantId,loggedUserId,loggedUser, tenant,projectStartDate, projectEndDate) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        appLogger.logMessage("info", "Support initiated.", "PMSSupport", "generateDefaultMilestone", loggedUser, tenant, moduleName);
        let param = [];
        let parameters =[];
        try {
            let duration = Math.round(moment.duration(moment(projectEndDate).diff(moment(projectStartDate))).asDays()/4);
            let milestoneStartDate = moment().format("YYYY-MM-DD");
            let milestoneEndDate = moment(milestoneStartDate).add(duration,'d').format("YYYY-MM-DD");            
            for(let params of config.defaultMilestone){
                parameters = [tenantId,projectId,params,params,milestoneStartDate,milestoneEndDate,loggedUserId,loggedUserId]
                param.push(parameters)
                milestoneStartDate = milestoneEndDate
                milestoneEndDate = moment(milestoneStartDate).add(duration,'d').format("YYYY-MM-DD"); 
            }
            endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
            diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "generateDefaultMilestone", startDateTime, endDateTime, diffInMS,moduleName);
        } catch (e) {
            appLogger.logMessage("error", "Error while executing generateDefaultMilestone and the error is " + e, "PMSSupport", "generateDefaultMilestone", loggedUser,tenant,moduleName);
        }
        appLogger.logMessage("info", "generateDefaultMilestone result returned. " + JSON.stringify(param), "PMSSupport", "generateDefaultMilestone", loggedUser,tenant,moduleName);
        return param;
    },
    notifyUser: async function (msg, phno, tenantId, whatsappId, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        appLogger.logMessage("info", "Support initiated.", "PMSSupport", "notifyUser", loggedUser, tenant, moduleName);
        let out = {
            status: "Success",
            message: "Successfully closed all the tasks",
            data: []
        }
        try {
            let endPoint = config.whatsAppServerUrl + config.whatsAppEndpoints.notifyUser;
            let payload = {
                "message": msg,
                "loggedUser": loggedUser,
                "whatsappNumber": phno,
                "tenant": tenantId,
                "tenantId": tenant,
                "whatsappId": whatsappId
            }
            configuration = {
                method: 'post',
                url: endPoint,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: payload
            };
            axios(configuration)
                .then(function (response) {
                    appLogger.logMessage("debug", "Response after whatsapp api call: " + JSON.stringify(response.data), "PMSSupport", "notifyUser", loggedUser, tenant, moduleName);
                })
                .catch(function (error) {
                    out.status = "Failed";
                    out.message = "Failed to notify user due to: " + JSON.stringify(error.message)
                    appLogger.logMessage("error", out.message, "PMSSupport", "notifyUser", loggedUser, tenant, moduleName);
                    return out;
                });
            endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
            diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "notifyUser", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (e) {
            appLogger.logMessage("error", "Error while executing notifyUser and the error is " + e, "PMSSupport", "notifyUser", loggedUser, tenant, moduleName);
        }
        return out;
    },
    notifyInApp: async function (sendFrom, sendTo, message, unitId, unitType, tenantId, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        appLogger.logMessage("info", "Support initiated.", "PMSSupport", "notifyInApp", loggedUser, tenant, moduleName);
        let out = {
            status: "Success",
            message: "Successfully closed all the tasks",
            data: []
        }
        try {
            let param = [
                sendFrom,
                sendTo,
                message,
                unitId,
                unitType,
                tenantId, 
                startDateTime,
                startDateTime
            ]
            let res = await dbOperations.executeQuery(mysqlQueries.sendNotification, param, loggedUser, "", true, [6,7], tenant, appLogger, meteringLogger, moduleName);
            if(res != undefined && res != null && res != 'Error'){
                if(res.affectedRows > 0){
                    appLogger.logMessage("info", "Successfully send notification", "PMSSupport", "notifyInApp", loggedUser, tenant, moduleName);
                }else{
                    out.status = "Failed";
                    out.message = "Failed to notify."
                    appLogger.logMessage("info", "Failed to send notification", "PMSSupport", "notifyInApp", loggedUser, tenant, moduleName);
                }
            }else{
                out.status = "Failed";
                out.message = "Failed to notify."
                appLogger.logMessage("info", "Failed to send send notification", "PMSSupport", "notifyInApp", loggedUser, tenant, moduleName);
            }
            endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
            diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "notifyInApp", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (e) {
            appLogger.logMessage("error", "Error while executing notifyInApp and the error is " + e, "PMSSupport", "notifyInApp", loggedUser, tenant, moduleName);
        }
        return out;
    },
    checkIfPMOrDPM: async function(payload){
      let functionName= "checkIfPMOrDPM";
      let out = {
        status:"Success",
        message:"Successfully checked the role of the user",
        data:[]
      }
      try {
        startDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
        let query = mysqlQueries.getPMsProjectIds;
        let param = [payload.loggedUserId];
        let result = await dbOperations.executeQuery(query,param,payload.loggedUser,"getProjectIdsOfPM",false,null,payload.tenant,appLogger,meteringLogger,moduleName);
        if(result){
          if(Array.isArray(result)){
              if(result.length>0){
                  for(let row of result){
                      out.data.push(row.PROJECT_ID);
                  }
              }else{
                  appLogger.logMessage("debug","This user is neither pr nor delegated pm","PMSSupport",functionName,payload.loggedUser,payload.tenant,moduleName);
                  out.message = "Not a project manager";
                  out.status = "Failure";
              }
          }else{
              out.status = "Failure";
              out.message = "Inernal server error";
              out.data = "Invalid response received from the server"
              appLogger.logMessage("debug",out.data,"PMSSupport",functionName,payload.loggedUser,payload.tenant,moduleName);
          }
        }else{
          out.status = "Failure";
          out.message = "Internal server error";
          out.data = "Result received from the server is null/undefined";
          appLogger.logMessage("debug",out.data,"PMSSupport",functionName,payload.loggedUser,payload.tenant,moduleName);
        }
        endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
        diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
        meteringLogger.logMessage(payload.tenant, payload.loggedUser, "PMSSupport", functionName, startDateTime, endDateTime, diffInMS, moduleName);
      } catch (error) {
        appLogger.logMessage("error","Failed to check whether the user is pm or delegated pm due to:"+ JSON.stringify(error.message),"PMSSupport",functionName,payload.loggedUser,payload.tenant,moduleName);
        out.status = "Failure";
        out.message = "Internal server error";
        out.data = JSON.stringify(error.message);
      }
      return out;
    },
    getTasksList: async function(payload){
      let functionName= "getTasksList";
      let out = {
        status:"Success",
        message:"Successfully fetched the task list",
        data:[]
      }
      try {
        startDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
        let query = mysqlQueries.getAllTasksListofPM;
        let defaultEndDate = moment().format("YYYY-MM-DD");
        let defaultStartDate = moment().subtract(30,'d').format('YYYY-MM-DD');
        let param = [];
        if(payload.startDate && payload.endDate){
            param = [
                payload.loggedUserId,
                payload.startDate,
                payload.endDate,
                payload.startDate,,
                payload.endDate,
                payload.startDate,,
                payload.endDate,
                payload.startDate,,
                payload.endDate
            ];
        }else{
            param = [
                payload.loggedUserId,
                defaultStartDate,
                defaultEndDate,
                defaultStartDate,
                defaultEndDate,
                defaultStartDate,
                defaultEndDate,
                defaultStartDate,
                defaultEndDate
            ];
        }
        let result = await dbOperations.executeQuery(query,param,payload.loggedUser,functionName,false,null,payload.tenant,appLogger,meteringLogger,moduleName);
        if(result){
          if(Array.isArray(result)){
              if(result.length>0){
                  out.data = result;
              }else{
                  appLogger.logMessage("debug","This user is neither pr nor delegated pm","PMSSupport",functionName,payload.loggedUser,payload.tenant,moduleName);
                  out.message = "No tasks found active";
              }
          }else{
              out.status = "Failure";
              out.message = "Inernal server error";
              out.data = "Invalid response received from the server"
              appLogger.logMessage("debug",out.data,"PMSSupport",functionName,payload.loggedUser,payload.tenant,moduleName);
          }
        }else{
          out.status = "Failure";
          out.message = "Internal server error";
          out.data = "Result received from the server is null/undefined";
          appLogger.logMessage("debug",out.data,"PMSSupport",functionName,payload.loggedUser,payload.tenant,moduleName);
        }
        endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
        diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
        meteringLogger.logMessage(payload.tenant, payload.loggedUser, "PMSSupport", functionName, startDateTime, endDateTime, diffInMS, moduleName);
      } catch (error) {
        appLogger.logMessage("error","Failed to check whether the user is pm or delegated pm due to:"+ JSON.stringify(error.message),"PMSSupport",functionName,payload.loggedUser,payload.tenant,moduleName);
        out.status = "Failure";
        out.message = "Internal server error";
        out.data = JSON.stringify(error.message);
      }
      return out;
    },
    generatePdf: async function (PdfContent, destinationPath, fileName, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let out = {
            "status": "Failed",
            "message": "Failed to generate PDF",
            "data": '',
            "isFile": false
        }
        try {
            let options = {
                format: "A4",
                orientation: "portrait",
                border: "10mm"
            };
            var document = {
                html: PdfContent,
                data: {},
                path: destinationPath + fileName,
                type: "",
            };
            pdf.create(document, options)
                .then((res) => {
                    console.error(res);
                    appLogger.logMessage("info", "successfully created pdf", "PMSSupport", "generatePdf", loggedUser, tenant, moduleName);
                })
                .catch((error) => {
                    console.error(error);
                    appLogger.logMessage("error", "fail to create pdf: "+error, "PMSSupport", "generatePdf", loggedUser, tenant, moduleName);
                });
            let publicPath = path.join(__dirname,'../public/clientDocs/')
            if (!fs.existsSync(publicPath)) {
                fs.mkdirSync(publicPath);
            }
            await sleep(3000)
            if (fs.existsSync(String(destinationPath+fileName))) {
                fs.copyFile(destinationPath+fileName, publicPath+fileName, (err) => {
                    if (err) {
                    console.error('Error occurred while copying file:', err);
                    appLogger.logMessage("error", "fail to copy file: "+err, "PMSSupport", "generatePdf", loggedUser, tenant, moduleName);
                    } else {
                    console.log('File copied successfully!');
                    appLogger.logMessage("error", "successfully file copied", "PMSSupport", "generatePdf", loggedUser, tenant, moduleName);
                    }
                });
            }
            out.status = "Success";
            out.message = "PDFs Generated Successfully";
            out.data = fileName;
            out.isFile = true;
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "generatePdf", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            out.status = "Failed";
            appLogger.logMessage("error", "Error occured in  generatePdf" + error.message, "PMSSupport", "generatePdf", loggedUser, tenant, moduleName);
        }
        appLogger.logMessage("info", "generatePdf function completed", "PMSSupport", "isMilestoneExists", loggedUser, tenant, moduleName);
        return out;
    },
    generateWatcherPdf: async function (fileName, destinationPath, data, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let out = {
            "status": "Failed",
            "message": "Failed to generate PDF",
            "data": '',
            "isFile": false
        }
        try {
            appLogger.logMessage("info", "generateWatcherPdf function begins", "PMSSupport", "generateWatcherPdf", loggedUser, tenant, moduleName);
            let PdfContent = fs.readFileSync(path.join(__dirname,'../Templates/WatcherPdfPrimaryPage1.html'), 'utf8');
            let PdfBlankContent = fs.readFileSync(path.join(__dirname,'../Templates/WatcherPdfBlankPage1.html'), 'utf8');
            let pageNo = 0, countLimit, count = 0;
            let sentenceLimit = 42;
            let content = ""
            for (let i = 0; i < data.length; i ++) {
                countLimit = (pageNo == 0) ? 35 : 45;
                count = count + Math.ceil(data[i].length/sentenceLimit)
                if(count >= countLimit){
                    if(pageNo == 0)
                        PdfContent = PdfContent.replace("{{rows}}",content)
                    else
                        PdfContent = PdfContent + PdfBlankContent.replace("{{rows}}",content)
                    count = Math.ceil(data[i].length/sentenceLimit)
                    pageNo++
                    content = ""
                    content += content += `<tr style="background-color:rgb(253, 227, 192) ;"><td>${i+1}</td><td>${data[i].TASK_NAME}</td><td>${data[i].TASK_DESCRIPTION}</td><td>${data[i].TASK_STATUS_TYPE_CODE}</td><td>${data[i].PROGRESS}</td><td>${data[i].BUDGET}</td></tr>`
                }else{
                    // content += `<tr><td>${i+1}<td><td>${data[i].TASK_NAME}<td><td>${data[i].TASK_DESCRIPTION}<td><td>${data[i].TASK_STATUS_TYPE_CODE}<td><td>${data[i].PROGRESS}<td><td>${data[i].BUDGET}<td><tr>`
                    content += `<tr style="background-color: rgb(253, 227, 192) ;"><td>${i+1}</td><td>${data[i].TASK_NAME}</td><td>${data[i].TASK_DESCRIPTION}</td><td>${data[i].TASK_STATUS_TYPE_CODE}</td><td>${data[i].PROGRESS}</td><td>${data[i].BUDGET}</td></tr>`
                }
            }
            if(content != ""){
                if(pageNo == 0)
                    PdfContent = PdfContent.replace("{{rows}}",content)
                else
                    PdfContent = PdfContent + PdfBlankContent.replace("{{rows}}",content)
            }
            await this.generatePdf(PdfContent, destinationPath, fileName, loggedUser, tenant);
            out.status = "Success";
            out.message = "PDFs Generated Successfully";
            out.data = fileName;
            out.isFile = true;
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "generateWatcherPdf", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            out.status = "Failed";
            appLogger.logMessage("error", "Error occured in  generateWatcherPdf" + error.message, "PMSSupport", "generateWatcherPdf", loggedUser, tenant, moduleName);
        }
        appLogger.logMessage("info", "generateWatcherPdf function completed", "PMSSupport", "generateWatcherPdf", loggedUser, tenant, moduleName);
        return out;
    },

    //NOTIFY USERS WHO ADDED TASK / PROJECT IN THEIR WATCH LIST WHEN ANY UPDATION ON THE TASK AND PROJECT
    watchListNotification: async function (body, action, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        appLogger.logMessage("info", "Support initiated.", "PMSSupport", "watchListNotification", loggedUser, tenant, moduleName);
        let out = {
            status: "Success",
            message: "Successfully notify users",
            data: []
        }
        try {
            let userDetails= await this.getUserDetailsInWatchList(body,body.loggedUser,body.tenant)
            if(userDetails.status=='Success'){
                let mailContent= await this.contentForWatchListTask(body,action,body.loggedUser,body.tenant)
                if(mailContent.status=='Success'){
                    let sub,mes,mailIdArray=[],whatsappNumberArray=[],selfPhoneNumberId
                    sub=mailContent.data[0].SUB
                    mes=mailContent.data[0].MESSAGE
                    mailIdArray=userDetails.data[0].MAIL_ID_ARRAY
                    whatsappNumberArray=userDetails.data[0].WHATSAPP_NUMBER_ARRAY
                    selfPhoneNumberId=userDetails.data[0].SELF_PHONE_NUMBER_ID
                    out= await this.notifyUserInWatchList(body,mailIdArray,whatsappNumberArray,selfPhoneNumberId,sub,mes,body.loggedUser,body.tenant)     
                }
            }
            endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
            diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "watchListNotification", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (e) {
            out.status = "Failure ";
            out.message = "Failed to notify user."
            appLogger.logMessage("error", "Error while executing watchListNotification and the error is " + e, "PMSSupport", "watchListNotification", loggedUser, tenant, moduleName);
        }
        return out;
    },
    
    
    // GET DETAILS OF THE USERS WHO ADDED A TASK IN  WATCH LIST AND SEND MAIL AND WATSAPP NOTIFICATIONS
    getUserDetailsInWatchList: async function (body,loggedUser,tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        appLogger.logMessage("info", "getUserDetailsInWatchList Support initiated.", "PMSSupport", "getUserDetailsInWatchList", loggedUser, tenant, moduleName);
        let out = {
            status: "Success",
            message: "Successfully fetched user details",
            data: []

        }
        try {
            let mailIdArray=[],whatsappNumberArray=[],selfPhoneNumberId,param=[]
            if(body.taskId!=undefined && body.taskId!=null){
                // create sub task
                param = [
                    [body.taskId],body.tenantId
                ]
            }else{
                param = [
                    [body.mainTaskId],body.tenantId
                ]
            }
            
            let query=mysqlQueries.getUserDetailsInWatchList
            let result = await dbOperations.executeQuery(query, param, loggedUser, "getUserDetailsInWatchList", false,null, tenant, appLogger, meteringLogger, moduleName);
            if(result != undefined && result != null && result != 'Error'){
                if(result.length > 0){
                    appLogger.logMessage("info", "Successfully fetched user details", "PMSSupport", "getUserDetailsInWatchList", loggedUser, tenant, moduleName);
                    for(let data of result){
                        mailIdArray.push({'Id':data.ID,'Email':data.EMAIL})
                        whatsappNumberArray.push(data.WHATSAPP_NUMBER)
                        selfPhoneNumberId=data.WHATSAPP_ID
                    }
                    out.data=[{'MAIL_ID_ARRAY':mailIdArray,'WHATSAPP_NUMBER_ARRAY':whatsappNumberArray,'SELF_PHONE_NUMBER_ID':selfPhoneNumberId}]
                    //await this.notifyUserInWatchList(body,mailIdArray,whatsappNumberArray,selfPhoneNumberId,sub,mes)
                }else{
                    out.data=[]
                    out.status = "Waning";
                    out.message = "No user available."
                    appLogger.logMessage("info", "Failed to fetch user details", "PMSSupport", "getUserDetailsInWatchList", loggedUser, tenant, moduleName);
                }
            }else{
                out.data=[]
                out.status = "Warning ";
                out.message = "Failed to fetch user details."
                appLogger.logMessage("info", "Failed to fetch details of user added the task in watch list", "PMSSupport", "getUserDetailsInWatchList", loggedUser, tenant, moduleName);
            }
            endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
            diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "getUserDetailsInWatchList", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (e) {
            appLogger.logMessage("error", "Error while executing getUserDetailsInWatchList and the error is " + e, "PMSSupport", "getUserDetailsInWatchList", loggedUser, tenant, moduleName);
        }
        return out;
    },
    // CREATE CONTENT FOR SENDING MAIL  ABOUT THE WATCH LIST TASK
    contentForWatchListTask: async function (body,action,loggedUser,tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        appLogger.logMessage("info", "contentForWatchListTask Support initiated.", "PMSSupport", "contentForWatchListTask", loggedUser, tenant, moduleName);
        let out = {
            status: "Success",
            message: "Successfully created content",
            data: []

        }
        try {
            if(body.mailData!=undefined && body.mailData!=null){
                body.mailData=JSON.parse(body.mailData)

            }
            let sub,mes,message,subject;
            switch(action){
                case 'task_assign':
                    sub = mailConfig.task.watchlist_task_assign.sub
                    sub = sub.replace('{taskId}', body.taskId)
                    sub = sub.replace('{projectName}', body.projectName)
                    sub = sub.replace('{assignedByName}', body.assignedByName)
                    sub = sub.replace('{assignedToName}', body.mailData.ASSIGNED_TO_NAME)
                    subject=sub
                    mes = mailConfig.task.watchlist_task_assign.message
                    mes = mes.replace('{taskId}', body.taskId)
                    mes = mes.replace('{assignedByName}', body.assignedByName)
                    mes = mes.replace('{assignedToName}', body.mailData.ASSIGNED_TO_NAME)
                    mes = mes.replace('{projectName}', body.projectName)
                    mes = mes.replace('{taskName}', body.taskName)
                    mes = mes.replace('{taskDescription}', body.taskDescription)
                    mes = mes.replace('{estimatedStartDate}', moment(body.estimatedStartDate).format("DD-MM-YYYY"))
                    mes = mes.replace('{estimatedCompletionDate}', moment(body.estimatedCompletionDate).format("DD-MM-YYYY"))

                    // mes=mes.replace('{assignedByName}',body.assignedByName)
                    mes = mes.replace('{groupName}', body.groupName)
                    mes = mes.replace('{createdByName}', body.createdByName)
                    //mes=mes.replace('{createdByName}',data.createdByName)
                    message = mes
                    break;
                case 'task_reassign':
                    sub = mailConfig.task.watchlist_task_reassign.sub
                    sub = sub.replace('{taskId}', body.taskId)
                    sub = sub.replace('{projectName}', body.projectName)
                    sub = sub.replace('{assignedByName}', body.assignedByName)
                    sub = sub.replace('{assignedToName}', body.assignedToName)
                    subject=sub
                    mes = mailConfig.task.watchlist_task_reassign.message
                    mes = mes.replace('{taskId}', body.taskId)
                    mes = mes.replace('{assignedByName}', body.assignedByName)
                    mes = mes.replace('{assignedToName}', body.assignedToName)
                    mes = mes.replace('{projectName}', body.projectName)
                    mes = mes.replace('{taskName}', body.taskName)
                    mes = mes.replace('{taskDescription}', body.taskDescription)
                    mes = mes.replace('{estimatedStartDate}', moment(body.estimatedStartDate).format("DD-MM-YYYY"))
                    mes = mes.replace('{estimatedCompletionDate}', moment(body.estimatedCompletionDate).format("DD-MM-YYYY"))
                    mes = mes.replace('{groupName}', body.groupName)
                    mes = mes.replace('{createdByName}', body.createdByName)
                    //mes=mes.replace('{createdByName}',data.createdByName)
                    message = mes

                    break;
                case 'task_start':
                    sub = mailConfig.task.watchlist_task_start.sub
                    sub = sub.replace('{taskId}', body.taskId)
                    sub = sub.replace('{projectName}', body.projectName)
                    sub = sub.replace('{loggedUserName}', body.loggedUserName)
                    subject=sub
                    mes = mailConfig.task.watchlist_task_start.message
                    mes = mes.replace('{taskId}', body.taskId)
                    mes = mes.replace('{loggedUserName}', body.loggedUserName)
                    mes = mes.replace('{projectName}', body.projectName)
                    mes = mes.replace('{taskName}', body.taskName)
                    mes = mes.replace('{taskDescription}', body.taskDescription)
                    mes = mes.replace('{estimatedStartDate}', moment(body.estimatedStartDate).format("DD-MM-YYYY"))
                    mes = mes.replace('{estimatedCompletionDate}', moment(body.estimatedCompletionDate).format("DD-MM-YYYY"))
                    message=mes
                    break;
                case 'task_hold':
                    sub = mailConfig.task.watchlist_task_hold.sub
                    sub = sub.replace('{taskId}', body.taskId)
                    sub = sub.replace('{projectName}', body.projectName)
                    sub = sub.replace('{loggedUserName}', body.loggedUserName)
                    subject=sub
                    mes = mailConfig.task.watchlist_task_hold.message  
                    mes = mes.replace('{taskId}', body.taskId)
                    mes = mes.replace('{loggedUserName}', body.loggedUserName)
                    mes = mes.replace('{projectName}', body.projectName)
                    mes = mes.replace('{taskName}', body.taskName)
                    mes = mes.replace('{taskDescription}', body.taskDescription)
                    mes = mes.replace('{estimatedStartDate}', moment(body.estimatedStartDate).format("DD-MM-YYYY"))
                    mes = mes.replace('{estimatedCompletionDate}', moment(body.estimatedCompletionDate).format("DD-MM-YYYY"))
                    message=mes
                    break;
                case 'task_edit':
                    sub = mailConfig.task.watchlist_task_edit.sub
                    sub = sub.replace('{taskId}', body.taskId)
                    sub = sub.replace('{projectName}', body.projectName)
                    sub = sub.replace('{loggedUserName}', body.loggedUserName)
                    subject=sub
                    mes = mailConfig.task.watchlist_task_edit.message
                    mes = mes.replace('{taskId}', body.taskId)
                    mes = mes.replace('{loggedUserName}', body.loggedUserName)
                    mes = mes.replace('{projectName}', body.projectName)
                    mes = mes.replace('{taskName}', body.taskName)
                    mes = mes.replace('{groupName}', body.groupName)
                    mes = mes.replace('{taskDescription}', body.taskDescription)
                    mes = mes.replace('{estimatedStartDate}', moment(body.estimatedStartDate).format("DD-MM-YYYY"))
                    mes = mes.replace('{estimatedCompletionDate}', moment(body.estimatedCompletionDate).format("DD-MM-YYYY"))
                    message=mes
                    break;
                case 'task_resume':
                    sub = mailConfig.task.watchlist_task_resume.sub
                    sub = sub.replace('{taskId}', body.taskId)
                    sub = sub.replace('{projectName}', body.projectName)
                    sub = sub.replace('{loggedUserName}', body.loggedUserName)
                    subject=sub
                    mes = mailConfig.task.watchlist_task_resume.message
                    mes = mes.replace('{taskId}', body.taskId)
                    mes = mes.replace('{loggedUserName}', body.loggedUserName)
                    mes = mes.replace('{projectName}', body.projectName)
                    mes = mes.replace('{taskName}', body.taskName)
                    mes = mes.replace('{taskDescription}', body.taskDescription)
                    mes = mes.replace('{estimatedStartDate}', moment(body.estimatedStartDate).format("DD-MM-YYYY"))
                    mes = mes.replace('{estimatedCompletionDate}', moment(body.estimatedCompletionDate).format("DD-MM-YYYY"))
                    message=mes
                    break;
                case 'task_complete':
                    sub = mailConfig.task.watchlist_task_complete.sub
                    sub = sub.replace('{taskId}', body.taskId)
                    sub = sub.replace('{projectName}', body.projectName)
                    sub = sub.replace('{loggedUserName}', body.loggedUserName)
                    subject=sub
                    mes = mailConfig.task.watchlist_task_complete.message
                    mes = mes.replace('{taskId}', body.taskId)
                    mes = mes.replace('{loggedUserName}', body.loggedUserName)
                    mes = mes.replace('{projectName}', body.projectName)
                    mes = mes.replace('{taskName}', body.taskName)
                    //mes = mes.replace('{taskDescription}', body.taskDescription)
                    mes = mes.replace('{estimatedStartDate}', moment(body.estimatedStartDate).format("DD-MM-YYYY"))
                    mes = mes.replace('{estimatedCompletionDate}', moment(body.actualCompletionDate).format("DD-MM-YYYY"))
                    mes = mes.replace('{actualCompletionDate}', moment(body.completedDate).format("DD-MM-YYYY"))

                    message=mes
                    break;
                case 'task_closed':
                    sub = mailConfig.task.watchlist_task_closed.sub
                    sub = sub.replace('{taskId}', body.taskId)
                    sub = sub.replace('{projectName}', body.mailData.PROJECT_NAME)
                    sub = sub.replace('{loggedUserName}', body.loggedUserName)
                    subject=sub
                    mes = mailConfig.task.watchlist_task_closed.message
                    mes = mes.replace('{taskId}', body.taskId)
                    mes = mes.replace('{loggedUserName}', body.loggedUserName)
                    mes = mes.replace('{projectName}', body.mailData.PROJECT_NAME)
                    mes = mes.replace('{taskName}', body.mailData.TASK_NAME)
                    mes = mes.replace('{taskDescription}', body.mailData.TASK_DESCRIPTION)
                    mes = mes.replace('{estimatedStartDate}', moment(body.estimatedStartDate).format("DD-MM-YYYY"))
                    mes = mes.replace('{estimatedCompletionDate}', moment(body.estimatedCompletionDate).format("DD-MM-YYYY"))
                    message=mes
                    break;
                case 'work_log':
                    sub = mailConfig.task.watchlist_task_logwork.sub
                    sub = sub.replace('{taskId}', body.taskId)
                    sub = sub.replace('{projectName}', body.projectName)
                    sub = sub.replace('{loggedUserName}', body.loggedUserName)
                    subject=sub
                    mes = mailConfig.task.watchlist_task_logwork.message
                    mes = mes.replace('{taskId}', body.taskId)
                    mes = mes.replace('{hour}', body.hours)
                    mes = mes.replace('{loggedUserName}', body.loggedUserName)
                    mes = mes.replace('{projectName}', body.projectName)
                    mes = mes.replace('{taskName}', body.taskName)
                    mes = mes.replace('{taskDescription}', body.taskDescription)
                    mes = mes.replace('{estimatedStartDate}', moment(body.estimatedStartDate).format("DD-MM-YYYY"))
                    mes = mes.replace('{estimatedCompletionDate}', moment(body.estimatedCompletionDate).format("DD-MM-YYYY"))
                    message=mes
                    break
                case 'work_log_edit':
                    
                    sub = mailConfig.task.watchlist_work_log_edit.sub
                    sub = sub.replace('{taskId}', body.taskId)
                    sub = sub.replace('{projectName}', body.mailData.PROJECT_NAME)
                    sub = sub.replace('{loggedUserName}', body.loggedUserName)
                    subject=sub
                    mes = mailConfig.task.watchlist_work_log_edit.message
                    mes = mes.replace('{taskId}', body.taskId)
                    mes = mes.replace('{loggedUserName}', body.loggedUserName)
                    mes = mes.replace('{projectName}', body.mailData.PROJECT_NAME)
                    mes = mes.replace('{taskName}', body.mailData.TASK_NAME)
                    mes = mes.replace('{taskDescription}', body.mailData.TASK_DESCRIPTION)
                    mes = mes.replace('{estimatedStartDate}', moment(body.estimatedStartDate).format("DD-MM-YYYY"))
                    mes = mes.replace('{estimatedCompletionDate}', moment(body.estimatedCompletionDate).format("DD-MM-YYYY"))
                    message=mes
                    break;
                case 'work_log_delete':
                    sub = mailConfig.task.watchlist_work_log_delete.sub
                    sub = sub.replace('{taskId}', body.taskId)
                    sub = sub.replace('{projectName}', body.mailData.PROJECT_NAME)
                    sub = sub.replace('{loggedUserName}', body.loggedUserName)
                    subject=sub
                    mes = mailConfig.task.watchlist_work_log_delete.message 
                    mes = mes.replace('{taskId}', body.taskId)
                    mes = mes.replace('{loggedUserName}', body.loggedUserName)
                    mes = mes.replace('{projectName}', body.mailData.PROJECT_NAME)
                    mes = mes.replace('{taskName}', body.mailData.TASK_NAME)
                    mes = mes.replace('{taskDescription}', body.mailData.TASK_DESCRIPTION)
                    mes = mes.replace('{estimatedStartDate}', moment(body.estimatedStartDate).format("DD-MM-YYYY"))
                    mes = mes.replace('{estimatedCompletionDate}', moment(body.estimatedCompletionDate).format("DD-MM-YYYY"))
                    message=mes
                    break;
                case 'add_task_milestone':
                    sub = mailConfig.task.watchlist_add_task_milestone.sub
                    sub = sub.replace('{taskId}', body.taskId)
                    sub = sub.replace('{projectName}', body.projectName)
                    sub = sub.replace('{loggedUserName}', body.loggedUserName)
                    subject=sub
                    mes = mailConfig.task.watchlist_add_task_milestone.message 
                    mes = mes.replace('{taskId}', body.taskId)
                    mes = mes.replace('{milestoneName}', body.milestoneName)
                    mes = mes.replace('{loggedUserName}', body.loggedUserName)
                    mes = mes.replace('{projectName}', body.projectName)
                    mes = mes.replace('{taskName}', body.taskName)
                    mes = mes.replace('{taskDescription}', body.taskDescription)
                    mes = mes.replace('{estimatedStartDate}', moment(body.estimatedStartDate).format("DD-MM-YYYY"))
                    mes = mes.replace('{estimatedCompletionDate}', moment(body.estimatedCompletionDate).format("DD-MM-YYYY"))
                    message=mes
                    break;
                    
                case 'remove_task_milestone':
                    sub = mailConfig.task.watchlist_remove_task_milestone.sub
                    sub = sub.replace('{taskId}', body.taskId)
                    sub = sub.replace('{projectName}', body.projectName)
                    sub = sub.replace('{loggedUserName}', body.loggedUserName)
                    subject=sub
                    mes = mailConfig.task.watchlist_remove_task_milestone.message 
                    mes = mes.replace('{taskId}', body.taskId)
                    mes = mes.replace('{loggedUserName}', body.loggedUserName)
                    mes = mes.replace('{milestoneName}', body.milestoneName)
                    mes = mes.replace('{projectName}', body.projectName)
                    mes = mes.replace('{taskName}', body.taskName)
                    mes = mes.replace('{taskDescription}', body.taskDescription)
                    mes = mes.replace('{estimatedStartDate}', moment(body.estimatedStartDate).format("DD-MM-YYYY"))
                    mes = mes.replace('{estimatedCompletionDate}', moment(body.estimatedCompletionDate).format("DD-MM-YYYY"))
                    message=mes
                    break;
                case 'convert_to_issue':
                    sub = mailConfig.task.watchlist_convert_to_issue.sub
                    sub = sub.replace('{taskId}', body.taskId)
                    sub = sub.replace('{projectName}', body.projectName)
                    sub = sub.replace('{loggedUserName}', body.loggedUserName)
                    subject=sub
                    mes = mailConfig.task.watchlist_convert_to_issue.message 
                    mes = mes.replace('{taskId}', body.taskId)
                    mes = mes.replace('{loggedUserName}', body.loggedUserName)
                    mes = mes.replace('{projectName}', body.projectName)
                    mes = mes.replace('{taskName}', body.taskName)
                    mes = mes.replace('{taskDescription}', body.taskDescription)
                    mes = mes.replace('{estimatedStartDate}', moment(body.estimatedStartDate).format("DD-MM-YYYY"))
                    mes = mes.replace('{estimatedCompletionDate}', moment(body.estimatedCompletionDate).format("DD-MM-YYYY"))
                    message=mes
                    break;
                case 'create_subtask':
                    sub = mailConfig.task.watchlist_create_subtask.sub
                    let taskId=body.mainTaskId
                    sub = sub.replace('{taskId}',taskId)
                    sub = sub.replace('{projectName}', body.projectName)
                    sub = sub.replace('{loggedUserName}', body.loggedUserName)
                    sub = sub.replace('{taskId}', taskId)
                    subject=sub
                    mes = mailConfig.task.watchlist_create_subtask.message 
                    mes = mes.replace('{taskId}', taskId)
                    mes = mes.replace('{loggedUserName}', body.loggedUserName)
                    mes = mes.replace('{projectName}', body.projectName)
                    mes = mes.replace('{taskName}', body.taskName)
                    mes = mes.replace('{taskDescription}', body.taskDescription)
                    mes = mes.replace('{estimatedStartDate}', moment(body.estimatedStartDate).format("DD-MM-YYYY"))
                    mes = mes.replace('{estimatedCompletionDate}', moment(body.estimatedCompletionDate).format("DD-MM-YYYY"))
                    message=mes
                    break;
                case 'convert_to_maintask':
                    sub = mailConfig.task.watchlist_convert_to_maintask.sub
                    sub = sub.replace('{taskId}', body.mailData.TASK_ID)
                    sub = sub.replace('{projectName}', body.mailData.PROJECT_NAME)
                    sub = sub.replace('{loggedUserName}', body.loggedUserName)
                    subject=sub
                    mes = mailConfig.task.watchlist_convert_to_maintask.message 
                    mes = mes.replace('{taskId}', body.mailData.TASK_ID)
                    mes = mes.replace('{loggedUserName}', body.loggedUserName)
                    mes = mes.replace('{projectName}', body.mailData.PROJECT_NAME)
                    mes = mes.replace('{taskName}', body.mailData.TASK_NAME)
                    mes = mes.replace('{taskDescription}', body.mailData.TASK_DESCRIPTION)
                    mes = mes.replace('{estimatedStartDate}', moment(body.estimatedStartDate).format("DD-MM-YYYY"))
                    mes = mes.replace('{estimatedCompletionDate}', moment(body.estimatedCompletionDate).format("DD-MM-YYYY"))
                    message=mes
                    break;
                case 'convert_to_subtask':
                        sub = mailConfig.task.watchlist_convert_to_maintask.sub
                        sub = sub.replace('{taskId}', body.mailData.TASK_ID)
                        sub = sub.replace('{projectName}', body.mailData.PROJECT_NAME)
                        sub = sub.replace('{loggedUserName}', body.loggedUserName)
                        subject=sub
                        mes = mailConfig.task.watchlist_convert_to_maintask.message 
                        mes = mes.replace('{taskId}', body.mailData.TASK_ID)
                        mes = mes.replace('{loggedUserName}', body.loggedUserName)
                        mes = mes.replace('{projectName}', body.mailData.PROJECT_NAME)
                        mes = mes.replace('{taskName}', body.mailData.TASK_NAME)
                        mes = mes.replace('{taskDescription}', body.mailData.TASK_DESCRIPTION)
                        mes = mes.replace('{estimatedStartDate}', moment(body.estimatedStartDate).format("DD-MM-YYYY"))
                        mes = mes.replace('{estimatedCompletionDate}', moment(body.estimatedCompletionDate).format("DD-MM-YYYY"))
                        message=mes
                        break;
                case 'project_start':
                    break;
                case 'project_hold':
                    break;
                case 'project_completed':
                    break;
                case 'project_closed':
                    break;
                case 'priority_update':
                    sub = mailConfig.task.priortyChange.sub
                    mes = mailConfig.task.priortyChange.message
                    sub = sub.replace('{projectName}', body.projectName)
                    sub = sub.replace('{updatedByName}', body.updatedByName)
                    sub = sub.replace('{taskId}', body.taskId)
                    mes = mes.replace('{projectName}', body.projectName)
                    mes = mes.replace('{taskName}', body.taskName)
                    mes = mes.replace('{groupName}', body.groupName)
                    mes = mes.replace('{taskDescription}', body.taskDescription)
                    mes = mes.replace('{estimatedStartDate}', body.estimatedStartDate)
                    mes = mes.replace('{estimatedCompletionDate}', body.estimatedCompletionDate)
                    mes = mes.replace('{priority}', body.priority)
                    subject=sub
                    message = mes
                    break;
                case 'status_update':
                    sub = mailConfig.task.statusChange.sub
                    mes = mailConfig.task.statusChange.message
                    sub = sub.replace('{projectName}', body.projectName)
                    sub = sub.replace('{updatedByName}', body.updatedByName)
                    sub = sub.replace('{taskId}', body.taskId)
                    mes = mes.replace('{projectName}', body.projectName)
                    mes = mes.replace('{taskName}', body.taskName)
                    mes = mes.replace('{groupName}', body.groupName)
                    mes = mes.replace('{taskDescription}', body.taskDescription)
                    mes = mes.replace('{estimatedStartDate}', body.estimatedStartDate)
                    mes = mes.replace('{estimatedCompletionDate}', body.estimatedCompletionDate)
                    mes = mes.replace('{status}', body.status)
                    subject=sub
                    message = mes
                    break;
                case 'task_dependency':
                    sub = mailConfig.task.watchlist_dependency.sub
                    sub = sub.replace('{taskId}', body.mailData.TASK_ID)
                    sub = sub.replace('{projectName}', body.mailData.PROJECT_NAME)
                    sub = sub.replace('{loggedUserName}', body.loggedUserName)
                    subject=sub
                    mes = mailConfig.task.watchlist_dependency.message 
                    mes = mes.replace('{taskId}', body.mailData.TASK_ID)
                    mes = mes.replace('{loggedUserName}', body.loggedUserName)
                    mes = mes.replace('{projectName}', body.mailData.PROJECT_NAME)
                    mes = mes.replace('{taskName}', body.mailData.TASK_NAME)
                    mes = mes.replace('{taskDescription}', body.mailData.TASK_DESCRIPTION)
                    mes = mes.replace('{estimatedStartDate}', moment(body.estimatedStartDate).format("DD-MM-YYYY"))
                    mes = mes.replace('{estimatedCompletionDate}', moment(body.estimatedCompletionDate).format("DD-MM-YYYY"))
                    message=mes
                    break;
            }
            out.data=[{'SUB':subject,'MESSAGE':message}]
            endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
            diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "contentForWatchListTask", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (e) {
            out.status = "Failure ";
            out.message = "Failed to create notification content."
            appLogger.logMessage("error", "Error while executing contentForWatchListTask and the error is " + e, "PMSSupport", "contentForWatchListTask", loggedUser, tenant, moduleName);
        }
        return out;
    },

    //NOTIFY USERS WHO ADDED TASK / PROJECT IN THEIR WATCH LIST WHEN ANY UPDATION ON THE TASK AND PROJECT
    notifyUserInWatchList: async function (body,mailIdArray,whatsappNumberArray,selfPhoneNumberId,sub,mes,loggedUser,tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        appLogger.logMessage("info", "notifyUserInWatchList Support initiated.", "PMSSupport", "notifyUserInWatchList", loggedUser, tenant, moduleName);
        let out = {
            status: "Success",
            message: "Successfully notify user",
            data: []

        }
        try {
            
            sendMails(mailIdArray, null, null, sub, mes, body.loggedUser, body.tenant, null, false, body.tenantId, appLogger, meteringLogger, moduleName)

            await sleep(5000)
            endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
            diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "notifyUserInWatchList", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (e) {
            out.status = "Failure ";
            out.message = "Failed to send notification."
            appLogger.logMessage("error", "Error while executing notifyUserInWatchList and the error is " + e, "PMSSupport", "notifyUserInWatchList", loggedUser, tenant, moduleName);
        }
        return out;
    },
    // UPDATE MILESTONE
    updateMilestone: async function (body,id,loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        taskIds = id;
        let result,query
        let today = new Date();
        let response = false
        try {
            appLogger.logMessage("info", "updateMilestone function begins", "PMSSupport", "updateMilestone", loggedUser, tenant, moduleName);
            query=mysqlQueries.checkMilestoneExists;
            result = await dbOperations.executeQuery(query, [body.newTaskId,body.tenantId], loggedUser, "getUserDetailsInWatchList", false,null, tenant, appLogger, meteringLogger, moduleName);
            if(result != null && result != undefined && result.length > 0 && result != 'Error'){
              // if new main task have milestone and old task have no milestone
                if(body.milestoneId == null){
                    let param = [];
                    let records = [];
                    for(id of taskIds){
                        records.push(body.tenantId);
                        records.push(result[0].MILESTONE_ID);
                        records.push(id);
                        records.push(today)
                        records.push(body.loggedUserId);
                        records.push(body.loggedUserId);
                        param.push(records);
                        records = [];
                    }
                    query=mysqlQueries.addMilestone;
                    result = await dbOperations.executeQuery(query,[param], loggedUser, "getUserDetailsInWatchList", false,null, tenant, appLogger, meteringLogger, moduleName);   
                    if (result != null && result != undefined && result != 'Error') {
                        if (result.affectedRows > 0) {
                            response = true
                        }
                    }
                }else{
                  // if new main task have milestone and old task have milestone
                    query=mysqlQueries.updateMilestone;
                    result = await dbOperations.executeQuery(query, [result[0].MILESTONE_ID,body.loggedUserId,taskIds,body.tenantId], loggedUser, "getUserDetailsInWatchList", false,null, tenant, appLogger, meteringLogger, moduleName);  
                    if (result != null && result != undefined && result != 'Error') {
                        if (result.affectedRows > 0) {
                            response = true
                        }
                    }  
                }                
            }else{
                if(body.milestoneId != null){
                    query=mysqlQueries.endDateMilestone;
                    result = await dbOperations.executeQuery(query, [moment(today).format(YYYY-MM-DD),body.loggedUserId,taskIds,body.tenantId], loggedUser, "getUserDetailsInWatchList", false,null, tenant, appLogger, meteringLogger, moduleName);    
                    if (result != null && result != undefined && result != 'Error') {
                        if (result.affectedRows > 0) {
                            response = true
                        }
                    }
                }
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "updateMilestone", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  updateMilestone" + error.message, "PMSSupport", "updateMilestone", loggedUser, tenant, moduleName);
        }
        appLogger.logMessage("info", "updateMilestone function completed", "PMSSupport", "updateMilestone", loggedUser, tenant, moduleName);
        return response
    },
    notifySelectedUser: async function (result, approvers, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        appLogger.logMessage("info", "Support initiated.", "PMSSupport", "notifySelectedUser", loggedUser, tenant, moduleName);
        let out = {
            status: "Success",
            message: "Successfully notified selected users",
            data: []
        }
        try {
            let msg = "You have a pending approval of task '" + result.taskName + "' in the '" + result.projectName + "' project, which has been completed by " + result.assignedToName + "."
            let sub = mailConfig.task.approval.sub;
            sub = sub.replace("{projectName}", result.projectName)
            sub = sub.replace("{taskId}", result.taskId)
            let message = mailConfig.task.approval.message;
            message = message.replace("{projectName}", result.projectName)
            message = message.replace("{taskId}", result.taskId)
            message = message.replace("{taskName}", result.taskName)
            message = message.replace("{taskDescription}", result.taskDescription)
            approvers = approvers.map(({
                USER_ID: Id,
                EMAIL: Email,
                WHATSAPP_NUMBER: Phno,
                WHATSAPP_ID: WhatsappId,
                TENANT_NAME: Tenant,
                ID: TenantId,
                ...rest
            }) => ({
                Id, Email, Phno, WhatsappId, Tenant, TenantId,...rest
            }));
            sendMails(approvers, null, null, sub, message, loggedUser, tenant, null, false, result.tenantId, appLogger, meteringLogger, moduleName)
            let comment = result.comment || null
            for(let data of approvers){
                await this.notifyInApp(result.loggedUserId, data.Id, msg, result.taskId, 'TASK', result.tenantId, loggedUser, tenant,comment);
                await this.notifyUser(msg, data.Phno, data.TenantId, data.WhatsappId, loggedUser, tenant);
            }
            endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
            diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "notifySelectedUser", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (e) {
            appLogger.logMessage("error", "Error while executing notifySelectedUser and the error is " + e, "PMSSupport", "notifySelectedUser", loggedUser, tenant, moduleName);
        }
        return out;
    },

    // UPDATE MAIN TASK PROGRESS
    updateMainTaskProgress: async function (body,loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let result
        
        try {
            appLogger.logMessage("info", "updateMainTaskProgress function begins", "PMSSupport", "updateMainTaskProgress", loggedUser, tenant, moduleName);
            if(body.type=='SUB' && body.mainTaskId!=undefined && body.mainTaskId!=null){
                let param=[],query
                query=mysqlQueries.getTotalProgressOfSubTask
                param=[body.mainTaskId,body.tenantId]
                result = await dbOperations.executeQuery(query,param, loggedUser, "addTaskProgress", false, null, tenant, appLogger, meteringLogger, moduleName)
                appLogger.logMessage("debug", "Result of fetching total progress of all sub task under main task "+JSON.stringify(result), "PMService", "addTaskProgress", loggedUser, tenant, moduleName);
                if(result!=undefined && result!=null && result!='Error'){
                    if(result.length>0){
                        let mainTaskProgress=result[0].TOTAL_PROGRESS/result[0].SUBTASK_COUNT
                        query=mysqlQueries.addTaskProgress
                        param=[mainTaskProgress,body.loggedUserId,body.mainTaskId,body.tenantId]
                        result = await dbOperations.executeQuery(query,param, loggedUser, "addTaskProgress", false, null, tenant, appLogger, meteringLogger, moduleName)
                        appLogger.logMessage("debug", "Result updating main task progerss "+JSON.stringify(result), "PMService", "addTaskProgress", loggedUser, tenant, moduleName);
                        if(result!=undefined && result!=null && result!='Error'){
                            if(result.affectedRows>0){
                                appLogger.logMessage("info", "Task progress added successfully. ", "PMService", "addTaskProgress", loggedUser, tenant, moduleName);
                                result = await ResponseHandler.sendResponse("Success", "Task progress added successfully ", 200, result, true, "addTaskProgress", tenant, loggedUser, moduleName,appLogger,meteringLogger);

                            }else{
                                result = await ResponseHandler.sendResponse("Warning", "Failed to add progress. ", 400, result, true, "addTaskProgress", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                            }
    
                        }else{
                            result = await ResponseHandler.sendResponse("Warning", "Failed to add progress.", 400, result, true, "addTaskProgress", tenant, loggedUser, moduleName,appLogger,meteringLogger);

                        }
        

                    }else{
                        result = await ResponseHandler.sendResponse("Wanring", "Failed to update progress to the main task.", 400, result, true, "addTaskProgress", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                    }
                }else{
                    appLogger.logMessage("info", "Failed to get the  sub task progress. ", "PMService", "addTaskProgress", loggedUser, tenant, moduleName);
                    result = await ResponseHandler.sendResponse("Wanring", "Failed to update progress to the main task.", 400, result, true, "addTaskProgress", tenant, loggedUser, moduleName,appLogger,meteringLogger);

                }
            }else{
                appLogger.logMessage("info", "Task progress added successfully. ", "PMService", "addTaskProgress", loggedUser, tenant, moduleName);
                result = await ResponseHandler.sendResponse("Success", "Task progress added successfully ", 200, result, true, "addTaskProgress", tenant, loggedUser, moduleName,appLogger,meteringLogger);

            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "updateMainTaskProgress", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  updateMainTaskProgress" + error.message, "PMSSupport", "updateMainTaskProgress", loggedUser, tenant, moduleName);
        }
        appLogger.logMessage("info", "updateMainTaskProgress function completed", "PMSSupport", "updateMainTaskProgress", loggedUser, tenant, moduleName);
        return result
    },

    //  CHECK DASHBOARD ALREADY EXISTS
    isDashBoardExists: async function (dashboardName,userId, loggedUser, tenant) {
        appLogger.logMessage("debug", "isDashBoardExists function called ", "PMSSupport", "isDashBoardExists", loggedUser, tenant, moduleName);
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let out = {
            status: "Success",
            message: "No dashboard with same name",
            statusCode: 200,
            data: []
        }
        try {
            let isExists=false
            let param1 = { $unwind: "$dashboard" };
            //let param2 = { $match: {$eq:[{"dashboard.dashboardName": dashboardName}] } };

            let param2 = { $match: { "dashboard.dashboardName": dashboardName} };
            let param3 = { $project: { "dashboard.userId": 1 } }
            let params = [param1, param2, param3];
            let result = await mongoOperations.executeMongoGetSpecificData(loggedUser, "dashboard", params, "isDashBoardExists", tenant, appLogger, meteringLogger, moduleName);
            if (result != null && result != undefined ) {
                if (result.length > 0) {
                    for(let data of result) {
                       if(data.dashboard.userId==userId){
                        isExists=true
                       } 
                    }     
                    if(isExists)  {
                        out.status = "Warning";
                        out.message = "Dashboard name already exists";
                        out.statusCode = 400;
                        out.data = []
                        appLogger.logMessage("debug", " Dasboard name exists." , "PMSSupport", "isDashBoardExists", loggedUser, tenant, moduleName);
                    } else {
                        out.status = "Success";
                        out.message = "No dashboard available";
                        out.statusCode = 200;
                        appLogger.logMessage("debug", " " , "PMSSupport", "isDashBoardExists", loggedUser, tenant, moduleName);
                    }
                            
                }
            } else {
                out.status='Warning'
                out.statusCode=400
                out.message="Failed to fetch dashboard"
                
                appLogger.logMessage("debug", "Failed to get dashboard", "PMSSupport", "isDashBoardExists", loggedUser, tenant, moduleName);
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "isDashBoardExists", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Failed to get dashboard due to" + error.message, "PMSSupport", "isDashBoardExists", req.body.loggedUser, req.body.tenant, moduleName);
            out.status = "Failure"
            out.message = "Internal server error " + error.message
            out.statusCode = 500
        }
        appLogger.logMessage("info", "isDashBoardExists completed", "PMSSupport", "isDashBoardExists", loggedUser, tenant, moduleName);
        return out;
    },


    //CONVERT TO TITLE CASE 
    //  CHECK DASHBOARD ALREADY EXISTS
    toTitleCase: async function (str, loggedUser, tenant) {
        appLogger.logMessage("debug", "toTitleCase function called ", "PMSSupport", "toTitleCase", loggedUser, tenant, moduleName);
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let response;
        try {
            let wordArr = String(str).split(" ");
            let finalWord = "";
            for(let word of wordArr){
                let firstChar = String(word).toUpperCase()[0];
                let str2 = (String(word).slice(1,word.length)).toLowerCase();
                let titleCaseStr = firstChar+str2;
                finalWord+=" "+titleCaseStr
            }
            response=finalWord.trim();
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "toTitleCase", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Failed to get dashboard due to" + error.message, "PMSSupport", "toTitleCase",loggedUser, tenant, moduleName);
            out.status = "Failure"
            out.message = "Internal server error " + error.message
            out.statusCode = 500
        }
        appLogger.logMessage("info", "toTitleCase completed", "PMSSupport", "toTitleCase", loggedUser, tenant, moduleName);
        return response;
    },

    sendNotificationInWhatsapp: async function (endPoint,payload, loggedUser, tenant) {
        appLogger.logMessage("debug", "sendNotificationInWhatsapp function called ", "PMSSupport", "sendNotificationInWhatsapp", loggedUser, tenant, moduleName);
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let response;
        
        try {
            var configuration = {
                method: 'post',
                url: endPoint,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: payload
            };
            axios(configuration)
                .then(function (response) {
                    appLogger.logMessage("debug","Response after whatsapp api call: "+JSON.stringify(response.data),"PMSSupport","sendNotificationInWhatsapp",loggedUser,tenant,moduleName);
                    out = response.data;
                    return out;
                })
                .catch(function (error) {
                    out.status = "Failed";
                    out.message = "Failed to notify user due to: " + JSON.stringify(error.message)
                    appLogger.logMessage("debug",out.message,"PMSSupport","sendNotificationInWhatsapp",loggedUser,tenant,moduleName);
                    return out;
                });
        } catch (error) {
            appLogger.logMessage("error", "Failed to get dashboard due to" + error.message, "PMSSupport", "sendNotificationInWhatsapp",loggedUser, tenant, moduleName);
            out.status = "Failure"
            out.message = "Internal server error " + error.message
            out.statusCode = 500
        }
        appLogger.logMessage("info", "sendNotificationInWhatsapp completed", "PMSSupport", "sendNotificationInWhatsapp", loggedUser, tenant, moduleName);
        return response;
    },

    //UPDATE TASK TABLE CANNOT_START AND CANNOT_COMPLETE COLUMNS ACCORDING TO THE DEPENDENCY RULES
    updateDependencyRule: async function (body,taskIdToUpdate,query,loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let result
        
        try {
            appLogger.logMessage("info", "updateDependencyRule function begins", "PMSSupport", "updateDependencyRule", loggedUser, tenant, moduleName);
            let param=[];
                
                param=['Y',body.loggedUserId,taskIdToUpdate,body.tenantId]
                result = await dbOperations.executeQuery(query,param, loggedUser, "updateDependencyRule", false, null, tenant, appLogger, meteringLogger, moduleName)
                appLogger.logMessage("debug", "Result of updating dependency rule in task table "+JSON.stringify(result), "PMService", "updateDependencyRule", loggedUser, tenant, moduleName);
                if(result!=undefined && result!=null && result!='Error'){
                    if(result.affectedRows>0){
                        result = await ResponseHandler.sendResponse("Success", "Successfully updated dependency rule.", 200, null, false, "updateDependencyRule", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                        appLogger.logMessage("info", "Successfully updated dependency rule. ", "PMService", "updateDependencyRule", loggedUser, tenant, moduleName);

                    }else{
                        result = await ResponseHandler.sendResponse("Warning", "Failed to update dependency rule.", 400, result, true, "updateDependencyRule", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                    }
                }else{
                    appLogger.logMessage("info", "Failed to update dependency rule. ", "PMService", "updateDependencyRule", loggedUser, tenant, moduleName);
                    result = await ResponseHandler.sendResponse("Warning", "Failed to update dependency rule.", 400, result, true, "updateDependencyRule", tenant, loggedUser, moduleName,appLogger,meteringLogger);

                }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "updateDependencyRule", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            appLogger.logMessage("error", "Error occured in  updateDependencyRule" + error.message, "PMSSupport", "updateDependencyRule", loggedUser, tenant, moduleName);
        }
        appLogger.logMessage("info", "updateDependencyRule function completed", "PMSSupport", "updateDependencyRule", loggedUser, tenant, moduleName);
        return result
    },

    notifyManagerForIssueCreation: async function (taskId, userId, loggedUser, tenant,tenantId,type,issue_Name,project_Name,severity,createdBy,convertedTo,projectId) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let functionName = "notifyManagerForIssueCreation";
        appLogger.logMessage("info", "notifyManagerForIssueCreation support function is started", functionName, loggedUser, tenant, moduleName);
        let out = {
            status: "Success",
            message: "Successfully notified the project manager via whatsapp"
        }
        try {
            let query = "";
            let param = [];
            query= mysqlQueries.getIssueMangerDetails;
            param = [projectId];
            appLogger.logMessage("debug", "Issue Created: " + userId , "PMSSupport", functionName, loggedUser, tenant, moduleName);
            let result = await dbOperations.executeQuery(query, param, loggedUser, "fetching user to send notification for Issue creation", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result ) {
                if (Array.isArray(result)) {
                    if (result.length > 0) {
                        let payload = {};
                        let endPoint = "";
                        let msg="" 
                        if(convertedTo != null && convertedTo != undefined && convertedTo == "TASK"){
                            msg= createdBy+" has converted a task to issue  called ' "+ issue_Name +" ' in ' "+project_Name + " ' project with severity as " + severity
                        }else{                
                        msg= createdBy+" has created an issue called ' "+ issue_Name +" ' in ' "+project_Name + " ' project with severity as " + severity
                        }
                        for(managerData of result){
                            payload = {
                                "message":msg,
                                "loggedUser":loggedUser,
                                "whatsappNumber": managerData.PM_WHATSAPP_NUMBER,
                                "tenant": managerData.TENANT_NAME,
                                "tenantId": managerData.TENANT_ID,
                                "whatsappId":managerData.WHATSAPP_ID
                            }
                            endPoint = config.whatsAppServerUrl + config.whatsAppEndpoints.notifyUser;
                            var configuration = {
                                method: 'post',
                                url: endPoint,
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                data: payload
                            };
                            axios(configuration)
                                .then(function (response) {
                                    appLogger.logMessage("debug","Response after whatsapp api call: "+JSON.stringify(response.data),"PMSSupport",functionName,loggedUser,tenant,moduleName);
                                    out = response.data;
                                    return out;
                                })
                                .catch(function (error) {
                                    out.status = "Failed";
                                    out.message = "Failed to notify user due to: " + JSON.stringify(error.message)
                                    appLogger.logMessage("debug",out.message,"PMSSupport",functionName,loggedUser,tenant,moduleName);
                                    return out;
                                });
                        }
                    } else {
                        out.status = "Failed";
                        out.message = "Failed to send notification due to no users found to notify";
                        appLogger.logMessage("debug", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
                        return out;
                    }
                } else {
                    out.status = "Failed";
                    out.message = "Invalid response from the server";
                    appLogger.logMessage("debug", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
                    return out;
                }
            } else {
                out.status = "Failed";
                out.message = "Failed to notify the users due to invalid response from the server";
                appLogger.logMessage("debug", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
                return out;
            }
        
        } catch (error) {
            out.status = "Failed";
            out.message = "Failed to notify the user due to: " + JSON.stringify(error.message);
            appLogger.logMessage("error", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
            return out;
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "filterTodoLists", startDateTime, endDateTime, diffInMS, moduleName);
    },

    notifyEmpAssignIssue: async function (userId, loggedUser, tenant,issue_Name,project_Name,severity,assignedBy) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let functionName = "notifyEmpAssignIssue";
        appLogger.logMessage("info", "notifyEmpAssignIssue support function is started", functionName, loggedUser, tenant, moduleName);
        let out = {
            status: "Success",
            message: "Successfully notified the  employee via whatsapp"
        }
        try {
            let query = "";
            let param = [];
            query= mysqlQueries.getEmpDetailsForAssignIssueWhatsappNotify;
            param = [userId];
            appLogger.logMessage("debug", "Issue Assigned: " + userId , "PMSSupport", functionName, loggedUser, tenant, moduleName);
            let result = await dbOperations.executeQuery(query, param, loggedUser, "fetching user to send notification for Assign creation", false, null, tenant,appLogger,meteringLogger,moduleName);
            if (result ) {
                if (Array.isArray(result)) {
                    if (result.length > 0) {
                        let payload = {};
                        let endPoint = "";
                        let msg= assignedBy+" assigned an issue  ' "+ issue_Name +" ' in ' "+project_Name + " ' project with severity as " + severity
                        
                            payload = {
                                "message":msg,
                                "loggedUser":loggedUser,
                                "whatsappNumber": result[0].PM_WHATSAPP_NUMBER,
                                "tenant": result[0].TENANT_NAME,
                                "tenantId": result[0].TENANT_ID,
                                "whatsappId":result[0].WHATSAPP_ID
                            }
                            endPoint = config.whatsAppServerUrl + config.whatsAppEndpoints.notifyUser;
                            var configuration = {
                                method: 'post',
                                url: endPoint,
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                data: payload
                            };
                            axios(configuration)
                                .then(function (response) {
                                    appLogger.logMessage("debug","Response after whatsapp api call: "+JSON.stringify(response.data),"PMSSupport",functionName,loggedUser,tenant,moduleName);
                                    out = response.data;
                                    return out;
                                })
                                .catch(function (error) {
                                    out.status = "Failed";
                                    out.message = "Failed to notify user due to: " + JSON.stringify(error.message)
                                    appLogger.logMessage("debug",out.message,"PMSSupport",functionName,loggedUser,tenant,moduleName);
                                    return out;
                                });
                        
                    } else {
                        out.status = "Failed";
                        out.message = "Failed to send notification due to no users found to notify";
                        appLogger.logMessage("debug", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
                        return out;
                    }
                } else {
                    out.status = "Failed";
                    out.message = "Invalid response from the server";
                    appLogger.logMessage("debug", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
                    return out;
                }
            } else {
                out.status = "Failed";
                out.message = "Failed to notify the users due to invalid response from the server";
                appLogger.logMessage("debug", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
                return out;
            }
        
        } catch (error) {
            out.status = "Failed";
            out.message = "Failed to notify the user due to: " + JSON.stringify(error.message);
            appLogger.logMessage("error", out.message, "PMSSupport", functionName, loggedUser, tenant, moduleName);
            return out;
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSSupport", "filterTodoLists", startDateTime, endDateTime, diffInMS, moduleName);
    },
    notifyWatchlistUsersinMilestone:async function(body){
        try {
            let mailTemplates = JSON.parse(body.selectedMailData)
            for (let data of mailTemplates) {
                if (data.ADDED_TO_WATCH_LIST == 'true') {
                        body.taskId = data.ID
                        body['taskName'] = data.TASK_NAME
                        body['estimatedStartDate'] = data.ESTIMATED_START_DATE
                        body['estimatedCompletionDate'] = data.ESTIMATED_COMPLETION_DATE
                        body['assignedToName'] = data.ASSIGNED_TO_NAME
                        body['taskDescription'] = data.TASK_DESCRIPTION
                        body.mailData = JSON.stringify(data)
                        await this.sendemail(body)
                            //   await sleep(5000)                            
                    }
            }
        } catch (error) {
            out.status = "Failed";
            out.message = "Failed to notify the user due to: " + JSON.stringify(error.message);
            appLogger.logMessage("error", out.message, "PMSSupport", functionName, body.loggedUser, body.tenant, 'PMS');
            return out;
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(body.tenant, body.loggedUser, "PMSSupport", "filterTodoLists", startDateTime, endDateTime, diffInMS, 'PMS');

    },


    sendemail: async function(body){
        return new Promise(async (resolve, reject) => {
            appLogger.logMessage("debug", "getTasksDueExpired function called with payload: " + JSON.stringify(body), "PMSSupport", "getTasksDueExpired", body.loggedUser, body.tenant, moduleName);
            startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            let res = {
                status: "Success",
                data: []
            }
            try {
                let notifyResult = await this.watchListNotification(body, 'remove_task_milestone', body.loggedUser, body.tenant)
                appLogger.logMessage("debug", "Response after notifying the user in the watch list: " + JSON.stringify(notifyResult), 'notify users in watchlist', "assignUserToTask", body.loggedUser, body.tenant, 'PMS');
                res.status = "Success";
            } catch (error) {
                appLogger.logMessage("error", "Failed to fetch tasks which due date expired due to: " + JSON.stringify(error.message), body.loggedUser, "PMSSupport", "getTasksDueExpired", body.loggedUser, body.tenant, moduleName);
                res.status = "Failed";
                res.message = "Interal server error";
                res.data = JSON.stringify(error.message);
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(body.tenant, body.loggedUser, "PMSSupport", "getTasksDueExpired", startDateTime, endDateTime, diffInMS, moduleName);
            resolve(res);
        })
    }
    

}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}