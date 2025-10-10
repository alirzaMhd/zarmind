"use strict";
// ==========================================
// ZARMIND - Database Configuration
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.initializeDatabase = exports.healthCheck = exports.closePool = exports.getExecutedMigrations = exports.isMigrationExecuted = exports.recordMigration = exports.ensureMigrationsTable = exports.buildSearchQuery = exports.dropTable = exports.truncateTable = exports.executeSQLFile = exports.getTableCount = exports.tableExists = exports.getPoolStats = exports.testConnection = exports.buildSelectQuery = exports.buildDeleteQuery = exports.buildUpdateQuery = exports.buildInsertQuery = exports.batchQuery = exports.transaction = exports.getClient = exports.query = void 0;
var pg_1 = require("pg");
var logger_1 = require("../utils/logger");
// ==========================================
// DATABASE CONFIGURATION
// ==========================================
var dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'zarmind',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10), // Maximum pool size
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return error after 10 seconds if no connection available
    allowExitOnIdle: false,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};
// ==========================================
// CREATE POOL
// ==========================================
var pool = new pg_1.Pool(dbConfig);
exports.pool = pool;
// ==========================================
// POOL EVENT HANDLERS
// ==========================================
pool.on('connect', function (client) {
    (0, logger_1.logSystem)('New client connected to database', {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
    });
});
pool.on('acquire', function (client) {
    logger_1.default.debug('Client acquired from pool', {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
    });
});
pool.on('remove', function (client) {
    logger_1.default.debug('Client removed from pool', {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
    });
});
pool.on('error', function (err, client) {
    (0, logger_1.logError)(err, 'Unexpected database pool error');
});
// ==========================================
// QUERY HELPER FUNCTION
// ==========================================
/**
 * Execute a query with automatic connection handling
 */
var query = function (text, params) { return __awaiter(void 0, void 0, void 0, function () {
    var start, result, duration, error_1, duration;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                start = Date.now();
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, pool.query(text, params)];
            case 2:
                result = _a.sent();
                duration = Date.now() - start;
                (0, logger_1.logQuery)(text, params, duration);
                return [2 /*return*/, result];
            case 3:
                error_1 = _a.sent();
                duration = Date.now() - start;
                (0, logger_1.logError)(error_1, 'Database Query Error', {
                    query: text,
                    params: params,
                    duration: duration,
                });
                throw error_1;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.query = query;
// ==========================================
// GET CLIENT (for transactions)
// ==========================================
/**
 * Get a client from the pool for manual transaction control
 */
var getClient = function () { return __awaiter(void 0, void 0, void 0, function () {
    var client;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, pool.connect()];
            case 1:
                client = _a.sent();
                logger_1.default.debug('Client checked out from pool', {
                    totalCount: pool.totalCount,
                    idleCount: pool.idleCount,
                    waitingCount: pool.waitingCount,
                });
                return [2 /*return*/, client];
        }
    });
}); };
exports.getClient = getClient;
// ==========================================
// TRANSACTION WRAPPER
// ==========================================
/**
 * Execute a function within a transaction
 * Automatically handles BEGIN, COMMIT, and ROLLBACK
 */
var transaction = function (callback) { return __awaiter(void 0, void 0, void 0, function () {
    var client, result, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, exports.getClient)()];
            case 1:
                client = _a.sent();
                _a.label = 2;
            case 2:
                _a.trys.push([2, 6, 8, 9]);
                return [4 /*yield*/, client.query('BEGIN')];
            case 3:
                _a.sent();
                logger_1.default.debug('Transaction started');
                return [4 /*yield*/, callback(client)];
            case 4:
                result = _a.sent();
                return [4 /*yield*/, client.query('COMMIT')];
            case 5:
                _a.sent();
                logger_1.default.debug('Transaction committed');
                return [2 /*return*/, result];
            case 6:
                error_2 = _a.sent();
                return [4 /*yield*/, client.query('ROLLBACK')];
            case 7:
                _a.sent();
                logger_1.default.warn('Transaction rolled back', { error: error_2.message });
                throw error_2;
            case 8:
                client.release();
                logger_1.default.debug('Transaction client released');
                return [7 /*endfinally*/];
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.transaction = transaction;
// ==========================================
// BATCH QUERY HELPER
// ==========================================
/**
 * Execute multiple queries in a transaction
 */
var batchQuery = function (queries) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, (0, exports.transaction)(function (client) { return __awaiter(void 0, void 0, void 0, function () {
                var results, _i, queries_1, _a, text, params, start, result, duration;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            results = [];
                            _i = 0, queries_1 = queries;
                            _b.label = 1;
                        case 1:
                            if (!(_i < queries_1.length)) return [3 /*break*/, 4];
                            _a = queries_1[_i], text = _a.text, params = _a.params;
                            start = Date.now();
                            return [4 /*yield*/, client.query(text, params)];
                        case 2:
                            result = _b.sent();
                            duration = Date.now() - start;
                            (0, logger_1.logQuery)(text, params, duration);
                            results.push(result);
                            _b.label = 3;
                        case 3:
                            _i++;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/, results];
                    }
                });
            }); })];
    });
}); };
exports.batchQuery = batchQuery;
// ==========================================
// QUERY BUILDERS
// ==========================================
/**
 * Build INSERT query with RETURNING
 */
