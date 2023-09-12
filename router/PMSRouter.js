/*
 * @Author: Prince E J 
 * @Date: 2022-10-25 13:45:00 
 */
'use strict';
let Router = require('restify-router').Router;
const router = new Router();
let restify = require('restify');
const appLogger = require('../logger/Logger').applicationLogger;
const meteringLogger = require('../logger/Logger').meteringLogger;
router.use(restify.plugins.bodyParser());
router.use(restify.plugins.queryParser());
const moment = require('moment');
let projectHandler = require('../services/PMSServices');
let responseHandler = require('../../common/main/ResponseHandler');
const authHandler = require('../../common/main/AuthenticationHandler');
const validationHandler = require('../../common/main/ValidationHandler');
const { rejections } = require('winston');
let startDateTime;
let endDateTime;
let diffInMS;
let moduleName='PM'
router.use(function (req, res, next) {
    return next();
});

router.post('/createProject', async function (req, res) {
    appLogger.logMessage("debug", "/createProject api called", "Router", "createProject", "SELF",moduleName);
    let email = req.body.loggedUser;
    let token=req.body.token;
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status: "Success",
        message: "Successfully created new project",
        statusCode:200,
        data: []
    }
    if (email) {
        try {
            await authHandler.insertAuditLog(req.body.tenantId,req.body.tenant,req.body.loggedUser,moduleName,"createProject",appLogger,meteringLogger);
            let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, email, 'PMRouter', '/createProject', req.body.tenantId, req.body.tenant,appLogger,meteringLogger,moduleName)
            if (auth[0].isSuccess) {
                out = await projectHandler.createProject(req);
                
            } else {
                out={ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
            }
        } catch (error) {
            appLogger.logMessage("error", "Failed to create project due to: " + JSON.stringify(error.message), "Router.js", "createProject", email,moduleName);
            out.status = "Failed";
            out.message = "Internal server error";
            out.statusCode = 500;
        }
    } else {
        appLogger.logMessage("error", "Failed to create new project due to invalid email", "Router.js", "createNewProject", "PROJECTMANAGER",moduleName);
        out.status = "Failed";
        out.message = "Missing parameter(email)";
        out.statusCode = 400;
    }
    out = await responseHandler.sendResponse(out.status,out.message,200,out.data,false,"createProject",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
})

//VIEW PROJECTS by Project Manager
router.post('/viewProjectsByManager', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "/viewProjectsByManager api called", "Router", "viewProjectsByManager", "SELF",moduleName);
    let token = req.body.token
    let jtoken = req.headers.authorization?.split(" ")[1]
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    try {
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"viewProjectsByManager",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/viewProjectsByManager', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.viewProjectsByManager(req, loggedUser, tenant);
            if(result.data.length>0){
                for(let project of result.data){
                    await projectHandler.getProjectTeam(project,project.ID,req.body.loggedUser,req.body.tenant);
                    await projectHandler.populateTeamImage(project,req.body.tenantType,loggedUser,tenant);
                }
            }
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "viewProjectsByManager", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "viewProjectsByManager", loggedUser, tenant,moduleName);
        res.json({ type: 'Failure', message: e.message, statusCode: 500 });
    }
})


router.post('/viewProjectsByEmployee',async(req,res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "/viewProjectsByEmployee api called", "PMSRouter", "viewProjectsByManager",req.body.loggedUser,req.body.tenant,moduleName);

    //appLogger.logMessage("info", "/viewProjectsByEmployee api called", "PMSRouter", "viewProjectsByEmployee", "SELF",moduleName);
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"viewProjectsByEmployee",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/viewProjectsByEmployee', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.viewProjectsByEmployee(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "viewProjectsByEmployee", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "viewProjectsByEmployee", loggedUser, tenant,moduleName);
        res.json({ type: 'Failure', message: e.message, statusCode: 500 });
    }
})

router.post('/reassignTask',async(req,res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "/reassignTask api called", "Router", "viewProjectsByEmployee", "SELF",moduleName);
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out= {
        status:"Success",
        message:"Successfully reassigned the task",
        statusCode:200,
        data: []
    }
    try {
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"reassignTask",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/reassignTask', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess || req.body.isFromWhatsApp) {
            const result = await projectHandler.reassignTask(req);
            out = await responseHandler.sendResponse(result.status,result.message,result.statusCode,result.data,false,"reassignTask",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
        } else {
            out = { type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "reassignTask", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "reassignTask", loggedUser, tenant,moduleName);
        out = { type: 'Failure', message: e.message, statusCode: 500 };
    }
    res.send(out);
})


//VIEW ALL TASKS IN A PROJECT
router.post('/viewTasks', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'viewTasks','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"viewTasks",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/viewTasks', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.viewTasks(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "viewTasks", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "viewTasks", loggedUser, tenant,moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
})
//VIEW DETAILS OF  A PARTICULAR TASK
router.post('/viewTaskDetails', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'viewTaskDetails','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"viewTaskDetails",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/viewTaskDetails', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.viewTaskDetails(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "viewTaskDetails", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "viewTaskDetails", loggedUser, tenant,moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
})
router.post('/getProjectDetails',async function(req,res){
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:"Successfully fetched project details",
        statusCode:200,
        data:{}
    }
    try {
        await validationHandler.validatePayload(req.body,'getprojectDetails','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(req.body.tenantId,req.body.tenant,req.body.loggedUser,moduleName,"getProjectDetails",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, req.body.loggedUser, 'PMRouter', '/getProjectDetails', req.body.tenantId, req.body.tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.getProjectDetails(req);
        } else {
            out={ status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(req.body.tenant, req.body.loggedUser, "PMRouter", "viewTaskDetails", startDateTime, endDateTime, diffInMS,moduleName);

    } catch (error) {
        appLogger.logMessage("error","Failed to fetch project details due to: "+JSON.stringify(error.message),"PMRouter","getProjectDetails",req.body.loggedUser,req.body.tenant,moduleName);
        out.status = "Failed";
        out.message = "Internal server error";
        out.statusCode = 500;
    }
    out =await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"getProjectDetails",req.body.tenant,moduleName,req.body.loggedUser,appLogger,meteringLogger);
    res.send(out);
})

//DELETE TASK IN A PROJECT
router.post('/deleteTask', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'deleteTask','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"deleteTask",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/deleteTask', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.deleteTask(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "deleteTask", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "deleteTask", loggedUser, tenant,moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
})

//UPADTE TASK IN A PROJECT
router.post('/updateTask', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'updateTasks','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"updateTask",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/updateTask', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.updateTask(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "updateTask", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "updateTask", loggedUser, tenant,moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
})

router.post('/getLookups', async function (req, res) {
    let out = {
        status: "Success",
        message: "Successfully fetched lookup data",
        data: []
    }
    try {
        let jtoken = req.headers.authorization?.split(" ")[1]
        await validationHandler.validatePayload(req.body,'getLookups','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(req.body.tenantId,req.body.tenant,req.body.loggedUser,moduleName,"getLookups",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, req.body.loggedUser, 'PMRouter', '/getLookups', req.body.tenantId, req.body.tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.getLookups(req);
        } else {
            out={ status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        } 
    } catch (error) {
        appLogger.logMessage("error", "Failed to fetch lookups due to: " + JSON.stringify(error.message), "Router", "getLookups", req.body.loggedUser,req.body.tenant,moduleName);
        out.status = "Failed";
        out.message = "Failed to fetch lookups due to internal server error";
        out.data = JSON.stringify(error.message);
    }
    out = await responseHandler.sendResponse(out.status,out.message,200,out.data,false,"getLookups",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
})

router.post('/closeProject',async function(req,res){
    let out = {
        status:"Success",
        message:"Successfully deleted the project",
        statusCode:200,
        data:[]
    }
    try {
        let jtoken = req.headers.authorization?.split(" ")[1]
        await validationHandler.validatePayload(req.body,'viewTasks','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(req.body.tenantId,req.body.tenant,req.body.loggedUser,moduleName,"closeProject",appLogger,meteringLogger);
        let body = req.body;
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, req.body.loggedUser, 'PMRouter', '/closeProject', req.body.tenantId, req.body.tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.closeProject(req);
        } else {
            out={ status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
        
    } catch (error) {
        appLogger.logMessage("error","Failed to delete project due to: "+JSON.stringify(error.message),"Router","closeProject",req.body.loggedUser,req.body.tenant);
        out.status = "Failure";
        out.message = "Failed to delete project due to internal server error";
        out.data = JSON.stringify(error.message);
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"closeProject",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
})


//CREATE TASK
router.post('/createTask', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'createTask','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"createTask",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/createTask', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess || req.body.isFromWhatsApp) {
            const result = await projectHandler.createTask(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "createTask", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "createTask", loggedUser, tenant,moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
})

router.post('/createTaskbyTemplate', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'createTaskByEmployee','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"createTaskbyTemplate",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/createTask', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.createTasksByTemplate(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "createTask", startDateTime, endDateTime, diffInMS);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "createTask", loggedUser, tenant);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
})


//UPDATE PROJECT
router.post('/updateProject', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'updateProject','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"updateProject",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/updateProject', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.updateProject(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "updateProject", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "updateProject", loggedUser, tenant,moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
})
//ADD MEMBER TO THE PROJECT
router.post('/addMemberToProject', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'addMemberToProject','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addMemberToProject",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/addMemberToProject', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.addMemberToProject(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "addMemberToProject", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "addMemberToProject", loggedUser, tenant,moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
})


//FETCH ALL ACTIVE TASKS UNDER A PROJECT
router.post('/viewActiveTasks', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'viewActiveTasks','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"viewActiveTasks",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/viewActiveTasks', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.viewActiveTasks(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "viewActiveTasks", startDateTime, endDateTime,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "viewActiveTasks", loggedUser, tenant,moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
})

//GET ALL USERS IN A TENANT
router.post('/getAllUsers', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getAlUsers','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getAllUsers",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/getAllUsers', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getAllUsers(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "getAllUsers", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "getAllUsers", loggedUser, tenant,moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
})

//ASSIGN USER TO THE TASK
router.post('/assignUserToTask', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'asiignUserToTask','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"assignUserToTask",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/assignUserToTask', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.assignUserToTask(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "assignUserToTask", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "assignUserToTask", loggedUser, tenant,moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
})

router.post('/terminateAllLookUp', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'terminateAllLookup','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"terminateAllLookUp",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId, jtoken, loggedUser, 'PMRouter', '/terminateAllLookUp', tenantId, tenant, appLogger, meteringLogger, moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.terminateAllLookUp(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "terminateAllLookUp", startDateTime, endDateTime, diffInMS);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "terminateAllLookUp", loggedUser, tenant);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
})

router.post('/terminateLookupType', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'terminateAllLoopkup','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"terminateLookupType",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/terminateLookupType', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.terminateLookupType(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "terminateLookupType", startDateTime, endDateTime, diffInMS);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "terminateLookupType", loggedUser, tenant);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
})

router.post('/deleteLookupTypeField', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'deletelookupTypeField','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"deleteLookupTypeField",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId, jtoken, loggedUser, 'PMRouter', '/terminateLookupTypeField', tenantId, tenant, appLogger, meteringLogger, moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.terminateLookupTypeField(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "terminateLookupTypeField", startDateTime, endDateTime, diffInMS);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "terminateLookupTypeField", loggedUser, tenant);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
})

//update lookup
router.post('/updateLookup', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'updatelookup','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"updateLookup",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId, jtoken, loggedUser, 'PMRouter', '/updateLookup', tenantId, tenant, appLogger, meteringLogger, moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.updateLookup(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "updateLookup", startDateTime, endDateTime, diffInMS);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "updateLookup", loggedUser, tenant);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
})

router.post('/addLookup', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'addLookup','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addLookup",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/addLookup', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.addLookup(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "addLookup", startDateTime, endDateTime, diffInMS);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "addLookup", loggedUser, tenant);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
})

router.post('/addLookupField', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'addLookupField','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addLookupField",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/addLookupField', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.addLookupField(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "addLookupField", startDateTime, endDateTime, diffInMS);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "addLookupField", loggedUser, tenant);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
})


//API TO MARK TASK AS COMPLETED
router.post('/completeTask', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:" Task  marked as completetd successfully ",
        data:[],
        statusCode:200
    }
    try {
        await validationHandler.validatePayload(req.body,'completeTask','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"completeTask",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/completeTask', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.completeTask(req, loggedUser, tenant);
        } else {
            out={ status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "getAllUsers", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "completeTask", loggedUser, tenant,moduleName);
        out.status="Failure"
        out.message="Failed to mark task as completed"
        out.data=JSON.stringify(e.message);
        out.statusCode=500
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"completeTask",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);

})

//get All Lookups
router.post('/getAllLookups', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getAllLookups','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getAllLookups",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/getAllLookups', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getAllLookups(loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "getAllLookups", startDateTime, endDateTime, diffInMS);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "getAllLookups", loggedUser, tenant);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
})

//complete all tasks
router.post('/completeAllTask', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:" All tasks completed successfully ",
        data:[],
        statusCode:200
    }
    try {
        await validationHandler.validatePayload(req.body,'completeTask','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"completeAllTask",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/completeAllTask', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.completeAllTask(req, loggedUser, tenant);
        } else {
            out={ status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "completeAllTask", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "completeAllTask", loggedUser, tenant,moduleName);
        out.status="Failure"
        out.message="Failure to complete all tasks"
        out.data=JSON.stringify(e.message);
        out.statusCode=500
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"completeAllTask",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);

})

//check any task is already assigned
router.post('/isTaskAssigned', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:"Task  already assigned",
        data:[true],
        statusCode:200
    }
    try {
        await validationHandler.validatePayload(req.body,'isTaskAssigned','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"isTaskAssigned",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/isTaskAssigned', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.isTaskAssigned(req, loggedUser, tenant);
        } else {
            out={ status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "isTaskAssigned", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "isTaskAssigned", loggedUser, tenant,moduleName);
        out.status="Failure"
        out.message="Failed to check task  already assigned"
        out.data=JSON.stringify(e.message);
        out.statusCode=500
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"isTaskAssigned",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);

})

