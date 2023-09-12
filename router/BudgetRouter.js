'use strict';
let Router = require('restify-router').Router;
const router = new Router();
let restify = require('restify');
const appLogger = require('../logger/Logger').applicationLogger;
const meteringLogger = require('../logger/Logger').meteringLogger;
router.use(restify.plugins.bodyParser());
router.use(restify.plugins.queryParser());
const moment = require('moment');
let responseHandler = require('../../common/main/ResponseHandler');
const authHandler = require('../../common/main/AuthenticationHandler');
const BudgetService = require('../services/BudgetService');
let  BudgetSupport = require('../services/BudgetSupport')
const validationHandler = require("../../common/main/ValidationHandler")
let startDateTime;
let endDateTime;
let diffInMS;
let moduleName='PM'
router.use(function (req, res, next) {
    return next();
});

router.post('/getAllCurrency', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getAllCurrency','BudgetRouter',moduleName,appLogger,meteringLogger,tenant,loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getAllCurrency",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudgetRouter', '/getAllCurrency', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await BudgetService.getAllCurrency(loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }); 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudgetRouter", "getAllCurrency", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudgetRouter", "getAllCurrency", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "BudgetRouter", "getAllCurrency", loggedUser, tenant, moduleName);
}),

//COUNT  OF  TASKS  BY PROJECT FOR WIDGET 
router.post('/UpdateMainTaskBudget', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'updateMainTaskBudgegt','BudgetRouter',moduleName,appLogger,meteringLogger,tenant,loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"UpdateMainTaskBudget",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/UpdateMainTaskBudget', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await BudgetSupport.updateMainTaskBudget(req.body.mainTaskId,tenantId,loggedUser,tenant,loggedUserId);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "UpdateMainTaskBudget", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "UpdateMainTaskBudget", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "UpdateMainTaskBudget Api call finished and result is returned.", "PMSRouter", "UpdateMainTaskBudget", loggedUser, tenant, moduleName);
})

router.post('/updateGroupBudget', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'updateGroupBudget','BudgetRouter',moduleName,appLogger,meteringLogger,tenant,loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"updateGroupBudget",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudgetRouter', '/updateGroupBudget', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await BudgetSupport.updateBudgetOfGroup(req.body.groupId, req.body.tenantId, req.body.loggedUserId, req.body.loggedUser, req.body.tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }); 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudgetRouter", "updateGroupBudget", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudgetRouter", "updateGroupBudget", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "BudgetRouter", "updateGroupBudget", loggedUser, tenant, moduleName);
})

router.post('/updateProjectBudget', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'updateProjectBudget','BudgetRouter',moduleName,appLogger,meteringLogger,tenant,loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"updateProjectBudget",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudgetRouter', '/updateProjectBudget', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await BudgetSupport.updateBudgetOfProject(req.body.projectId, req.body.tenantId, req.body.loggedUserId, req.body.loggedUser, req.body.tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }); 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudgetRouter", "updateProjectBudget", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudgetRouter", "updateProjectBudget", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "BudgetRouter", "updateProjectBudget", loggedUser, tenant, moduleName);
})

router.post('/addBudget', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'addBudget','BudgetRouter',moduleName,appLogger,meteringLogger,tenant,loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addBudget",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudgetRouter', '/addBudget', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            // const result = await BudgetSupport.addBudget(req.body.classId, req.body.classType, req.body.tenantId, req.body.currencyCode, req.body.type, req.body.maxAmount, req.body.minAmount, req.body.loggedUserId, req.body.loggedUser, req.body.tenant);
            const result = await BudgetSupport.editClassBudget(req.body.classId, req.body.classType, req.body.tenantId, req.body.currencyCode, req.body.type, req.body.maxAmount, req.body.minAmount, req.body.loggedUserId, req.body.loggedUser, req.body.tenant, req.body.mainTaskId, req.body.groupId, req.body.projectId );
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }); 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudgetRouter", "addBudget", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudgetRouter", "addBudget", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "BudgetRouter", "addBudget", loggedUser, tenant, moduleName);
})

