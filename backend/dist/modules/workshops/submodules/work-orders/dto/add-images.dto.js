"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddImagesDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
function toStringArray(v) {
    if (v == null)
        return undefined;
    if (Array.isArray(v))
        return v.map((x) => String(x));
    if (typeof v === 'string') {
        const s = v.trim();
        if (!s)
            return [];
        // If JSON array string provided
        if (s.startsWith('[') && s.endsWith(']')) {
            try {
                const arr = JSON.parse(s);
                return Array.isArray(arr) ? arr.map((x) => String(x)) : [];
            }
            catch {
                // fall through to comma-split
            }
        }
        return s.split(',').map((x) => x.trim()).filter(Boolean);
    }
    return [];
}
class AddImagesDto {
}
exports.AddImagesDto = AddImagesDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => toStringArray(value)),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AddImagesDto.prototype, "imagesToAdd", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => toStringArray(value)),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AddImagesDto.prototype, "imagesToRemove", void 0);
//# sourceMappingURL=add-images.dto.js.map