//ADD TEMPLATE TO MONGODB
router.post('/addTemplate', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let out = {
        status:"Success",
        message:" Template added successfully ",
        data:[],
        statusCode:200
    }
    try {
        await validationHandler.validatePayload(req.body,'addTemplate','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addTemplate",appLogger,meteringLogger);
        out = await projectHandler.addTemplate(req, loggedUser, tenant);
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "addTemplate", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "addTemplate", loggedUser, tenant,moduleName);
        out.status="Failure"
        out.message="Failure to  add template"
        out.data=JSON.stringify(e.message);
        out.statusCode=500
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"addTemplate",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);

})

//GET TEMPLATE FROM MONGODB
router.post('/getTemplate', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:" Template fetched  successfully ",
        data:[true],
        statusCode:200
    }
    try {
        await validationHandler.validatePayload(req.body,'getTemplate','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getTemplate",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/getTemplate', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.getTemplate(req, loggedUser, tenant);
        } else {
            out={ status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "getTemplate", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "getTemplate", loggedUser, tenant,moduleName);
        out.status="Failure"
        out.message="Failure to fetch template"
        out.data=JSON.stringify(e.message);
        out.statusCode=500
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"getTemplate",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);

})

router.post('/getProjectCounts', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:" Project counts fetched  successfully ",
        data:[true],
        statusCode:200
    }
    try {
        await validationHandler.validatePayload(req.body,'getprojectCounts','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getProjectCounts",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(loggedUserId,jtoken, loggedUser, 'PMRouter', '/getProjectCounts', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.getProjectCounts(req, loggedUser, tenant);
        } else {
            out = { status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "getProjectCounts", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "getProjectCounts", loggedUser, tenant,moduleName);
        out.status="Failed"
        out.message="Internal server error"
        out.data=JSON.stringify(e.message);
        out.statusCode=500
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"getProjectCounts",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);

})

router.post('/getProjectsByStatus', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:" Projects fetched  successfully ",
        data:[true],
        statusCode:200
    }
    try {
        await validationHandler.validatePayload(req.body,'getprojectByStatus','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getProjectsByStatus",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(loggedUserId,jtoken, loggedUser, 'PMRouter', '/getProjectsByStatus', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.getProjectsByStatus(req, loggedUser, tenant);
        } else {
            out = { status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "getProjectsByStatus", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "getProjectsByStatus", loggedUser, tenant,moduleName);
        out.status="Failed"
        out.message="Internal server error"
        out.data=JSON.stringify(e.message);
        out.statusCode=500
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"getProjectsByStatus",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);

})

router.post('/getProjectTeam',async function(req,res){
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:" Projects fetched  successfully ",
        data:[true],
        statusCode:200
    }
    try {
        await validationHandler.validatePayload(req.body,'getProjectTeam','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getProjectTeam",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(loggedUserId,jtoken, loggedUser, 'PMRouter', '/getProjectTeam', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.getProjectsByStatus(req, loggedUser, tenant);
        } else {
            out = { status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "getProjectTeam", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "getProjectTeam", loggedUser, tenant,moduleName);
        out.status="Failure"
        out.message="Internal server error"
        out.data=JSON.stringify(e.message);
        out.statusCode=500
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"getProjectTeam",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
})

router.post('/getTasksList', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:" Projects fetched  successfully ",
        data:[true],
        statusCode:200
    }
    try {
        await validationHandler.validatePayload(req.body,'getTaskList','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getTasksList",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(loggedUserId,jtoken, loggedUser, 'PMRouter', '/getTasksList', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.getTasksList(req, loggedUser, tenant);
        } else {
            out = { status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "getTasksList", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "getTasksList", loggedUser, tenant,moduleName);
        out.status="Failed"
        out.message="Internal server error"
        out.data=JSON.stringify(e.message);
        out.statusCode=500
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"getTasksList",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
})
//SEND   NOTIFICATIONS AMONG  DIFFERENT USERS
router.post('/sendNotification', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let token = req.body.token;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:" Notification send  successfully ",
        data:[],
        statusCode:200
    }
    try {
        await validationHandler.validatePayload(req.body,'sendNotification','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"sendNotification",appLogger,meteringLogger);
        appLogger.logMessage("info", "sendNotification  started", "PMSRouter", "sendNotification", loggedUser,tenant,moduleName);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/sendNotification', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.sendNotification(req, loggedUser, tenant);
        } else {
            out = { status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "sendNotification", startDateTime, endDateTime, diffInMS,moduleName);
    } catch (e) {
        out.status="Failure"
        out.message="Failed to send notification "
        out.data=JSON.stringify(e.message);
        out.statusCode=500
        appLogger.logMessage("error", e.message, "PMSRouter", "sendNotification", loggedUser, tenant,moduleName);
        
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"getNotification",tenant,loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);

})

//GET NOTIFICATIONS  FOR THE EMPLOYEE
router.post('/getNotification', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let token = req.body.token;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:" Notification fetched  successfully ",
        data:[],
        statusCode:200
    }
    try {
        await validationHandler.validatePayload(req.body,'getNotification','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getNotification",appLogger,meteringLogger);
        appLogger.logMessage("info", "getNotification  started", "PMSServices", "getNotification", loggedUser,tenant,moduleName);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, "PMSServices", '/getNotification', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.getNotification(req, loggedUser, tenant);
        } else {
            out = { status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSServices", "getNotification", startDateTime, endDateTime, diffInMS,moduleName);
    } catch (e) {
        out.status="Failure"
        out.message="Failed to fetch notification "
        out.data=JSON.stringify(e.message);
        out.statusCode=500
        appLogger.logMessage("error", e.message, "PMSServices", "getNotification", loggedUser, tenant,moduleName);
        
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"getNotification",tenant,loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);

})

