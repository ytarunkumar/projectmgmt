let appLogger = require('../logger/Logger').applicationLogger;
let meteringLogger = require('../logger/Logger').meteringLogger;
let mysqlQueries = require('../queries/PMSQueries');
let dbOperations = require('../../common/connection/mysql/DbOperations');
const moment = require('moment');
const { loggers } = require('winston');
const responseHandler = require('../../common/main/ResponseHandler');
const config = require('../config/Config.json');
const axios = require('axios');
const apiConfig = require('../config/APISignature.json');
const fs = require('fs')
const path = require('path');
const https = require('https');
let startDateTime;
let endDateTime;
let diffInMS;
let moduleName = 'PM'
module.exports = {

    // CREATE GPM_BUDGET WHILE CREATING TASK
    addBudget: async function(classId,classType,tenantId,currencyCode,type,maxAmount,minAmount,loggedUserId,loggedUser, tenant){
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let result
        appLogger.logMessage("info", "update order of execution of task function begins", "BudgetSupport", "addBudget", loggedUser, tenant, moduleName);
        try {
            currencyCode = (currencyCode === '' || currencyCode === 'null' || currencyCode === undefined || currencyCode === null) ? null : currencyCode;
            type = (type === '' || type === 'null' || type === undefined || type === null) ? null : type.toUpperCase();
            maxAmount = (maxAmount === '' || maxAmount === 'null' || maxAmount === undefined || maxAmount === null) ? 0 : maxAmount;
            minAmount = (minAmount === '' || minAmount === 'null' || minAmount === undefined || minAmount === null) ? 0 : minAmount;
            if(type != null && type != undefined){
                if(type == "FIXED"){
                    minAmount = (minAmount != 0) ? minAmount : maxAmount;
                }
            }
            if(classId !=  null && classId != undefined && classType !=  null && classType != undefined){
                result = await dbOperations.executeQuery(mysqlQueries.checkBudgetExists,[tenantId,classType,classId], loggedUser, "addBudget", true, null, tenant, appLogger, meteringLogger, moduleName)
                if (result != undefined && result != null && result.length == 0) {
                    params = [tenantId,classType,classId,currencyCode,type,maxAmount,minAmount,loggedUserId,loggedUserId]
                    result = await dbOperations.executeQuery(mysqlQueries.addBudget,params, loggedUser, "addBudget", true, null, tenant, appLogger, meteringLogger, moduleName)
                    if (result != undefined && result != null && result.affectedRows > 0) {
                        appLogger.logMessage("info", "Successfully added budget.", "BudgetSupport", "addBudget", loggedUser, tenant, moduleName);
                        result = await responseHandler.sendResponse("Success", "Successfully added budget .", 200, null, false, "addBudget", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                    }else{
                        appLogger.logMessage("info", "Failed to add buget.", "BudgetSupport", "addBudget", loggedUser, tenant, moduleName);
                        result = await responseHandler.sendResponse("Warning", "Failed to add budget .", 400, null, false, "addBudget", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                    }
                }else{
                    appLogger.logMessage("info", "Budget already exists.", "BudgetSupport", "addBudget", loggedUser, tenant, moduleName);
                    result = await responseHandler.sendResponse("Warning", "Budget already exists.", 400, null, false, "addBudget", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                }
            }else{
                appLogger.logMessage("info", "Invalid params.", "BudgetSupport", "addBudget", loggedUser, tenant, moduleName);
            }        
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "BudgetSupport", "addBudget", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            result = await responseHandler.sendResponse("Error", "Error occured "+JSON.stringify(error), 500, null, false, "addBudget", tenant, loggedUser, moduleName,appLogger,meteringLogger);
            appLogger.logMessage("error", "Error occured in  addBudget" + error.message, "BudgetSupport", "addBudget", loggedUser, tenant, moduleName);
        }
        appLogger.logMessage("info", "addBudget function completed", "BudgetSupport", "addBudget", loggedUser, tenant, moduleName);
        return result;
    },
    
    updateMainTaskBudget: async function(maintaskId,tenantId,loggedUser,tenant,loggedUserId){
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let result,minAmount = 0;
        appLogger.logMessage("info", "update order of execution of task function begins", "BudgetSupport", "updateMainTaskBudget", loggedUser, tenant, moduleName);
        try {
            if(maintaskId !=  null && maintaskId != undefined){
                let mainTaskdata = await dbOperations.executeQuery(mysqlQueries.fetchMainTask,[maintaskId,'TASK',tenantId], loggedUser, "updateMainTaskBudget", true, null, tenant, appLogger, meteringLogger, moduleName)
                if (mainTaskdata != undefined && mainTaskdata != null && mainTaskdata.length > 0) {
                    result = await dbOperations.executeQuery(mysqlQueries.fetchSubTaskBudget,maintaskId, loggedUser, "updateMainTaskBudget", true, null, tenant, appLogger, meteringLogger, moduleName)
                    if (result != undefined && result != null && result.length > 0) {
                        let totalAmount = 0
                        for(data of result){
                           totalAmount += data.BUDGET_AMOUNT_MAX 
                        }
                        if(totalAmount > mainTaskdata[0].BUDGET_AMOUNT_MAX){
                            if(mainTaskdata[0].BUDGET_AMOUNT_MIN == 0){
                                minAmount = totalAmount
                            }else{
                                minAmount = mainTaskdata[0].BUDGET_AMOUNT_MIN
                            }
                        }else if(totalAmount > mainTaskdata[0].BUDGET_AMOUNT_MIN){
                            totalAmount = totalAmount
                        }else{
                            totalAmount = mainTaskdata[0].BUDGET_AMOUNT_MIN
                        }
                        result = await dbOperations.executeQuery(mysqlQueries.updateMainTaskBudget,[minAmount,totalAmount,loggedUserId,maintaskId,'TASK',tenantId], loggedUser, "updateMainTaskBudget", true, null, tenant, appLogger, meteringLogger, moduleName)
                        if (result != undefined && result != null && result.affectedRows > 0) {
                            appLogger.logMessage("info", "Successfully update budget of main task.", "BudgetSupport", "updateMainTaskBudget", loggedUser, tenant, moduleName);
                            result = await responseHandler.sendResponse("Success", "Successfully update budget of main task.", 200, result, true, "updateMainTaskBudget", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                        }else{
                            appLogger.logMessage("info", "Failed to  update budget of main task.", "BudgetSupport", "updateMainTaskBudget", loggedUser, tenant, moduleName);
                            result = await responseHandler.sendResponse("Warning", "Failed to add budget .", 400, result, true, "updateMainTaskBudget", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                        }
                    }                   
                }else{
                    appLogger.logMessage("info", "Failed to get sub task data.", "BudgetSupport", "updateMainTaskBudget", loggedUser, tenant, moduleName);
                    result = await responseHandler.sendResponse("Warning", "Failed to get sub task data .", 400, null, false, "updateMainTaskBudget", tenant, loggedUser, moduleName,appLogger,meteringLogger);
                }  
               
            }else{
                appLogger.logMessage("info", "Invalid params.", "BudgetSupport", "updateMainTaskBudget", loggedUser, tenant, moduleName);
            }        
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "BudgetSupport", "updateMainTaskBudget", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            result = await responseHandler.sendResponse("Error", "Error occured "+JSON.stringify(error), 500, null, false, "updateMainTaskBudget", tenant, loggedUser, moduleName,appLogger,meteringLogger);
            appLogger.logMessage("error", "Error occured in  updateMainTaskBudget" + error.message, "BudgetSupport", "updateMainTaskBudget", loggedUser, tenant, moduleName);
        }
        appLogger.logMessage("info", "updateMainTaskBudget function completed", "BudgetSupport", "updateMainTaskBudget", loggedUser, tenant, moduleName);
        return result;
    },

    updateBudgetOfGroup: async function (groupId, tenantId, loggedUserId, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let result
        appLogger.logMessage("info", "updateBudgetOfGroup function begins", "BudgetSupport", "updateBudgetOfGroup", loggedUser, tenant, moduleName);
        try {
            if (groupId != null && groupId != undefined) {
                result = await dbOperations.executeQuery(mysqlQueries.getSumOfMainTask, [groupId, tenantId], loggedUser, "getSumOfMainTask", false, null, tenant, appLogger, meteringLogger, moduleName)
                if (result != undefined && result != null && result.length > 0) {
                    params = [result[0].total_budget, result[0].total_budget, result[0].total_budget, result[0].total_budget, 
                    result[0].total_budget, result[0].total_budget, result[0].total_budget, result[0].total_budget,loggedUserId, groupId]
                    result = await dbOperations.executeQuery(mysqlQueries.updateBudgetOfGroup, params, loggedUser, "updateBudgetOfGroup", false, null, tenant, appLogger, meteringLogger, moduleName)
                    if (result != undefined && result != null && result.affectedRows > 0) {
                        appLogger.logMessage("info", "Successfully updated group budget.", "BudgetSupport", "updateBudgetOfGroup", loggedUser, tenant, moduleName);
                        result = await responseHandler.sendResponse("Success", "Successfully updated group budget.", 200, null, false, "updateBudgetOfGroup", tenant, loggedUser, moduleName, appLogger, meteringLogger);
                    } else {
                        appLogger.logMessage("info", "Failed to update group budget.", "BudgetSupport", "updateBudgetOfGroup", loggedUser, tenant, moduleName);
                        result = await responseHandler.sendResponse("Warning", "Failed to updat group budget.", 400, null, false, "updateBudgetOfGroup", tenant, loggedUser, moduleName, appLogger, meteringLogger);
                    }
                } else {
                    appLogger.logMessage("info", "Failed to update group budget.", "BudgetSupport", "updateBudgetOfGroup", loggedUser, tenant, moduleName);
                    result = await responseHandler.sendResponse("Warning", "Failed to updat group budget.", 400, null, false, "updateBudgetOfGroup", tenant, loggedUser, moduleName, appLogger, meteringLogger);
                }
            } else {
                appLogger.logMessage("info", "Invalid parameters.", "BudgetSupport", "updateBudgetOfGroup", loggedUser, tenant, moduleName);
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "BudgetSupport", "updateBudgetOfGroup", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            result = await responseHandler.sendResponse("Error", "Error occured " + JSON.stringify(error), 500, null, false, "updateBudgetOfGroup", tenant, loggedUser, moduleName, appLogger, meteringLogger);
            appLogger.logMessage("error", "Error occured in  updateBudgetOfGroup" + error.message, "BudgetSupport", "updateBudgetOfGroup", loggedUser, tenant, moduleName);
        }
        appLogger.logMessage("info", "updateBudgetOfGroup function completed", "BudgetSupport", "updateBudgetOfGroup", loggedUser, tenant, moduleName);
        return result;
    },
    updateBudgetOfProject: async function (projectId, tenantId, loggedUserId, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let result
        appLogger.logMessage("info", "updateBudgetOfProject function begins", "BudgetSupport", "updateBudgetOfProject", loggedUser, tenant, moduleName);
        try {
            if (projectId != null && projectId != undefined) {
                params = [projectId, tenantId, projectId, tenantId, projectId, tenantId, loggedUserId, projectId]
                result = await dbOperations.executeQuery(mysqlQueries.updateBudgetOfProject, params, loggedUser, "updateBudgetOfProject", false, null, tenant, appLogger, meteringLogger, moduleName)
                if (result != undefined && result != null && result.affectedRows > 0) {
                    appLogger.logMessage("info", "Successfully added budget.", "BudgetSupport", "updateBudgetOfProject", loggedUser, tenant, moduleName);
                    result = await responseHandler.sendResponse("Success", "Successfully added budget .", 200, null, false, "updateBudgetOfProject", tenant, loggedUser, moduleName, appLogger, meteringLogger);
                } else {
                    appLogger.logMessage("info", "Failed to add buget for.", "BudgetSupport", "updateBudgetOfProject", loggedUser, tenant, moduleName);
                    result = await responseHandler.sendResponse("Warning", "Failed to add budget .", 400, null, false, "updateBudgetOfProject", tenant, loggedUser, moduleName, appLogger, meteringLogger);
                }
            } else {
                appLogger.logMessage("info", "Invalid params.", "BudgetSupport", "updateBudgetOfProject", loggedUser, tenant, moduleName);
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "BudgetSupport", "updateBudgetOfProject", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            result = await responseHandler.sendResponse("Error", "Error occured " + JSON.stringify(error), 500, null, false, "updateBudgetOfProject", tenant, loggedUser, moduleName, appLogger, meteringLogger);
            appLogger.logMessage("error", "Error occured in  updateBudgetOfProject" + error.message, "BudgetSupport", "updateBudgetOfProject", loggedUser, tenant, moduleName);
        }
        appLogger.logMessage("info", "updateBudgetOfProject function completed", "BudgetSupport", "updateBudgetOfProject", loggedUser, tenant, moduleName);
        return result;
    },

    editBudget: async function (classId, classType, tenantId, currencyCode, type, maxAmount, minAmount, loggedUserId, loggedUser, tenant, isUpdate) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let result
        appLogger.logMessage("info", "editBudget function begins", "BudgetSupport", "editBudget", loggedUser, tenant, moduleName);
        try {
            currencyCode = (currencyCode === '' || currencyCode === 'null' || currencyCode === undefined || currencyCode === null) ? null : currencyCode;
            type = (type === '' || type === 'null' || type === undefined || type === null) ? null : type.toUpperCase();
            maxAmount = (maxAmount === '' || maxAmount === 'null' || maxAmount === undefined || maxAmount === null) ? 0 : maxAmount;
            minAmount = (minAmount === '' || minAmount === 'null' || minAmount === undefined || minAmount === null) ? 0 : minAmount;
            if (classId != null && classId != undefined && classType != null && classType != undefined) {
                result = await dbOperations.executeQuery(mysqlQueries.checkBudgetExists, [tenantId, classType, classId], loggedUser, "checkBudgetExists", true, null, tenant, appLogger, meteringLogger, moduleName)
                if (result != undefined && result != null && result.length > 0) {
                    params = [currencyCode, type, maxAmount, minAmount, loggedUserId, tenantId, classType, classId,]
                    let query = (!isUpdate) ? mysqlQueries.editBudget : mysqlQueries.updateExistBudget;
                    result = await dbOperations.executeQuery(query, params, loggedUser, "editBudget", false, null, tenant, appLogger, meteringLogger, moduleName)
                    if (result != undefined && result != null) {
                        appLogger.logMessage("info", "Successfully updated budget.", "BudgetSupport", "editBudget", loggedUser, tenant, moduleName);
                        result = await responseHandler.sendResponse("Success", "Successfully updated budget.", 200, null, false, "editBudget", tenant, loggedUser, moduleName, appLogger, meteringLogger);
                    } else {
                        appLogger.logMessage("info", "Failed to update buget for.", "BudgetSupport", "editBudget", loggedUser, tenant, moduleName);
                        result = await responseHandler.sendResponse("Warning", "Failed to update budget .", 400, null, false, "editBudget", tenant, loggedUser, moduleName, appLogger, meteringLogger);
                    }
                } else {
                    result = await this.addBudget(classId, classType, tenantId, currencyCode, type, maxAmount, minAmount, loggedUserId, loggedUser, tenant);
                }
            } else {
                appLogger.logMessage("info", "Invalid params.", "BudgetSupport", "editBudget", loggedUser, tenant, moduleName);
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "BudgetSupport", "editBudget", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            result = await responseHandler.sendResponse("Error", "Error occured " + JSON.stringify(error), 500, null, false, "editBudget", tenant, loggedUser, moduleName, appLogger, meteringLogger);
            appLogger.logMessage("error", "Error occured in  editBudget" + error.message, "BudgetSupport", "editBudget", loggedUser, tenant, moduleName);
        }
        appLogger.logMessage("info", "editBudget function completed", "BudgetSupport", "editBudget", loggedUser, tenant, moduleName);
        return result;
    },

    addClassBudget: async function (classId, classType, tenantId, currencyCode, type, maxAmount, minAmount, loggedUserId, loggedUser, tenant, mainTaskId, groupId, projectId) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let result
        appLogger.logMessage("info", "addClassBudget function begins", "BudgetSupport", "addClassBudget", loggedUser, tenant, moduleName);
        try {
            result = await this.addBudget(classId, classType, tenantId, currencyCode, type, maxAmount, minAmount, loggedUserId, loggedUser, tenant);
            if (result.type.toUpperCase() == "SUCCESS") {
                switch (classType) {
                    case "SUBTASK":
                        await this.addBudget(mainTaskId, "TASK", tenantId, currencyCode, type, 0, 0, loggedUserId, loggedUser, tenant);
                        await this.updateMainTaskBudget(mainTaskId, tenantId, loggedUser, tenant, loggedUserId)
                        await this.addBudget(groupId, "GROUP", tenantId, currencyCode, type, 0, 0, loggedUserId, loggedUser, tenant);
                        await this.updateBudgetOfGroup(groupId, tenantId, loggedUserId, loggedUser, tenant)
                        await this.addBudget(projectId, "PROJECT", tenantId, currencyCode, type, 0, 0, loggedUserId, loggedUser, tenant);
                        break;
                    case "TASK":
                        await this.addBudget(groupId, "GROUP", tenantId, currencyCode, type, 0, 0, loggedUserId, loggedUser, tenant);
                        await this.updateBudgetOfGroup(groupId, tenantId, loggedUserId, loggedUser, tenant)
                        await this.addBudget(projectId, "PROJECT", tenantId, currencyCode, type, 0, 0, loggedUserId, loggedUser, tenant);
                        break;
                    default:
                        await this.addBudget(projectId, "PROJECT", tenantId, currencyCode, type, 0, 0, loggedUserId, loggedUser, tenant);
                        break;
                }
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "BudgetSupport", "addClassBudget", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            result = await responseHandler.sendResponse("Error", "Error occured " + JSON.stringify(error), 500, null, false, "addClassBudget", tenant, loggedUser, moduleName, appLogger, meteringLogger);
            appLogger.logMessage("error", "Error occured in  addClassBudget" + error.message, "BudgetSupport", "addClassBudget", loggedUser, tenant, moduleName);
        }
        appLogger.logMessage("info", "addClassBudget function completed", "BudgetSupport", "addClassBudget", loggedUser, tenant, moduleName);
        return result;
    },
    editClassBudget: async function (classId, classType, tenantId, currencyCode, type, maxAmount, minAmount, loggedUserId, loggedUser, tenant, mainTaskId, groupId, projectId) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let result
        appLogger.logMessage("info", "editClassBudget function begins", "BudgetSupport", "editClassBudget", loggedUser, tenant, moduleName);
        try {
            result = await this.checkTotalAmount(classId, classType, maxAmount, tenantId, loggedUser, tenant);
            if (result.type.toUpperCase() == "SUCCESS") {
                result = await this.editBudget(classId, classType, tenantId, currencyCode, type, maxAmount, minAmount, loggedUserId, loggedUser, tenant,false);
                if (result.type.toUpperCase() == "SUCCESS") {
                    switch (classType) {
                        case "SUBTASK":
                            result = await this.editBudget(mainTaskId, "TASK", tenantId, currencyCode, type, 0, 0, loggedUserId, loggedUser, tenant,true);
                            if (result.type.toUpperCase() == "SUCCESS") {
                                await this.updateMainTaskBudget(mainTaskId, tenantId, loggedUser, tenant, loggedUserId)
                                result = await this.editBudget(groupId, "GROUP", tenantId, currencyCode, type, 0, 0, loggedUserId, loggedUser, tenant,true);
                                if (result.type.toUpperCase() == "SUCCESS") {
                                    await this.updateBudgetOfGroup(groupId, tenantId, loggedUserId, loggedUser, tenant)
                                    await this.editBudget(projectId, "PROJECT", tenantId, currencyCode, type, 0, 0, loggedUserId, loggedUser, tenant,true);
                                } else {
                                    result = await responseHandler.sendResponse("Warning", "Failed to add group budget .", 400, null, false, "editClassBudget", tenant, loggedUser, moduleName, appLogger, meteringLogger);
                                }
                            } else {
                                result = await responseHandler.sendResponse("Warning", "Failed to add main budget .", 400, null, false, "editClassBudget", tenant, loggedUser, moduleName, appLogger, meteringLogger);
                            }
                            break;
                        case "TASK":
                            result = await this.editBudget(groupId, "GROUP", tenantId, currencyCode, type, 0, 0, loggedUserId, loggedUser, tenant,true);
                            if (result.type.toUpperCase() == "SUCCESS") {
                                await this.updateBudgetOfGroup(groupId, tenantId, loggedUserId, loggedUser, tenant)
                                await this.editBudget(projectId, "PROJECT", tenantId, currencyCode, type, 0, 0, loggedUserId, loggedUser, tenant,true);
                            } else {
                                result = await responseHandler.sendResponse("Warning", "Failed to add group budget .", 400, null, false, "editClassBudget", tenant, loggedUser, moduleName, appLogger, meteringLogger);
                            }
                            break;
                        default:
                            await this.editBudget(projectId, "PROJECT", tenantId, currencyCode, type, 0, 0, loggedUserId, loggedUser, tenant,true);
                            break;
                    }
                }
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "BudgetSupport", "editClassBudget", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            result = await responseHandler.sendResponse("Error", "Error occured " + JSON.stringify(error), 500, null, false, "editClassBudget", tenant, loggedUser, moduleName, appLogger, meteringLogger);
            appLogger.logMessage("error", "Error occured in  editClassBudget" + error.message, "BudgetSupport", "addClassBudget", loggedUser, tenant, moduleName);
        }
        appLogger.logMessage("info", "editClassBudget function completed", "BudgetSupport", "editClassBudget", loggedUser, tenant, moduleName);
        return result;
    },
    addCurrency: async function (code, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let result
        appLogger.logMessage("info", "addCurrency function begins", "addCurrency", loggedUser, tenant, moduleName);
        try {
          if (code != null && code != undefined) {
            let unique = [...new Map(code.map(item =>
                [item['code'], item])).values()]
            param = []
            for(item of unique){
                param.push([item.code,item.currency,item.symbol])
            }
            result = await dbOperations.executeQuery(mysqlQueries.addCurrencyData, [param], loggedUser, "addCurrency", true, null, tenant, appLogger, meteringLogger, moduleName)
            if (result != undefined && result != null && result.affectedRows > 0) {
              appLogger.logMessage("info", "Successfully added currency.",  "addCurrency", loggedUser, tenant, moduleName);
              result = await responseHandler.sendResponse("Success", "Successfully added currency.", 200, result, true, "addCurrency", tenant, loggedUser, moduleName, appLogger, meteringLogger);
            } else {
              appLogger.logMessage("info", "Failed to added currency.",  "addCurrency", loggedUser, tenant, moduleName);
              result = await responseHandler.sendResponse("Warning", "Failed to added currency.", 400, null, false, "addCurrency", tenant, loggedUser, moduleName, appLogger, meteringLogger);
            }
          }else{
            appLogger.logMessage("info", "Invalid Params",  "addCurrency", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Warning", "Invalid params.", 400, null, false, "addCurrency", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          }    
          endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
          diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
          meteringLogger.logMessage(tenant, loggedUser,  "addCurrency", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
          result = await responseHandler.sendResponse("Error", "Error occured " + JSON.stringify(error), 500, null, false, "addCurrency", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          appLogger.logMessage("error", "Error occured in  addCurrency" + error.message,  "addCurrency", loggedUser, tenant, moduleName);
        }
        appLogger.logMessage("info", "addCurrency function completed",  "addCurrency", loggedUser, tenant, moduleName);
        return result;
      },
    checkTotalAmount: async function (classId, className, maxAmount, tenantId, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let result
        appLogger.logMessage("info", "checkTotalAmount function begins", "checkTotalAmount", loggedUser, tenant, moduleName);
        try {
            let msg = "";
            if (classId != null && classId != undefined && className != null && className != undefined) {
                if(className == "SUBTASK"){
                    result = await responseHandler.sendResponse("Success", "Successfully updated the budget.", 200, null, false, "checkTotalAmount", tenant, loggedUser, moduleName, appLogger, meteringLogger);
                }else{
                    let query = (className == "GROUP") ? mysqlQueries.checkGroupAmt : mysqlQueries.checkMainTaskAmt;
                    result = await dbOperations.executeQuery(query, [classId,tenantId,classId,tenantId], loggedUser, "checkTotalAmount", false, null, tenant, appLogger, meteringLogger, moduleName)
                    if (result != undefined && result != null && result.length > 0) {
                        let totalAmt = (result[0].TOTAL_AMT != null)? result[0].TOTAL_AMT : 0;
                        if(totalAmt <= Number(maxAmount)){
                            appLogger.logMessage("info", "Successfully updated the budget.", "BudgetSupport", "checkTotalAmount", loggedUser, tenant, moduleName);
                            result = await responseHandler.sendResponse("Success", "Successfully updated the budget.", 200, null, false, "checkTotalAmount", tenant, loggedUser, moduleName, appLogger, meteringLogger);
                        }else{
                            msg = (className == "GROUP") ? "Failed to update group budget as total budget of task is greater than given amount." : "Failed to update task budget as total budget of sub task is greater than given amount."
                            appLogger.logMessage("info", "Failed to update budget data due to total amount is higher.", "BudgetSupport", "checkTotalAmount", loggedUser, tenant, moduleName);
                            result = await responseHandler.sendResponse("Warning", msg, 400, null, false, "checkTotalAmount", tenant, loggedUser, moduleName, appLogger, meteringLogger);
                        }
                    } else {
                        appLogger.logMessage("info", "Successfully updated the budget.", "BudgetSupport", "checkTotalAmount", loggedUser, tenant, moduleName);
                        result = await responseHandler.sendResponse("Success", "Successfully updated the budget.", 200, null, false, "checkTotalAmount", tenant, loggedUser, moduleName, appLogger, meteringLogger);
                    }
                }
            } else {
                appLogger.logMessage("info", "Invalid Params", "checkTotalAmount", loggedUser, tenant, moduleName);
                result = await responseHandler.sendResponse("Warning", "Invalid params.", 400, null, false, "checkTotalAmount", tenant, loggedUser, moduleName, appLogger, meteringLogger);
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "checkTotalAmount", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            result = await responseHandler.sendResponse("Error", "Error occured " + JSON.stringify(error), 500, null, false, "checkTotalAmount", tenant, loggedUser, moduleName, appLogger, meteringLogger);
            appLogger.logMessage("error", "Error occured in  checkTotalAmount" + error.message, "checkTotalAmount", loggedUser, tenant, moduleName);
        }
        appLogger.logMessage("info", "checkTotalAmount function completed", "checkTotalAmount", loggedUser, tenant, moduleName);
        return result;
    },


    addToMasterTable: async function (param, action, loggedUser, tenant, loggedUserId) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let result
        appLogger.logMessage("info", "addToMasterTable function begins", "addToMasterTable", loggedUser, tenant, moduleName);
        try {
            if (action == 'ADD') {
                let query = mysqlQueries.addLExpToMasterTable;
                result = await dbOperations.executeQuery(query, [param], loggedUser, "addLExpToMasterTable", false, null, tenant, appLogger, meteringLogger, moduleName)
            } else if (action == 'EDIT') {
                let query = mysqlQueries.editLExpToMasterTable;
                let today = new Date()
                let parameter = [moment(today).format('YYYY-MM-DD'),loggedUserId, param.id]
                result = await dbOperations.executeQuery(query, parameter, loggedUser, "addLExpToMasterTable", false, null, tenant, appLogger, meteringLogger, moduleName)
                if (result != undefined && result != null && result != 'error') {
                    if (result.affectedRows > 0) {
                        let params = [param.tenantId,param.projectId,param.worker, param.type, param.uom, param.rate, loggedUserId, loggedUserId]
                        result = await dbOperations.executeQuery(mysqlQueries.addLExpToMasterTable, [[params]], loggedUser, "addLExpToMasterTable", false, null, tenant, appLogger, meteringLogger, moduleName)
                    } else {
                        appLogger.logMessage("info", "Something went wrong while adding labour expense to master table.", "BudgetService", "addLExpToMasterTable", loggedUser, tenant, moduleName);
                        result = await responseHandler.sendResponse("Warning", "Something went wrong while adding labour expense to master table.", 400, null, false, "addLExpToMasterTable", tenant, loggedUser, moduleName, appLogger, meteringLogger);
                    }
                }
            }
            if (result != undefined && result != null && result != 'error') {
                if (result.affectedRows > 0) {
                    appLogger.logMessage("info", "Labour expense added successfully to master table.", "BudgetService", "addLExpToMasterTable", loggedUser, tenant, moduleName);
                    result = await responseHandler.sendResponse("Success", "Labour expense added successfully to master table", 200, null, false, "addLExpToMasterTable", tenant, loggedUser, moduleName, appLogger, meteringLogger);
                } else {
                    appLogger.logMessage("info", "Something went wrong while adding labour expense to master table.", "BudgetService", "addLExpToMasterTable", loggedUser, tenant, moduleName);
                    result = await responseHandler.sendResponse("Warning", "Something went wrong while adding labour expense to master table.", 400, null, false, "addLExpToMasterTable", tenant, loggedUser, moduleName, appLogger, meteringLogger);
                }
            } else {
                appLogger.logMessage("info", "Failed to add labour expense to master table.", "BudgetService", "addLExpToMasterTable", loggedUser, tenant, moduleName);
                result = await responseHandler.sendResponse("Warning", "Failed to add labour expense to master table. ", 400, null, false, "addLExpToMasterTable", tenant, loggedUser, moduleName, appLogger, meteringLogger);
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "addToMasterTable", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            result = await responseHandler.sendResponse("Error", "Error occured " + JSON.stringify(error), 500, null, false, "addToMasterTable", tenant, loggedUser, moduleName, appLogger, meteringLogger);
            appLogger.logMessage("error", "Error occured in  addToMasterTable" + error.message, "addToMasterTable", loggedUser, tenant, moduleName);
        }
        appLogger.logMessage("info", "addToMasterTable function completed", "addToMasterTable", loggedUser, tenant, moduleName);
        return result;
    },

    // categorize the task into zones based on budget and timeline against progress of completion 
    categorizeTaskZone: async function (threshold, loggedUser, tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let taskZone;
        appLogger.logMessage("info", "Function Initiated with threshold "+threshold, "BudgetSupport", "categorizeTaskZone", loggedUser, tenant, moduleName);
        try {
            switch (true) {
                case threshold <= 0  :
                    taskZone = "Green";
                    break;
                case threshold > 0 && threshold <=25 :
                    taskZone = "Yellow";
                    break;
                case threshold >25 && threshold <=75 :
                    taskZone = "Red";
                    break;
                case threshold >75   :
                    taskZone = "Black";
                    break;
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, "categorizeTaskZone", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            result = await responseHandler.sendResponse("Error", "Error occured while executing the function and the error is " + JSON.stringify(error), 500, null, false, "categorizeTaskZone", tenant, loggedUser, moduleName, appLogger, meteringLogger);
            appLogger.logMessage("error", "Error occured while executing the function and the error is " + error.message, "categorizeTaskZone", loggedUser, tenant, moduleName);
        }
        appLogger.logMessage("info", "Function completed.", "BudgetSupport", "categorizeTaskZone", loggedUser, tenant, moduleName);
        return taskZone;
    }
}