var buildInsertQuery = function (table, data, returning) {
    if (returning === void 0) { returning = '*'; }
    var keys = Object.keys(data);
    var values = Object.values(data);
    var columns = keys.join(', ');
    var placeholders = keys.map(function (_, i) { return "$".concat(i + 1); }).join(', ');
    var text = "INSERT INTO ".concat(table, " (").concat(columns, ") VALUES (").concat(placeholders, ") RETURNING ").concat(returning);
    return { text: text, params: values };
};
exports.buildInsertQuery = buildInsertQuery;
/**
 * Build UPDATE query with WHERE clause
 */
var buildUpdateQuery = function (table, data, where, returning) {
    if (returning === void 0) { returning = '*'; }
    var dataKeys = Object.keys(data);
    var dataValues = Object.values(data);
    var whereKeys = Object.keys(where);
    var whereValues = Object.values(where);
    var setClause = dataKeys
        .map(function (key, i) { return "".concat(key, " = $").concat(i + 1); })
        .join(', ');
    var whereClause = whereKeys
        .map(function (key, i) { return "".concat(key, " = $").concat(dataKeys.length + i + 1); })
        .join(' AND ');
    var text = "UPDATE ".concat(table, " SET ").concat(setClause, " WHERE ").concat(whereClause, " RETURNING ").concat(returning);
    var params = __spreadArray(__spreadArray([], dataValues, true), whereValues, true);
    return { text: text, params: params };
};
exports.buildUpdateQuery = buildUpdateQuery;
/**
 * Build DELETE query with WHERE clause
 */
var buildDeleteQuery = function (table, where, returning) {
    var whereKeys = Object.keys(where);
    var whereValues = Object.values(where);
    var whereClause = whereKeys
        .map(function (key, i) { return "".concat(key, " = $").concat(i + 1); })
        .join(' AND ');
    var returningClause = returning ? " RETURNING ".concat(returning) : '';
    var text = "DELETE FROM ".concat(table, " WHERE ").concat(whereClause).concat(returningClause);
    return { text: text, params: whereValues };
};
exports.buildDeleteQuery = buildDeleteQuery;
/**
 * Build SELECT query with pagination
 */
var buildSelectQuery = function (table, options) {
    if (options === void 0) { options = {}; }
    var _a = options.select, select = _a === void 0 ? ['*'] : _a, _b = options.where, where = _b === void 0 ? {} : _b, orderBy = options.orderBy, limit = options.limit, offset = options.offset;
    var columns = select.join(', ');
    var text = "SELECT ".concat(columns, " FROM ").concat(table);
    var params = [];
    // WHERE clause
    var whereKeys = Object.keys(where);
    if (whereKeys.length > 0) {
        var whereClause = whereKeys
            .map(function (key, i) {
            params.push(where[key]);
            return "".concat(key, " = $").concat(params.length);
        })
            .join(' AND ');
        text += " WHERE ".concat(whereClause);
    }
    // ORDER BY
    if (orderBy) {
        text += " ORDER BY ".concat(orderBy);
    }
    // LIMIT
    if (limit) {
        params.push(limit);
        text += " LIMIT $".concat(params.length);
    }
    // OFFSET
    if (offset) {
        params.push(offset);
        text += " OFFSET $".concat(params.length);
    }
    return { text: text, params: params };
};
exports.buildSelectQuery = buildSelectQuery;
// ==========================================
// UTILITY FUNCTIONS
// ==========================================
/**
 * Check if database is connected
 */
var testConnection = function () { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_3;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, exports.query)('SELECT NOW() as now')];
            case 1:
                result = _b.sent();
                (0, logger_1.logSystem)('Database connection test successful', {
                    serverTime: (_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.now,
                });
                return [2 /*return*/, true];
            case 2:
                error_3 = _b.sent();
                (0, logger_1.logError)(error_3, 'Database connection test failed');
                return [2 /*return*/, false];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.testConnection = testConnection;
/**
 * Get database statistics
 */
var getPoolStats = function () {
    return {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
    };
};
exports.getPoolStats = getPoolStats;
/**
 * Check if a table exists
 */
var tableExists = function (tableName) { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, (0, exports.query)("SELECT EXISTS (\n      SELECT FROM information_schema.tables \n      WHERE table_schema = 'public' \n      AND table_name = $1\n    )", [tableName])];
            case 1:
                result = _b.sent();
                return [2 /*return*/, ((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.exists) || false];
        }
    });
}); };
exports.tableExists = tableExists;
/**
 * Get table row count
 */
