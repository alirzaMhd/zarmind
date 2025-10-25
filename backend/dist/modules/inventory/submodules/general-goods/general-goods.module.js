"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneralGoodsModule = void 0;
const common_1 = require("@nestjs/common");
const general_goods_controller_1 = require("./general-goods.controller");
const general_goods_service_1 = require("./general-goods.service");
const database_module_1 = require("../../../../core/database/database.module");
let GeneralGoodsModule = class GeneralGoodsModule {
};
exports.GeneralGoodsModule = GeneralGoodsModule;
exports.GeneralGoodsModule = GeneralGoodsModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        controllers: [general_goods_controller_1.GeneralGoodsController],
        providers: [general_goods_service_1.GeneralGoodsService],
        exports: [general_goods_service_1.GeneralGoodsService],
    })
], GeneralGoodsModule);
//# sourceMappingURL=general-goods.module.js.map