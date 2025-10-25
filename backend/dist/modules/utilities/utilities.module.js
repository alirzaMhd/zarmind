"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtilitiesModule = void 0;
const common_1 = require("@nestjs/common");
const media_controller_1 = require("./media.controller");
const ocr_service_1 = require("./ocr.service");
const qr_code_service_1 = require("./qr-code.service");
const database_module_1 = require("../../core/database/database.module");
let UtilitiesModule = class UtilitiesModule {
};
exports.UtilitiesModule = UtilitiesModule;
exports.UtilitiesModule = UtilitiesModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        controllers: [media_controller_1.MediaController],
        providers: [ocr_service_1.OcrService, qr_code_service_1.QrCodeService],
        exports: [ocr_service_1.OcrService, qr_code_service_1.QrCodeService],
    })
], UtilitiesModule);
//# sourceMappingURL=utilities.module.js.map