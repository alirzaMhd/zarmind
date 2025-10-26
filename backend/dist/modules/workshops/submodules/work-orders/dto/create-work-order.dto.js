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
exports.CreateWorkOrderDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const shared_types_1 = require("@zarmind/shared-types");
function toNum(v) {
    if (v === '' || v == null)
        return undefined;
    const n = Number(v);
    return isNaN(n) ? undefined : n;
}
function toInt(v) {
    if (v === '' || v == null)
        return undefined;
    const n = parseInt(String(v), 10);
    return isNaN(n) ? undefined : n;
}
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
                // fallback to comma split
            }
        }
        return s.split(',').map((x) => x.trim()).filter(Boolean);
    }
    return [];
}
function toJson(v) {
    if (v == null || v === '')
        return undefined;
    if (typeof v === 'object')
        return v;
    if (typeof v === 'string') {
        try {
            return JSON.parse(v);
        }
        catch {
            // ignore invalid JSON string
            return undefined;
        }
    }
    return undefined;
}
class CreateWorkOrderDto {
}
exports.CreateWorkOrderDto = CreateWorkOrderDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "workshopId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "orderNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "productName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => toJson(value)),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateWorkOrderDto.prototype, "specifications", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => toInt(value)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateWorkOrderDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(shared_types_1.WorkOrderStatus),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(shared_types_1.WorkOrderPriority),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "orderDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "expectedEndDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "completedDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "deliveredDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => toNum(value)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateWorkOrderDto.prototype, "costEstimate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => toNum(value)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateWorkOrderDto.prototype, "actualCost", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => toNum(value)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateWorkOrderDto.prototype, "goldProvided", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "stonesProvided", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => toStringArray(value)),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateWorkOrderDto.prototype, "images", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => toInt(value)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateWorkOrderDto.prototype, "qualityRating", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "notes", void 0);
//# sourceMappingURL=create-work-order.dto.js.map