var getTableCount = function (tableName) { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, (0, exports.query)("SELECT COUNT(*) as count FROM ".concat(tableName))];
            case 1:
                result = _b.sent();
                return [2 /*return*/, parseInt(((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.count) || '0', 10)];
        }
    });
}); };
exports.getTableCount = getTableCount;
/**
 * Execute raw SQL file
 */
var executeSQLFile = function (sql) { return __awaiter(void 0, void 0, void 0, function () {
    var statements, _i, statements_1, statement;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                statements = sql
                    .split(';')
                    .map(function (s) { return s.trim(); })
                    .filter(function (s) { return s.length > 0; });
                _i = 0, statements_1 = statements;
                _a.label = 1;
            case 1:
                if (!(_i < statements_1.length)) return [3 /*break*/, 4];
                statement = statements_1[_i];
                return [4 /*yield*/, (0, exports.query)(statement)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.executeSQLFile = executeSQLFile;
/**
 * Truncate table (WARNING: Deletes all data)
 */
var truncateTable = function (tableName_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([tableName_1], args_1, true), void 0, function (tableName, cascade) {
        var cascadeClause;
        if (cascade === void 0) { cascade = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cascadeClause = cascade ? 'CASCADE' : '';
                    return [4 /*yield*/, (0, exports.query)("TRUNCATE TABLE ".concat(tableName, " ").concat(cascadeClause))];
                case 1:
                    _a.sent();
                    logger_1.default.warn("Table truncated: ".concat(tableName));
                    return [2 /*return*/];
            }
        });
    });
};
exports.truncateTable = truncateTable;
/**
 * Drop table (WARNING: Deletes table structure and data)
 */
var dropTable = function (tableName_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([tableName_1], args_1, true), void 0, function (tableName, ifExists) {
        var ifExistsClause;
        if (ifExists === void 0) { ifExists = true; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ifExistsClause = ifExists ? 'IF EXISTS' : '';
                    return [4 /*yield*/, (0, exports.query)("DROP TABLE ".concat(ifExistsClause, " ").concat(tableName, " CASCADE"))];
                case 1:
                    _a.sent();
                    logger_1.default.warn("Table dropped: ".concat(tableName));
                    return [2 /*return*/];
            }
        });
    });
};
exports.dropTable = dropTable;
// ==========================================
// SEARCH HELPERS
// ==========================================
/**
 * Build full-text search query
 */
var buildSearchQuery = function (table, searchColumns, searchTerm, additionalWhere) {
    var params = ["%".concat(searchTerm, "%")];
    var searchConditions = searchColumns
        .map(function () {
        var index = params.length;
        return "".concat(searchColumns[params.length - 1], " ILIKE $").concat(index);
    })
        .join(' OR ');
    var whereClause = "(".concat(searchConditions, ")");
    if (additionalWhere) {
        var additionalKeys = Object.keys(additionalWhere);
        var additionalConditions = additionalKeys.map(function (key) {
            params.push(additionalWhere[key]);
            return "".concat(key, " = $").concat(params.length);
        });
        whereClause += " AND ".concat(additionalConditions.join(' AND '));
    }
    var text = "SELECT * FROM ".concat(table, " WHERE ").concat(whereClause);
    return { text: text, params: params };
};
exports.buildSearchQuery = buildSearchQuery;
// ==========================================
// MIGRATION HELPERS
// ==========================================
/**
 * Check if migrations table exists, create if not
 */
var ensureMigrationsTable = function () { return __awaiter(void 0, void 0, void 0, function () {
    var exists;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, exports.tableExists)('migrations')];
            case 1:
                exists = _a.sent();
                if (!!exists) return [3 /*break*/, 3];
                return [4 /*yield*/, (0, exports.query)("\n      CREATE TABLE migrations (\n        id SERIAL PRIMARY KEY,\n        name VARCHAR(255) NOT NULL UNIQUE,\n        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n      )\n    ")];
            case 2:
                _a.sent();
                (0, logger_1.logSystem)('Migrations table created');
                _a.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.ensureMigrationsTable = ensureMigrationsTable;
/**
 * Record migration execution
 */
var recordMigration = function (migrationName) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, exports.query)('INSERT INTO migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [migrationName])];
            case 1:
                _a.sent();
                (0, logger_1.logSystem)("Migration recorded: ".concat(migrationName));
                return [2 /*return*/];
        }
    });
}); };
exports.recordMigration = recordMigration;
/**
 * Check if migration has been executed
 */
