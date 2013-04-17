/* jshint es5: true, node: true, strict: true */

"use strict";

var config              = require('./config.js'),
    winston             = require('winston'),
    express             = require('express'),
    http                = require('http'),
    app                 = express();



// Set up logger with a custom debug level

var log = new (winston.Logger)({
    levels: {
        debug   : 0,
        info    : 1,
        warn    : 2,
        error   : 3
    },
    exitOnError : false,
    transports  : [
        new (winston.transports.Console)({
            silent              : config.get('logConsoleSilent'),
            level               : config.get('logConsoleLevel'),
            colorize            : true,
            handleExceptions    : false
        }),

        new (winston.transports.File)({
            filename            : config.get('logFileFileName'),
            silent              : config.get('logFileSilent'),
            level               : config.get('logFileLevel'),
            handleExceptions    : false
        })
    ]
});

winston.addColors({
    debug   : 'blue',
    info    : 'green',
    warn    : 'yellow',
    error   : 'red'
});



// Disable identification

app.disable('x-powered-by');

// Simple auth function admin services
// Replad with a much stronger in a real implementation

var auth = express.basicAuth(function(user, pass, callback) {
    var result = (user === 'node' && pass === 'node');
    callback(null, result);
});

// Configure application - Serve static files from doc root

app.configure('all',function () {
    app.use(config.get('contextPath'), express.static(config.get('docRoot')));
});

// Set up http server

var httpServer = http.createServer(app);



// Admin service - Simple ping service

app.get(config.get('contextPath') + "apiadmin/ping", function (req, res, next) {
    log.debug('Ping request');
    res.send(200, 'OK');
});

// Admin service - Config in use

app.get(config.get('contextPath') + "apiadmin/config", auth, function (req, res, next) {
    res.json(config.get());
});



// Start http server

httpServer.listen(config.get('httpServerPort'));
log.info('Server started and running at http://localhost:' + config.get('httpServerPort') + config.get('contextPath'));
log.info('Serving documents from ' + config.get('docRoot'));



// Prevent exceptions to bubble up to the top and eventually kill the server

process.on("uncaughtException", function (err) {
    log.error(err.stack);
});