router.post('/getRiskTasks', async (req,res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let token = req.body.token;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:" getRiskTasks fetched  successfully ",
        statusCode:200,
        data:[]
    }
    try {     
        await validationHandler.validatePayload(req.body,'getRiskTask','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)   
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getRiskTasks",appLogger,meteringLogger);
        appLogger.logMessage("info", "getRiskTasks  started", "PMSServices", "getRiskTasks", loggedUser,tenant,moduleName);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, "PMSServices", '/getRiskTasks', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.getRiskTasks(req, loggedUser, tenant);
        } else {
            out = { status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }; 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSServices", "getRiskTasks", startDateTime, endDateTime, diffInMS,moduleName);
    } catch (e) {
        out.status="Failure"
        out.message="Failed to fetch risk tasks "
        out.data=JSON.stringify(e.message);
        out.statusCode=500
        appLogger.logMessage("error", e.message, "PMSServices", "getRiskTasks", loggedUser, tenant,moduleName);
        
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"getRiskTasks",tenant,loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
    
})

router.post('/getRiskProjects', async (req,res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let token = req.body.token;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:" getRiskProjects fetched  successfully ",
        statusCode:200,
        data:[]
    }
    try {
        await validationHandler.validatePayload(req.body,'getRiskProjects','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getRiskProjects",appLogger,meteringLogger);
        appLogger.logMessage("info", "getRiskProjects  started", "PMSServices", "getRiskProjects", loggedUser,tenant,moduleName);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, "getRiskProjects", '/getRiskTasks', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.getRiskProjects(req, loggedUser, tenant);
        } else {
            out = { status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }; 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSServices", "getRiskProjects", startDateTime, endDateTime, diffInMS,moduleName);
    } catch (e) {
        out.status="Failure"
        out.message="Failed to fetch risk projects "
        out.data=JSON.stringify(e.message);
        out.statusCode=500
        appLogger.logMessage("error", e.message, "PMSServices", "getRiskProjects", loggedUser, tenant,moduleName);
        
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"getRiskProjects",tenant,loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
    
})
router.post('/logWork', async (req,res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let token = req.body.token;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:" task added successfully ",
        statusCode:200,
        data:[]
    }
    try {
        await validationHandler.validatePayload(req.body,'logWork','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"logWork",appLogger,meteringLogger);
        appLogger.logMessage("info", "logWork  started", "PMSServices", "logWork", loggedUser,tenant,moduleName);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, "PMSServices", '/logWork', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess || req.body.isFromWhatsApp) {
            out = await projectHandler.logWork(req, loggedUser, tenant);
        } else {
            out = { status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }; 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSServices", "logWork", startDateTime, endDateTime, diffInMS,moduleName);
    } catch (e) {
        out.status="Failure"
        out.message="Failed to log work "
        out.data=JSON.stringify(e.message);
        out.statusCode=500
        appLogger.logMessage("error", e.message, "PMSServices", "logWork", loggedUser, tenant,moduleName);
        
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"logWork",tenant,loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
    
})
router.post('/updateLogWork', async (req,res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let token = req.body.token;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:" Time updated successfully ",
        statusCode:200,
        data:[]
    }
    try {
        await validationHandler.validatePayload(req.body,'updatelogWork','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"updateLogWork",appLogger,meteringLogger);
        appLogger.logMessage("info", "updateLogWork  started", "PMSServices", "updateLogWork", loggedUser,tenant,moduleName);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, "PMSServices", '/updateLogWork', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.updateLogWork(req, loggedUser, tenant);
        } else {
            out = { status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }; 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSServices", "updateLogWork", startDateTime, endDateTime, diffInMS,moduleName);
    } catch (e) {
        out.status="Failure"
        out.message="Failed to update log work "
        out.data=JSON.stringify(e.message);
        out.statusCode=500
        appLogger.logMessage("error", e.message, "PMSServices", "updateLogWork", loggedUser, tenant,moduleName);
        
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"updateLogWork",tenant,loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
    
})


router.post('/startOrHoldTask', async (req,res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let token = req.body.token;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:" task started/hold successfully ",
        statusCode:200,
        data:[]
    }
    try {
        await validationHandler.validatePayload(req.body,'startOrHoldTask','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"startOrHoldTask",appLogger,meteringLogger);
        appLogger.logMessage("info", "startOrHoldTask  started", "PMSServices", "startOrHoldTask", loggedUser,tenant,moduleName);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, moduleName, '/startOrHoldTask', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.startOrHoldTask(req, loggedUser, tenant);
        } else {
            out = { status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }; 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSServices", "startOrHoldTask", startDateTime, endDateTime, diffInMS,moduleName);
    } catch (e) {
        out.status="Failure"
        out.message="Failed to start or hold Task "
        out.data=JSON.stringify(e.message);
        out.statusCode=500
        appLogger.logMessage("error", e.message, "PMSServices", "startOrHoldTask", loggedUser, tenant,moduleName);
        
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"startOrHoldTask",tenant,loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
    
})

router.post('/viewWorkLogs', async (req,res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let token = req.body.token;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:" workLogs fetched successfully ",
        statusCode:200,
        data:[]
    }
    try {
        await validationHandler.validatePayload(req.body,'viewWorkLogs','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"viewWorkLogs",appLogger,meteringLogger);
        appLogger.logMessage("info", "viewWorkLogs  started", "PMSServices", "viewWorkLogs", loggedUser,tenant,moduleName);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, moduleName, '/viewWorkLogs', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.viewWorkLogs(req, loggedUser, tenant);
        } else {
            out = { status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }; 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSServices", "viewWorkLogs", startDateTime, endDateTime, diffInMS,moduleName);
    } catch (e) {
        out.status="Failure"
        out.message="Failed to view work log "
        out.data=JSON.stringify(e.message);
        out.statusCode=500
        appLogger.logMessage("error", e.message, "PMSServices", "viewWorkLogs", loggedUser, tenant,moduleName);
        
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"viewWorkLogs",tenant,loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
    
})

router.post('/automateProject', async (req,res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let token = req.body.token;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:"Project automation started successfully",
        statusCode:200,
        data:[]
    }
    try {
        await validationHandler.validatePayload(req.body,'automateProject','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"automateProject",appLogger,meteringLogger);
        appLogger.logMessage("info", "automateProject  started", "PMSServices", "automateProject", loggedUser,tenant,moduleName);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, moduleName, '/automateProject', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.automateProject(req, loggedUser, tenant);
        } else {
            out = { status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }; 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSServices", "automateProject", startDateTime, endDateTime, diffInMS,moduleName);
    } catch (e) {
        out.status="Failure"
        out.message="Failed to automate Project "
        out.data=JSON.stringify(e.message);
        out.statusCode=500
        appLogger.logMessage("error", e.message, "PMSServices", "automateProject", loggedUser, tenant,moduleName);
        
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"automateProject",tenant,loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
    
})


router.post('/getAllTasksOfEmp', async (req,res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let token = req.body.token;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:"Project automation started successfully",
        statusCode:200,
        data:[]
    }
    try {
        await validationHandler.validatePayload(req.body,'getAlltasksOfEmp','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getAllTasksOfEmp",appLogger,meteringLogger);
        appLogger.logMessage("info", "getAllTasksOfEmp  started", "PMSServices", "automategetAllTasksOfEmpProject", loggedUser,tenant,moduleName);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, moduleName, '/getAllTasksOfEmp', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.getAllTasksOfUser(req, loggedUser, tenant);
        } else {
            out = { status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }; 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSServices", "getAllTasksOfEmp", startDateTime, endDateTime, diffInMS,moduleName);
    } catch (e) {
        out.status="Failure"
        out.message="Failed to get all task"
        out.data=JSON.stringify(e.message);
        out.statusCode=500
        appLogger.logMessage("error", e.message, "PMSServices", "getAllTasksOfEmp", loggedUser, tenant,moduleName);
        
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"getAllTasksOfEmp",tenant,loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
    
})

router.post('/getRiskTasksOfEmployee', async (req,res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let token = req.body.token;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:" Risk tasks fetched  successfully ",
        statusCode:200,
        data:[]
    }
    try {
        await validationHandler.validatePayload(req.body,'getRiskTaskOfEmployee','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getRiskTasksOfEmployee",appLogger,meteringLogger);
        appLogger.logMessage("info", "getRiskTasksOfEmployee  started", "PMSServices", "getRiskTasks", loggedUser,tenant,moduleName);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, "PMSServices", '/getRiskTasksOfEmployee', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.getRiskTasksOfEmp(req, loggedUser, tenant);
        } else {
            out = { status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }; 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSServices", "getRiskTasksOfEmployee", startDateTime, endDateTime, diffInMS,moduleName);
    } catch (e) {
        out.status="Failure"
        out.message="Failed to fetch risk tasks "
        out.data=JSON.stringify(e.message);
        out.statusCode=500
        appLogger.logMessage("error", e.message, "PMSServices", "getRiskTasksOfEmployee", loggedUser, tenant,moduleName);
        
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"getRiskTasksOfEmployee",tenant,loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
    
})

router.post('/deleteWorkLog', async (req,res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let token = req.body.token;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:" WorkLog deleted successfully ",
        statusCode:200,
        data:[]
    }
    try {
        await validationHandler.validatePayload(req.body,'deleteWorkLog','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"deleteWorkLog",appLogger,meteringLogger);
        appLogger.logMessage("info", "deleteWorkLog  started", "PMSServices", "deleteWorkLog", loggedUser,tenant,moduleName);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, "PMSServices", '/deleteWorkLog', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.deleteWorkLog(req, loggedUser, tenant);
        } else {
            out = { status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }; 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSServices", "deleteWorkLog", startDateTime, endDateTime, diffInMS,moduleName);
    } catch (e) {
        out.status="Failure"
        out.message="Failed to delete work log"
        out.data=JSON.stringify(e.message);
        out.statusCode=500
        appLogger.logMessage("error", e.message, "PMSServices", "deleteWorkLog", loggedUser, tenant,moduleName);
        
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"deleteWorkLog",tenant,loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
    
})

router.post('/getUserProjectDetails', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getUserProjectDetails','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getUserProjectDetails",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getUserProjectDetails', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getUserProjectDetails(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getUserProjectDetails", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "LMRouter", "getUserProjectDetails", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "LMRouter", "getUserProjectDetails", loggedUser, tenant, moduleName);
})

router.post('/assignToTeam', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'assignToTeam','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"assignToTeam",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/assignToTeam', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.assignToTeam(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "assignToTeam", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "LMRouter", "assignToTeam", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "LMRouter", "assignToTeam", loggedUser, tenant, moduleName);
})
router.post('/getTeamDetailsByProject', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getTeamDetailsByProject','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getTeamDetailsByProject",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getTeamDetailsByProject', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess || req.body.isFromWhatsApp) {
            const result = await projectHandler.getTeamDetailsByProject(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getTeamDetailsByProject", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "LMRouter", "getTeamDetailsByProject", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "LMRouter", "getTeamDetailsByProject", loggedUser, tenant, moduleName);
})

router.post('/holdOrResume',async function(req,res){
    let out = {
        status:"Success",
        message:"Successfully hold or resume the project",
        statusCode:200,
        data:[]
    }
    try {
        let jtoken = req.headers.authorization?.split(" ")[1]
        await validationHandler.validatePayload(req.body,'holdOrResume','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(req.body.tenantId,req.body.tenant,req.body.loggedUser,moduleName,"holdOrResume",appLogger,meteringLogger);
        let body = req.body;
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, req.body.loggedUser, 'PMRouter', '/holdOrResume', req.body.tenantId, req.body.tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.holdOrResume(req);
        } else {
            res.json({ status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        
    } catch (error) {
        appLogger.logMessage("error","Failed to hold or resume project due to: "+JSON.stringify(error.message),"Router","holdOrResume",req.body.loggedUser,req.body.tenant);
        out.status = "Failed";
        out.message = "Failed to hold or resume due to internal server error";
        out.data = JSON.stringify(error.message);
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"holdOrResume",req.body.tenant,req.body.loggedUser,appLogger,meteringLogger);
    res.send(out);
})

//GET MAIN TASKS
router.post('/getMainTasks', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let token = req.body.token;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:"Main tasks fetched successfully ",
        data:[],
        statusCode:200
    }
    try {
        await validationHandler.validatePayload(req.body,'getMaintasks','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getMainTasks",appLogger,meteringLogger);
        appLogger.logMessage("info", "getMainTasks  started", "TSMServices", "getMainTasks", loggedUser,tenant,moduleName);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'TMSRouter', '/getMainTasks', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.getMainTasks(req, loggedUser, tenant);
        } else {
            out = { status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }; 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "TMSRouter", "getMainTasks", startDateTime, endDateTime, diffInMS,moduleName);
    } catch (e) {
        out.status="Failure"
        out.message="Failed to fetch main task "
        out.data=JSON.stringify(e.message);
        out.statusCode=500
        appLogger.logMessage("error", e.message, "TMSRouter", "getMainTasks", loggedUser, tenant,moduleName);
        
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"TSMRouter",tenant,loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);

})
router.post('/getSubTasks', async (req, res) => {
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
        await validationHandler.validatePayload(req.body,'getSubTasks','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getSubTasks",appLogger,meteringLogger);
        appLogger.logMessage("info", "getSubTasks  started", "TSMServices", "getSubTasks", loggedUser,tenant,moduleName);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'TMSRouter', '/getSubTasks', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.getSubTasks(req, loggedUser, tenant);
        } else {
            out = { status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }; 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "TMSRouter", "getSubTasks", startDateTime, endDateTime, diffInMS,moduleName);
    } catch (e) {
        out.status="Failure"
        out.message="Failed to fetch  sub task "
        out.data=JSON.stringify(e.message);
        out.statusCode=500
        appLogger.logMessage("error", e.message, "TMSRouter", "getSubTasks", loggedUser, tenant,moduleName);
        
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"TSMRouter",tenant,loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
})
router.post('/createSubTask', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'createSubTask','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"createSubTask",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/createSubTask', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.createSubTask(req);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }); 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "createSubTask", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "createSubTask", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "PMSRouter", "createSubTask", loggedUser, tenant, moduleName);
})

router.post('/getProjectsAssigned', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getProjectAssigned','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getProjectsAssigned",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getProjectsAssigned', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getProjectsAssigned(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getProjectsAssigned", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "LMRouter", "getProjectsAssigned", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "LMRouter", "getProjectsAssigned", loggedUser, tenant, moduleName);
})


router.post('/getEmployeeProjectTasks', async (req,res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let token = req.body.token;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:"Task fetched for employee",
        statusCode:200,
        data:[]
    }
    try {
        await validationHandler.validatePayload(req.body,'getEmployeeProjectTasks','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getEmployeeProjectTasks",appLogger,meteringLogger);
        appLogger.logMessage("info", "getEmployeeProjectTasks  started", "PMSServices", "getEmployeeProjectTasks", loggedUser,tenant,moduleName);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, moduleName, '/getEmployeeProjectTasks', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.getEmployeeProjectTasks(req, loggedUser, tenant);
        } else {
            out = { status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }; 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSServices", "getEmployeeProjectTasks", startDateTime, endDateTime, diffInMS,moduleName);
    } catch (e) {
        out.status="Failure"
        out.message="Failed to automate Project "
        out.data=JSON.stringify(e.message);
        out.statusCode=500
        appLogger.logMessage("error", e.message, "PMSServices", "getEmployeeProjectTasks", loggedUser, tenant,moduleName);
        
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"getEmployeeProjectTasks",tenant,loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
    
})

router.get("/file", function (req, res, next) {
    let filePath = req.query.filePath;
    var fileName = encodeURIComponent(path.basename(filePath));
    fs.readFile('./utils/' + filePath, function (err, data) {
        if (err) {
            console.log(err.message);

            res.end("");
        } else {
            res.setHeader("Content-Type", "application/octet-stream");
            res.writeHead(200, {
                "Content-Disposition": "attachment;filename*=UTF-8''" + fileName,
            });
            res.end(data);
        }
    });
});

  router.post('/getTodoList', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let out = {
        status:"Success",
        message:"Successfully fetched tasks",
        statusCode:200,
        data:[]
    }
    try {
        await validationHandler.validatePayload(req.body,'getTdoList','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        out = await projectHandler.getTodoList(req);
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(req.body.tenant, req.body.userEmail, "PMSRouter", "getTodoList", startDateTime, endDateTime, diffInMS, moduleName);
        appLogger.logMessage("info", "Api call finished and result is returned.", "PMSRouter", "getTodoList", req.body.userEmail, req.body.tenant, moduleName);
    } catch (error) {
        appLogger.logMessage("error","Failed to fetch todolist due to: "+JSON.stringify(error.message),"PMSRouter","getTodoList",req.body.userEmail,req.body.tenant,moduleName);
        out.status = "Failure";
        out.statusCode=500
        out.message = "Failed to fetch todo list due to: "+JSON.stringify(error.message);
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"getTodoList",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
})

router.post('/getLookupsWhatsApp', async function (req, res) {
    let out = {
        status: "Success",
        message: "Successfully fetched lookup data",
        statusCode:200,
        data: []
    }
    try {
        await validationHandler.validatePayload(req.body,'getLookupWhatsup','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(req.body.tenantId, req.body.tenant, req.body.loggedUser, moduleName, "getLookups",appLogger,meteringLogger);
        out = await projectHandler.getLookups(req);
    } catch (error) {
        appLogger.logMessage("error", "Failed to fetch lookups due to: " + JSON.stringify(error.message), "Router", "getLookups", req.body.loggedUser,req.body.tenant,moduleName);
        out.status = "Failed";
        out.message = "Failed to fetch lookups due to internal server error";
        out.data = JSON.stringify(error.message);
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"getLookups",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
})

router.post('/updateStatus', async function (req, res) {
    let out = {
        status: "Success",
        message: "Successfully fetched lookup data",
        statusCode:200,
        data: []
    }
    try {
        await validationHandler.validatePayload(req.body,'updateStatus','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(req.body.tenantId, req.body.tenant, req.body.loggedUser, moduleName, "getLookups",appLogger,meteringLogger);
        out = await projectHandler.updateStatus(req);
    } catch (error) {
        appLogger.logMessage("error", "Failed to fetch lookups due to: " + JSON.stringify(error.message), "Router", "getLookups", req.body.loggedUser,req.body.tenant,moduleName);
        out.status = "Failed";
        out.message = "Failed to fetch lookups due to internal server error";
        out.data = JSON.stringify(error.message);
    }
    res.send(out);
})


// GET WORK LOG DETIALS OF TASK basis

router.post('/getTaskWorkLog', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let token = req.body.token;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:"Get work log successfully ",
        data:[],
        statusCode:200
    }
    try {
        await validationHandler.validatePayload(req.body,'getTaskWorkLog','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getTaskWorkLog",appLogger,meteringLogger);
        appLogger.logMessage("info", "getTaskWorkLog  started", "TSMServices", "getTaskWorkLog", loggedUser,tenant,moduleName);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'TMSRouter', '/getMainTasks', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.getTaskWorkLog(req, loggedUser, tenant);
        } else {
            out = { status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }; 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "TMSRouter", "getTaskWorkLog", startDateTime, endDateTime, diffInMS,moduleName);
    } catch (e) {
        out.status="Failure"
        out.message="Failed to fetch  work log "
        out.data=JSON.stringify(e.message);
        out.statusCode=500
        appLogger.logMessage("error", e.message, "TMSRouter", "getTaskWorkLog", loggedUser, tenant,moduleName);
        
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"TSMRouter",tenant,loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);

})

//   REMOVE TEAM MEMBERS FROM PORJECT TEAM
router.post('/removeTeamMembers', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let token = req.body.token;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:"Team members are removed successfully ",
        data:[],
        statusCode:200
    }
    try {
        await validationHandler.validatePayload(req.body,'removeTaskMembers','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"removeTeamMembers",appLogger,meteringLogger);
        appLogger.logMessage("info", "removeTeamMembers  started", "TSMServices", "removeTeamMembers", loggedUser,tenant,moduleName);
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'TMSRouter', '/getMainTasks', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.removeTeamMembers(req, loggedUser, tenant);
        } else {
            out = { status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }; 
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "TMSRouter", "removeTeamMembers", startDateTime, endDateTime, diffInMS,moduleName);
    } catch (e) {
        out.status="Failure"
        out.message="Failed to remove team members " 
        out.data=JSON.stringify(e.message);
        out.statusCode=500
        appLogger.logMessage("error", e.message, "TMSRouter", "removeTeamMembers", loggedUser, tenant,moduleName);
        
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"TSMRouter",tenant,loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);

})

router.post('/getTeamProjects', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "Api invoked", "PMSRouter", "getTeamProjects", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body,'getTeamProjects','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getTeamProjects",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getTeamProjects', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getTeamProjects(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getTeamProjects", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "LMRouter", "getTeamProjects", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "LMRouter", "getTeamProjects", loggedUser, tenant, moduleName);
})

router.post('/getAttachmentsByActionId', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "Api invoked", "PMSRouter", "getAttachmentsByActionId", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body,'getAttachmentsByActionId','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getAttachmentsByActionId",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getAttachmentsByActionId', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess || req.body.isFromWhatsApp) {
            const result = await projectHandler.getAttachmentsByActionId(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getAttachmentsByActionId", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getAttachmentsByActionId", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "PMSRouter", "getAttachmentsByActionId", loggedUser, tenant, moduleName);
})
  
router.post('/getTaskAttachments', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let fromWhatsapp=req.body.whatsapp;
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getTaskAttachments','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getTaskAttachments",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getTaskAttachments', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess||fromWhatsapp) {
            const result = await projectHandler.getTaskAttachments(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getTaskAttachments", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getTaskAttachments", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "PMSRouter", "getTaskAttachments", loggedUser, tenant, moduleName);
})

//API TO FETCH TASK DATA TO SHOW IN CREATING DEPENDENCY TASK
router.post('/getTaskForDependancy', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getTaskForDependency','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getTaskForDependancy",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getTaskForDependancy', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getTaskForDependancy(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getTaskForDependancy", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getTaskForDependancy", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", " getTaskForDependancy Api call finished and result is returned.", "PMSRouter", "getTaskForDependancy", loggedUser, tenant, moduleName);
})


