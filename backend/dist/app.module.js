"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
// Core Modules
const config_module_1 = require("./core/config/config.module");
const database_module_1 = require("./core/database/database.module");
const cache_module_1 = require("./core/cache/cache.module");
const auth_module_1 = require("./core/auth/auth.module");
const axios_1 = require("@nestjs/axios");
// Guards
const jwt_auth_guard_1 = require("./core/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("./core/guards/roles.guard");
// Filters
const prisma_exception_filter_1 = require("./core/database/prisma-exception.filter");
// Feature Modules
const customers_module_1 = require("./modules/crm/customers.module");
const workshops_module_1 = require("./modules/workshops/workshops.module");
const employees_module_1 = require("./modules/employees/employees.module");
const inventory_module_1 = require("./modules/inventory/inventory.module");
const management_module_1 = require("./modules/management/management.module"); // Add this
const suppliers_module_1 = require("./modules/suppliers/suppliers.module");
const transactions_module_1 = require("./modules/transactions/transactions.module");
const users_module_1 = require("./modules/users/users.module");
const utilities_module_1 = require("./modules/utilities/utilities.module");
// Feature Controllers & Services (for modules without separate module files)
const analytics_controller_1 = require("./modules/analytics/analytics.controller");
const gold_currency_service_1 = require("./modules/analytics/gold-currency.service");
const reports_controller_1 = require("./modules/reports/reports.controller");
const reports_service_1 = require("./modules/reports/reports.service");
const notifications_gateway_1 = require("./modules/notifications/notifications.gateway");
// Financials Submodules
const ap_module_1 = require("./modules/financials/submodules/accounts-payable/ap.module");
const ar_module_1 = require("./modules/financials/submodules/accounts-receivable/ar.module");
const bank_accounts_module_1 = require("./modules/financials/submodules/bank-accounts/bank-accounts.module");
const cash_module_1 = require("./modules/financials/submodules/cash/cash.module");
const checks_module_1 = require("./modules/financials/submodules/checks/checks.module");
const expenses_module_1 = require("./modules/financials/submodules/expenses/expenses.module");
const settings_module_1 = require("./modules/settings/settings.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            // Global Configuration
            config_module_1.AppConfigModule,
            // Serve static files (uploads)
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'uploads'),
                serveRoot: '/uploads',
                serveStaticOptions: {
                    index: false,
                },
            }),
            // Core Modules
            database_module_1.DatabaseModule,
            cache_module_1.CacheModule,
            auth_module_1.AuthModule,
            axios_1.HttpModule,
            // CRM Module
            customers_module_1.CustomersModule,
            // Workshops Modules
            workshops_module_1.WorkshopsModule,
            // Employee Management
            employees_module_1.EmployeesModule,
            // Financial Modules
            ap_module_1.ApModule,
            ar_module_1.ArModule,
            bank_accounts_module_1.BankAccountsModule,
            cash_module_1.CashModule,
            checks_module_1.ChecksModule,
            expenses_module_1.ExpensesModule,
            // Inventory Management
            inventory_module_1.InventoryModule,
            // Management Module (Branches, etc.) - Add this
            management_module_1.ManagementModule,
            // Supplier Management
            suppliers_module_1.SuppliersModule,
            // Transaction Management
            transactions_module_1.TransactionsModule,
            // User Management
            users_module_1.UsersModule,
            // Utilities (Media, OCR, QR)
            utilities_module_1.UtilitiesModule,
            settings_module_1.SettingsModule,
        ],
        controllers: [
            // Standalone controllers (modules without separate module files)
            analytics_controller_1.AnalyticsController,
            reports_controller_1.ReportsController,
        ],
        providers: [
            // Standalone services
            reports_service_1.ReportsService,
            gold_currency_service_1.GoldCurrencyService,
            // WebSocket Gateway
            notifications_gateway_1.NotificationsGateway,
            // Global Guards
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
            // Global Exception Filters
            {
                provide: core_1.APP_FILTER,
                useClass: prisma_exception_filter_1.PrismaExceptionFilter,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map