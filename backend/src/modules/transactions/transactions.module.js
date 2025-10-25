"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../core/database/database.module");
const purchases_module_1 = require("./submodules/purchases/purchases.module");
const returns_module_1 = require("./submodules/returns/returns.module");
const sales_module_1 = require("./submodules/sales/sales.module");
let TransactionsModule = class TransactionsModule {
};
exports.TransactionsModule = TransactionsModule;
exports.TransactionsModule = TransactionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_module_1.DatabaseModule,
            purchases_module_1.PurchasesModule,
            returns_module_1.ReturnsModule,
            sales_module_1.SalesModule,
        ],
        exports: [
            purchases_module_1.PurchasesModule,
            returns_module_1.ReturnsModule,
            sales_module_1.SalesModule,
        ],
    })
], TransactionsModule);
//# sourceMappingURL=transactions.module.js.map