//CREATE DEPENDANCY TASK
router.post('/createDependencyTask', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'createDependencyTask','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"createDependencyTask",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/createDependencyTask', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.createDependencyTask(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "createDependencyTask", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "createDependencyTask", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", " createDependencyTask Api call finished and result is returned.", "PMSRouter", "createDependencyTask", loggedUser, tenant, moduleName);
})

router.post('/addProjectOwner', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'addprojectOwner','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addProjectOwner",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/addProjectOwner', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.addProjectOwner(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "addProjectOwner", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "addProjectOwner", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", " addProjectOwner Api call finished and result is returned.", "PMSRouter", "addProjectOwner", loggedUser, tenant, moduleName);
})


router.post('/removeProjectOwner', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'removeProjectOwner','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"removeProjectOwner",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/removeProjectOwner', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.removeProjectOwner(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "removeProjectOwner", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "removeProjectOwner", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "removeProjectOwner Api call finished and result is returned.", "PMSRouter", "removeProjectOwner", loggedUser, tenant, moduleName);
})

router.post('/addIssue', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'addIssue','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addIssue",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/addIssue', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.addIssue(req, req.body, loggedUser, tenant, jtoken);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "addIssue", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "addIssue", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "addIssue Api call finished and result is returned.", "PMSRouter", "addIssue", loggedUser, tenant, moduleName);
})

router.post('/editIssue', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'editIssue','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"editIssue",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/editIssue', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.editIssue(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "editIssue", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "editIssue", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "editIssue Api call finished and result is returned.", "PMSRouter", "editIssue", loggedUser, tenant, moduleName);
})

router.post('/deleteIssue', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'deleteIssue','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"deleteIssue",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/deleteIssue', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.deleteIssue(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "deleteIssue", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "deleteIssue", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "deleteIssue Api call finished and result is returned.", "PMSRouter", "deleteIssue", loggedUser, tenant, moduleName);
})

router.post('/getAllIssue', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getAllIssue','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getAllIssue",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getAllIssue', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getAllIssue(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getAllIssue", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getAllIssue", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getAllIssue Api call finished and result is returned.", "PMSRouter", "getAllIssue", loggedUser, tenant, moduleName);
})

router.post('/getAllOpenIssue', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getAllOpenIssue','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getAllOpenIssue",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getAllOpenIssue', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getAllOpenIssue(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getAllOpenIssue", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getAllIssue", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getAllIssue Api call finished and result is returned.", "PMSRouter", "getAllIssue", loggedUser, tenant, moduleName);
})

router.post('/getIssueByProject', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getIssueByProject','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getIssueByProject",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getIssueByProject', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getIssueByProject(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getIssueByProject", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getIssueByProject", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getIssueByProject Api call finished and result is returned.", "PMSRouter", "getIssueByProject", loggedUser, tenant, moduleName);
})

router.post('/getIssueByUser', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getIssueByUser','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getIssueByUser",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getIssueByUser', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getIssueByUser(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getIssueByUser", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getIssueByUser", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getIssueByUser Api call finished and result is returned.", "PMSRouter", "getIssueByUser", loggedUser, tenant, moduleName);
})


router.post('/getIssueDetails', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getIssueDetails','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getIssueDetails",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getIssueDetails', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getIssueDetails(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getIssueDetails", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getIssueDetails", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getIssueDetails Api call finished and result is returned.", "PMSRouter", "getIssueDetails", loggedUser, tenant, moduleName);
})

router.post('/assignIssue', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'asisgnIssue','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"assignIssue",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/assignIssue', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.assignIssue(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "assignIssue", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "assignIssue", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "assignIssue Api call finished and result is returned.", "PMSRouter", "assignIssue", loggedUser, tenant, moduleName);
})

router.post('/addMilestone', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'addMilestone','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addMilestone",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/addMilestone', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.addMilestone(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "addMilestone", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "addMilestone", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "addMilestone Api call finished and result is returned.", "PMSRouter", "addMilestone", loggedUser, tenant, moduleName);
})

router.post('/editMilestone', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'editmilestone','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"editMilestone",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/editMilestone', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.editMilestone(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "editMilestone", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "editMilestone", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "editMilestone Api call finished and result is returned.", "PMSRouter", "editMilestone", loggedUser, tenant, moduleName);
})

router.post('/getMilestone', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getMilestone','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addMilestone",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getMilestone', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getMilestone(req.body.projectId, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getMilestone", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getMilestone", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getMilestone Api call finished and result is returned.", "PMSRouter", "getMilestone", loggedUser, tenant, moduleName);
})

router.post('/getTaskForMilestones', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getTaskFormIlestone','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getTaskForMilestones",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getTaskForMilestones', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getTaskForMilestones(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getTaskForMilestones", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getTaskForMilestones", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getTaskForMilestones Api call finished and result is returned.", "PMSRouter", "getTaskForMilestones", loggedUser, tenant, moduleName);
})

// CHANGE STATUS OF  AN ISSUE
router.post('/changeIssueStatus', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'changeIssueStatus','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"changeIssueStatus",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/changeIssueStatus', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.changeIssueStatus(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "changeIssueStatus", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "changeIssueStatus", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "changeIssueStatus Api call finished and result is returned.", "PMSRouter", "changeIssueStatus", loggedUser, tenant, moduleName);
})

//ADD FAVOURITE PROJECTS

router.post('/addFavouriteProject', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'addFavouriteproject','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser) 
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addFavouriteProject",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/addFavouriteProject', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.addFavouriteProject(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "addFavouriteProject", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "addFavouriteProject", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "addFavouriteProject Api call finished and result is returned.", "PMSRouter", "addFavouriteProject", loggedUser, tenant, moduleName);
})

// REMOVE FAOURITE PROJECT
router.post('/removeFavouriteProject', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'removeFavouriteProject','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"removeFavouriteProject",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/removeFavouriteProject', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.removeFavouriteProject(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "removeFavouriteProject", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "removeFavouriteProject", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "removeFavouriteProject Api call finished and result is returned.", "PMSRouter", "removeFavouriteProject", loggedUser, tenant, moduleName);
})

router.post('/addModule', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'addModule','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addModule",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/addModule', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.addModule(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "addModule", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "addModule", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "addModule Api call finished and result is returned.", "PMSRouter", "addModule", loggedUser, tenant, moduleName);
})

router.post('/editModule', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'editModule','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"editModule",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/editModule', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.editModule(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "editModule", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "editModule", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "editModule Api call finished and result is returned.", "PMSRouter", "editModule", loggedUser, tenant, moduleName);
})

router.post('/getModule', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getModule','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getModule",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getModule', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getModule(req.body.projectId, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getModule", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getModule", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getModule Api call finished and result is returned.", "PMSRouter", "getModule", loggedUser, tenant, moduleName);
})

router.post('/deleteModule', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'deleteModule','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"deleteModule",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/deleteModule', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.deleteModule(req.body.moduleId, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "deleteModule", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "deleteModule", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "deleteModule Api call finished and result is returned.", "PMSRouter", "deleteModule", loggedUser, tenant, moduleName);
})

//FETCH ALL TASK OF VARIOUS STATUS FOR EMPLOYEE
router.post('/fetchAllTaskForEmployee', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'fetchAllTaskForEmployee','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"fetchAllTaskForEmployee",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/fetchAllTaskForEmployee', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.fetchAllTaskForEmployee(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "fetchAllTaskForEmployee", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "fetchAllTaskForEmployee", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "fetchAllTaskForEmployee Api call finished and result is returned.", "PMSRouter", "fetchAllTaskForEmployee", loggedUser, tenant, moduleName);
})

//FETCH ALL TASK OF VARIOUS STATUS  UNDER A PROJECT FOR PROJECT MANAGER VIEW
router.post('/fetchAllTaskForManager', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'fetchAllTaskForManager','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"fetchAllTaskForManager",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/fetchAllTaskForManager', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.fetchAllTaskForManager(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "fetchAllTaskForManager", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "fetchAllTaskForManager", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "fetchAllTaskForManager Api call finished and result is returned.", "PMSRouter", "fetchAllTaskForManager", loggedUser, tenant, moduleName);
})

//COUNT OF DELAYED TASKS
router.post('/delayedTaskCount', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'delayedTaskCount','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"delayedTaskCount",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/delayedTaskCount', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.delayedTaskCount(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "delayedTaskCount", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "delayedTaskCount", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "delayedTaskCount Api call finished and result is returned.", "PMSRouter", "delayedTaskCount", loggedUser, tenant, moduleName);
})

//COUNT OF ISSUES
router.post('/getIssuesCount', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getIssuesCount','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getIssuesCount",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getIssuesCount', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getIssuesCount(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getIssuesCount", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getIssuesCount", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getIssuesCount Api call finished and result is returned.", "PMSRouter", "getIssuesCount", loggedUser, tenant, moduleName);
})

// FETCH SUBTASK DETAILS
router.post('/getSubTaskDetails', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getSubTaskDetails','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getSubTaskDetails",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getSubTaskDetails', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getSubTaskDetails(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getSubTaskDetails", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getSubTaskDetails", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getSubTaskDetails Api call finished and result is returned.", "PMSRouter", "getSubTaskDetails", loggedUser, tenant, moduleName);
})

//API TO ADD TASK TO MILETSONE
router.post('/addTaskToMilestone', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'addTaskToMilestone','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addTaskToMilestone",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/addTaskToMilestone', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.addTaskToMilestone(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "addTaskToMilestone", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "addTaskToMilestone", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "addTaskToMilestone Api call finished and result is returned.", "PMSRouter", "addTaskToMilestone", loggedUser, tenant, moduleName);
})

//API TO GET TASK UNDER MILESTONE
router.post('/deleteMilestone', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'deleteMilestone','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"deleteMilestone",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/deleteMilestone', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.deleteMilestone(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "deleteMilestone", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "deleteMilestone", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "deleteMilestone Api call finished and result is returned.", "PMSRouter", "deleteMilestone", loggedUser, tenant, moduleName);
})

//API TO FETCH TASK UNDER MILESTONE
router.post('/getTaskUnderMilestone', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getTaskUnderMilestone','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getTaskUnderMilestone",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getTaskUnderMilestone', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getTaskUnderMilestone(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getTaskUnderMilestone", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getTaskUnderMilestone", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getTaskUnderMilestone Api call finished and result is returned.", "PMSRouter", "getTaskUnderMilestone", loggedUser, tenant, moduleName);
})

//API TO REMOVE DEPENDANCY 
router.post('/removeDependancy', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'removeDependancy','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"removeDependancy",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/removeDependancy', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.removeDependancy(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "removeDependancy", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "removeDependancy", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "removeDependancy Api call finished and result is returned.", "PMSRouter", "removeDependancy", loggedUser, tenant, moduleName);
})

router.post('/getRiskIssueCountByProject', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getRiskIssueCountByProject','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getRiskIssueCountByProject",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getRiskIssueCountByProject', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getRiskIssueCountByProject(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getRiskIssueCountByProject", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getRiskIssueCountByProject", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getRiskIssueCountByProject Api call finished and result is returned.", "PMSRouter", "getRiskIssueCountByProject", loggedUser, tenant, moduleName);
})

router.post('/getRiskTasksCountByProject', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getRiskTasksCountByProject','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getRiskTasksCountByProject",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getRiskTasksCountByProject', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getRiskTasksCountByProject(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getRiskTasksCountByProject", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getRiskTasksCountByProject", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getRiskTasksCountByProject Api call finished and result is returned.", "PMSRouter", "getRiskTasksCountByProject", loggedUser, tenant, moduleName);
})

// API TO GET IMAGES OF TASK AND ITS WORK LOG FROM ATTACHMENTS 
router.post('/getTaskImages', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getTaskImages','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getTaskImages",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getTaskImages', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getTaskImages(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getTaskImages", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getTaskImages", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getTaskImages Api call finished and result is returned.", "PMSRouter", "getTaskImages", loggedUser, tenant, moduleName);
})

//API TO SEND ATTACHMENTS
router.post('/sendAttachment', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'sendAttachment','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"sendAttachment",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/sendAttachment', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.sendAttachment(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "sendAttachment", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "sendAttachment", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "sendAttachment Api call finished and result is returned.", "PMSRouter", "sendAttachment", loggedUser, tenant, moduleName);
})


//API TO ARCHIVE PROJECTS
router.post('/archiveProject', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'archiveProject','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"archiveProject",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/archiveProject', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.archiveProject(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "archiveProject", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "archiveProject", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "archiveProject Api call finished and result is returned.", "PMSRouter", "archiveProject", loggedUser, tenant, moduleName);
})


//API TO UNARCHIVE PROJECT 
router.post('/unArchiveProject', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'unArchiveProject','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"unArchiveProject",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/unArchiveProject', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.unArchiveProject(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "unArchiveProject", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "unArchiveProject", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "unArchiveProject Api call finished and result is returned.", "PMSRouter", "unArchiveProject", loggedUser, tenant, moduleName);
})

//API TO CREATE GROUP
router.post('/createGroup', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'createGroup','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"createGroup",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/createGroup', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.createGroup(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "createGroup", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "createGroup", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "createGroup Api call finished and result is returned.", "PMSRouter", "createGroup", loggedUser, tenant, moduleName);
})

//API TO FETCH GROUP
router.post('/fetchGroup', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'fetchGroup','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"fetchGroup",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/fetchGroup', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.fetchGroup(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "fetchGroup", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "fetchGroup", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "fetchGroup Api call finished and result is returned.", "PMSRouter", "fetchGroup", loggedUser, tenant, moduleName);
})

router.post('/getProjectsOfEmployee', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:"Successfully fetched user's projects",
        statusCode:200,
        data:[]
    }
    try {
        await validationHandler.validatePayload(req.body,'getProjectsOfEmployee','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getProjectsOfEmployee",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/fetchGroup', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess || req.body.isFromWhatsApp == true) {
            out = await projectHandler.getProjectsOfEmployee(req.body, loggedUser, tenant);
            
        } else {
            out={ status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
        
        
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getProjectsOfEmployee", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getProjectsOfEmployee", loggedUser, tenant, moduleName);
        out = { status: 'Failure', message: e, statusCode: 500 };
    }
    appLogger.logMessage("info", "getProjectsOfEmployee Api call finished and result is returned.", "PMSRouter", "getProjectsOfEmployee", loggedUser, tenant, moduleName);
    res.send({type:out.status,message:out.message,data:out.data,statusCode:200});
})

