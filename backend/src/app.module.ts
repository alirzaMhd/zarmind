import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// Core Modules
import { AppConfigModule } from './core/config/config.module';
import { DatabaseModule } from './core/database/database.module';
import { CacheModule } from './core/cache/cache.module';
import { AuthModule } from './core/auth/auth.module';

// Guards
import { JwtAuthGuard } from './core/auth/guards/jwt-auth.guard';
import { RolesGuard } from './core/guards/roles.guard';

// Filters
import { PrismaExceptionFilter } from './core/database/prisma-exception.filter';

// Feature Modules
import { CustomersModule } from './modules/crm/customers.module';
import { WorkshopsModule } from './modules/workshops/workshops.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ManagementModule } from './modules/management/management.module'; // Add this
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { UsersModule } from './modules/users/users.module';
import { UtilitiesModule } from './modules/utilities/utilities.module';

// Feature Controllers & Services (for modules without separate module files)
import { AnalyticsController } from './modules/analytics/analytics.controller';
import { ReportsController } from './modules/reports/reports.controller';
import { ReportsService } from './modules/reports/reports.service';
import { NotificationsGateway } from './modules/notifications/notifications.gateway';

// Financials Submodules
import { ApModule } from './modules/financials/submodules/accounts-payable/ap.module';
import { ArModule } from './modules/financials/submodules/accounts-receivable/ar.module';
import { BankAccountsModule } from './modules/financials/submodules/bank-accounts/bank-accounts.module';
import { CashModule } from './modules/financials/submodules/cash/cash.module';
import { ChecksModule } from './modules/financials/submodules/checks/checks.module';
import { ExpensesModule } from './modules/financials/submodules/expenses/expenses.module';

import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    // Global Configuration
    AppConfigModule,

    // Serve static files (uploads)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
      },
    }),

    // Core Modules
    DatabaseModule,
    CacheModule,
    AuthModule,

    // CRM Module
    CustomersModule,

    // Workshops Modules
    WorkshopsModule,

    // Employee Management
    EmployeesModule,

    // Financial Modules
    ApModule,
    ArModule,
    BankAccountsModule,
    CashModule,
    ChecksModule,
    ExpensesModule,

    // Inventory Management
    InventoryModule,

    // Management Module (Branches, etc.) - Add this
    ManagementModule,

    // Supplier Management
    SuppliersModule,

    // Transaction Management
    TransactionsModule,

    // User Management
    UsersModule,

    // Utilities (Media, OCR, QR)
    UtilitiesModule,
    
    SettingsModule,
  ],
  controllers: [
    // Standalone controllers (modules without separate module files)
    AnalyticsController,
    ReportsController,
  ],
  providers: [
    // Standalone services
    ReportsService,

    // WebSocket Gateway
    NotificationsGateway,

    // Global Guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },

    // Global Exception Filters
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
  ],
})
export class AppModule {}