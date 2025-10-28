"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrCodeController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const fs = __importStar(require("fs"));
const qr_code_service_1 = require("./qr-code.service");
const jwt_auth_guard_1 = require("../../core/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../core/guards/roles.guard");
const roles_decorator_1 = require("../../core/guards/roles.decorator");
const shared_types_1 = require("@zarmind/shared-types");
const IMAGES_DIR = (0, path_1.join)(process.cwd(), 'uploads', 'images');
function ensureImagesDir() {
    if (!fs.existsSync(IMAGES_DIR))
        fs.mkdirSync(IMAGES_DIR, { recursive: true });
}
const logoStorage = (0, multer_1.diskStorage)({
    destination: (_req, _file, cb) => {
        ensureImagesDir();
        cb(null, IMAGES_DIR);
    },
    filename: (_req, file, cb) => {
        const ext = ((0, path_1.extname)(file.originalname) || '.png').toLowerCase();
        cb(null, `qr-logo${ext}`);
    },
});
let QrCodeController = class QrCodeController {
    constructor(qr) {
        this.qr = qr;
        ensureImagesDir();
    }
    async preview(body) {
        const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3001';
        const sample = `${appUrl}/qr-lookup?code=SAMPLE`;
        const dataUrl = await this.qr.generateQrCodeWithSettings(sample, body.settings);
        return { dataUrl };
    }
    async getLogo() {
        ensureImagesDir();
        const files = fs.readdirSync(IMAGES_DIR).filter((f) => f.startsWith('qr-logo.'));
        if (!files.length)
            return { logoUrl: null };
        const filename = files[0];
        // Serve via existing media controller route
        return {
            logoUrl: `/api/utilities/media/images/${filename}`,
            filename,
        };
    }
    async uploadLogo(file) {
        if (!file)
            throw new common_1.BadRequestException('No file uploaded');
        // Remove old logo files (keep only the newly uploaded one)
        const files = fs.readdirSync(IMAGES_DIR).filter((f) => f.startsWith('qr-logo.') && f !== file.filename);
        files.forEach((f) => {
            try {
                fs.unlinkSync((0, path_1.join)(IMAGES_DIR, f));
            }
            catch { }
        });
        return {
            success: true,
            logoUrl: `/api/utilities/media/images/${file.filename}`,
        };
    }
    async deleteLogo() {
        ensureImagesDir();
        const files = fs.readdirSync(IMAGES_DIR).filter((f) => f.startsWith('qr-logo.'));
        files.forEach((f) => {
            try {
                fs.unlinkSync((0, path_1.join)(IMAGES_DIR, f));
            }
            catch { }
        });
        return { success: true };
    }
    async regenerateAll() {
        // Implement your batch regeneration here if needed
        return { success: true, message: 'Regeneration started' };
    }
};
exports.QrCodeController = QrCodeController;
__decorate([
    (0, common_1.Post)('preview'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QrCodeController.prototype, "preview", null);
__decorate([
    (0, common_1.Get)('logo'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QrCodeController.prototype, "getLogo", null);
__decorate([
    (0, common_1.Post)('upload-logo'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('logo', {
        storage: logoStorage,
        fileFilter: (_req, file, cb) => {
            if (!/image\/(png|jpeg|jpg|webp|svg\+xml)/i.test(file.mimetype)) {
                return cb(new common_1.BadRequestException('Invalid image type'), false);
            }
            cb(null, true);
        },
        limits: { fileSize: 2 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QrCodeController.prototype, "uploadLogo", null);
__decorate([
    (0, common_1.Delete)('logo'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QrCodeController.prototype, "deleteLogo", null);
__decorate([
    (0, common_1.Post)('regenerate-all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QrCodeController.prototype, "regenerateAll", null);
exports.QrCodeController = QrCodeController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN),
    (0, common_1.Controller)('utilities/qr-code'),
    __metadata("design:paramtypes", [qr_code_service_1.QrCodeService])
], QrCodeController);
//# sourceMappingURL=qr-code.controller.js.map