router.post('/getIssueCountByType', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let token = req.body.token;    
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getIssueCountByType','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getIssueCountByType",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getIssueCountByType', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getIssueCountByType(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getIssueCountByType", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getIssueCountByType", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getIssueCountByType Api call finished and result is returned.", "PMSRouter", "getIssueCountByType", loggedUser, tenant, moduleName);
})

router.post('/changeTaskMilestone', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let token = req.body.token;    
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'changeTaskMilestone','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"changeTaskMilestone",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/changeTaskMilestone', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.changeTaskMilestone(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "changeTaskMilestone", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "changeTaskMilestone", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "changeTaskMilestone Api call finished and result is returned.", "PMSRouter", "changeTaskMilestone", loggedUser, tenant, moduleName);
})
router.post('/removeTaskFromMilestone', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let token = req.body.token;    
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'removeTaskFromMilestone','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"removeTaskFromMilestone",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/removeTaskFromMilestone', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.removeTaskFromMilestone(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "removeTaskFromMilestone", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "removeTaskFromMilestone", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "removeTaskFromMilestone Api call finished and result is returned.", "PMSRouter", "removeTaskFromMilestone", loggedUser, tenant, moduleName);
})

//FETCH RULE DETAILS FOR RECURRING TASK
router.post('/fetchRecurringRules', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'fetchRecurringRules','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"fetchRecurringRules",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/fetchRecurringRules', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.fetchRecurringRules(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "fetchRecurringRules", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "fetchRecurringRules", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "fetchRecurringRules Api call finished and result is returned.", "PMSRouter", "fetchRecurringRules", loggedUser, tenant, moduleName);
})

//ADD TASK DATA  TO  RECURRING  TABLE
router.post('/isRecurringTask', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'isRecurringTask','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"isRecurringTask",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/isRecurringTask', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.isRecurringTask(req.body.newTaskId,req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "isRecurringTask", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "isRecurringTask", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "isRecurringTask Api call finished and result is returned.", "PMSRouter", "isRecurringTask", loggedUser, tenant, moduleName);
})

router.post('/populateRecurringTask', async (req, res) => {
    let loggedUser = "admin";
    let tenant = "SYSTEM";
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    try {
        
        await validationHandler.validatePayload(req.body,'populateRecurringTask','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        let currentDate = req.body.currentDate;
        let result = await projectHandler.populateRecurringTask(currentDate, loggedUser, tenant);
        res.send(result);
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "populateRecurringTask", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "populateRecurringTask", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "populateRecurringTask Api call finished and result is returned.", "PMSRouter", "populateRecurringTask", loggedUser, tenant, moduleName);
})

//ADD TASK DATA  TO  RECURRING  TABLE
router.post('/recurringTaskByProject', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'recurringTaskByProject','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"recurringTaskByProject",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/recurringTaskByProject', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.recurringTaskByProject(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "recurringTaskByProject", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "recurringTaskByProject", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "recurringTaskByProject Api call finished and result is returned.", "PMSRouter", "recurringTaskByProject", loggedUser, tenant, moduleName);
})

//ADD TASK DATA  TO  RECURRING  TABLE
router.post('/getRecurringSubTask', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getRecurringSubTask','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getRecurringSubTask",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getRecurringSubTask', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getRecurringSubTask(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getRecurringSubTask", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getRecurringSubTask", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getRecurringSubTask Api call finished and result is returned.", "PMSRouter", "getRecurringSubTask", loggedUser, tenant, moduleName);
})

router.post('/stopRecurringTask', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'stopRecurringTask','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"stopRecurringTask",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/stopRecurringTask', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.stopRecurringTask(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "stopRecurringTask", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "stopRecurringTask", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "stopRecurringTask Api call finished and result is returned.", "PMSRouter", "stopRecurringTask", loggedUser, tenant, moduleName);
})

router.post('/postponeTask', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'postponeTask','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"postponeTask",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/postponeTask', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess || req.body.isFromWhatsApp) {
            const result = await projectHandler.postponeTask(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "postponeTask", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "postponeTask", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "postponeTask Api call finished and result is returned.", "PMSRouter", "postponeTask", loggedUser, tenant, moduleName);
})

router.post('/addMultiReccTask', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'addMultiReccTask','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addMultiReccTask",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/addMultiReccTask', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.addMultiReccTask(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "addMultiReccTask", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "addMultiReccTask", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "addMultiReccTask Api call finished and result is returned.", "PMSRouter", "addMultiReccTask", loggedUser, tenant, moduleName);
})

router.post('/cancelRecurringTask', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'cancelRecurringTask','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"cancelRecurringTask",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/cancelRecurringTask', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.cancelRecurringTask(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "cancelRecurringTask", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "cancelRecurringTask", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "cancelRecurringTask Api call finished and result is returned.", "PMSRouter", "cancelRecurringTask", loggedUser, tenant, moduleName);
})

router.post('/populateRecurringDates', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'populateRecurringDates','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"populateRecurringDates",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/populateRecurringDates', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.populateRecurringDates(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "populateRecurringDates", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "populateRecurringDates", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "populateRecurringDates Api call finished and result is returned.", "PMSRouter", "populateRecurringDates", loggedUser, tenant, moduleName);
})

router.post('/addIssueToMilestone', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'addIssueToMilestone','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addIssueToMilestone",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/addIssueToMilestone', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.addIssueToMilestone(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "addIssueToMilestone", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "addIssueToMilestone", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "addIssueToMilestone Api call finished and result is returned.", "PMSRouter", "addIssueToMilestone", loggedUser, tenant, moduleName);
})

router.post('/changeIssueMilestone', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'changeIssueMilestone','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"changeIssueMilestone",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/changeIssueMilestone', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.changeIssueMilestone(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "changeIssueMilestone", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "changeIssueMilestone", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "changeIssueMilestone Api call finished and result is returned.", "PMSRouter", "changeIssueMilestone", loggedUser, tenant, moduleName);
})

router.post('/removeIssueFromMilestone', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'removeIssueFromMilestone','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"removeIssueFromMilestone",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/removeIssueFromMilestone', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.removeIssueFromMilestone(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "removeIssueFromMilestone", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "removeIssueFromMilestone", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "removeIssueFromMilestone Api call finished and result is returned.", "PMSRouter", "removeIssueFromMilestone", loggedUser, tenant, moduleName);
})

router.post('/getIssuesUnderMilestone', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getIssuesUnderMilestone','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getIssuesUnderMilestone",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getIssuesUnderMilestone', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getIssuesUnderMilestone(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getIssuesUnderMilestone", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getIssuesUnderMilestone", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getIssuesUnderMilestone Api call finished and result is returned.", "PMSRouter", "getIssuesUnderMilestone", loggedUser, tenant, moduleName);
})
// Convert task to issue
router.post('/convertTaskToIssue', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'convertTaskToIssue','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"convertTaskToIssue",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/convertTaskToIssue', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.convertTaskToIssue(req,req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "convertTaskToIssue", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "convertTaskToIssue", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "convertTaskToIssue Api call finished and result is returned.", "PMSRouter", "convertTaskToIssue", loggedUser, tenant, moduleName);
})

//CONVERT ISSUE TO TASK
router.post('/issueToTask', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'issueToTask','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"issueToTask",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/issueToTask', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.issueToTask(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "issueToTask", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "issueToTask", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "issueToTask Api call finished and result is returned.", "PMSRouter", "issueToTask", loggedUser, tenant, moduleName);
})

router.post('/addfunctionalroles', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'addfunctionalroles','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addfunctionalroles",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/addfunctionalroles', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.addfunctionalroles(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "addfunctionalroles", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "addfunctionalroles", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "addfunctionalroles Api call finished and result is returned.", "PMSRouter", "addfunctionalroles", loggedUser, tenant, moduleName);
})

router.post('/fetchfunctionalroles', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'fetchfunctionalroles','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"fetchfunctionalroles",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/fetchfunctionalroles', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.fetchfunctionalroles(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "fetchfunctionalroles", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "fetchfunctionalroles", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "fetchfunctionalroles Api call finished and result is returned.", "PMSRouter", "fetchfunctionalroles", loggedUser, tenant, moduleName);
})
router.post('/editfunctionalrole', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'editfunctionalrole','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"editfunctionalrole",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/editfunctionalrole', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.editfunctionalrole(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "editfunctionalrole", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "editfunctionalrole", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "editfunctionalrole Api call finished and result is returned.", "PMSRouter", "editfunctionalrole", loggedUser, tenant, moduleName);
})
router.post('/deleteFunctionalRole', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'deleteFunctionalRole','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"deleteFunctionalRole",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/deleteFunctionalRole', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.deleteFunctionalRole(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "deleteFunctionalRole", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "deleteFunctionalRole", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "deleteFunctionalRole Api call finished and result is returned.", "PMSRouter", "deleteFunctionalRole", loggedUser, tenant, moduleName);
})

//COUNT  OF ISSUE BY STATUS
router.post('/issueCountByStatus', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let result
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'issueCountByStatus','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"issueCountByStatus",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/issueCountByStatus', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            result = await projectHandler.issueCountByStatus(req.body,0, loggedUser, tenant);
            
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "issueCountByStatus", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "issueCountByStatus", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "issueCountByStatus Api call finished and result is returned.", "PMSRouter", "issueCountByStatus", loggedUser, tenant, moduleName);
    res.send(result);
})
//COUNT  OF PROJECT BY STATUS
router.post('/projectCountByStatus', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'projectCountByStatus','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"projectCountByStatus",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/issueCountByStatus', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.projectCountByStatus(req.body,0, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "projectCountByStatus", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "projectCountByStatus", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "projectCountByStatus Api call finished and result is returned.", "PMSRouter", "projectCountByStatus", loggedUser, tenant, moduleName);
})

//COUNT  OF  ISSUE  BY ASSIGNEE  FOR PROJECT MANAGER
router.post('/issueCountByAssignee', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'issueCountByAssignee','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"issueCountByAssignee",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/issueCountByStatus', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.issueCountByAssignee(req.body,0, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "issueCountByAssignee", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "issueCountByAssignee", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "issueCountByAssignee Api call finished and result is returned.", "PMSRouter", "issueCountByAssignee", loggedUser, tenant, moduleName);
})

//COUNT  OF  TASK  BY ASSIGNEE   FOR WIDGET 
router.post('/taskCountByAssignee', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'taskCountByAssignee','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"taskCountByAssignee",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/issueCountByStatus', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.taskCountByAssignee(req.body,0, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "taskCountByAssignee", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "taskCountByAssignee", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "taskCountByAssignee Api call finished and result is returned.", "PMSRouter", "taskCountByAssignee", loggedUser, tenant, moduleName);
})
//COUNT  OF  TASK  BY STATUS FOR WIDGET 
router.post('/taskCountByStatus', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'taskCountByStatus','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"taskCountByStatus",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/taskCountByStatus', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.taskCountByStatus(req.body,0, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "taskCountByStatus", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "taskCountByStatus", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "taskCountByStatus Api call finished and result is returned.", "PMSRouter", "taskCountByStatus", loggedUser, tenant, moduleName);
})

// change user existing functional role
router.post('/changeExistsFuncRole', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'changeExistsFuncRole','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"changeExistsFuncRole",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/changeExistsFuncRole', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.changeExistsFuncRole(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "changeExistsFuncRole", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "changeExistsFuncRole", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "changeExistsFuncRole Api call finished and result is returned.", "PMSRouter", "changeExistsFuncRole", loggedUser, tenant, moduleName);
})

//COUNT  OF  TASK  BY PRIORITY FOR WIDGET 
router.post('/taskCountByPriority', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'taskCountByPriority','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"taskCountByPriority",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/taskCountByPriority', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.taskCountByPriority(req.body,0, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "taskCountByPriority", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "taskCountByPriority", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "taskCountByPriority Api call finished and result is returned.", "PMSRouter", "taskCountByPriority", loggedUser, tenant, moduleName);
})


//COUNT  OF  ISUES  BY PROJECT FOR WIDGET 
router.post('/issueCountByProject', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'issueCountByProject','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"issueCountByProject",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/issueCountByProject', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.issueCountByProject(req.body,0, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "issueCountByProject", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "issueCountByProject", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "issueCountByProject Api call finished and result is returned.", "PMSRouter", "issueCountByProject", loggedUser, tenant, moduleName);
})


//COUNT  OF  TASKS  BY PROJECT FOR WIDGET 
router.post('/taskCountByProject', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'taskCountByProject','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"taskCountByProject",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/taskCountByProject', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.taskCountByProject(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "taskCountByProject", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "taskCountByProject", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "taskCountByProject Api call finished and result is returned.", "PMSRouter", "taskCountByProject", loggedUser, tenant, moduleName);
})
//EDITABLE FIELD OF TASKS  FOR WIDGET 
router.post('/getEditableTaskFields', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out={
        status:"Success",
        statusCode:200,
        message:"Successfully fetched the editable fields of task",
        data:['Project','Assignee','Status','Priority']
    }
    try {
        await validationHandler.validatePayload(req.body,'getEditableTaskFields','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getEditableTaskFields",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getEditableTaskFields', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out.data = out.data.sort();
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getEditableTaskFields", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getEditableTaskFields", loggedUser, tenant, moduleName);
        out.status = "Failed";
        out.message = "Internal server error";
        out.statusCode = 500;
        out.data=[]
    }
    appLogger.logMessage("info", "getEditableTaskFields Api call finished and result is returned.", "PMSRouter", "getEditableTaskFields", loggedUser, tenant, moduleName);
    res.send(out);
})

//COUNT  OF ISSUE BY PRIORITY
router.post('/issueCountByPriority', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'issueCountByPriority','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"issueCountByPriority",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/issueCountByPriority', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.issueCountByPriority(req.body,0, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "issueCountByPriority", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "issueCountByPriority", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "issueCountByPriority Api call finished and result is returned.", "PMSRouter", "issueCountByPriority", loggedUser, tenant, moduleName);
})

