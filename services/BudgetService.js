let appLogger = require('../logger/Logger').applicationLogger;
let meteringLogger = require('../logger/Logger').meteringLogger;
let dbOperations = require('../../common/connection/mysql/DbOperations');
let mysqlQueries = require('../queries/PMSQueries');
let responseHandler = require('../../common/main/ResponseHandler')
let moment = require('moment');
const axios = require('axios');
const OPEN_EXCHANGE_RATES_API_KEY = 'd88af741811c44349187f83d9a388299';
const currencyCodes = require('currency-codes');
const BudgetSupport = require('./BudgetSupport');
let apiSignatures = require('../config/APISignature.json');


let startDateTime;
let endDateTime;
let diffInMS;
let moduleName = 'PM'
let className = "BudgetService";

module.exports = {
    getAllCurrency: async function (loggedUser,tenant) {
        startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        let result
        appLogger.logMessage("info", "getAllCurrency function begins", className, "getAllCurrency", loggedUser, tenant, moduleName);
        try {
            result = await dbOperations.executeQuery(mysqlQueries.getAllCurrency, [], loggedUser, "getAllCurrency", true, null, tenant, appLogger, meteringLogger, moduleName)
            if (result != undefined && result != null && result.length > 0) {
                appLogger.logMessage("info", "Successfully fetched currency.", className, "getAllCurrency", loggedUser, tenant, moduleName);
                result = await responseHandler.sendResponse("Success", "Successfully fetched currency.", 200, result, true, "getAllCurrency", tenant, loggedUser, moduleName, appLogger, meteringLogger);
            } else {
                appLogger.logMessage("info", "Failed to fetch currency.", className, "getAllCurrency", loggedUser, tenant, moduleName);
                result = await responseHandler.sendResponse("Warning", "Failed to fetch currency.", 400, null, false, "getAllCurrency", tenant, loggedUser, moduleName, appLogger, meteringLogger);
            }
            endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
            meteringLogger.logMessage(tenant, loggedUser, className, "getAllCurrency", startDateTime, endDateTime, diffInMS, moduleName);
        } catch (error) {
            result = await responseHandler.sendResponse("Error", "Error occured " + JSON.stringify(error), 500, null, false, "getAllCurrency", tenant, loggedUser, moduleName, appLogger, meteringLogger);
            appLogger.logMessage("error", "Error occured in  getAllCurrency" + error.message, className, "getAllCurrency", loggedUser, tenant, moduleName);
        }
        appLogger.logMessage("info", "getAllCurrency function completed", className, "getAllCurrency", loggedUser, tenant, moduleName);
        return result;
    },
    
  getCurrency: async function (loggedUser, tenant) {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let result
    appLogger.logMessage("info", "getCurrency function begins", className, "getCurrency", loggedUser, tenant, moduleName);
    try {
      const response = await axios.get('https://restcountries.com/v2/all');
      const currencies = [];
      for (const country of response.data) {
        if (country.currencies) {
          for (const currency of country.currencies) {
            // const currencySymbol = await this.fetchCurrencySymbol(currency.code);
            currencies.push({
              country: country.name,
              currency: currency.name,
              code: currency.code,
              symbol: currency.symbol
            });
          }
        }
      }
      if (currencies != undefined && currencies != null && currencies.length > 0) {
        let insertCurrency = await BudgetSupport.addCurrency(currencies, loggedUser, tenant)
        if (insertCurrency.data.affectedRows > 0) {
          appLogger.logMessage("info", "Successfully added currency.", className, "getCurrency", loggedUser, tenant, moduleName);
          result = await responseHandler.sendResponse("Success", "Successfully added currency.", 200, result, true, "getCurrency", tenant, loggedUser, moduleName, appLogger, meteringLogger);

        } else {
          appLogger.logMessage("info", "Failed to added currency.", className, "getCurrency", loggedUser, tenant, moduleName);
          result = await responseHandler.sendResponse("Warning", "Failed to added currency.", 400, null, false, "getCurrency", tenant, loggedUser, moduleName, appLogger, meteringLogger);

        }
      } else {
        appLogger.logMessage("info", "Failed to add currency.", className, "getCurrency", loggedUser, tenant, moduleName);
        result = await responseHandler.sendResponse("Warning", "Failed to add currency.", 400, null, false, "getCurrency", tenant, loggedUser, moduleName, appLogger, meteringLogger);
      }

      endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
      diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
      meteringLogger.logMessage(tenant, loggedUser, className, "getCurrency", startDateTime, endDateTime, diffInMS, moduleName);
    } catch (error) {
      result = await responseHandler.sendResponse("Error", "Error occured " + JSON.stringify(error), 500, null, false, "getCurrency", tenant, loggedUser, moduleName, appLogger, meteringLogger);
      appLogger.logMessage("error", "Error occured in  getCurrency" + error.message, className, "getCurrency", loggedUser, tenant, moduleName);
    }
    appLogger.logMessage("info", "getCurrency function completed", className, "getCurrency", loggedUser, tenant, moduleName);
    return result;
  },
  getBalanceAmtOfProject: async function (project, tenantId, loggedUser, tenant) {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let result
    appLogger.logMessage("info", "getBalanceAmtOfProject function begins", className, "getBalanceAmtOfProject", loggedUser, tenant, moduleName);
    try {
      result = await dbOperations.executeQuery(mysqlQueries.getBalanceAmtOfProject, [project, tenantId, project, tenantId], loggedUser, "getBalanceAmtOfProject", true, null, tenant, appLogger, meteringLogger, moduleName)
      if (result != undefined && result != null && result.length > 0) {
        appLogger.logMessage("info", "Successfully fetched currency.", className, "getBalanceAmtOfProject", loggedUser, tenant, moduleName);
        result = await responseHandler.sendResponse("Success", "Successfully fetched currency.", 200, result, true, "getBalanceAmtOfProject", tenant, loggedUser, moduleName, appLogger, meteringLogger);
      } else {
        appLogger.logMessage("info", "Failed to fetch currency.", className, "getBalanceAmtOfProject", loggedUser, tenant, moduleName);
        result = await responseHandler.sendResponse("Warning", "Failed to fetch currency.", 400, null, false, "getBalanceAmtOfProject", tenant, loggedUser, moduleName, appLogger, meteringLogger);
      }
      endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
      diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
      meteringLogger.logMessage(tenant, loggedUser, className, "getBalanceAmtOfProject", startDateTime, endDateTime, diffInMS, moduleName);
    } catch (error) {
      result = await responseHandler.sendResponse("Error", "Error occured " + JSON.stringify(error), 500, null, false, "getBalanceAmtOfProject", tenant, loggedUser, moduleName, appLogger, meteringLogger);
      appLogger.logMessage("error", "Error occured in  getBalanceAmtOfProject" + error.message, className, "getBalanceAmtOfProject", loggedUser, tenant, moduleName);
    }
    appLogger.logMessage("info", "getBalanceAmtOfProject function completed", className, "getBalanceAmtOfProject", loggedUser, tenant, moduleName);
    return result;
  },

  //GET MAIN TASKS FROM GPM_TASKS
  getMainTaskExpense: async function (req) {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let out = {
      status: "Success",
      message: "Successfully fetch task",
      data: []
    }
    let response = []
    try {
      let body = req.body;
      let loggedUser = body.loggedUser
      let tenant = body.tenant
      if (body) {
        let requestParams = Object.keys(body);
        let missingParams = [];
        let signatureKeys = Object.keys(apiSignatures.getMainTaskExpense);
        for (let key of signatureKeys) {
          if (!requestParams.includes(key)) {
            missingParams.push(key);
          }
        }
        if (missingParams.length > 0) {
          appLogger.logMessage("error", "Failed to fetch task and expense due to missing parameters: " + JSON.stringify(missingParams), className, "holdOrResume", body.loggedUser, body.tenant);
          out.status = "Failed";
          out.message = "Missing parameters: " + JSON.stringify(missingParams);
        } else {
          let query = mysqlQueries.getMainTaskExpense;
          let param = [req.body.projectId, req.body.tenantId];
          let result = await dbOperations.executeQuery(query, param, loggedUser, "getMainTaskExpense", false, null, tenant, appLogger, meteringLogger, moduleName);
          if (result != null && result != undefined && result != 'Error') {
            if (result.length > 0) {
              let total = 0
              for(data of result){
                total += data.EXP_AMNT
              }
              let expense = {expenses_list:result,total_expenses:total}
              response = expense
              appLogger.logMessage("info", "Task fetched   successfully", className, "getMainTaskExpense", "SELF", "SELF_TENANT");
              out.status = "Success";
              out.message = "TaskExpense fetched successfully";
              out.data = response
              out.statusCode = 200
            } else {
              appLogger.logMessage("info", "Failed to fetch task expense", className, "holdOrResume", "SELF", "SELF_TENANT");
              out.status = "Warning";
              out.message = "No task available";
              out.data = []
              out.statusCode = 404
            }
          } else {
            appLogger.logMessage("info", "Failed to get main task expense", className, "getMainTaskExpense", "SELF", "SELF_TENANT");
            out.status = "Warning";
            out.message = "Failed to fetch task expense";
            out.data = []
            out.statusCode = 404
          }
        }
      } else {
        appLogger.logMessage("error", "Failed to get main task expense due to invalid request body", className, "holdOrResume", "SELF", "SELF_TENANT");
        out.status = "Failed";
        out.message = "Invalid request body";
        out.statusCode = 404
        out.data = []
      }

    } catch (error) {
      appLogger.logMessage("error", "Failed to get MainTasks due to: " + JSON.stringify(error.message), className, "getMainTaskExpense", req.body.loggedUser, req.body.tenant);
      out.status = "Failed";
      out.message = "Internal server error";
      out.data = JSON.stringify(error.message);
    }
    endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
    meteringLogger.logMessage(req.body.tenant, req.body.loggedUser, className, "getMainTaskExpense", startDateTime, endDateTime, diffInMS);
    return out;
  },
  // GET SUB TASK EXPENSE
  getSubTaskExpense: async function (req) {
    startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let out = {
      status: "Success",
      message: "Successfully fetch sub task expense",
      data: []
    }
    try {
      let body = req.body;
      let loggedUser = body.loggedUser
      let tenant = body.tenant
      if (body) {
        let requestParams = Object.keys(body);
        let missingParams = [];
        let signatureKeys = Object.keys(apiSignatures.getSubTaskExpense);
        for (let key of signatureKeys) {
          if (!requestParams.includes(key)) {
            missingParams.push(key);
          }
        }
        if (missingParams.length > 0) {
          appLogger.logMessage("error", "Failed to fetch sub task expense due to missing parameters: " + JSON.stringify(missingParams), className, "getSubTaskExpense", body.loggedUser, body.tenant);
          out.status = "Failed";
          out.message = "Missing parameters: " + JSON.stringify(missingParams);
        } else {
          let query = mysqlQueries.getSubTaskExpense;
          let param = [req.body.projectId,req.body.tenantId,req.body.mainTaskId];
          let result = await dbOperations.executeQuery(query, param, loggedUser, "getSubTaskExpense", false, null, tenant, appLogger, meteringLogger, moduleName);
          if (result != null && result != undefined && result != 'Error') {
            if (result.length > 0) {
              let total = 0
              for(data of result){
                total += data.EXP_AMNT
              }
              let expense = {expenses_list:result,total_expenses:total}
              response = expense
              appLogger.logMessage("info", " Subtask expense fetched successfully", className, "getSubTaskExpense", body.loggedUser, body.tenant);
              out.status = "Success";
              out.message = "Subtask expense fetched successfully";
              out.data = result
              out.statusCode = 200
            } else {
              appLogger.logMessage("info", "Failed to fetch sub task expense", className, "getSubTaskExpense", body.loggedUser, body.tenant);
              out.status = "Warning";
              out.message = "No sub task expense available";
              out.data = []
              out.statusCode = 404
            }
          } else {
            appLogger.logMessage("info", "Failed to fetch sub task expense", className, "getSubTaskExpense", body.loggedUser, body.tenant);
            out.status = "Warning";
            out.message = "Failed to fetch sub task expense";
            out.data = []
            out.statusCode = 404
          }
        }
      } else {
        appLogger.logMessage("error", "Failed to fetch subtask expense due to invalid request body", className, "holdOrResume", body.loggedUser, body.tenant);
        out.status = "Failed";
        out.message = "Invalid request body";
        out.statusCode = 404
        out.data = []
      }

    } catch (error) {
      appLogger.logMessage("error", "Failed to fetch subtask expense: " + JSON.stringify(error.message), className, "holdOrResume", req.body.loggedUser, req.body.tenant);
      out.status = "Failed";
      out.message = "Internal server error";
      out.data = JSON.stringify(error.message);
    }
    endDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    diffInMS = moment(endDateTime).diff(moment(startDateTime), 'ms');
    meteringLogger.logMessage(req.body.tenant, req.body.loggedUser, className, "holdOrResume", startDateTime, endDateTime, diffInMS);
    return out;
  },

  // EDIT NEW EXPENSE FOR A TASK UNDER PROJECT/GROUP/RECURRING JOBS FOR A TENANT
  editExpenditure: async function (body, loggedUser, tenant) {
    let startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "editExpenditure service initiated", "BudgetService", "editExpenditure", loggedUser, tenant, moduleName);
    let result;
    try {
      let requestParams = Object.keys(body);
      let missingParams = [];
      let signatureKeys = Object.keys(apiSignatures.editExpenditure);
      for (let key of signatureKeys) {
        if (!requestParams.includes(key)) {
          missingParams.push(key);
        }
      }
      if (missingParams.length > 0) {
        appLogger.logMessage("debug", "Failed to edit expense because of missing parameters : " + JSON.stringify(missingParams), className, "editExpenditure", loggedUser, tenant, moduleName);
        result = await responseHandler.sendResponse("Warning", "Missing parameters: " + JSON.stringify(missingParams), 404, null, false, "editExpenditure", tenant, loggedUser, moduleName, appLogger, meteringLogger);
      } else {
        let query = mysqlQueries.editExpenditure;
        let param = [Number(body.taskID), body.expTypeID, body.expAmnt, body.description.trim(), body.loggedUserId, body.loggedUserId,body.expId,body.tenantId,];
        result = await dbOperations.executeQuery(query, param, loggedUser, "editExpenditure", false, null, tenant, appLogger, meteringLogger, moduleName)
        if (result != undefined && result != null && result != 'error') {
          if (result.affectedRows > 0) {
            appLogger.logMessage("info", "Edit Expense done successfully.", "BudgetService", "editExpenditure", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Success", "Expense updated successfully", 200, null, false, "editExpenditure", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          } else {
            appLogger.logMessage("info", "Something went wrong while editing expense.", "BudgetService", "editExpenditure", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Warning", "Something went wrong while edit expense .", 400, null, false, "editExpenditure", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          }
        } else {
          appLogger.logMessage("info", "Failed to edit Expense.", "BudgetService", "editExpenditure", loggedUser, tenant, moduleName);
          result = await responseHandler.sendResponse("Warning", "Failed to edit Expense . ", 400, null, false, "editExpenditure", tenant, loggedUser, moduleName, appLogger, meteringLogger);
        }
      }
      endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
      diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
      meteringLogger.logMessage(tenant, loggedUser, "BudgetService", "editExpenditure", startDateTime, endDateTime, diffInMS, moduleName);
      appLogger.logMessage("info", "editExpenditure Service completed.", "BudgetService", "editExpenditure", loggedUser, tenant, moduleName, moduleName);
    } catch (e) {
      appLogger.logMessage("error", e.message, "BudgetService", "editExpenditure", loggedUser, tenant, moduleName);
      result = await responseHandler.sendResponse("Failure", e.message, 500, null, false, "editExpenditure", tenant, loggedUser, moduleName, appLogger, meteringLogger);
    }
    return result;
  },

  // DELETE NEW EXPENSE FOR A TASK UNDER PROJECT/GROUP/RECURRING JOBS FOR A TENANT
  deleteExpenditure: async function (body, loggedUser, tenant) {
    let startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "editExpenditure service initiated", "BudgetService", "editExpenditure", loggedUser, tenant, moduleName);
    let result;
    try {
      if (body.expId == null || body.expId == undefined) {
        appLogger.logMessage("debug", "Failed to delete expense because of missing parameters", className, "deleteExpenditure", loggedUser, tenant, moduleName);
        result = await responseHandler.sendResponse("Warning", "Failed to delete expense because of missing parameters", 404, null, false, "deleteExpenditure", tenant, loggedUser, moduleName, appLogger, meteringLogger);
      } else {
        let query = mysqlQueries.deleteExpenditure;
        let param = [body.expId, body.tenantId];
        result = await dbOperations.executeQuery(query, param, loggedUser, "deleteExpenditure", false, null, tenant, appLogger, meteringLogger, moduleName)
        if (result != undefined && result != null && result != 'error') {
          if (result.affectedRows > 0) {
            appLogger.logMessage("info", "Expense deleted successfully.", "BudgetService", "deleteExpenditure", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Success", "Expense deleted successfully", 200, null, false, "deleteExpenditure", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          } else {
            appLogger.logMessage("info", "Something went wrong while deleting  expense.", "BudgetService", "deleteExpenditure", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Warning", "Something went wrong while deleting  expense .", 400, null, false, "deleteExpenditure", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          }
        } else {
          appLogger.logMessage("info", "Failed to delete  Expense.", "BudgetService", "deleteExpenditure", loggedUser, tenant, moduleName);
          result = await responseHandler.sendResponse("Warning", "Failed to delete  Expense . ", 400, null, false, "deleteExpenditure", tenant, loggedUser, moduleName, appLogger, meteringLogger);
        }
      }
      endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
      diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
      meteringLogger.logMessage(tenant, loggedUser, "BudgetService", "deleteExpenditure", startDateTime, endDateTime, diffInMS, moduleName);
      appLogger.logMessage("info", "deleteExpenditure Service completed.", "BudgetService", "deleteExpenditure", loggedUser, tenant, moduleName, moduleName);
    } catch (e) {
      appLogger.logMessage("error", e.message, "BudgetService", "deleteExpenditure", loggedUser, tenant, moduleName);
      result = await responseHandler.sendResponse("Failure", e.message, 500, null, false, "deleteExpenditure", tenant, loggedUser, moduleName, appLogger, meteringLogger);
    }
    return result;
  },

  // ADD PAYMENT
  addPayment: async function (body, loggedUser, tenant) {
    let startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "addPayment   service initiated", "BudgetService", "addPayment ", loggedUser, tenant, moduleName);
    let result;
    try {
      let requestParams = Object.keys(body);
      let missingParams = [];
      let signatureKeys = Object.keys(apiSignatures.addPayment);
      for (let key of signatureKeys) {
        if (!requestParams.includes(key)) {
          missingParams.push(key);
        }
      }
      if (missingParams.length > 0) {
        appLogger.logMessage("debug", "Failed to add payment because of missing parameters : " + JSON.stringify(missingParams), className, "addPayment", loggedUser, tenant, moduleName);
        result = await responseHandler.sendResponse("Warning", "Missing parameters: " + JSON.stringify(missingParams), 404, null, false, "addPayment", tenant, loggedUser, moduleName, appLogger, meteringLogger);
      } else {
        let query = mysqlQueries.addPayment;
        let param = [body.tenantId, body.expID, body.amount, body.pay_rec, body.description.trim(), body.transaction_date, body.loggedUserId, body.loggedUserId];
        result = await dbOperations.executeQuery(query, param, loggedUser, "addPayment", false, null, tenant, appLogger, meteringLogger, moduleName)
        if (result != undefined && result != null && result != 'error') {
          if (result.affectedRows > 0) {
            let query = mysqlQueries.updatePaymentStatus;
            let param = [body.expID]
            result = await dbOperations.executeQuery(query, param, loggedUser, "addPayment", false, null, tenant, appLogger, meteringLogger, moduleName)
            if (result != undefined && result != null && result != 'error') {
              if (result.affectedRows > 0) {
                appLogger.logMessage("info", "Payment added successfully.", "BudgetService", "addPayment", loggedUser, tenant, moduleName);
                result = await responseHandler.sendResponse("Success", "Payment added successfully", 200, null, false, "addPayment", tenant, loggedUser, moduleName, appLogger, meteringLogger);
              }
            }else {
              appLogger.logMessage("info", "Failed to add payment status.", "BudgetService", "addPayment", loggedUser, tenant, moduleName);
              result = await responseHandler.sendResponse("Warning", "Failed to add payment status.", 400, null, false, "addPayment", tenant, loggedUser, moduleName, appLogger, meteringLogger);
            }            
          } else {
            appLogger.logMessage("info", "Something went wrong while adding payment.", "BudgetService", "addPayment", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Warning", "Something went wrong while adding payment .", 400, null, false, "addPayment", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          }
        } else {
          appLogger.logMessage("info", "Failed to add payment.", "BudgetService", "addPayment", loggedUser, tenant, moduleName);
          result = await responseHandler.sendResponse("Warning", "Failed to add payment . ", 400, null, false, "addPayment", tenant, loggedUser, moduleName, appLogger, meteringLogger);
        }
      }
      endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
      diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
      meteringLogger.logMessage(tenant, loggedUser, "BudgetService", "addPayment", startDateTime, endDateTime, diffInMS, moduleName);
      appLogger.logMessage("info", "addPayment Service completed.", "BudgetService", "addPayment", loggedUser, tenant, moduleName, moduleName);
    } catch (e) {
      appLogger.logMessage("error", e.message, "BudgetService", "addPayment", loggedUser, tenant, moduleName);
      result = await responseHandler.sendResponse("Failure", e.message, 500, null, false, "addPayment", tenant, loggedUser, moduleName, appLogger, meteringLogger);
    }
    return result;
  },

  // EDIT PAYMENT
  editPayment: async function (body, loggedUser, tenant) {
    let startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "editPayment   service initiated", "BudgetService", "editPayment ", loggedUser, tenant, moduleName);
    let result;
    try {
      let requestParams = Object.keys(body);
      let missingParams = [];
      let signatureKeys = Object.keys(apiSignatures.editPayment);
      for (let key of signatureKeys) {
        if (!requestParams.includes(key)) {
          missingParams.push(key);
        }
      }
      if (missingParams.length > 0) {
        appLogger.logMessage("debug", "Failed to add payment because of missing parameters : " + JSON.stringify(missingParams), className, "editPayment", loggedUser, tenant, moduleName);
        result = await responseHandler.sendResponse("Warning", "Missing parameters: " + JSON.stringify(missingParams), 404, null, false, "editPayment", tenant, loggedUser, moduleName, appLogger, meteringLogger);
      } else {
        let query = mysqlQueries.editPayment;
        let param = [body.amount, body.pay_rec, body.description.trim(), body.transaction_date, body.loggedUserId, body.loggedUserId, body.payment_ID];
        result = await dbOperations.executeQuery(query, param, loggedUser, "editPayment", false, null, tenant, appLogger, meteringLogger, moduleName)
        if (result != undefined && result != null && result != 'error') {
          if (result.affectedRows > 0) {
            appLogger.logMessage("info", "Payment edited successfully.", "BudgetService", "editPayment", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Success", "Payment edited successfully", 200, null, false, "editPayment", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          } else {
            appLogger.logMessage("info", "Something went wrong while editing payment.", "BudgetService", "editPayment", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Warning", "Something went wrong while editing payment .", 400, null, false, "editPayment", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          }
        } else {
          appLogger.logMessage("info", "Failed to edit payment.", "BudgetService", "editPayment", loggedUser, tenant, moduleName);
          result = await responseHandler.sendResponse("Warning", "Failed to edit payment . ", 400, null, false, "editPayment", tenant, loggedUser, moduleName, appLogger, meteringLogger);
        }
      }
      endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
      diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
      meteringLogger.logMessage(tenant, loggedUser, "BudgetService", "editPayment", startDateTime, endDateTime, diffInMS, moduleName);
      appLogger.logMessage("info", "editPayment Service completed.", "BudgetService", "editPayment", loggedUser, tenant, moduleName, moduleName);
    } catch (e) {
      appLogger.logMessage("error", e.message, "BudgetService", "editPayment", loggedUser, tenant, moduleName);
      result = await responseHandler.sendResponse("Failure", e.message, 500, null, false, "editPayment", tenant, loggedUser, moduleName, appLogger, meteringLogger);
    }
    return result;
  },

  // DELETE PAYMENTS
  deletePayment: async function (body, loggedUser, tenant) {
    let startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "deletePayment service initiated", "BudgetService", "deletePayment", loggedUser, tenant, moduleName);
    let result;
    try {
      if (body.payment_ID == null || body.payment_ID == undefined) {
        appLogger.logMessage("debug", "Failed to delete payment because of missing parameters", className, "deletePayment", loggedUser, tenant, moduleName);
        result = await responseHandler.sendResponse("Warning", "Failed to delete payment because of missing parameters", 404, null, false, "deletePayment", tenant, loggedUser, moduleName, appLogger, meteringLogger);
      } else {
        let query = mysqlQueries.deletePayment;
        let param = [body.payment_ID];
        result = await dbOperations.executeQuery(query, param, loggedUser, "deletePayment", false, null, tenant, appLogger, meteringLogger, moduleName)
        if (result != undefined && result != null && result != 'error') {
          if (result.affectedRows > 0) {
            appLogger.logMessage("info", "Payment deleted successfully.", "BudgetService", "deletePayment", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Success", "Payment deleted successfully", 200, null, false, "deletePayment", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          } else {
            appLogger.logMessage("info", "Something went wrong while deleting payment.", "BudgetService", "deletePayment", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Warning", "Something went wrong while deleting payment .", 400, null, false, "deletePayment", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          }
        } else {
          appLogger.logMessage("info", "Failed to delete payment.", "BudgetService", "deletePayment", loggedUser, tenant, moduleName);
          result = await responseHandler.sendResponse("Warning", "Failed to delete payment . ", 400, null, false, "deletePayment", tenant, loggedUser, moduleName, appLogger, meteringLogger);
        }
      }
      endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
      diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
      meteringLogger.logMessage(tenant, loggedUser, "BudgetService", "deletePayment", startDateTime, endDateTime, diffInMS, moduleName);
      appLogger.logMessage("info", "deletePayment Service completed.", "BudgetService", "deletePayment", loggedUser, tenant, moduleName, moduleName);
    } catch (e) {
      appLogger.logMessage("error", e.message, "BudgetService", "deletePayment", loggedUser, tenant, moduleName);
      result = await responseHandler.sendResponse("Failure", e.message, 500, null, false, "deletePayment", tenant, loggedUser, moduleName, appLogger, meteringLogger);
    }
    return result;
  },

  // DELETE PAYMENTS
  fetchPayment: async function (body, loggedUser, tenant) {
    let startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "fetchPayment service initiated", "BudgetService", "fetchPayment", loggedUser, tenant, moduleName);
    let result;
    try {
      if (body.exp_ID == null || body.exp_ID == undefined) {
        appLogger.logMessage("debug", "Failed to fetch payment because of missing parameters", className, "fetchPayment", loggedUser, tenant, moduleName);
        result = await responseHandler.sendResponse("Warning", "Failed to fetch payment because of missing parameters", 404, null, false, "fetchPayment", tenant, loggedUser, moduleName, appLogger, meteringLogger);
      } else {
        let query = mysqlQueries.fetchPayment;
        let param = [body.exp_ID];
        result = await dbOperations.executeQuery(query, param, loggedUser, "fetchPayment", false, null, tenant, appLogger, meteringLogger, moduleName)
        if (result != undefined && result != null && result != 'error') {
          if (result.length > 0) {
            let total_exp = result[0].EXP_AMNT;
            let total_payment = 0 ;
            let total_receivable = 0 ;
            let pay_rec;
            for(data of result){
              if(data.PAY_REC == 'PAY'){
                total_payment += data.AMOUNT
              }else if(data.PAY_REC == 'REC'){
                total_receivable += data.AMOUNT
              }
            }
            let diff = total_payment - total_receivable;
            let balance = total_exp - Math.abs(diff)
            if (balance >= 0) {
              balance = Math.abs(balance);
              pay_rec = 'PAY'
            } else if (balance < 0) {
              balance = Math.abs(balance);
              pay_rec = 'REC'
            }
            let obj = {total_pay:total_payment,total_rec:total_receivable,pay_rec:pay_rec,total_exp:total_exp,balance:balance,data:result}
            appLogger.logMessage("info", "Payment fetched successfully.", "BudgetService", "fetchPayment", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Success", "Payment fetched successfully", 200, obj, true, "fetchPayment", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          } else {
            let query = mysqlQueries.fetchExpData;
            let param = [body.exp_ID];
            result = await dbOperations.executeQuery(query, param, loggedUser, "fetchPayment", false, null, tenant, appLogger, meteringLogger, moduleName)
            if (result != undefined && result != null && result != 'error') {
              if (result.length > 0) {
                let total_exp = result[0].EXP_AMNT;
                let total_payment = 0 ;
                let total_receivable = 0 ;
                let pay_rec = 'PAY';
                let balance = total_exp
                let obj = {total_pay:total_payment,total_rec:total_receivable,pay_rec:pay_rec,total_exp:total_exp,balance:balance,data:[]}
                appLogger.logMessage("info", "Payment fetched successfully.", "BudgetService", "fetchPayment", loggedUser, tenant, moduleName);
                result = await responseHandler.sendResponse("Success", "Payment fetched successfully", 200, obj, true, "fetchPayment", tenant, loggedUser, moduleName, appLogger, meteringLogger);
              }
            }else{
            appLogger.logMessage("info", "Something went wrong while fetching payment.", "BudgetService", "fetchPayment", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Warning", "Something went wrong while fetching payment .", 400, null, false, "fetchPayment", tenant, loggedUser, moduleName, appLogger, meteringLogger);
            }
          }
        } else {
          appLogger.logMessage("info", "Failed to fetch payment.", "BudgetService", "fetchPayment", loggedUser, tenant, moduleName);
          result = await responseHandler.sendResponse("Warning", "Failed to fetch payment . ", 400, null, false, "fetchPayment", tenant, loggedUser, moduleName, appLogger, meteringLogger);
        }
      }
      endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
      diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
      meteringLogger.logMessage(tenant, loggedUser, "BudgetService", "fetchPayment", startDateTime, endDateTime, diffInMS, moduleName);
      appLogger.logMessage("info", "fetchPayment Service completed.", "BudgetService", "fetchPayment", loggedUser, tenant, moduleName, moduleName);
    } catch (e) {
      appLogger.logMessage("error", e.message, "BudgetService", "fetchPayment", loggedUser, tenant, moduleName);
      result = await responseHandler.sendResponse("Failure", e.message, 500, null, false, "fetchPayment", tenant, loggedUser, moduleName, appLogger, meteringLogger);
    }
    return result;
  },

  // CLOSE SETTLEMENT PAYMENTS
  closeSettlement: async function (body, loggedUser, tenant) {
    let startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "closeSettlement service initiated", "BudgetService", "closeSettlement", loggedUser, tenant, moduleName);
    let result;
    try {
      if (body.exp_ID == null || body.exp_ID == undefined) {
        appLogger.logMessage("debug", "Failed to delete payment because of missing parameters", className, "closeSettlement", loggedUser, tenant, moduleName);
        result = await responseHandler.sendResponse("Warning", "Failed to delete payment because of missing parameters", 404, null, false, "closeSettlement", tenant, loggedUser, moduleName, appLogger, meteringLogger);
      } else {
        let query = mysqlQueries.closeSettlement;
        let param = [body.exp_ID];
        result = await dbOperations.executeQuery(query, param, loggedUser, "closeSettlement", false, null, tenant, appLogger, meteringLogger, moduleName)
        if (result != undefined && result != null && result != 'error') {
          if (result.affectedRows > 0) {
            appLogger.logMessage("info", "Settlement closed successfully.", "BudgetService", "closeSettlement", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Success", "Settlement closed successfully", 200, null, false, "closeSettlement", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          } else {
            appLogger.logMessage("info", "Something went wrong while closing settlement.", "BudgetService", "closeSettlement", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Warning", "Something went wrong while closing settlement .", 400, null, false, "closeSettlement", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          }
        } else {
          appLogger.logMessage("info", "Failed to close settlement.", "BudgetService", "closeSettlement", loggedUser, tenant, moduleName);
          result = await responseHandler.sendResponse("Warning", "Failed to close settlement. ", 400, null, false, "closeSettlement", tenant, loggedUser, moduleName, appLogger, meteringLogger);
        }
      }
      endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
      diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
      meteringLogger.logMessage(tenant, loggedUser, "BudgetService", "closeSettlement", startDateTime, endDateTime, diffInMS, moduleName);
      appLogger.logMessage("info", "closeSettlement Service completed.", "BudgetService", "closeSettlement", loggedUser, tenant, moduleName, moduleName);
    } catch (e) {
      appLogger.logMessage("error", e.message, "BudgetService", "closeSettlement", loggedUser, tenant, moduleName);
      result = await responseHandler.sendResponse("Failure", e.message, 500, null, false, "closeSettlement", tenant, loggedUser, moduleName, appLogger, meteringLogger);
    }
    return result;
  },


  // ADD LABOUR EXPENSE
  addLabourExpense: async function (body, loggedUser, tenant) {
    let startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "addLabourExpense   service initiated", "BudgetService", "addLabourExpense ", loggedUser, tenant, moduleName);
    let result;
    try {
      let requestParams = Object.keys(body);
      let missingParams = [];
      let signatureKeys = Object.keys(apiSignatures.addLabourExpense);
      for (let key of signatureKeys) {
        if (!requestParams.includes(key)) {
          missingParams.push(key);
        }
      }
      if (missingParams.length > 0) {
        appLogger.logMessage("debug", "Failed to add labour expense because of missing parameters : " + JSON.stringify(missingParams), className, "addLabourExpense", loggedUser, tenant, moduleName);
        result = await responseHandler.sendResponse("Warning", "Missing parameters: " + JSON.stringify(missingParams), 404, null, false, "addLabourExpense", tenant, loggedUser, moduleName, appLogger, meteringLogger);
      } else {
        let labourExp = JSON.parse(body.labourExp)
        // let labourExp = body.labourExp
        let param = [];
        let records = [];
        for(data of labourExp){
          records.push(body.tenantId);
          records.push(body.expID);
          records.push(data.worker);
          records.push(data.type)
          records.push(data.uom)
          records.push(data.rate);
          records.push(data.worked_unit);
          records.push(data.log_date);
          records.push(body.loggedUserId);
          records.push(body.loggedUserId);
          param.push(records);
          records = [];
        }
        let query = mysqlQueries.addLabourExpense; 
        result = await dbOperations.executeQuery(query,[param], loggedUser, "addLabourExpense", false, null, tenant, appLogger, meteringLogger, moduleName)
        if (result != undefined && result != null && result != 'error') {
          if (result.affectedRows > 0) {
            let param = [];
            let param1 = []
            let records = [];
            let isAdd = false;
            let isEdit = false
            for(data of labourExp){
              if(data.addToMaster == true && (data.id == null || data.id == undefined) ){
                isAdd = true
                records.push(body.tenantId);
                records.push(body.projectId);
                records.push(data.worker);
                records.push(data.type);
                records.push(data.uom);
                records.push(data.rate);
                records.push(body.loggedUserId);
                records.push(body.loggedUserId);
                param.push(records);
                records = [];
              }else if(data.addToMaster == true && (data.id != null && data.id != undefined)){
                isEdit = true
                let obj ={id:data.id,tenantId:body.tenantId,projectId:body.projectId,worker:data.worker,type:data.type,uom:data.uom,rate:data.rate,worked_unit:data.worked_unit,log_date:data.log_date,loggedUserId:body.loggedUserId}
                param1.push(obj);
                records = [];
              }              
            }
            if(isAdd == true){
              result = await BudgetSupport.addToMasterTable(param,"ADD",loggedUser,tenant,body.loggedUserId)
              if(result.statusCode != 200){
                appLogger.logMessage("info", "Failed to add labor expense to master table.", "BudgetService", "addLabourExpense", loggedUser, tenant, moduleName);
              }
            }
            if(isEdit == true){
              let query = mysqlQueries.editLabourExpense;
              for(data of param1){
                let param = [data.worker, data.type, data.uom, data.rate, data.worked_unit, data.log_date, body.loggedUserId, data.id];
                result = await dbOperations.executeQuery(query, param, loggedUser, "editLabourExpense", false, null, tenant, appLogger, meteringLogger, moduleName)
                if (result != undefined && result != null && result != 'error' && result.affectedRows > 0) {
                  result = await BudgetSupport.addToMasterTable(data, "EDIT", loggedUser, tenant, body.loggedUserId)
                  if (result.statusCode != 200) {
                    appLogger.logMessage("info", "Failed to update labor expense to master table.", "BudgetService", "addLabourExpense", loggedUser, tenant, moduleName);
                  }
                }
              }             
            }
            appLogger.logMessage("info", "Labour expense added successfully.", "BudgetService", "addLabourExpense", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Success", "Labour expense added successfully", 200, null, false, "addLabourExpense", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          } else {
            appLogger.logMessage("info", "Something went wrong while adding labour expense.", "BudgetService", "addLabourExpense", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Warning", "Something went wrong while adding labour expense .", 400, null, false, "addLabourExpense", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          }
        } else {
          appLogger.logMessage("info", "Failed to add labour expense.", "BudgetService", "addLabourExpense", loggedUser, tenant, moduleName);
          result = await responseHandler.sendResponse("Warning", "Failed to add labour expense . ", 400, null, false, "addLabourExpense", tenant, loggedUser, moduleName, appLogger, meteringLogger);
        }
      }
      endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
      diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
      meteringLogger.logMessage(tenant, loggedUser, "BudgetService", "addLabourExpense", startDateTime, endDateTime, diffInMS, moduleName);
      appLogger.logMessage("info", "addLabourExpense Service completed.", "BudgetService", "addLabourExpense", loggedUser, tenant, moduleName, moduleName);
    } catch (e) {
      appLogger.logMessage("error", e.message, "BudgetService", "addLabourExpense", loggedUser, tenant, moduleName);
      result = await responseHandler.sendResponse("Failure", e.message, 500, null, false, "addLabourExpense", tenant, loggedUser, moduleName, appLogger, meteringLogger);
    }
    return result;
  },

  // edit LABOUR EXPENSE
  editLabourExpense: async function (body, loggedUser, tenant) {
    let startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "editLabourExpense   service initiated", "BudgetService", "editLabourExpense ", loggedUser, tenant, moduleName);
    let result;
    try {
      let requestParams = Object.keys(body);
      let missingParams = [];
      let signatureKeys = Object.keys(apiSignatures.editLabourExpense);
      for (let key of signatureKeys) {
        if (!requestParams.includes(key)) {
          missingParams.push(key);
        }
      }
      if (missingParams.length > 0) {
        appLogger.logMessage("debug", "Failed to edit labour expense because of missing parameters : " + JSON.stringify(missingParams), className, "editLabourExpense", loggedUser, tenant, moduleName);
        result = await responseHandler.sendResponse("Warning", "Missing parameters: " + JSON.stringify(missingParams), 404, null, false, "editLabourExpense", tenant, loggedUser, moduleName, appLogger, meteringLogger);
      } else {
        let query = mysqlQueries.editLabourExpense;
        let param = [body.worker,body.worker_type,body.uom,body.rate, body.worked_unit, body.log_date, body.loggedUserId, body.labourExpId];
        result = await dbOperations.executeQuery(query, param, loggedUser, "editLabourExpense", false, null, tenant, appLogger, meteringLogger, moduleName)
        if (result != undefined && result != null && result != 'error') {
          if (result.affectedRows > 0) {
            appLogger.logMessage("info", "Labour expense updated successfully.", "BudgetService", "editLabourExpense", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Success", "Labour expense updated successfully", 200, null, false, "editLabourExpense", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          } else {
            appLogger.logMessage("info", "Something went wrong while editing labour expense.", "BudgetService", "editLabourExpense", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Warning", "Something went wrong while editing labour expense .", 400, null, false, "editLabourExpense", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          }
        } else {
          appLogger.logMessage("info", "Failed to edit labour expense.", "BudgetService", "editLabourExpense", loggedUser, tenant, moduleName);
          result = await responseHandler.sendResponse("Warning", "Failed to edit labour expense . ", 400, null, false, "editLabourExpense", tenant, loggedUser, moduleName, appLogger, meteringLogger);
        }
      }
      endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
      diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
      meteringLogger.logMessage(tenant, loggedUser, "BudgetService", "editLabourExpense", startDateTime, endDateTime, diffInMS, moduleName);
      appLogger.logMessage("info", "editLabourExpense Service completed.", "BudgetService", "editLabourExpense", loggedUser, tenant, moduleName, moduleName);
    } catch (e) {
      appLogger.logMessage("error", e.message, "BudgetService", "editLabourExpense", loggedUser, tenant, moduleName);
      result = await responseHandler.sendResponse("Failure", e.message, 500, null, false, "editLabourExpense", tenant, loggedUser, moduleName, appLogger, meteringLogger);
    }
    return result;
  },


  // FETCH LABOUR EXPENSE
  fetchLabourExpense: async function (body, loggedUser, tenant) {
    let startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "fetchLabourExpense service initiated", "BudgetService", "fetchLabourExpense", loggedUser, tenant, moduleName);
    let result;
    try {
      if (body.expId == null || body.expId == undefined) {
        appLogger.logMessage("debug", "Failed to fetch labour expense because of missing parameters", className, "fetchLabourExpense", loggedUser, tenant, moduleName);
        result = await responseHandler.sendResponse("Warning", "Failed to fetch labour expense because of missing parameters", 404, null, false, "fetchLabourExpense", tenant, loggedUser, moduleName, appLogger, meteringLogger);
      } else {
        let query = mysqlQueries.fetchLabourExpense;
        let param = [body.expId];
        result = await dbOperations.executeQuery(query, param, loggedUser, "fetchLabourExpense", false, null, tenant, appLogger, meteringLogger, moduleName)
        if (result != undefined && result != null && result != 'error') {
          if (result.length > 0) {
            appLogger.logMessage("info", "Labour expense fetched successfully.", "BudgetService", "fetchLabourExpense", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Success", "Labour expense fetched successfully", 200, result, true, "fetchLabourExpense", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          } else {
            appLogger.logMessage("info", "Something went wrong while fetching labour expense.", "BudgetService", "fetchLabourExpense", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Warning", "Something went wrong while fetching labour expense .", 400, null, false, "fetchLabourExpense", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          }
        } else {
          appLogger.logMessage("info", "Failed to fetch labour expense.", "BudgetService", "fetchLabourExpense", loggedUser, tenant, moduleName);
          result = await responseHandler.sendResponse("Warning", "Failed to fetch labour expense . ", 400, null, false, "fetchLabourExpense", tenant, loggedUser, moduleName, appLogger, meteringLogger);
        }
      }
      endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
      diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
      meteringLogger.logMessage(tenant, loggedUser, "BudgetService", "fetchLabourExpense", startDateTime, endDateTime, diffInMS, moduleName);
      appLogger.logMessage("info", "fetchLabourExpense Service completed.", "BudgetService", "fetchLabourExpense", loggedUser, tenant, moduleName, moduleName);
    } catch (e) {
      appLogger.logMessage("error", e.message, "BudgetService", "fetchLabourExpense", loggedUser, tenant, moduleName);
      result = await responseHandler.sendResponse("Failure", e.message, 500, null, false, "fetchLabourExpense", tenant, loggedUser, moduleName, appLogger, meteringLogger);
    }
    return result;
  },


  // ADD LABOUR EXPENSE TO MASTER TABLE
  addLExpToMasterTable: async function (body, loggedUser, tenant) {
    let startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "addLExpToMasterTable   service initiated", "BudgetService", "addLExpToMasterTable ", loggedUser, tenant, moduleName);
    let result;
    try {
      let requestParams = Object.keys(body);
      let missingParams = [];
      let signatureKeys = Object.keys(apiSignatures.addLExpToMasterTable);
      for (let key of signatureKeys) {
        if (!requestParams.includes(key)) {
          missingParams.push(key);
        }
      }
      if (missingParams.length > 0) {
        appLogger.logMessage("debug", "Failed to add labour expense to master table because of missing parameters : " + JSON.stringify(missingParams), className, "addLExpToMasterTable", loggedUser, tenant, moduleName);
        result = await responseHandler.sendResponse("Warning", "Missing parameters: " + JSON.stringify(missingParams), 404, null, false, "addLExpToMasterTable", tenant, loggedUser, moduleName, appLogger, meteringLogger);
      } else {
        let labourExp = body.labourExp
        let param = [];
        let records = [];
        for (data of labourExp) {
          records.push(body.tenantId);
          records.push(body.projectId);
          records.push(data.Name);
          records.push(data.Type);
          records.push(data.UOM);
          records.push(data.Rate);
          records.push(body.loggedUserId);
          records.push(body.loggedUserId);
          param.push(records);
          records = [];
        }
        let query = mysqlQueries.addLExpToMasterTable;
        result = await dbOperations.executeQuery(query, [param], loggedUser, "addLExpToMasterTable", false, null, tenant, appLogger, meteringLogger, moduleName)
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
      }
      endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
      diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
      meteringLogger.logMessage(tenant, loggedUser, "BudgetService", "addLExpToMasterTable", startDateTime, endDateTime, diffInMS, moduleName);
      appLogger.logMessage("info", "addLExpToMasterTable Service completed.", "BudgetService", "addLExpToMasterTable", loggedUser, tenant, moduleName, moduleName);
    } catch (e) {
      appLogger.logMessage("error", e.message, "BudgetService", "addLExpToMasterTable", loggedUser, tenant, moduleName);
      result = await responseHandler.sendResponse("Failure", e.message, 500, null, false, "addLExpToMasterTable", tenant, loggedUser, moduleName, appLogger, meteringLogger);
    }
    return result;
  },


  // FETCH LABOUR EXPENSE FROM MASTER TABLE
  fetchLExpFromMasterTable: async function (body, loggedUser, tenant) {
    let startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "fetchLExpFromMasterTable service initiated", "BudgetService", "fetchLExpFromMasterTable", loggedUser, tenant, moduleName);
    let result;
    try {
      if (body.type == null || body.type == undefined || body.projectId == null || body.projectId == undefined) {
        appLogger.logMessage("debug", "Failed to fetch labour expense from master table because of missing parameters", className, "fetchLExpFromMasterTable", loggedUser, tenant, moduleName);
        result = await responseHandler.sendResponse("Warning", "Failed to fetch labour expense from master table because of missing parameters", 404, null, false, "fetchLExpFromMasterTable", tenant, loggedUser, moduleName, appLogger, meteringLogger);
      } else {
        let query = mysqlQueries.fetchLExpFromMasterTable;
        let param = [body.type, body.projectId, body.tenantId];
        result = await dbOperations.executeQuery(query, param, loggedUser, "fetchLExpFromMasterTable", false, null, tenant, appLogger, meteringLogger, moduleName)
        if (result != undefined && result != null && result != 'error') {
          if (result.length > 0) {
            appLogger.logMessage("info", "Labour expense fetched successfully.", "BudgetService", "fetchLExpFromMasterTable", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Success", "Labour expense fetched successfully", 200, result, true, "fetchLExpFromMasterTable", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          } else {
            appLogger.logMessage("info", "No Data Found.", "BudgetService", "fetchLExpFromMasterTable", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Warning", "No Data Found.", 400, null, false, "fetchLExpFromMasterTable", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          }
        } else {
          appLogger.logMessage("info", "Failed to fetch labour expense.", "BudgetService", "fetchLExpFromMasterTable", loggedUser, tenant, moduleName);
          result = await responseHandler.sendResponse("Warning", "Failed to fetch labour expense . ", 400, null, false, "fetchLExpFromMasterTable", tenant, loggedUser, moduleName, appLogger, meteringLogger);
        }
      }
      endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
      diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
      meteringLogger.logMessage(tenant, loggedUser, "BudgetService", "fetchLExpFromMasterTable", startDateTime, endDateTime, diffInMS, moduleName);
      appLogger.logMessage("info", "fetchLExpFromMasterTable Service completed.", "BudgetService", "fetchLExpFromMasterTable", loggedUser, tenant, moduleName, moduleName);
    } catch (e) {
      appLogger.logMessage("error", e.message, "BudgetService", "fetchLExpFromMasterTable", loggedUser, tenant, moduleName);
      result = await responseHandler.sendResponse("Failure", e.message, 500, null, false, "fetchLExpFromMasterTable", tenant, loggedUser, moduleName, appLogger, meteringLogger);
    }
    return result;
  },

  // FETCH LABOUR EXPENSE FROM MASTER TABLE
  fetchLExpType: async function (body, loggedUser, tenant) {
    let startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "fetchLExpType service initiated", "BudgetService", "fetchLExpType", loggedUser, tenant, moduleName);
    let result;
    try {
      if (body.LOOKUP_TYPE == null || body.LOOKUP_TYPE == undefined) {
        appLogger.logMessage("debug", "Failed to fetch labour expense from master table because of missing parameters", className, "fetchLExpType", loggedUser, tenant, moduleName);
        result = await responseHandler.sendResponse("Warning", "Failed to fetch labour expense from master table because of missing parameters", 404, null, false, "fetchLExpType", tenant, loggedUser, moduleName, appLogger, meteringLogger);
      } else {
        let query = mysqlQueries.fetchLExpType;
        let param = [body.LOOKUP_TYPE, body.tenantId];
        result = await dbOperations.executeQuery(query, param, loggedUser, "fetchLExpType", false, null, tenant, appLogger, meteringLogger, moduleName)
        if (result != undefined && result != null && result != 'error') {
          if (result.length > 0) {
            appLogger.logMessage("info", "Labour expense fetched successfully.", "BudgetService", "fetchLExpType", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Success", "Labour expense fetched successfully", 200, result, true, "fetchLExpType", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          } else {
            appLogger.logMessage("info", "Something went wrong while fetching labour expense.", "BudgetService", "fetchLExpType", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Warning", "Something went wrong while fetching labour expense .", 400, null, false, "fetchLExpType", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          }
        } else {
          appLogger.logMessage("info", "Failed to fetch labour expense.", "BudgetService", "fetchLExpType", loggedUser, tenant, moduleName);
          result = await responseHandler.sendResponse("Warning", "Failed to fetch labour expense . ", 400, null, false, "fetchLExpType", tenant, loggedUser, moduleName, appLogger, meteringLogger);
        }
      }
      endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
      diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
      meteringLogger.logMessage(tenant, loggedUser, "BudgetService", "fetchLExpType", startDateTime, endDateTime, diffInMS, moduleName);
      appLogger.logMessage("info", "fetchLExpType Service completed.", "BudgetService", "fetchLExpType", loggedUser, tenant, moduleName, moduleName);
    } catch (e) {
      appLogger.logMessage("error", e.message, "BudgetService", "fetchLExpType", loggedUser, tenant, moduleName);
      result = await responseHandler.sendResponse("Failure", e.message, 500, null, false, "fetchLExpType", tenant, loggedUser, moduleName, appLogger, meteringLogger);
    }
    return result;
  },

    // FETCH LABOUR EXPENSE FROM MASTER TABLE
  getExpData: async function (body, loggedUser, tenant) {
    let startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "getExpData service initiated", "BudgetService", "getExpData", loggedUser, tenant, moduleName);
    let result;
    try {
      if (body.type == null || body.type == undefined && body.NAME == null || body.NAME == undefined) {
        appLogger.logMessage("debug", "Failed to fetch labour expense from master table because of missing parameters", className, "getExpData", loggedUser, tenant, moduleName);
        result = await responseHandler.sendResponse("Warning", "Failed to fetch labour expense from master table because of missing parameters", 404, null, false, "getExpData", tenant, loggedUser, moduleName, appLogger, meteringLogger);
      } else {
        let query = mysqlQueries.getExpData;
        let param = [body.type,body.projectId,body.tenantId,body.NAME];
        result = await dbOperations.executeQuery(query, param, loggedUser, "getExpData", false, null, tenant, appLogger, meteringLogger, moduleName)
        if (result != undefined && result != null && result != 'error') {
          if (result.length > 0) {
            appLogger.logMessage("info", "Expense fetched successfully.", "BudgetService", "getExpData", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Success", "Expense fetched successfully", 200, result, true, "getExpData", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          } else {
            appLogger.logMessage("info", "Something went wrong while fetching  expense data.", "BudgetService", "getExpData", loggedUser, tenant, moduleName);
            result = await responseHandler.sendResponse("Warning", "Something went wrong while fetching  expense data .", 400, null, false, "getExpData", tenant, loggedUser, moduleName, appLogger, meteringLogger);
          }
        } else {
          appLogger.logMessage("info", "Failed to fetch  expense data.", "BudgetService", "getExpData", loggedUser, tenant, moduleName);
          result = await responseHandler.sendResponse("Warning", "Failed to fetch  expense data. ", 400, null, false, "getExpData", tenant, loggedUser, moduleName, appLogger, meteringLogger);
        }
      }
      endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
      diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
      meteringLogger.logMessage(tenant, loggedUser, "BudgetService", "getExpData", startDateTime, endDateTime, diffInMS, moduleName);
      appLogger.logMessage("info", "getExpData Service completed.", "BudgetService", "getExpData", loggedUser, tenant, moduleName, moduleName);
    } catch (e) {
      appLogger.logMessage("error", e.message, "BudgetService", "getExpData", loggedUser, tenant, moduleName);
      result = await responseHandler.sendResponse("Failure", e.message, 500, null, false, "getExpData", tenant, loggedUser, moduleName, appLogger, meteringLogger);
    }
    return result;
  },

  //API TO CATEGORIZE TASK BASED ON BUDGETS
  getBudgetTaskZones: async function (body, loggedUser, tenant) {
    let startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "Service Initiated", "BudgetService", "getBudgetTaskZones", loggedUser, tenant, moduleName);
    let response;
    let result;
    let greenZoneTask=[],yellowZoneTask=[],redZoneTask=[],blackZoneTask=[]
    try {
      if(body.projectId!=null && body.projectId!=undefined){
        let taskDatas = await dbOperations.executeQuery(mysqlQueries.getTaskZonesBudgets,[body.projectId],loggedUser,"getBudgetTaskZones",false,null,tenant,appLogger,meteringLogger,moduleName) 
        appLogger.logMessage("debug", "taskDatas recieved "+JSON.stringify(taskDatas), "BudgetService", "getBudgetTaskZones", loggedUser, tenant, moduleName);
        if(taskDatas!=null && taskDatas!=undefined && taskDatas.length>0){
          for(let task of taskDatas){
            let difference = task.BUDGET_UTILIZED - task.BUDGET_ON_PROGRESS
            let zone = await BudgetSupport.categorizeTaskZone(difference,loggedUser,tenant)
            appLogger.logMessage("info", "Task "+task.TASK_NAME+" is in "+zone+" zone.", "BudgetService", "getBudgetTaskZones", loggedUser, tenant, moduleName);
            if(zone == 'Green'){
              greenZoneTask.push(task)
            }else if(zone == 'Yellow'){
              yellowZoneTask.push(task)
            }else if(zone == 'Red'){
              redZoneTask.push(task)
            }else{
              blackZoneTask.push(task)
            }
          }
          result = {
            "chartData":[
               {
                  "Green":greenZoneTask.length,
                  "Yellow":yellowZoneTask.length,
                  "Red":redZoneTask.length,
                  "Black":blackZoneTask.length
               }
            ],
            "zoneData":[
               {
                  "Zone":"Green",
                  "Task":greenZoneTask
               },
               {
                  "Zone":"Yellow",
                  "Task":yellowZoneTask
               },
               {
                  "Zone":"Red",
                  "Task":redZoneTask
               },
               {
                  "Zone":"Black",
                  "Task":blackZoneTask
               }
            ]  
          }
          appLogger.logMessage("debug", "Result : "+JSON.stringify(result), "BudgetService", "getBudgetTaskZones", loggedUser, tenant, moduleName);
          response = await responseHandler.sendResponse("Success", "Data fetched successfully.", 200, result, false, "getBudgetTaskZones", tenant, loggedUser, moduleName,appLogger,meteringLogger);
        }else{
          response = await responseHandler.sendResponse("Warning", "No data found", 404, null, result, "getBudgetTaskZones", tenant, loggedUser, moduleName,appLogger,meteringLogger);
        }
      }else{
        response = await responseHandler.sendResponse("Warning", "Invalid Parameter", 400, null, false, "getBudgetTaskZones", tenant, loggedUser, moduleName,appLogger,meteringLogger);
      }
      endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
      diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
      meteringLogger.logMessage(tenant, loggedUser, "BudgetService", "getBudgetTaskZones", startDateTime, endDateTime, diffInMS, moduleName);
      appLogger.logMessage("info", "Service completed.", "BudgetService", "getBudgetTaskZones", loggedUser, tenant, moduleName, moduleName);
    } catch (e) {
      appLogger.logMessage("error", e.message, "BudgetService", "getBudgetTaskZones", loggedUser, tenant, moduleName);
      response = await responseHandler.sendResponse("Failure", e.message, 500, null, false, "getBudgetTaskZones", tenant, loggedUser, moduleName, appLogger, meteringLogger);
    }
    return response;
  },  

  //API TO CATEGORISE TASK BASED ON TIMELINES
  getTimelineTaskZones: async function (body, loggedUser, tenant) {
    let startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "Service initiated", "BudgetService", "getTimelineTaskZones", loggedUser, tenant, moduleName);
    let result;
    let greenZoneTask=[],yellowZoneTask=[],redZoneTask=[],blackZoneTask=[]
    try {
      if(body.projectId!=null && body.projectId!=undefined){
        let taskDatas = await dbOperations.executeQuery(mysqlQueries.getTaskZonesTimeline,[body.projectId],loggedUser,"getTimelineTaskZones",false,null,tenant,appLogger,meteringLogger,moduleName) 
        appLogger.logMessage("debug", "taskDatas recieved : "+JSON.stringify(taskDatas), "BudgetService", "getTimelineTaskZones", loggedUser, tenant, moduleName);
        if(taskDatas!=null && taskDatas!=undefined && taskDatas.length>0){
          for(let task of taskDatas){
            let difference = task.ESTIMATED_COMPLETION_PERCENTAGE - task.ACTUAL_COMPLETION_PERCENTAGE
            let zone = await BudgetSupport.categorizeTaskZone(difference,loggedUser,tenant)
            if(zone == 'Green'){
              greenZoneTask.push(task)
            }else if(zone == 'Yellow'){
              yellowZoneTask.push(task)
            }else if(zone == 'Red'){
              redZoneTask.push(task)
            }else{
              blackZoneTask.push(task)
            }
          }
          result = {
            "chartData":[
               {
                  "Green":greenZoneTask.length,
                  "Yellow":yellowZoneTask.length,
                  "Red":redZoneTask.length,
                  "Black":blackZoneTask.length
               }
            ],
            "zoneData":[
               {
                  "Zone":"Green",
                  "Task":greenZoneTask
               },
               {
                  "Zone":"Yellow",
                  "Task":yellowZoneTask
               },
               {
                  "Zone":"Red",
                  "Task":redZoneTask
               },
               {
                  "Zone":"Black",
                  "Task":blackZoneTask
               }
            ]  
          }
          appLogger.logMessage("debug", "Result : "+JSON.stringify(result), "BudgetService", "getTimelineTaskZones", loggedUser, tenant, moduleName);
          response = await responseHandler.sendResponse("Success", "Data fetched successfully.", 200, result, false, "getTimelineTaskZones", tenant, loggedUser, moduleName,appLogger,meteringLogger);
        }else{
          response = await responseHandler.sendResponse("Warning", "No data found", 404, null, false, "getTimelineTaskZones", tenant, loggedUser, moduleName,appLogger,meteringLogger);
        }

      }else{
        response = await responseHandler.sendResponse("Warning", "Invalid Parameter", 400, null, false, "getTimelineTaskZones", tenant, loggedUser, moduleName,appLogger,meteringLogger);
      }
      endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
      diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
      meteringLogger.logMessage(tenant, loggedUser, "BudgetService", "getTimelineTaskZones", startDateTime, endDateTime, diffInMS, moduleName);
      appLogger.logMessage("info", "Service completed.", "BudgetService", "getTimelineTaskZones", loggedUser, tenant, moduleName, moduleName);
    } catch (e) {
      appLogger.logMessage("error", e.message, "BudgetService", "getTimelineTaskZones", loggedUser, tenant, moduleName);
      result = await responseHandler.sendResponse("Failure", e.message, 500, null, false, "getTimelineTaskZones", tenant, loggedUser, moduleName, appLogger, meteringLogger);
    }
    return response;
  },

  //API TO PLOT COST CHART ON PROJECT SUMMARY PAGE
  getCostChart: async function (body, loggedUser, tenant) {
    let startDateTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    appLogger.logMessage("info", "Service Initiated", "BudgetService", "getCostChart", loggedUser, tenant, moduleName);
    let response;
    try {
      if(body.projectId!=null && body.projectId!=undefined){
        let projectCost = await dbOperations.executeQuery(mysqlQueries.getCostChart,[body.projectId,body.projectId],loggedUser,"getCostChart",false,null,tenant,appLogger,meteringLogger,moduleName) 
        appLogger.logMessage("debug", "projectCost recieved "+JSON.stringify(projectCost), "BudgetService", "getCostChart", loggedUser, tenant, moduleName);
        if(projectCost!=null && projectCost!=undefined && projectCost.length>0){
          response = await responseHandler.sendResponse("Success", "Data fetched successfully.", 200, projectCost, false, "getCostChart", tenant, loggedUser, moduleName,appLogger,meteringLogger);
        }else{
          response = await responseHandler.sendResponse("Warning", "No data found", 404, null, result, "getCostChart", tenant, loggedUser, moduleName,appLogger,meteringLogger);
        }
      }else{
        response = await responseHandler.sendResponse("Warning", "Invalid Parameter", 400, null, false, "getCostChart", tenant, loggedUser, moduleName,appLogger,meteringLogger);
      }
      endDateTime = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
      diffInMS = moment(endDateTime).diff(moment(startDateTime), "ms");
      meteringLogger.logMessage(tenant, loggedUser, "BudgetService", "getCostChart", startDateTime, endDateTime, diffInMS, moduleName);
      appLogger.logMessage("info", "Service completed.", "BudgetService", "getCostChart", loggedUser, tenant, moduleName, moduleName);
    } catch (e) {
      appLogger.logMessage("error", e.message, "BudgetService", "getCostChart", loggedUser, tenant, moduleName);
      response = await responseHandler.sendResponse("Failure", e.message, 500, null, false, "getCostChart", tenant, loggedUser, moduleName, appLogger, meteringLogger);
    }
    return response;
  },  


}
