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
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/database/prisma.service");
const shared_types_1 = require("@zarmind/shared-types");
let EmployeesService = class EmployeesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const employeeCode = dto.employeeCode ?? this.generateEmployeeCode();
        // Verify branch if provided
        if (dto.branchId) {
            const branch = await this.prisma.branch.findUnique({
                where: { id: dto.branchId },
                select: { id: true },
            });
            if (!branch)
                throw new common_1.BadRequestException('Branch not found');
        }
        // Check for duplicate employee code
        const existing = await this.prisma.employee.findUnique({
            where: { employeeCode },
        });
        if (existing)
            throw new common_1.BadRequestException('Employee code already exists');
        // Check for duplicate national ID if provided
        if (dto.nationalId) {
            const existingNationalId = await this.prisma.employee.findUnique({
                where: { nationalId: dto.nationalId },
            });
            if (existingNationalId)
                throw new common_1.BadRequestException('National ID already exists');
        }
        const data = {
            employeeCode,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            email: dto.email ?? null,
            nationalId: dto.nationalId ?? null,
            position: dto.position,
            department: dto.department ?? null,
            employmentType: dto.employmentType,
            hireDate: new Date(dto.hireDate),
            terminationDate: dto.terminationDate ? new Date(dto.terminationDate) : null,
            status: dto.status ?? shared_types_1.EmploymentStatus.ACTIVE,
            branch: dto.branchId ? { connect: { id: dto.branchId } } : undefined,
            baseSalary: dto.baseSalary ?? null,
            commissionRate: dto.commissionRate ?? null,
            address: dto.address ?? null,
            city: dto.city ?? null,
            birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
            emergencyContact: dto.emergencyContact ?? null,
            emergencyPhone: dto.emergencyPhone ?? null,
            notes: dto.notes ?? null,
        };
        const created = await this.prisma.employee.create({
            data,
            include: {
                branch: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        });
        return this.mapEmployee(created);
    }
    async findAll(params) {
        const { page, limit, search, status, employmentType, department, branchId, sortBy = 'createdAt', sortOrder = 'desc', } = params;
        const where = {
            ...(status ? { status } : {}),
            ...(employmentType ? { employmentType } : {}),
            ...(department ? { department: { contains: department, mode: 'insensitive' } } : {}),
            ...(branchId ? { branchId } : {}),
            ...(search
                ? {
                    OR: [
                        { employeeCode: { contains: search, mode: 'insensitive' } },
                        { firstName: { contains: search, mode: 'insensitive' } },
                        { lastName: { contains: search, mode: 'insensitive' } },
                        { phone: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                        { nationalId: { contains: search, mode: 'insensitive' } },
                        { position: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        const [total, rows] = await this.prisma.$transaction([
            this.prisma.employee.count({ where }),
            this.prisma.employee.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    branch: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                        },
                    },
                },
            }),
        ]);
        const items = rows.map((e) => this.mapEmployee(e));
        return { items, total, page, limit };
    }
    async findOne(id) {
        const employee = await this.prisma.employee.findUnique({
            where: { id },
            include: {
                branch: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        address: true,
                    },
                },
            },
        });
        if (!employee)
            throw new common_1.NotFoundException('Employee not found');
        return this.mapEmployee(employee);
    }
    async update(id, dto) {
        const existing = await this.prisma.employee.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Employee not found');
        // Check for duplicate employee code if changed
        if (dto.employeeCode && dto.employeeCode !== existing.employeeCode) {
            const duplicate = await this.prisma.employee.findUnique({
                where: { employeeCode: dto.employeeCode },
            });
            if (duplicate)
                throw new common_1.BadRequestException('Employee code already exists');
        }
        // Check for duplicate national ID if changed
        if (dto.nationalId && dto.nationalId !== existing.nationalId) {
            const duplicate = await this.prisma.employee.findUnique({
                where: { nationalId: dto.nationalId },
            });
            if (duplicate)
                throw new common_1.BadRequestException('National ID already exists');
        }
        // Verify branch if provided
        if (dto.branchId) {
            const branch = await this.prisma.branch.findUnique({
                where: { id: dto.branchId },
                select: { id: true },
            });
            if (!branch)
                throw new common_1.BadRequestException('Branch not found');
        }
        const data = {
            employeeCode: dto.employeeCode ?? undefined,
            firstName: dto.firstName ?? undefined,
            lastName: dto.lastName ?? undefined,
            phone: dto.phone ?? undefined,
            email: dto.email ?? undefined,
            nationalId: dto.nationalId ?? undefined,
            position: dto.position ?? undefined,
            department: dto.department ?? undefined,
            employmentType: dto.employmentType ?? undefined,
            hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
            terminationDate: dto.terminationDate ? new Date(dto.terminationDate) : undefined,
            status: dto.status ?? undefined,
            branch: dto.branchId ? { connect: { id: dto.branchId } } : undefined,
            baseSalary: dto.baseSalary ?? undefined,
            commissionRate: dto.commissionRate ?? undefined,
            address: dto.address ?? undefined,
            city: dto.city ?? undefined,
            birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
            emergencyContact: dto.emergencyContact ?? undefined,
            emergencyPhone: dto.emergencyPhone ?? undefined,
            notes: dto.notes ?? undefined,
        };
        // Remove undefined values
        Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);
        const updated = await this.prisma.employee.update({
            where: { id },
            data,
            include: {
                branch: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        });
        return this.mapEmployee(updated);
    }
    async getSummary() {
        const [totalEmployees, byStatus, byDepartment, byEmploymentType] = await Promise.all([
            this.prisma.employee.count(),
            this.prisma.employee.groupBy({
                by: ['status'],
                _count: true,
            }),
            this.prisma.employee.groupBy({
                by: ['department'],
                where: { department: { not: null } },
                _count: true,
            }),
            this.prisma.employee.groupBy({
                by: ['employmentType'],
                _count: true,
            }),
        ]);
        return {
            totalEmployees,
            byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
            byDepartment: byDepartment.map((d) => ({ department: d.department, count: d._count })),
            byEmploymentType: byEmploymentType.map((t) => ({ type: t.employmentType, count: t._count })),
        };
    }
    async remove(id) {
        const existing = await this.prisma.employee.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Employee not found');
        // Soft delete: mark as inactive/terminated
        await this.prisma.employee.update({
            where: { id },
            data: { status: shared_types_1.EmploymentStatus.TERMINATED },
        });
        return { success: true, message: 'Employee marked as terminated' };
    }
    // Helpers
    generateEmployeeCode() {
        const now = new Date();
        const y = String(now.getFullYear()).slice(-2);
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const t = Date.now().toString(36).toUpperCase();
        return `EMP-${y}${m}${d}-${t}`;
    }
    decimalToNumber(value) {
        if (value == null)
            return 0;
        if (typeof value === 'number')
            return value;
        if (typeof value.toNumber === 'function') {
            try {
                return value.toNumber();
            }
            catch {
                // ignore
            }
        }
        const n = Number(value);
        return isNaN(n) ? 0 : n;
    }
    mapEmployee(e) {
        return {
            id: e.id,
            employeeCode: e.employeeCode,
            firstName: e.firstName,
            lastName: e.lastName,
            phone: e.phone,
            email: e.email,
            nationalId: e.nationalId,
            position: e.position,
            department: e.department,
            employmentType: e.employmentType,
            hireDate: e.hireDate,
            terminationDate: e.terminationDate,
            status: e.status,
            branchId: e.branchId,
            branch: e.branch ?? undefined,
            baseSalary: this.decimalToNumber(e.baseSalary),
            commissionRate: this.decimalToNumber(e.commissionRate),
            address: e.address,
            city: e.city,
            birthDate: e.birthDate,
            emergencyContact: e.emergencyContact,
            emergencyPhone: e.emergencyPhone,
            notes: e.notes,
            createdAt: e.createdAt,
            updatedAt: e.updatedAt,
        };
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map