//COUNT  OF ISSUE BY ASSIGNED BY
router.post('/issueCountByAssignedBy', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'issueCountByAssignedBy','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"issueCountByAssignedBy",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/issueCountByAssignedBy', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.issueCountByAssignedBy(req.body,0, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "issueCountByAssignedBy", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "issueCountByAssignedBy", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "issueCountByAssignedBy Api call finished and result is returned.", "PMSRouter", "issueCountByAssignedBy", loggedUser, tenant, moduleName);
})

//COUNT  OF ISSUE BY ASSIGNED BY
router.post('/issueCountByCreatedBy', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'issueCountByCreatedBy','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"issueCountByCreatedBy",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/issueCountByCreatedBy', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.issueCountByCreatedBy(req.body,0, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "issueCountByCreatedBy", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "issueCountByCreatedBy", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "issueCountByCreatedBy Api call finished and result is returned.", "PMSRouter", "issueCountByCreatedBy", loggedUser, tenant, moduleName);
})

//EDITABLE FIELD OF PROJECT  FOR WIDGET 
router.post('/getEditableProjectFields', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out={
        status:"Success",
        statusCode:200,
        message:"Successfully fetched the editable fields of project",
        data:['Status','Progress']
    }
    try {
        await validationHandler.validatePayload(req.body,'getEditableProjectFields','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getEditableProjectFields",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getEditableProjectFields', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out.data = out.data.sort();
        } else {
            out={ status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getEditableProjectFields", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getEditableProjectFields", loggedUser, tenant, moduleName);
        out.status = "Failed";
        out.message = "Internal server error";
        out.statusCode = 500;
        out.data=[]
    }
    appLogger.logMessage("info", "getEditableProjectFields Api call finished and result is returned.", "PMSRouter", "getEditableProjectFields", loggedUser, tenant, moduleName);
    res.send(out);
})

router.post('/getIssuesBasedOnSeverity', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getIssuesBasedOnSeverity','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getIssuesBasedOnSeverity",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getIssuesBasedOnSeverity', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getIssuesBasedOnSeverity(req,0, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getIssuesBasedOnSeverity", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getIssuesBasedOnSeverity", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getIssuesBasedOnSeverity Api call finished and result is returned.", "PMSRouter", "getIssuesBasedOnSeverity", loggedUser, tenant, moduleName);
})

router.post('/getEditableIssueFields',async (req,res)=>{
    appLogger.logMessage('info',"getEditableIssueFields called","Router","getEditableIssueFields",req.body.loggedUser,req.body.tenant,moduleName);
    let out = {
        status:"Success",
        statusCode:200,
        message:"Successfully fetched the editable fields of issues",
        data:[
            "Projects",
            "Assignee",
            "Assigned By",
            "Priority",
            "Severity",
            "Status", 
            "Created By"
        ]
    }
    try {
        let jtoken = req.headers.authorization?.split(" ")[1]
        await validationHandler.validatePayload(req.body,'getEditableProjectFields','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getEditableProjectFields",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getEditableProjectFields', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out.data = out.data.sort();
        } else {
            out={ status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
       
    } catch (error) {
        appLogger.logMessage("error","Failed to fetch fields for issue: "+JSON.stringify(error.message),"Router","getEditableIssueFields",req.body.loggedUser,req.body.tenant,moduleName);
        out.status = "Failed";
        out.message = "Failed to fetch fields for issue due to: "+JSON.stringify(error.message);
        out.data = [];
    }
    res.send(out);
})

router.post('/createDashboard',async (req,res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let out = {
        status:"Success",
        message:"Successfully created the dashboard for the user",
        data:{}
    }
    try {
        let jtoken = req.headers.authorization?.split(" ")[1]
        await validationHandler.validatePayload(req.body,'createDashboard','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(req.body.tenantId,req.body.tenant,req.body.loggedUser,moduleName,"createDashoard",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId, jtoken, req.body.loggedUser, 'PMSRouter', 'createDashboard', req.body.tenantId, req.body.tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.createDashboard(req, req.body.loggedUser, req.body.tenant);
        } else {
            out={ status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(req.body.tenant, req.body.loggedUser, "PMSRouter", "createDashboard", startDateTime, endDateTime, diffInMS, moduleName);
    } catch (error) {
        out.status = "Failure";
        out.message = "Internal server error";
        out.data = "Error due to: "+JSON.stringify(error.message);
        appLogger.logMessage("error",out.data,"Router","createDashboard",req.body.loggedUser,req.body.tenant,moduleName);
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"createDashboard",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
})

router.post('/createWidget',async (req,res)=>{
    appLogger.logMessage("info","/createDashboard api called","Router","createWidget",req.body.loggedUser,req.body.tenant,moduleName);
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let out = {
        status:"Success",
        message:"Successfully created the widget.",
        statusCode:200,
        data:{}
        
    }
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await authHandler.insertAuditLog(req.body.tenantId,req.body.tenant,req.body.loggedUser,moduleName,"createDashoard",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, req.body.loggedUser, 'PMSRouter', 'createWidget', req.body.tenantId, req.body.tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.createWidget(req, req.body.loggedUser, req.body.tenant);
        } else {
            out={status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(req.body.tenant, req.body.loggedUser, "PMSRouter", "createWidget", startDateTime, endDateTime, diffInMS, moduleName);
    } catch (error) {
        out.status = "Failure";
        out.message = "Internal server error";
        out.data = "Error due to: "+JSON.stringify(error.message);
        appLogger.logMessage("error",out.data,"PMSRouter","createWidget",req.body.loggedUser,req.body.tenant,moduleName);
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"createWidget",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
})

//TASK PROGRESS OF PROJECTS FOR PM
router.post('/getTaskProgress', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getTaskProgress','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getTaskProgress",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getTaskProgress', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getTaskProgress(req.body,0, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getTaskProgress", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getTaskProgress", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getTaskProgress Api call finished and result is returned.", "PMSRouter", "getTaskProgress", loggedUser, tenant, moduleName);
})

//PROJECT PROGRESS  FOR PM
router.post('/getProjectProgress', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getProjectProgress','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getProjectProgress",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getProjectProgress', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getProjectProgress(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getProjectProgress", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getProjectProgress", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getProjectProgress Api call finished and result is returned.", "PMSRouter", "getProjectProgress", loggedUser, tenant, moduleName);
})

router.post('/editDashboard', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let out = {
        status: "Success",
        message: "Successfully updated the dashboard",
        data: [],
        statusCode:200
    }
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body, 'editDashboard', 'PMSRouter', moduleName, appLogger, meteringLogger, req.body.tenant, req.body.loggedUser)
        await authHandler.insertAuditLog(req.body.tenantId, req.body.tenant, req.body.loggedUser, moduleName, "editDashboard", appLogger, meteringLogger, appLogger, meteringLogger)
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId, jtoken, req.body.loggedUser, 'PMSRouter', '/editDashboard', req.body.tenantId, req.body.tenant, appLogger, meteringLogger, moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.editDashboard(req, req.body.loggedUser, req.body.tenant);
        } else {
            out={status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode} ;
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(req.body.tenant, req.body.loggedUser, "PMSRouter", "editDashboard", startDateTime, endDateTime, diffInMS, moduleName);
    } catch (error) {
        out.status = "Failure";
        out.message = "Internal server error";
        out.data = "Failed to update dashboard due to: " + JSON.stringify(error.message);
        appLogger.logMessage("error", out.data, "PMSRouter", "editDashboard", req.body.loggedUser, req.body.tenant, moduleName);
    }
    out = await responseHandler.sendResponse(out.status, out.message, out.statusCode, out.data, false, "editDashboard", req.body.tenant, req.body.loggedUser, moduleName, appLogger, meteringLogger);
    res.send(out);
})

//GET PROJECT COUNT
router.post('/getProjectCount', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getProjectCount','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getProjectCount",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getProjectCount', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getProjectCount(req,req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getProjectCount", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getProjectCount", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getProjectCount Api call finished and result is returned.", "PMSRouter", "getProjectCount", loggedUser, tenant, moduleName);
})

router.post('/getDashboard', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:" Dashboard fetched  successfully ",
        data:[true],
        statusCode:200
    }
    try {
        await validationHandler.validatePayload(req.body,'getDashboard','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getDashboard",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/getDashboard', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.getDashboard(req, loggedUser, tenant);
        } else {
            out={ status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "getDashboard", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "getDashboard", loggedUser, tenant,moduleName);
        out.status="Failure"
        out.message="Failure to fetch dashboard"
        out.data=JSON.stringify(e.message);
        out.statusCode=500
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"getDashboard",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
})
router.post('/getEditableFields',async (req,res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info","/getEditableFields called","PMSRouter","getEditableFields",req.body.loggedUser,req.body.tenant,moduleName);
    let out = {
        status:"Success",
        message:"Successfully fetched editable fields",
        data:[],
        statusCode:200
    }
    try {
        let category = req.body.category;
        if(category){
            if(String(category).toLowerCase() == "tasks"){
                out.data = ['Project','Assignee','Status','Priority'];
            } else if (String(category).toLowerCase() == "issues") {
                out.data = [
                    "Projects",
                    "Assignee",
                    "Assigned By",
                    "Priority",
                    "Severity",
                    "Status",
                    "Created By"
                ]
            }else if(String(category).toLowerCase() == "projects"){
                out.data = ['Status','Progress'];
            }else{
                out.status ="Failure";
                out.message = "Invalid category: "+category+". Supported categories are: Issues,Tasks,Projects";
            }
            if(Array.isArray(out.data)){
                out.data = out.data.sort();
            }
        }else{
            out.status = "Failure";
            out.message = "Missing parameter (category)";
            out.statusCode = 500
        }
    } catch (error) {
        out.status = "Failure";
        out.message = "Internal server error";
        out.data = "Failed to fetch editable fields due to: "+JSON.stringify(error.message);
        appLogger.logMessage("error",out.data,"PMSRouter","getEditableFields",req.body.loggedUser,req.body.tenant,moduleName);
    }
    endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
    meteringLogger.logMessage(req.body.tenant, req.body.loggedUser, "PMSRouter", "getEditableFields", startDateTime, endDateTime, diffInMS, moduleName);
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"getEditableFields",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out)
})
router.post('/deleteDashboard', async (req, res) => {
    endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "/deleteDashboard called", "PMSRouter", "deleteDashboard", req.body.loggedUser, req.body.tenant, moduleName);
    let out = {
        status: "Success",
        message: "Deleted dashboard successfully",
        data: [],
        statusCode: 200
    }
    try {
        let jtoken = req.headers.authorization?.split(" ")[1]
        await validationHandler.validatePayload(req.body,'deleteDashboard','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(req.body.tenantId,req.body.tenant,req.body.loggedUser,moduleName,"deleteDashboard",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId, jtoken, req.body.loggedUser, 'PMSRouter', '/deleteDashboard', req.body.tenantId, req.body.tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.deleteDashboard(req,req.body.loggedUser,req.body.tenant);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
    } catch (error) {
        out.status = "Failure";
        out.message = "Internal server error";
        out.statusCode = 500;
        out.data = "Failed to delete dashboard due to: " + JSON.stringify(error.message);
        appLogger.logMessage("error", out.data, "PMSRouter", "deleteDashboard", req.body.loggedUser, req.body.tenant, moduleName);
    }
    endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
    meteringLogger.logMessage(req.body.tenant, req.body.loggedUser, "PMSRouter", "deleteDashboard", startDateTime, endDateTime, diffInMS, moduleName);
    out = await responseHandler.sendResponse(out.status, out.message, out.statusCode, out.data, false, "deleteDashboard", req.body.tenant, req.body.loggedUser, moduleName, appLogger, meteringLogger);
    res.send(out);
})

// GET DASHBORAD OF USER 
router.post('/getUserDashboard', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out = {
        status:"Success",
        message:" Dashboard fetched  successfully ",
        data:[true],
        statusCode:200
    }
    try {
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getUserDashboard",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/getUserDashboard', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.getUserDashboard(req, loggedUser, tenant);
        } else {
            out={ status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "getUserDashboard", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "getUserDashboard", loggedUser, tenant,moduleName);
        out.status="Failure"
        out.message="Failure to fetch dashboard"
        out.data=JSON.stringify(e.message);
        out.statusCode=500
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"getUserDashboard",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
    res.send(out);
})

