"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RawGoldModule = void 0;
const common_1 = require("@nestjs/common");
const raw_gold_controller_1 = require("./raw-gold.controller");
const raw_gold_service_1 = require("./raw-gold.service");
const database_module_1 = require("../../../../core/database/database.module");
let RawGoldModule = class RawGoldModule {
};
exports.RawGoldModule = RawGoldModule;
exports.RawGoldModule = RawGoldModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        controllers: [raw_gold_controller_1.RawGoldController],
        providers: [raw_gold_service_1.RawGoldService],
        exports: [raw_gold_service_1.RawGoldService],
    })
], RawGoldModule);
//# sourceMappingURL=raw-gold.module.js.map