router.post('/editBudget', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'editBudget','BudgetRouter',moduleName,appLogger,meteringLogger,tenant,loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"editBudget",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudgetRouter', '/editBudget', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await BudgetSupport.editBudget(req.body.classId, req.body.classType, req.body.tenantId, req.body.currencyCode, req.body.type, req.body.maxAmount, req.body.minAmount, req.body.loggedUserId, req.body.loggedUser, req.body.tenant,false);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }); 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudgetRouter", "editBudget", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudgetRouter", "editBudget", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "BudgetRouter", "editBudget", loggedUser, tenant, moduleName);
})

router.post('/addClassBudget', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'addClassBudget','BudgetRouter',moduleName,appLogger,meteringLogger,tenant,loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addClassBudget",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudgetRouter', '/addClassBudget', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await BudgetSupport.addClassBudget(req.body.classId, req.body.classType, req.body.tenantId, req.body.currencyCode, req.body.type, req.body.maxAmount, req.body.minAmount, req.body.loggedUserId, req.body.loggedUser, req.body.tenant, req.body.mainTaskId, req.body.groupId, req.body.projectId);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }); 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudgetRouter", "addClassBudget", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudgetRouter", "addClassBudget", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "BudgetRouter", "addClassBudget", loggedUser, tenant, moduleName);
})

router.post('/editClassBudget', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getAllCurrency','editClassBudget',moduleName,appLogger,meteringLogger,tenant,loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"editClassBudget",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudgetRouter', '/editClassBudget', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await BudgetSupport.editClassBudget(req.body.classId, req.body.classType, req.body.tenantId, req.body.currencyCode, req.body.type, req.body.maxAmount, req.body.minAmount, req.body.loggedUserId, req.body.loggedUser, req.body.tenant, req.body.mainTaskId, req.body.groupId, req.body.projectId );
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }); 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudgetRouter", "editClassBudget", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudgetRouter", "editClassBudget", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "BudgetRouter", "editClassBudget", loggedUser, tenant, moduleName);
}),


router.post('/getCurrency', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getCurrency','BudgetRouter',moduleName,appLogger,meteringLogger,tenant,loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getCurrency",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudgetRouter', '/getCurrency', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await BudgetService.getCurrency(loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }); 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudgetRouter", "getCurrency", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudgetRouter", "getCurrency", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "BudgetRouter", "getCurrency", loggedUser, tenant, moduleName);
}),
router.post('/addCurrency', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'addCurrency','BudgetRouter',moduleName,appLogger,meteringLogger,tenant,loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addCurrency",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudgetRouter', '/addCurrency', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await BudgetService.addCurrency(req.body,loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }); 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudgetRouter", "addCurrency", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudgetRouter", "addCurrency", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "BudgetRouter", "addCurrency", loggedUser, tenant, moduleName);
}),

router.post('/getBalanceAmtOfProject', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getBalanceAmtOfProject','BudgetRouter',moduleName,appLogger,meteringLogger,tenant,loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getBalanceAmtOfProject",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudgetRouter', '/getBalanceAmtOfProject', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await BudgetService.getBalanceAmtOfProject(req.body.projectId, tenantId, loggedUser, tenant );
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }); 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudgetRouter", "editClassBudget", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudgetRouter", "editClassBudget", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "BudgetRouter", "editClassBudget", loggedUser, tenant, moduleName);
})



//GET MAIN TASKS EXPENSE
router.post('/getMainTaskExpense', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let token = req.body.token;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:"Get main tasks expense successfully ",
        data:[],
        statusCode:200
    }
    try {
        await validationHandler.validatePayload(req.body,'getMainTaskExpense','BudegtRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getMainTaskExpense",appLogger,meteringLogger);
        appLogger.logMessage("info", "getMainTaskExpense  started", "TSMServices", "getMainTaskExpense", loggedUser,tenant,moduleName);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'TMSRouter', '/getMainTaskExpense', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await BudgetService.getMainTaskExpense(req, loggedUser, tenant);
        } else {
            out = { type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }; 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "TMSRouter", "getMainTaskExpense", startDateTime, endDateTime, diffInMS,moduleName);
    } catch (e) {
        out.status="Failure"
        out.message="Failed to fetch  task "
        out.data=JSON.stringify(e.message);
        out.statusCode=500
        appLogger.logMessage("error", e.message, "TMSRouter", "getMainTaskExpense", loggedUser, tenant,moduleName);
        
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"TSMRouter",tenant,loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);

})
//GET SUB TASKS EXPENSE
router.post('/getSubTaskExpense', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let token = req.body.token;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:"Get sub  tasks successfully ",
        data:[],
        statusCode:200
    }
    try {
        await validationHandler.validatePayload(req.body,'getSubTaskExpense','BudegtRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getSubTaskExpense",appLogger,meteringLogger);
        appLogger.logMessage("info", "getSubTaskExpense  started", "TSMServices", "getSubTaskExpense", loggedUser,tenant,moduleName);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'TMSRouter', '/getSubTaskExpense', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await BudgetService.getSubTaskExpense(req, loggedUser, tenant);
        } else {
            out = { type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }; 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "TMSRouter", "getSubTaskExpense", startDateTime, endDateTime, diffInMS,moduleName);
    } catch (e) {
        out.status="Failure"
        out.message="Failed to fetch  sub task "
        out.data=JSON.stringify(e.message);
        out.statusCode=500
        appLogger.logMessage("error", e.message, "TMSRouter", "getSubTaskExpense", loggedUser, tenant,moduleName);
        
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"TSMRouter",tenant,loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
})