router.post('/deleteWidget', async (req, res) => {
    endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "/deleteWidget called", "PMSRouter", "deleteWidget", req.body.loggedUser, req.body.tenant, moduleName);
    let out = {
        status: "Success",
        message: "Successfully deleted widget",
        data: [],
        statusCode: 200
    }
    try {
        let jtoken = req.headers.authorization?.split(" ")[1]
        await validationHandler.validatePayload(req.body,'deleteWidget','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(req.body.tenantId,req.body.tenant,req.body.loggedUser,moduleName,"deleteWidget",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId, jtoken, req.body.loggedUser, 'PMSRouter', '/deleteWidget', req.body.tenantId, req.body.tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.deleteWidget(req,req.body.loggedUser,req.body.tenant);
            if(String(out.status).toLowerCase() == "success"){
                out.message = "Successfully deleted widget";
            }
        } else {
            out={ status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
    } catch (error) {
        out.status = "Failure";
        out.message = "Internal server error";
        out.statusCode = 500;
        out.data = "Failed to delete widget due to: " + JSON.stringify(error.message);
        appLogger.logMessage("error", out.data, "PMSRouter", "deleteWidget", req.body.loggedUser, req.body.tenant, moduleName);
    }
    endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
    meteringLogger.logMessage(req.body.tenant, req.body.loggedUser, "PMSRouter", "deleteWidget", startDateTime, endDateTime, diffInMS, moduleName);
    out = await responseHandler.sendResponse(out.status, out.message, out.statusCode, out.data, false, "deleteWidget", req.body.tenant, req.body.loggedUser, moduleName, appLogger, meteringLogger);
    res.send(out);
})

// FETCH PROJECTS FOR DASHBOARD 
router.post('/fetchProjectsForDashboard', async (req, res) => {
    endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "/fetchProjectsForDashboard called", "PMSRouter", "fetchProjectsForDashboard", req.body.loggedUser, req.body.tenant, moduleName);
    let out = {
        status: "Success",
        message: "Successfully fetched projects",
        data: [],
        statusCode: 200
    }
    try {
        let jtoken = req.headers.authorization?.split(" ")[1]
        await validationHandler.validatePayload(req.body,'fetchProjectsForDashboard','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(req.body.tenantId,req.body.tenant,req.body.loggedUser,moduleName,"fetchProjectsForDashboard",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId, jtoken, req.body.loggedUser, 'PMSRouter', '/fetchProjectsForDashboard', req.body.tenantId, req.body.tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.fetchProjectsForDashboard(req,req.body.loggedUser,req.body.tenant);
            
        } else {
            out={ status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
    } catch (error) {
        out.status = "Failure";
        out.message = "Internal server error";
        out.statusCode = 500;
        out.data = "Failed to fetch dashboard  due to: " + JSON.stringify(error.message);
        appLogger.logMessage("error", out.data, "PMSRouter", "fetchProjectsForDashboard", req.body.loggedUser, req.body.tenant, moduleName);
    }
    endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
    meteringLogger.logMessage(req.body.tenant, req.body.loggedUser, "PMSRouter", "fetchProjectsForDashboard", startDateTime, endDateTime, diffInMS, moduleName);
    out = await responseHandler.sendResponse(out.status, out.message, out.statusCode, out.data, false, "fetchProjectsForDashboard", req.body.tenant, req.body.loggedUser, moduleName, appLogger, meteringLogger);
    res.send(out);
})
// GET ALL EXPENSE TYPES FOR THE TENANT (COMBINATION OF PREDEFINED & CUSTOM TYPES
// (ALL TYPES WITH TENANT_ID 0 IS CONSIDERED AS PREDEFINED TYPES THAT ARE COMMON FOR ALL TENANTS) 
// CUSTOM TYPES ARE MAPPED WITH EACH TENANT)
router.post('/getAllExpType', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "Get all expense types for the tenant "+tenant, "PMSRouter", "getAllExpType", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body,'getAllExpType','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getAllExpType",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getAllExpType', tenantId, tenant,appLogger,meteringLogger,moduleName)
        auth[0].isSuccess = true;
        if (auth[0].isSuccess) {
            const result = await projectHandler.getAllExpType(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getAllExpType", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getAllExpType", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getAllExpType Api call finished and result is returned.", "PMSRouter", "getAllExpType", loggedUser, tenant, moduleName);
})

// ADD NEW EXPENSE TYPE FOR A TENANT
router.post('/addNewExpType', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let expTypeName = req.body.expTypeName;
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "Adding new expe type "+expTypeName+" for the tenant "+tenant, "PMSRouter", "addNewExpType", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body,'addNewExpType','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addNewExpType",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/addNewExpType', tenantId, tenant,appLogger,meteringLogger,moduleName)
        auth[0].isSuccess = true;
        if (auth[0].isSuccess) {
            const result = await projectHandler.addNewExpType(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "addNewExpType", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "addNewExpType", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "addNewExpType Api call finished and result is returned.", "PMSRouter", "addNewExpType", loggedUser, tenant, moduleName);
})
// ADD NEW EXPENSES FOR TASKS UNDER A PROJECT IN A TENANT
router.post('/addExpenditure', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token;
    let loggedUser = req.body.loggedUser;
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let expTypeID = req.body.expTypeID;
    let projectID = req.body.projectID;
    let taskID = req.body.taskID;
    let expAmnt = req.body.expAmnt;
    let description = req.body.description;
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "Adding expense amount for  "+taskID+" for the tenant "+tenant, "PMSRouter", "addExpenditure", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body,'addExpenditure','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addExpenditure",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/addExpenditure', tenantId, tenant,appLogger,meteringLogger,moduleName)
        auth[0].isSuccess = true;
        if (auth[0].isSuccess) {
            const result = await projectHandler.addExpenditure(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "addExpenditure", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "addExpenditure", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "addExpenditure Api call finished and result is returned.", "PMSRouter", "addExpenditure", loggedUser, tenant, moduleName);
})

//CONVERT SUB TASK TO MAIN TASK
router.post('/subTaskToMainTask', async (req, res) => {
    endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "/subTaskToMainTask called", "PMSRouter", "subTaskToMainTask", req.body.loggedUser, req.body.tenant, moduleName);
    let tenant = req.body.tenant;
    let tenantId = req.body.tenantId;
    let loggedUserId = req.body.loggedUserId;
    let loggedUser = req.body.loggedUser;
    let out = {
        status: "Success",
        message: "Successfully converted sub task to main task",
        data: [],
        statusCode: 200
    }
    try {
        let jtoken = req.headers.authorization?.split(" ")[1]
        await validationHandler.validatePayload(req.body,'subTaskToMainTask','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"subTaskToMainTask",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/subTaskToMainTask', req.body.tenantId, tenant,appLogger,meteringLogger,moduleName)
        auth[0].isSuccess = true;
        if (auth[0].isSuccess) {
            out = await projectHandler.subTaskToMainTask(req,req.body.loggedUser,req.body.tenant);
        } else {
            out={ status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
    } catch (error) {
        out.status = "Failure";
        out.message = "Internal server error";
        out.statusCode = 500;
        out.data = "Failed to sub task to main task due to: " + JSON.stringify(error.message);
        appLogger.logMessage("error", out.data, "PMSRouter", "subTaskToMainTask", req.body.loggedUser, req.body.tenant, moduleName);
    }
    endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
    meteringLogger.logMessage(req.body.tenant, req.body.loggedUser, "PMSRouter", "subTaskToMainTask", startDateTime, endDateTime, diffInMS, moduleName);
    out = await responseHandler.sendResponse(out.status, out.message, out.statusCode, out.data, false, "subTaskToMainTask", req.body.tenant, req.body.loggedUser, moduleName, appLogger, meteringLogger);
    res.send(out);
})

router.post('/convertMainTaskTosubTask', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'convertMainTaskTosubTask','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"convertMainTaskTosubTask",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/convertMainTaskTosubTask', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.convertMainTaskTosubTask(req,req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "convertMainTaskTosubTask", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "convertMainTaskTosubTask", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "convertMainTaskTosubTask Api call finished and result is returned.", "PMSRouter", "convertMainTaskTosubTask", loggedUser, tenant, moduleName);
})

router.post('/getOverallProjectStatus', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getOverallProjectStatus','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getOverallProjectStatus",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getOverallProjectStatus', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getOverallProjectStatus(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getOverallProjectStatus", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getOverallProjectStatus", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getOverallProjectStatus Api call finished and result is returned.", "PMSRouter", "getOverallProjectStatus", loggedUser, tenant, moduleName);
})
router.post('/getOverallProjectProgress', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getOverallProjectProgress','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getOverallProjectProgress",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getOverallProjectProgress', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getOverallProjectProgress(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getOverallProjectProgress", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getOverallProjectProgress", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getOverallProjectProgress Api call finished and result is returned.", "PMSRouter", "getOverallProjectProgress", loggedUser, tenant, moduleName);
})
router.post('/getOverallProjectBudget', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    try {
        await validationHandler.validatePayload(req.body,'getOverallProjectBudget','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getOverallProjectBudget",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getOverallProjectBudget', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getOverallProjectBudget(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getOverallProjectBudget", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getOverallProjectBudget", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getOverallProjectBudget Api call finished and result is returned.", "PMSRouter", "getOverallProjectBudget", loggedUser, tenant, moduleName);
})

router.post('/getIPProjects', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "getIPProjects Api invoked", "PMSRouter", "getIPProjects", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body,'getIPProjects','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getIPProjects",appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getIPProjects', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getIPProjects(loggedUser, tenant);
            res.send(result);

        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode  });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getIPProjects", startDateTime, endDateTime, diffInMS, moduleName);
    }catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getIPProjects", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getIPProjects Api call finished and result is returned.", "PMSRouter", "getIPProjects", loggedUser, tenant, moduleName);
})

router.post('/fetchTag', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out
    try {
        await validationHandler.validatePayload(req.body,'fetchTag','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"fetchTag",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/fetchTag', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.fetchTag(req, loggedUser, tenant);
           // res.send(result);
        } else {
            out={ status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "fetchTag", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "fetchTag", loggedUser, tenant, moduleName);
        out={ status: 'Failure', message: e, statusCode: 500 };
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"fetchTag",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
    appLogger.logMessage("info", "fetchTag Api call finished and result is returned.", "PMSRouter", "fetchTag", loggedUser, tenant, moduleName);
    res.send(out)
})

router.post('/updateTag', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out 
    try {
        await validationHandler.validatePayload(req.body,'updateTag','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"updateTag",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/updateTag', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            out = await projectHandler.updateTag(req, loggedUser, tenant);
            // res.send(result);
        } else {
            out={ status: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode };
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "updateTag", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "updateTag", loggedUser, tenant, moduleName);
        out={ status: 'Failure', message: e, statusCode: 500 };
    }
    out = await responseHandler.sendResponse(out.status,out.message,out.statusCode,out.data,false,"updateTag",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
    appLogger.logMessage("info", "updateTag Api call finished and result is returned.", "PMSRouter", "updateTag", loggedUser, tenant, moduleName);
    res.send(out)
})

//GET COMPLETED PROJECT COUNT
router.post('/completedTaskCountForPM', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "completedTaskCountForPM Api invoked", "PMSRouter", "completedTaskCountForPM", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body,'completedTaskCountForPM','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"completedTaskCountForPM",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/completedTaskCountForPM', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.completedTaskCountForPM(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "completedTaskCountForPM", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "completedTaskCountForPM", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "completedTaskCountForPM Api call finished and result is returned.", "PMSRouter", "completedTaskCountForPM", loggedUser, tenant, moduleName);
})

//GET COMPLETED TASK COUNT FOR PM
router.post('/completedTaskCountForEmp', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "completedTaskCountForEmp Api invoked", "PMSRouter", "completedTaskCountForEmp", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body,'completedTaskCountForEmp','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"completedTaskCountForEmp",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/completedTaskCountForEmp', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.completedTaskCountForEmp(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "completedTaskCountForEmp", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "completedTaskCountForEmp", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "completedTaskCountForEmp Api call finished and result is returned.", "PMSRouter", "completedTaskCountForEmp", loggedUser, tenant, moduleName);
})
//GET COMPLETED TASK COUNT FOR PM
router.post('/fetchIssuesForDashboard', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "fetchIssuesForDashboard Api invoked", "PMSRouter", "fetchIssuesForDashboard", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body,'fetchTag','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"fetchIssuesForDashboard",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/fetchIssuesForDashboard', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.fetchIssuesForDashboard(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "fetchIssuesForDashboard", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "fetchIssuesForDashboard", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "fetchIssuesForDashboard Api call finished and result is returned.", "PMSRouter", "fetchIssuesForDashboard", loggedUser, tenant, moduleName);
})

router.post('/getProjectMainTasks', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "getProjectMainTasks Api invoked", "PMSRouter", "getProjectMainTasks", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body,'getProjectMainTasks','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getProjectMainTasks",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getProjectMainTasks', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getProjectMainTasks(req, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getProjectMainTasks", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getProjectMainTasks", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getProjectMainTasks Api call finished and result is returned.", "PMSRouter", "getProjectMainTasks", loggedUser, tenant, moduleName);
})

// EDIT PROJECT DEATAILS
router.post('/editProjectDetails', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "editProjectDetails Api invoked", "PMSRouter", "editProjectDetails", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body,'editProjectDetails','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"editProjectDetails",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/editProjectDetails', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.editProjectDetails(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "editProjectDetails", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "editProjectDetails", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "editProjectDetails Api call finished and result is returned.", "PMSRouter", "editProjectDetails", loggedUser, tenant, moduleName);
})


// ADD TASK TO WATCH LIST
router.post('/updateTaskWatchList', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "updateTaskWatchList Api invoked", "PMSRouter", "updateTaskWatchList", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body,'updateTaskWatchList','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"updateTaskWatchList",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/updateTaskWatchList', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.updateTaskWatchList(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "updateTaskWatchList", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "updateWatchList", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "updateWatchList Api call finished and result is returned.", "PMSRouter", "updateWatchList", loggedUser, tenant, moduleName);
})

// ADD PROJECT TO WATCH LIST
router.post('/updateProjectWatchList', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "updateProjectWatchList Api invoked", "PMSRouter", "updateProjectWatchList", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body,'updateProjectWatchList','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"updateProjectWatchList",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/updateProjectWatchList', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.updateProjectWatchList(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "updateProjectWatchList", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "updateProjectWatchList", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "updateProjectWatchList Api call finished and result is returned.", "PMSRouter", "updateProjectWatchList", loggedUser, tenant, moduleName);
})

//GET PROJECT/TASK/ISSUE FROM WATCH LIST
router.post('/getWatchList', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "getWatchList Api invoked", "PMSRouter", "getWatchList", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body,'getWatchList','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getWatchList",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getWatchList', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.getWatchList(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "getWatchList", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getWatchList", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getWatchList Api call finished and result is returned.", "PMSRouter", "getWatchList", loggedUser, tenant, moduleName);
})

//ADD PROGRESS OF TASK
router.post('/addTaskProgress', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "addTaskProgress Api invoked", "PMSRouter", "addTaskProgress", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body,'addTaskProgress','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"addTaskProgress",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/addTaskProgress', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.addTaskProgress(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "addTaskProgress", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "addTaskProgress", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "addTaskProgress Api call finished and result is returned.", "PMSRouter", "addTaskProgress", loggedUser, tenant, moduleName);
})

router.post('/taskApproval', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "taskApproval Api invoked", "PMSRouter", "taskApproval", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body,'taskApproval','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"taskApproval",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/taskApproval', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.taskApproval(req.body, loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "taskApproval", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "taskApproval", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "taskApproval Api call finished and result is returned.", "PMSRouter", "taskApproval", loggedUser, tenant, moduleName);
})

