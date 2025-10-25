"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialsModule = void 0;
const common_1 = require("@nestjs/common");
const ap_module_1 = require("./submodules/accounts-payable/ap.module");
const ar_module_1 = require("./submodules/accounts-receivable/ar.module");
const bank_accounts_module_1 = require("./submodules/bank-accounts/bank-accounts.module");
const cash_module_1 = require("./submodules/cash/cash.module");
const checks_module_1 = require("./submodules/checks/checks.module");
const expenses_module_1 = require("./submodules/expenses/expenses.module");
let FinancialsModule = class FinancialsModule {
};
exports.FinancialsModule = FinancialsModule;
exports.FinancialsModule = FinancialsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            ap_module_1.ApModule,
            ar_module_1.ArModule,
            bank_accounts_module_1.BankAccountsModule,
            cash_module_1.CashModule,
            checks_module_1.ChecksModule,
            expenses_module_1.ExpensesModule,
        ],
        exports: [
            ap_module_1.ApModule,
            ar_module_1.ArModule,
            bank_accounts_module_1.BankAccountsModule,
            cash_module_1.CashModule,
            checks_module_1.ChecksModule,
            expenses_module_1.ExpensesModule,
        ],
    })
], FinancialsModule);
//# sourceMappingURL=financials.module.js.map