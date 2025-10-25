"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const library_1 = require("@prisma/client/runtime/library");
let PrismaExceptionFilter = class PrismaExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let error = new common_1.BadRequestException('Database error. Please verify your input and try again.');
        if (exception instanceof library_1.PrismaClientValidationError) {
            error = new common_1.BadRequestException('Invalid data for database operation');
        }
        else if (exception instanceof library_1.PrismaClientKnownRequestError) {
            switch (exception.code) {
                case 'P2000':
                    error = new common_1.BadRequestException('Value too long for column');
                    break;
                case 'P2002': {
                    const meta = exception.meta;
                    const fields = Array.isArray(meta?.target) ? meta.target.join(', ') : meta?.target;
                    error = new common_1.ConflictException(`Unique constraint failed on: ${fields ?? 'field'}`);
                    break;
                }
                case 'P2003':
                    error = new common_1.BadRequestException('Operation violates foreign key constraint');
                    break;
                case 'P2011':
                    error = new common_1.BadRequestException('Null constraint violation');
                    break;
                case 'P2012':
                    error = new common_1.BadRequestException('Missing a required value');
                    break;
                case 'P2014':
                    error = new common_1.BadRequestException('Invalid relation: this change would violate a required relation');
                    break;
                case 'P2016':
                    error = new common_1.BadRequestException('Query interpretation error');
                    break;
                case 'P2018':
                    error = new common_1.NotFoundException('Required connected records were not found');
                    break;
                case 'P2019':
                    error = new common_1.BadRequestException('Input error');
                    break;
                case 'P2020':
                    error = new common_1.BadRequestException('Value out of range');
                    break;
                case 'P2025':
                    error = new common_1.NotFoundException('Record not found');
                    break;
                default:
                    error = new common_1.InternalServerErrorException(`Prisma error code: ${exception.code}`);
                    break;
            }
        }
        const status = (error.getStatus && error.getStatus()) || 400;
        const body = (typeof error.getResponse === 'function' && error.getResponse()) || error.message;
        response.status(status).json({
            statusCode: status,
            message: typeof body === 'string' ? body : body?.message ?? 'Database error',
            error: error?.name ?? 'Error',
            path: request?.url,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.PrismaExceptionFilter = PrismaExceptionFilter;
exports.PrismaExceptionFilter = PrismaExceptionFilter = __decorate([
    (0, common_1.Catch)(library_1.PrismaClientKnownRequestError, library_1.PrismaClientValidationError)
], PrismaExceptionFilter);
//# sourceMappingURL=prisma-exception.filter.js.map