// EDIT NEW EXPENSES FOR TASKS UNDER A PROJECT IN A TENANT
router.post('/editExpenditure', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'editExpenditure','BudegtRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"editExpenditure",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudegtRouter', '/editExpenditure', tenantId, tenant,appLogger,meteringLogger,moduleName)
        auth[0].isSuccess = true;
        if (auth[0].isSuccess) {
            const result = await BudgetService.editExpenditure(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudegtRouter", "editExpenditure", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudegtRouter", "editExpenditure", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "editExpenditure Api call finished and result is returned.", "BudegtRouter", "editExpenditure", loggedUser, tenant, moduleName);
})

// DELETE NEW EXPENSES FOR TASKS UNDER A PROJECT IN A TENANT
router.post('/deleteExpenditure', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'deleteExpenditure','BudegtRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"deleteExpenditure",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudegtRouter', '/deleteExpenditure', tenantId, tenant,appLogger,meteringLogger,moduleName)
        auth[0].isSuccess = true;
        if (auth[0].isSuccess) {
            const result = await BudgetService.deleteExpenditure(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudegtRouter", "deleteExpenditure", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudegtRouter", "deleteExpenditure", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "deleteExpenditure Api call finished and result is returned.", "BudegtRouter", "deleteExpenditure", loggedUser, tenant, moduleName);
})

// ADD PAYMENT FOR EXPENSE
router.post('/addPayment', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'addPayment','BudegtRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addPayment",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudegtRouter', '/addPayment', tenantId, tenant,appLogger,meteringLogger,moduleName)
        auth[0].isSuccess = true;
        if (auth[0].isSuccess) {
            const result = await BudgetService.addPayment(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudegtRouter", "addPayment", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudegtRouter", "addPayment", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "addPayment Api call finished and result is returned.", "BudegtRouter", "addPayment", loggedUser, tenant, moduleName);
})

