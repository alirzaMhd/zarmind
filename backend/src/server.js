"use strict";
// ==========================================
// ZARMIND - Main Server Entry Point
// ==========================================
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gracefulShutdown = exports.startServer = exports.server = void 0;
require("express-async-errors");
var express_1 = require("express");
var cors = require("cors");
var helmet_1 = require("helmet");
var compression = require("compression");
var cookieParser = require("cookie-parser");
var morgan = require("morgan");
var path = require("path");
var fs = require("fs");
var dotenv = require("dotenv");
// Load environment variables
dotenv.config();
// ==========================================
// IMPORTS
// ==========================================
// Configuration
var server_1 = require("./config/server");
var database_1 = require("./config/database");
// Logger
var logger_1 = require("./utils/logger");
// Middleware
var error_middleware_1 = require("./middleware/error.middleware");
// Routes (will be imported later)
// import authRoutes from './routes/auth.routes';
// import inventoryRoutes from './routes/inventory.routes';
// import salesRoutes from './routes/sales.routes';
// import customerRoutes from './routes/customer.routes';
// import reportRoutes from './routes/report.routes';
// import aiRoutes from './routes/ai.routes';
// ==========================================
// CREATE EXPRESS APP
// ==========================================
var app = (0, express_1.default)();
// ==========================================
// TRUST PROXY (for production behind reverse proxy)
// ==========================================
if (server_1.SERVER_CONFIG.TRUST_PROXY) {
    app.set('trust proxy', 1);
}
// ==========================================
// ENSURE UPLOAD DIRECTORIES EXIST
// ==========================================
var ensureUploadDirectories = function () {
    var directories = [
        server_1.UPLOAD_CONFIG.UPLOAD_PATH,
        server_1.UPLOAD_CONFIG.TEMP_PATH,
        server_1.UPLOAD_CONFIG.PRODUCTS_PATH,
        server_1.UPLOAD_CONFIG.SCALE_PATH,
        server_1.UPLOAD_CONFIG.DOCUMENTS_PATH,
        server_1.UPLOAD_CONFIG.AVATARS_PATH,
    ];
    directories.forEach(function (dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            (0, logger_1.logSystem)("Created upload directory: ".concat(dir));
        }
    });
};
ensureUploadDirectories();
// ==========================================
// SECURITY MIDDLEWARE
// ==========================================
// Helmet - Security headers
app.use((0, helmet_1.default)(server_1.HELMET_OPTIONS));
// CORS - Cross-Origin Resource Sharing
app.use(cors(server_1.CORS_OPTIONS));
// ==========================================
// REQUEST PARSING MIDDLEWARE
// ==========================================
// Body parser for JSON
app.use(express_1.default.json(server_1.BODY_PARSER_CONFIG.JSON));
// Body parser for URL-encoded data
app.use(express_1.default.urlencoded(server_1.BODY_PARSER_CONFIG.URLENCODED));
// Cookie parser
app.use(cookieParser(server_1.COOKIE_CONFIG.SECRET));
// ==========================================
// COMPRESSION
// ==========================================
app.use(compression(server_1.COMPRESSION_CONFIG));
// ==========================================
// LOGGING MIDDLEWARE
// ==========================================
// Morgan HTTP request logger
if (server_1.IS_DEVELOPMENT) {
    app.use(morgan('dev', { stream: logger_1.stream }));
}
else {
    app.use(morgan('combined', { stream: logger_1.stream }));
}
// ==========================================
// CUSTOM MIDDLEWARE
// ==========================================
// Request ID
app.use(error_middleware_1.requestIdMiddleware);
// Request timing
app.use(error_middleware_1.requestTimingMiddleware);
// Attach response helpers
app.use(error_middleware_1.attachResponseHelpers);
// ==========================================
// STATIC FILES
// ==========================================
// Serve uploaded files
app.use('/uploads', express_1.default.static(path.join(__dirname, '../uploads')));
// ==========================================
// HEALTH CHECK & MONITORING
// ==========================================
if (server_1.MONITORING_CONFIG.ENABLED) {
    // Health check endpoint
    app.get(server_1.MONITORING_CONFIG.HEALTH_CHECK_PATH, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var dbHealth, healthStatus, statusCode, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, database_1.healthCheck)()];
                case 1:
                    dbHealth = _a.sent();
                    healthStatus = {
                        status: dbHealth.status === 'healthy' ? 'ok' : 'degraded',
                        timestamp: new Date().toISOString(),
                        uptime: process.uptime(),
                        environment: process.env.NODE_ENV,
                        database: {
                            status: dbHealth.status,
                            latency: dbHealth.latency,
                            stats: dbHealth.stats,
                        },
                        memory: {
                            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                            external: Math.round(process.memoryUsage().external / 1024 / 1024),
                            unit: 'MB',
                        },
                        cpu: {
                            user: process.cpuUsage().user,
                            system: process.cpuUsage().system,
                        },
                    };
                    statusCode = dbHealth.status === 'healthy' ? 200 : 503;
                    res.status(statusCode).json(healthStatus);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    res.status(503).json({
                        status: 'error',
                        timestamp: new Date().toISOString(),
                        error: error_1.message,
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Simple status endpoint
    app.get(server_1.MONITORING_CONFIG.STATUS_PATH, function (req, res) {
        res.json({
            status: 'running',
            name: 'Zarmind API',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
        });
    });
}
// ==========================================
// API ROUTES
// ==========================================
// Root endpoint
app.get('/', function (req, res) {
    res.json({
        success: true,
        message: 'Welcome to Zarmind API - سیستم حسابداری هوشمند زرمند',
        version: '1.0.0',
        documentation: "".concat(server_1.SERVER_CONFIG.BASE_URL, "/api/docs"),
        endpoints: {
            health: server_1.MONITORING_CONFIG.HEALTH_CHECK_PATH,
            status: server_1.MONITORING_CONFIG.STATUS_PATH,
            api: server_1.SERVER_CONFIG.API_PREFIX,
        },
    });
});
// API version info
app.get("".concat(server_1.SERVER_CONFIG.API_PREFIX), function (req, res) {
    res.json({
        success: true,
        message: 'Zarmind API v1.0.0',
        version: '1.0.0',
        endpoints: {
            auth: "".concat(server_1.SERVER_CONFIG.API_PREFIX, "/auth"),
            inventory: "".concat(server_1.SERVER_CONFIG.API_PREFIX, "/inventory"),
            sales: "".concat(server_1.SERVER_CONFIG.API_PREFIX, "/sales"),
            customers: "".concat(server_1.SERVER_CONFIG.API_PREFIX, "/customers"),
            reports: "".concat(server_1.SERVER_CONFIG.API_PREFIX, "/reports"),
            ai: "".concat(server_1.SERVER_CONFIG.API_PREFIX, "/ai"),
        },
    });
});
// Register API routes
// app.use(`${SERVER_CONFIG.API_PREFIX}/auth`, authRoutes);
// app.use(`${SERVER_CONFIG.API_PREFIX}/inventory`, inventoryRoutes);
// app.use(`${SERVER_CONFIG.API_PREFIX}/sales`, salesRoutes);
// app.use(`${SERVER_CONFIG.API_PREFIX}/customers`, customerRoutes);
// app.use(`${SERVER_CONFIG.API_PREFIX}/reports`, reportRoutes);
// app.use(`${SERVER_CONFIG.API_PREFIX}/ai`, aiRoutes);
// ==========================================
// ERROR HANDLING MIDDLEWARE (MUST BE LAST)
// ==========================================
// 404 Not Found handler
app.use(error_middleware_1.notFoundHandler);
// Global error handler
app.use(error_middleware_1.errorHandler);
// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================
/**
 * Graceful shutdown handler
 */
var gracefulShutdown = function (signal) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        (0, logger_1.logSystem)("".concat(signal, " received. Starting graceful shutdown..."));
        // Stop accepting new connections
        server.close(function () { return __awaiter(void 0, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        (0, logger_1.logSystem)('HTTP server closed');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        // Close database connections
                        return [4 /*yield*/, (0, database_1.closePool)()];
                    case 2:
                        // Close database connections
                        _a.sent();
                        (0, logger_1.logSystem)('Database connections closed');
                        // Close logger
                        // await closeLogger();
                        (0, logger_1.logSystem)('Graceful shutdown completed');
                        process.exit(0);
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        (0, logger_1.logError)(error_2, 'Error during graceful shutdown');
                        process.exit(1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        // Force shutdown after 30 seconds
        setTimeout(function () {
            logger_1.default.error('Forcing shutdown after timeout');
            process.exit(1);
        }, 30000);
        return [2 /*return*/];
    });
}); };
exports.gracefulShutdown = gracefulShutdown;
// ==========================================
// PROCESS EVENT HANDLERS
// ==========================================
// Graceful shutdown on SIGTERM
process.on('SIGTERM', function () { return gracefulShutdown('SIGTERM'); });
// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', function () { return gracefulShutdown('SIGINT'); });
// Handle unhandled promise rejections
process.on('unhandledRejection', error_middleware_1.handleUnhandledRejection);
// Handle uncaught exceptions
process.on('uncaughtException', error_middleware_1.handleUncaughtException);
// ==========================================
// START SERVER
// ==========================================
var server;
/**
 * Initialize and start the server
 */
