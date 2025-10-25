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
exports.PayrollService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../core/database/prisma.service");
const shared_types_1 = require("../../../../../../packages/shared-types/src");
let PayrollService = class PayrollService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generate(dto) {
        const employee = await this.prisma.employee.findUnique({
            where: { id: dto.employeeId },
            select: { id: true, baseSalary: true },
        });
        if (!employee)
            throw new common_1.BadRequestException('Employee not found');
        const baseSalary = dto.baseSalary ?? this.dec(employee.baseSalary);
        const commission = dto.commission ?? 0;
        const bonus = dto.bonus ?? 0;
        const overtime = dto.overtime ?? 0;
        const allowances = dto.allowances ?? 0;
        const tax = dto.tax ?? 0;
        const insurance = dto.insurance ?? 0;
        const loan = dto.loan ?? 0;
        const otherDeductions = dto.otherDeductions ?? 0;
        const totalEarnings = baseSalary + commission + bonus + overtime + allowances;
        const totalDeductions = tax + insurance + loan + otherDeductions;
        const netSalary = totalEarnings - totalDeductions;
        const created = await this.prisma.payroll.create({
            data: {
                employeeId: dto.employeeId,
                payPeriodStart: new Date(dto.payPeriodStart),
                payPeriodEnd: new Date(dto.payPeriodEnd),
                payDate: new Date(dto.payDate),
                baseSalary,
                commission,
                bonus,
                overtime,
                allowances,
                tax,
                insurance,
                loan,
                otherDeductions,
                totalEarnings,
                totalDeductions,
                netSalary,
                paymentMethod: dto.paymentMethod ?? null,
                paid: false,
            },
        });
        return created;
    }
    async findAll(params) {
        const where = {
            ...(params.employeeId ? { employeeId: params.employeeId } : {}),
            ...(params.paid === undefined ? {} : { paid: params.paid }),
            ...(params.from || params.to
                ? {
                    payDate: {
                        gte: params.from ? new Date(params.from) : undefined,
                        lte: params.to ? new Date(params.to) : undefined,
                    },
                }
                : {}),
        };
        const [total, rows] = await this.prisma.$transaction([
            this.prisma.payroll.count({ where }),
            this.prisma.payroll.findMany({
                where,
                orderBy: { payDate: 'desc' },
                skip: (params.page - 1) * params.limit,
                take: params.limit,
            }),
        ]);
        return {
            items: rows.map((r) => this.mapPayroll(r)),
            total,
            page: params.page,
            limit: params.limit,
        };
    }
    async findOne(id) {
        const row = await this.prisma.payroll.findUnique({ where: { id } });
        if (!row)
            throw new common_1.NotFoundException('Payroll record not found');
        return this.mapPayroll(row);
    }
    async markPaid(id, dto) {
        const row = await this.prisma.payroll.findUnique({ where: { id } });
        if (!row)
            throw new common_1.NotFoundException('Payroll record not found');
        if (row.paid)
            throw new common_1.BadRequestException('Already marked as paid');
        const updated = await this.prisma.payroll.update({
            where: { id },
            data: {
                paid: true,
                paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
                paymentMethod: dto.paymentMethod ?? shared_types_1.PaymentMethod.CASH,
                notes: dto.notes ?? undefined,
            },
        });
        return this.mapPayroll(updated);
    }
    decToNum(value) {
        if (value == null)
            return 0;
        if (typeof value === 'number')
            return value;
        if (typeof value?.toNumber === 'function') {
            try {
                return value.toNumber();
            }
            catch { }
        }
        const n = Number(value);
        return isNaN(n) ? 0 : n;
    }
    dec(value) {
        const n = this.decToNum(value);
        return n === 0 ? 0 : n;
    }
    mapPayroll(r) {
        return {
            ...r,
            baseSalary: this.decToNum(r.baseSalary),
            commission: this.decToNum(r.commission),
            bonus: this.decToNum(r.bonus),
            overtime: this.decToNum(r.overtime),
            allowances: this.decToNum(r.allowances),
            tax: this.decToNum(r.tax),
            insurance: this.decToNum(r.insurance),
            loan: this.decToNum(r.loan),
            otherDeductions: this.decToNum(r.otherDeductions),
            totalEarnings: this.decToNum(r.totalEarnings),
            totalDeductions: this.decToNum(r.totalDeductions),
            netSalary: this.decToNum(r.netSalary),
        };
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PayrollService);
//# sourceMappingURL=payroll.service.js.map