var isMigrationExecuted = function (migrationName) { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, (0, exports.query)('SELECT EXISTS(SELECT 1 FROM migrations WHERE name = $1)', [migrationName])];
            case 1:
                result = _b.sent();
                return [2 /*return*/, ((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.exists) || false];
        }
    });
}); };
exports.isMigrationExecuted = isMigrationExecuted;
/**
 * Get all executed migrations
 */
var getExecutedMigrations = function () { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, exports.query)('SELECT name FROM migrations ORDER BY executed_at ASC')];
            case 1:
                result = _a.sent();
                return [2 /*return*/, result.rows.map(function (row) { return row.name; })];
        }
    });
}); };
exports.getExecutedMigrations = getExecutedMigrations;
// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================
/**
 * Close database pool gracefully
 */
var closePool = function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, pool.end()];
            case 1:
                _a.sent();
                (0, logger_1.logSystem)('Database pool closed gracefully');
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                (0, logger_1.logError)(error_4, 'Error closing database pool');
                throw error_4;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.closePool = closePool;
// ==========================================
// HEALTH CHECK
// ==========================================
/**
 * Comprehensive database health check
 */
var healthCheck = function () { return __awaiter(void 0, void 0, void 0, function () {
    var timestamp, stats, start, latency, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                timestamp = new Date();
                stats = (0, exports.getPoolStats)();
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                start = Date.now();
                return [4 /*yield*/, (0, exports.query)('SELECT 1')];
            case 2:
                _a.sent();
                latency = Date.now() - start;
                return [2 /*return*/, {
                        status: 'healthy',
                        timestamp: timestamp,
                        stats: stats,
                        latency: latency,
                    }];
            case 3:
                error_5 = _a.sent();
                return [2 /*return*/, {
                        status: 'unhealthy',
                        timestamp: timestamp,
                        stats: stats,
                        error: error_5.message,
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.healthCheck = healthCheck;
// ==========================================
// INITIALIZE DATABASE
// ==========================================
/**
 * Initialize database connection and run startup checks
 */
var initializeDatabase = function () { return __awaiter(void 0, void 0, void 0, function () {
    var isConnected, stats, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                (0, logger_1.logSystem)('Initializing database connection...');
                return [4 /*yield*/, (0, exports.testConnection)()];
            case 1:
                isConnected = _a.sent();
                if (!isConnected) {
                    throw new Error('Failed to connect to database');
                }
                // Ensure migrations table exists
                return [4 /*yield*/, (0, exports.ensureMigrationsTable)()];
            case 2:
                // Ensure migrations table exists
                _a.sent();
                stats = (0, exports.getPoolStats)();
                (0, logger_1.logSystem)('Database initialized successfully', stats);
                return [3 /*break*/, 4];
            case 3:
                error_6 = _a.sent();
                (0, logger_1.logError)(error_6, 'Database initialization failed');
                throw error_6;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.initializeDatabase = initializeDatabase;
exports.default = {
    pool: pool,
    query: exports.query,
    getClient: exports.getClient,
    transaction: exports.transaction,
    batchQuery: exports.batchQuery,
    buildInsertQuery: exports.buildInsertQuery,
    buildUpdateQuery: exports.buildUpdateQuery,
    buildDeleteQuery: exports.buildDeleteQuery,
    buildSelectQuery: exports.buildSelectQuery,
    buildSearchQuery: exports.buildSearchQuery,
    testConnection: exports.testConnection,
    getPoolStats: exports.getPoolStats,
    tableExists: exports.tableExists,
    getTableCount: exports.getTableCount,
    executeSQLFile: exports.executeSQLFile,
    truncateTable: exports.truncateTable,
    dropTable: exports.dropTable,
    ensureMigrationsTable: exports.ensureMigrationsTable,
    recordMigration: exports.recordMigration,
    isMigrationExecuted: exports.isMigrationExecuted,
    getExecutedMigrations: exports.getExecutedMigrations,
    closePool: exports.closePool,
    healthCheck: exports.healthCheck,
    initializeDatabase: exports.initializeDatabase,
};
// ==========================================
// STARTUP
// ==========================================
// Auto-initialize in non-test environments
if (process.env.NODE_ENV !== 'test') {
    (0, exports.initializeDatabase)().catch(function (error) {
        (0, logger_1.logError)(error, 'Fatal: Could not initialize database');
        process.exit(1);
    });
}