// EDIT PAYMENT FOR EXPENSE
router.post('/editPayment', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let jtoken = req.headers.authorization?.split(" ")[1]

    try {
        await validationHandler.validatePayload(req.body,'editPayment','BudegtRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"editPayment",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudegtRouter', '/editPayment', tenantId, tenant,appLogger,meteringLogger,moduleName)
        auth[0].isSuccess = true;
        if (auth[0].isSuccess) {
            const result = await BudgetService.editPayment(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudegtRouter", "editPayment", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudegtRouter", "editPayment", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "editPayment Api call finished and result is returned.", "BudegtRouter", "editPayment", loggedUser, tenant, moduleName);
})

// DELETE PAYMENT FOR EXPENSE
router.post('/deletePayment', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let jtoken = req.headers.authorization?.split(" ")[1]

    try {
        await validationHandler.validatePayload(req.body,'deletePayment','BudegtRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"deletePayment",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudegtRouter', '/deletePayment', tenantId, tenant,appLogger,meteringLogger,moduleName)
        auth[0].isSuccess = true;
        if (auth[0].isSuccess) {
            const result = await BudgetService.deletePayment(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudegtRouter", "deletePayment", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudegtRouter", "deletePayment", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "deletePayment Api call finished and result is returned.", "BudegtRouter", "deletePayment", loggedUser, tenant, moduleName);
})

// FETCH PAYMENT FOR EXPENSE
router.post('/fetchPayment', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let jtoken = req.headers.authorization?.split(" ")[1]

    try {
        await validationHandler.validatePayload(req.body,'fetchPayment','BudegtRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"fetchPayment",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudegtRouter', '/fetchPayment', tenantId, tenant,appLogger,meteringLogger,moduleName)
        auth[0].isSuccess = true;
        if (auth[0].isSuccess) {
            const result = await BudgetService.fetchPayment(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudegtRouter", "fetchPayment", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudegtRouter", "fetchPayment", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "fetchPayment Api call finished and result is returned.", "BudegtRouter", "fetchPayment", loggedUser, tenant, moduleName);
})
// FETCH PAYMENT FOR EXPENSE
router.post('/closeSettlement', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let jtoken = req.headers.authorization?.split(" ")[1]

    try {
        await validationHandler.validatePayload(req.body,'closeSettlement','BudegtRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"closeSettlement",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudegtRouter', '/closeSettlement', tenantId, tenant,appLogger,meteringLogger,moduleName)
        auth[0].isSuccess = true;
        if (auth[0].isSuccess) {
            const result = await BudgetService.closeSettlement(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudegtRouter", "closeSettlement", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudegtRouter", "closeSettlement", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "closeSettlement Api call finished and result is returned.", "BudegtRouter", "closeSettlement", loggedUser, tenant, moduleName);
})

router.post('/addLabourExpense', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let jtoken = req.headers.authorization?.split(" ")[1]

    try {
        await validationHandler.validatePayload(req.body,'addLabourExpense','BudegtRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addLabourExpense",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudegtRouter', '/addLabourExpense', tenantId, tenant,appLogger,meteringLogger,moduleName)
        auth[0].isSuccess = true;
        if (auth[0].isSuccess) {
            const result = await BudgetService.addLabourExpense(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudegtRouter", "addLabourExpense", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudegtRouter", "addLabourExpense", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "addLabourExpense Api call finished and result is returned.", "BudegtRouter", "addLabourExpense", loggedUser, tenant, moduleName);
})

router.post('/editLabourExpense', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let jtoken = req.headers.authorization?.split(" ")[1]

    try {
        await validationHandler.validatePayload(req.body,'editLabourExpense','BudegtRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"editLabourExpense",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudegtRouter', '/editLabourExpense', tenantId, tenant,appLogger,meteringLogger,moduleName)
        auth[0].isSuccess = true;
        if (auth[0].isSuccess) {
            const result = await BudgetService.editLabourExpense(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudegtRouter", "editLabourExpense", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudegtRouter", "editLabourExpense", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "editLabourExpense Api call finished and result is returned.", "BudegtRouter", "editLabourExpense", loggedUser, tenant, moduleName);
})

router.post('/fetchLabourExpense', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    try {
        await validationHandler.validatePayload(req.body,'fetchLabourExpense','BudegtRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"fetchLabourExpense",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, token, loggedUser, 'BudegtRouter', '/fetchLabourExpense', tenantId, tenant,appLogger,meteringLogger,moduleName)
        auth[0].isSuccess = true;
        if (auth[0].isSuccess) {
            const result = await BudgetService.fetchLabourExpense(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudegtRouter", "fetchLabourExpense", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudegtRouter", "fetchLabourExpense", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "fetchLabourExpense Api call finished and result is returned.", "BudegtRouter", "fetchLabourExpense", loggedUser, tenant, moduleName);
})

router.post('/addLExpToMasterTable', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let jtoken = req.headers.authorization?.split(" ")[1]

    try {
        await validationHandler.validatePayload(req.body,'addLExpToMasterTable','BudegtRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addLExpToMasterTable",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudegtRouter', '/addLExpToMasterTable', tenantId, tenant,appLogger,meteringLogger,moduleName)
        auth[0].isSuccess = true;
        if (auth[0].isSuccess) {
            const result = await BudgetService.addLExpToMasterTable(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudegtRouter", "addLExpToMasterTable", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudegtRouter", "addLExpToMasterTable", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "addLExpToMasterTable Api call finished and result is returned.", "BudegtRouter", "addLExpToMasterTable", loggedUser, tenant, moduleName);
})

router.post('/editLExpToMasterTable', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let jtoken = req.headers.authorization?.split(" ")[1]

    try {
        await validationHandler.validatePayload(req.body,'editLExpToMasterTable','BudegtRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"editLExpToMasterTable",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudegtRouter', '/editLExpToMasterTable', tenantId, tenant,appLogger,meteringLogger,moduleName)
        auth[0].isSuccess = true;
        if (auth[0].isSuccess) {
            const result = await BudgetService.editLExpToMasterTable(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudegtRouter", "editLExpToMasterTable", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudegtRouter", "editLExpToMasterTable", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "editLExpToMasterTable Api call finished and result is returned.", "BudegtRouter", "editLExpToMasterTable", loggedUser, tenant, moduleName);
})

router.post('/fetchLExpFromMasterTable', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let jtoken = req.headers.authorization?.split(" ")[1]

    try {
        await validationHandler.validatePayload(req.body,'fetchLExpFromMasterTable','BudegtRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"fetchLExpFromMasterTable",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudegtRouter', '/fetchLExpFromMasterTable', tenantId, tenant,appLogger,meteringLogger,moduleName)
        auth[0].isSuccess = true;
        if (auth[0].isSuccess) {
            const result = await BudgetService.fetchLExpFromMasterTable(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudegtRouter", "fetchLExpFromMasterTable", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudegtRouter", "fetchLExpFromMasterTable", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "fetchLExpFromMasterTable Api call finished and result is returned.", "BudegtRouter", "fetchLExpFromMasterTable", loggedUser, tenant, moduleName);
})

router.post('/fetchLExpType', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let jtoken = req.headers.authorization?.split(" ")[1]

    try {
        await validationHandler.validatePayload(req.body,'fetchLExpType','BudegtRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"fetchLExpType",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudegtRouter', '/fetchLExpType', tenantId, tenant,appLogger,meteringLogger,moduleName)
        auth[0].isSuccess = true;
        if (auth[0].isSuccess) {
            const result = await BudgetService.fetchLExpType(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudegtRouter", "fetchLExpType", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudegtRouter", "fetchLExpType", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "fetchLExpType Api call finished and result is returned.", "BudegtRouter", "fetchLExpType", loggedUser, tenant, moduleName);
})

router.post('/getExpData', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getExpData','BudegtRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getExpData",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudegtRouter', '/getExpData', tenantId, tenant,appLogger,meteringLogger,moduleName)
        auth[0].isSuccess = true;
        if (auth[0].isSuccess) {
            const result = await BudgetService.getExpData(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudegtRouter", "getExpData", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudegtRouter", "getExpData", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getExpData Api call finished and result is returned.", "BudegtRouter", "getExpData", loggedUser, tenant, moduleName);
})

router.post('/getTimelineTaskZones', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getTimelineTaskZones','BudgetRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getTimelineTaskZones",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudgetRouter', '/getTimelineTaskZones', tenantId, tenant,appLogger,meteringLogger,moduleName)
        auth[0].isSuccess = true;
        if (auth[0].isSuccess) {
            const result = await BudgetService.getTimelineTaskZones(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudgetRouter", "getTimelineTaskZones", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudgetRouter", "getTimelineTaskZones", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "BudgetRouter", "getTimelineTaskZones", loggedUser, tenant, moduleName);
})

router.post('/getBudgetTaskZones', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getBudgetTaskZones','BudgetRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getBudgetTaskZones",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudgetRouter', '/getBudgetTaskZones', tenantId, tenant,appLogger,meteringLogger,moduleName)
        auth[0].isSuccess = true;
        if (auth[0].isSuccess) {
            const result = await BudgetService.getBudgetTaskZones(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudgetRouter", "getBudgetTaskZones", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudgetRouter", "getBudgetTaskZones", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "BudgetRouter", "getBudgetTaskZones", loggedUser, tenant, moduleName);
})

router.post('/getCostChart', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getCostChart','BudgetRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getCostChart",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'BudgetRouter', '/getCostChart', tenantId, tenant,appLogger,meteringLogger,moduleName)
        auth[0].isSuccess = true;
        if (auth[0].isSuccess) {
            const result = await BudgetService.getCostChart(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "BudgetRouter", "getCostChart", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "BudgetRouter", "getCostChart", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "BudgetRouter", "getCostChart", loggedUser, tenant, moduleName);
})

module.exports = router;