var startServer = function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                // Initialize database
                (0, logger_1.logSystem)('Initializing database connection...');
                return [4 /*yield*/, (0, database_1.initializeDatabase)()];
            case 1:
                _a.sent();
                (0, logger_1.logSystem)('Database initialized successfully');
                // Start HTTP server
                exports.server = server = app.listen(server_1.SERVER_CONFIG.PORT, server_1.SERVER_CONFIG.HOST, function () {
                    (0, logger_1.logSystem)('='.repeat(60));
                    (0, logger_1.logSystem)('🚀 Zarmind Server Started Successfully!');
                    (0, logger_1.logSystem)('='.repeat(60));
                    (0, logger_1.logSystem)("Environment: ".concat(process.env.NODE_ENV || 'development'));
                    (0, logger_1.logSystem)("Server URL: ".concat(server_1.SERVER_CONFIG.BASE_URL));
                    (0, logger_1.logSystem)("API Prefix: ".concat(server_1.SERVER_CONFIG.API_PREFIX));
                    (0, logger_1.logSystem)("Health Check: ".concat(server_1.SERVER_CONFIG.BASE_URL).concat(server_1.MONITORING_CONFIG.HEALTH_CHECK_PATH));
                    (0, logger_1.logSystem)("Frontend URL: ".concat(server_1.SERVER_CONFIG.FRONTEND_URL));
                    (0, logger_1.logSystem)('='.repeat(60));
                    // Log feature flags
                    var featuresEnabled = Object.entries(require('./config/server').FEATURES)
                        .filter(function (_a) {
                        var _ = _a[0], enabled = _a[1];
                        return enabled;
                    })
                        .map(function (_a) {
                        var feature = _a[0];
                        return feature;
                    });
                    if (featuresEnabled.length > 0) {
                        (0, logger_1.logSystem)("Enabled Features: ".concat(featuresEnabled.join(', ')));
                    }
                    (0, logger_1.logSystem)('Server is ready to accept connections');
                });
                // Handle server errors
                server.on('error', function (error) {
                    if (error.code === 'EADDRINUSE') {
                        (0, logger_1.logError)(error, "Port ".concat(server_1.SERVER_CONFIG.PORT, " is already in use. Please use a different port."));
                    }
                    else {
                        (0, logger_1.logError)(error, 'Server error');
                    }
                    process.exit(1);
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                (0, logger_1.logError)(error_3, 'Failed to start server');
                process.exit(1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.startServer = startServer;
// ==========================================
// BOOTSTRAP APPLICATION
// ==========================================
// Only start server if this file is run directly (not imported for testing)
if (require.main === module) {
    startServer();
}
// ==========================================
// EXPORTS
// ==========================================
exports.default = app;