router.post('/watcherDailySummary', async (req, res) => {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "watcherDailySummary Api invoked", "PMSRouter", "watcherDailySummary", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body,'watcherDailySummary','PMSRouter',moduleName,appLogger,meteringLogger,req.body.tenant,req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"watcherDailySummary",appLogger,meteringLogger,appLogger,meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/watcherDailySummary', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess) {
            const result = await projectHandler.watcherDailySummary(loggedUser, tenant);
            res.send(result);
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMSRouter", "watcherDailySummary", startDateTime, endDateTime, diffInMS, moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "watcherDailySummary", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "watcherDailySummary Api call finished and result is returned.", "PMSRouter", "watcherDailySummary", loggedUser, tenant, moduleName);
})

router.post('/getTaskDateRange', async (req, res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "getTaskDateRange Api invoked", "PMSRouter", "getTaskDateRange", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body, 'getTaskDateRange', 'PMSRouter', moduleName, appLogger, meteringLogger, req.body.tenant, req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId, tenant, loggedUser, moduleName, "getTaskDateRange", appLogger, meteringLogger, appLogger, meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getTaskDateRange', tenantId, tenant, appLogger, meteringLogger, moduleName)
        if (auth[0].isSuccess) {
            let out = await projectHandler.getFilteredTaskList(req.body, loggedUser, tenant)
            res.json({ type: out.status, message: out.message, data: out.data });
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getTaskDateRange", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getTaskDateRange Api call finished and result is returned.", "PMSRouter", "getTaskDateRange", loggedUser, tenant, moduleName);
})
//UPDATE PRIORITY AND SEVERITY OF ISSUE INLINE
router.post('/updateIssueDetails', async (req, res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "updateIssueDetails Api invoked", "PMSRouter", "updateIssueDetails", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body, 'updateIssueDetails', 'PMSRouter', moduleName, appLogger, meteringLogger, req.body.tenant, req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId, tenant, loggedUser, moduleName, "updateIssueDetails", appLogger, meteringLogger, appLogger, meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getTaskDateRange', tenantId, tenant, appLogger, meteringLogger, moduleName)
        if (auth[0].isSuccess) {
            let out = await projectHandler.updateIssueDetails(req.body, loggedUser, tenant)
            res.send(out)
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "updateIssueDetails", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "updateIssueDetails Api call finished and result is returned.", "PMSRouter", "updateIssueDetails", loggedUser, tenant, moduleName);
})

router.post('/getProjectOwnerDetails', async (req, res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "getProjectOwnerDetails Api invoked", "PMSRouter", "getProjectOwnerDetails", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body, 'getProjectOwnerDetails', 'PMSRouter', moduleName, appLogger, meteringLogger, req.body.tenant, req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId, tenant, loggedUser, moduleName, "getProjectOwnerDetails", appLogger, meteringLogger, appLogger, meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getTaskDateRange', tenantId, tenant, appLogger, meteringLogger, moduleName)
        if (auth[0].isSuccess) {
            let out = await projectHandler.getProjectOwnerDetails(req.body, loggedUser, tenant)
            res.send(out)
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getProjectOwnerDetails", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "getProjectOwnerDetails Api call finished and result is returned.", "PMSRouter", "getProjectOwnerDetails", loggedUser, tenant, moduleName);
})

router.post('/getPlannerProjects', async (req, res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "Api invoked", "PMSRouter", "getPlannerProjects", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body, 'getPlannerProjects', 'PMSRouter', moduleName, appLogger, meteringLogger, req.body.tenant, req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId, tenant, loggedUser, moduleName, "getPlannerProjects", appLogger, meteringLogger, appLogger, meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getPlannerProjects', tenantId, tenant, appLogger, meteringLogger, moduleName)
        if (auth[0].isSuccess) {
            let out = await projectHandler.getPlannerProjects(req.body, loggedUser, tenant)
            res.send(out)
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getPlannerProjects", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "PMSRouter", "getPlannerProjects", loggedUser, tenant, moduleName);
})

router.post('/getPlannerResources', async (req, res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "Api invoked", "PMSRouter", "getPlannerResources", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body, 'getPlannerResources', 'PMSRouter', moduleName, appLogger, meteringLogger, req.body.tenant, req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId, tenant, loggedUser, moduleName, "getPlannerResources", appLogger, meteringLogger, appLogger, meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getPlannerResources', tenantId, tenant, appLogger, meteringLogger, moduleName)
        if (auth[0].isSuccess) {
            let out = await projectHandler.getPlannerResources(req.body, loggedUser, tenant)
            res.send(out)
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getPlannerResources", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "PMSRouter", "getPlannerResources", loggedUser, tenant, moduleName);
})

router.post('/getPlannerDataOnProjects', async (req, res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "Api invoked", "PMSRouter", "getPlannerDataOnProjects", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body, 'getPlannerDataOnProjects', 'PMSRouter', moduleName, appLogger, meteringLogger, req.body.tenant, req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId, tenant, loggedUser, moduleName, "getPlannerDataOnProjects", appLogger, meteringLogger, appLogger, meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getPlannerDataOnProjects', tenantId, tenant, appLogger, meteringLogger, moduleName)
        if (auth[0].isSuccess) {
            let out = await projectHandler.getPlannerDataOnProjects(req.body, loggedUser, tenant)
            res.send(out)
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getPlannerDataOnProjects", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "PMSRouter", "getPlannerDataOnProjects", loggedUser, tenant, moduleName);
})

router.post('/getPlannerDataOnResources', async (req, res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "Api invoked", "PMSRouter", "getPlannerDataOnResources", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body, 'getPlannerDataOnResources', 'PMSRouter', moduleName, appLogger, meteringLogger, req.body.tenant, req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId, tenant, loggedUser, moduleName, "getPlannerDataOnResources", appLogger, meteringLogger, appLogger, meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getPlannerDataOnResources', tenantId, tenant, appLogger, meteringLogger, moduleName)
        if (auth[0].isSuccess) {
            let out = await projectHandler.getPlannerDataOnResources(req.body, loggedUser, tenant)
            res.send(out)
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getPlannerDataOnResources", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "PMSRouter", "getPlannerDataOnResources", loggedUser, tenant, moduleName);
})

router.post('/getPlannerData', async (req, res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let loggedUserId = req.body.loggedUserId
    let jtoken = req.headers.authorization?.split(" ")[1]
    appLogger.logMessage("info", "Api invoked", "PMSRouter", "getPlannerData", loggedUser, tenant, moduleName);
    try {
        await validationHandler.validatePayload(req.body, 'getPlannerData', 'PMSRouter', moduleName, appLogger, meteringLogger, req.body.tenant, req.body.loggedUser)
        await authHandler.insertAuditLog(tenantId, tenant, loggedUser, moduleName, "getPlannerData", appLogger, meteringLogger, appLogger, meteringLogger)
        let auth = await authHandler.checkAuthentication(loggedUserId, jtoken, loggedUser, 'PMSRouter', '/getPlannerData', tenantId, tenant, appLogger, meteringLogger, moduleName)
        if (auth[0].isSuccess) {
            let out = await projectHandler.getPlannerData(req.body, loggedUser, tenant)
            res.send(out)
        } else {
            res.json({ type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode });
        }
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMSRouter", "getPlannerData", loggedUser, tenant, moduleName);
        res.json({ type: 'Failure', message: e, statusCode: 500 });
    }
    appLogger.logMessage("info", "Api call finished and result is returned.", "PMSRouter", "getPlannerData", loggedUser, tenant, moduleName);
})

router.post('/updateTaskPriority',async(req,res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "/updateTaskPriority api called", "Router", "updateTaskPriority", req.body.loggedUser,req.body.tenant,moduleName);
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out= {
        status:"Success",
        message:"Successfully reassigned the task",
        statusCode:200,
        data: []
    }
    try {
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"updateTaskPriority",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/updateTaskPriority', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess || req.body.isFromWhatsApp) {
            const result = await projectHandler.updateTaskPriority(req);
            out = await responseHandler.sendResponse(result.status,result.message,result.statusCode,result.data,false,"updateTaskPriority",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
        } else {
            out = { type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "updateTaskPriority", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "updateTaskPriority", loggedUser, tenant,moduleName);
        out = { type: 'Failure', message: e.message, statusCode: 500 };
    }
    res.send(out);
})

router.post('/updateTaskStatus',async(req,res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "/updateTaskStatus api called", "Router", "updateTaskDates", req.body.loggedUser,req.body.tenant,moduleName);
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out= {
        status:"Success",
        message:"Successfully updated the task status",
        statusCode:200,
        data: []
    }
    try {
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"updateTaskStatus",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/updateTaskStatus', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess || req.body.isFromWhatsApp) {
            const result = await projectHandler.updateTaskStatus(req);
            out = await responseHandler.sendResponse(result.status,result.message,result.statusCode,result.data,false,"updateTaskStatus",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
        } else {
            out = { type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "updateTaskStatus", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "updateTaskStatus", loggedUser, tenant,moduleName);
        out = { type: 'Failure', message: e.message, statusCode: 500 };
    }
    res.send(out);
})

router.post('/updateTaskDates',async(req,res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "/updateTaskDates api called", "Router", "updateTaskDates", req.body.loggedUser,req.body.tenant,moduleName);
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out= {
        status:"Success",
        message:"Successfully updated the task dates",
        statusCode:200,
        data: []
    }
    try {
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"updateTaskStatus",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/updateTaskStatus', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess || req.body.isFromWhatsApp) {
            const result = await projectHandler.updateTaskDates(req);
            out = await responseHandler.sendResponse(result.status,result.message,result.statusCode,result.data,false,"updateTaskStatus",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
        } else {
            out = { type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "updateTaskStatus", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "updateTaskStatus", loggedUser, tenant,moduleName);
        out = { type: 'Failure', message: e.message, statusCode: 500 };
    }
    res.send(out);
})


router.post('/updateGroupOrder',async(req,res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "/updateGroupOrder api called", "Router", "updateGroupOrder", req.body.loggedUser,req.body.tenant,moduleName);
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out= {
        status:"Success",
        message:"Successfully updated the task dates",
        statusCode:200,
        data: []
    }
    try {
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"updateGroupOrder",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/updateGroupOrder', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess || req.body.isFromWhatsApp) {
            const result = await projectHandler.updateGroupOrder(req);
            out = await responseHandler.sendResponse(result.status,result.message,result.statusCode,result.data,false,"updateGroupOrder",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
        } else {
            out = { type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "updateGroupOrder", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "updateGroupOrder", loggedUser, tenant,moduleName);
        out = { type: 'Failure', message: e.message, statusCode: 500 };
    }
    res.send(out);
})

router.post('/deleteDependency',async(req,res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "/deleteDependency api called", "Router", "deleteDependency", req.body.loggedUser,req.body.tenant,moduleName);
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out= {
        status:"Success",
        message:"Successfully updated the task dates",
        statusCode:200,
        data: []
    }
    try {
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"deleteDependency",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/deleteDependency', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess || req.body.isFromWhatsApp) {
            const result = await projectHandler.deleteDependency(req);
            out = await responseHandler.sendResponse(result.status,result.message,result.statusCode,result.data,false,"deleteDependency",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
        } else {
            out = { type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "deleteDependency", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "deleteDependency", loggedUser, tenant,moduleName);
        out = { type: 'Failure', message: e.message, statusCode: 500 };
    }
    res.send(out);
})


router.post('/getProjectDetailsForSummary',async(req,res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "/getProjectDetailsForSummary api called", "Router", "getProjectDetailsForSummary", req.body.loggedUser,req.body.tenant,moduleName);
    let token = req.body.token
    let loggedUser = req.body.loggedUser
    let tenant = req.body.tenant
    let tenantId = req.body.tenantId
    let jtoken = req.headers.authorization?.split(" ")[1]
    let out= {
        status:"Success",
        message:"Successfully updated the task dates",
        statusCode:200,
        data: []
    }
    try {
        await authHandler.insertAuditLog(tenantId,tenant,loggedUser,moduleName,"getProjectDetailsForSummary",appLogger,meteringLogger);
        let auth = await authHandler.checkAuthentication(req.body.loggedUserId,jtoken, loggedUser, 'PMRouter', '/getProjectDetailsForSummary', tenantId, tenant,appLogger,meteringLogger,moduleName)
        if (auth[0].isSuccess || req.body.isFromWhatsApp) {
            const result = await projectHandler.getProjectDetailsForSummary(req);
            out = await responseHandler.sendResponse(result.status,result.message,result.statusCode,result.data,false,"getProjectDetailsForSummary",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
        } else {
            out = { type: 'Expired', message: auth[0].message, statusCode: auth[0].statusCode }
        }
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "getProjectDetailsForSummary", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "getProjectDetailsForSummary", loggedUser, tenant,moduleName);
        out = { type: 'Failure', message: e.message, statusCode: 500 };
    }
    res.send(out);
})
router.post('/tenantTest',async(req,res)=>{
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "/deleteDependency api called", "Router", "deleteDependency", req.body.loggedUser,req.body.tenant,moduleName);
     let token = req.body.token
     let loggedUser = req.body.loggedUser
     let tenant = req.body.tenant
    let out= {
        status:"Success",
        message:"Successfully updated the task dates",
        statusCode:200,
        data: []
    }
    try {
        const result = await projectHandler.tenantTest(req);
        out = await responseHandler.sendResponse(result.status,result.message,result.statusCode,result.data,false,"deleteDependency",req.body.tenant,req.body.loggedUser,moduleName,appLogger,meteringLogger);
        endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
        meteringLogger.logMessage(tenant, loggedUser, "PMRouter", "deleteDependency", startDateTime, endDateTime, diffInMS,moduleName);
    }
    catch (e) {
        appLogger.logMessage("error", e.message, "PMRouter", "deleteDependency", loggedUser, tenant,moduleName);
        out = { type: 'Failure', message: e.message, statusCode: 500 };
    }
    res.send(out);
})

module.exports = router;

