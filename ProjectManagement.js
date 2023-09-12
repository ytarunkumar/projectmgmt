/**
 * @author: Prince John
 * @created_on : 21/10/2022
*/
// Import required packages
const path = require('path');
const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });
let routes = require('./router/PMSRouter');
let BudgetRouter = require('./router/BudgetRouter');
const appLogger = require('../projectManagement/logger/Logger').applicationLogger;
const meteringLogger = require('../projectManagement/logger/Logger').meteringLogger;
const restify = require('restify');
const corsMiddleware = require('restify-cors-middleware');
const fs = require('fs');
// Note: Ensure you have a .env file and include LuisAppId, LuisAPIKey and LuisAPIHostName.
let moduleName="PM"
const redis = require('../common/connection/redis/RedisClient');
const mongoDB=require('../common/connection/mongodb/MongoOperations');
const Scheduler = require('./scheduler/Scheduler');
var https_options = null;
var serverCheck = false;
try {
     https_options = {
         key: fs.readFileSync(process.env.key),
         cert: fs.readFileSync(process.env.cert),
         ca: fs.readFileSync(process.env.ca, 'utf-8')
     };
    serverCheck = true;
    console.log('\nSSL Certificates read successfully.');
    appLogger.logMessage("info", "SSL Certificates read successfully.", "App", "Init", "SERVER");
} catch (e) {
    console.log('\nError while reading SSL certificates.');
    appLogger.logMessage("error", "Error in reading SSL certificates." + e, "App", "Init", "SERVER");
}
//enable this only for runnig on local setup
 serverCheck = true;
if (serverCheck) {
    const server = restify.createServer(https_options);
    server.use(restify.plugins.bodyParser());
    server.use(restify.plugins.queryParser());

    const cors = corsMiddleware({
        origins: [process.env.CLIENT_URL],  // Array of allowed origins or '*' for all origins
        allowHeaders: ['Authorization, Content-Type'],  // Array of allowed headers
    });

    server.pre(cors.preflight);  
    server.use(cors.actual);

    routes.applyRoutes(server);
    BudgetRouter.applyRoutes(server);
    server.get('/public/*',
        restify.plugins.serveStaticFiles('./public')
    );
    server.listen(process.env.port || process.env.PORT, async function () {
        console.log(`\n${server.name} listening to ${server.url}`);
        if (https_options == null || https_options == '' || https_options === undefined) {
            console.log('Warning the server is not running in https');
        }
        appLogger.logMessage('info', `${server.name} listening to ${server.url}`, "App", "Init", "SERVER");
        // await mysqlConnector.initializeMySql(server,appLogger,meteringLogger,moduleName);
        await redis.initializeRedis(appLogger,moduleName);
        await mongoDB.initializeMongoDb(server,appLogger,meteringLogger,moduleName);
        await Scheduler.recurringTaskCronJob();
        // await Scheduler.sendClientReportCronJob();
        // await Scheduler.sendWatcherReportCronJob();
    });
} else {
    console.log('Server was not started because SSL certificates could not be read.');
    appLogger.logMessage("error", "Server was not started because SSL certificates could not be read.", "App", "Init", "SERVER");
}

