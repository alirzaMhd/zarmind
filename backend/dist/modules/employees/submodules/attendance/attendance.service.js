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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../core/database/prisma.service");
const shared_types_1 = require("../../../../../../packages/shared-types/src");
let AttendanceService = class AttendanceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async clockIn(dto, ip, userAgent) {
        const dateOnly = this.dateOnly(dto.date);
        const employee = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
        if (!employee)
            throw new common_1.BadRequestException('Employee not found');
        const existing = await this.prisma.attendance.findUnique({
            where: { employeeId_date: { employeeId: dto.employeeId, date: dateOnly } },
        });
        if (existing) {
            if (existing.checkIn && !existing.checkOut) {
                throw new common_1.BadRequestException('Already clocked in for this date');
            }
            // If exists but no checkIn, proceed to set it
            return this.prisma.attendance.update({
                where: { id: existing.id },
                data: {
                    checkIn: new Date(),
                    status: shared_types_1.AttendanceStatus.PRESENT,
                    ipAddress: ip ?? existing.ipAddress ?? undefined,
                    location: dto.location ?? existing.location ?? undefined,
                    notes: dto.notes ?? existing.notes ?? undefined,
                },
            });
        }
        return this.prisma.attendance.create({
            data: {
                employeeId: dto.employeeId,
                date: dateOnly,
                checkIn: new Date(),
                status: shared_types_1.AttendanceStatus.PRESENT,
                ipAddress: ip,
                location: dto.location,
                notes: dto.notes,
            },
        });
    }
    async clockOut(dto, ip, userAgent) {
        const dateOnly = this.dateOnly(dto.date);
        const attendance = await this.prisma.attendance.findUnique({
            where: { employeeId_date: { employeeId: dto.employeeId, date: dateOnly } },
        });
        if (!attendance)
            throw new common_1.BadRequestException('No attendance record for this date');
        if (!attendance.checkIn)
            throw new common_1.BadRequestException('Not clocked in yet');
        if (attendance.checkOut)
            throw new common_1.BadRequestException('Already clocked out');
        const now = new Date();
        const hoursWorkedNum = this.roundHours((now.getTime() - attendance.checkIn.getTime()) / 3600000);
        const overtimeNum = hoursWorkedNum > 8 ? this.roundHours(hoursWorkedNum - 8) : 0;
        return this.prisma.attendance.update({
            where: { id: attendance.id },
            data: {
                checkOut: now,
                hoursWorked: new shared_types_1.Prisma.Decimal(hoursWorkedNum),
                overtime: new shared_types_1.Prisma.Decimal(overtimeNum),
                ipAddress: ip ?? attendance.ipAddress ?? undefined,
                location: dto.location ?? attendance.location ?? undefined,
                notes: dto.notes ?? attendance.notes ?? undefined,
            },
        });
    }
    async findAll(params) {
        const where = {
            ...(params.employeeId ? { employeeId: params.employeeId } : {}),
            ...(params.status ? { status: params.status } : {}),
            ...(params.from || params.to
                ? {
                    date: {
                        gte: params.from ? this.dateOnly(params.from) : undefined,
                        lte: params.to ? this.dateOnly(params.to) : undefined,
                    },
                }
                : {}),
        };
        const [total, rows] = await this.prisma.$transaction([
            this.prisma.attendance.count({ where }),
            this.prisma.attendance.findMany({
                where,
                orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
                skip: (params.page - 1) * params.limit,
                take: params.limit,
            }),
        ]);
        return { items: rows, total, page: params.page, limit: params.limit };
    }
    async findOne(id) {
        const row = await this.prisma.attendance.findUnique({ where: { id } });
        if (!row)
            throw new common_1.NotFoundException('Attendance record not found');
        return row;
    }
    async update(id, dto) {
        const existing = await this.prisma.attendance.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Attendance record not found');
        let checkIn = existing.checkIn;
        let checkOut = existing.checkOut;
        if (dto.checkIn)
            checkIn = new Date(dto.checkIn);
        if (dto.checkOut)
            checkOut = new Date(dto.checkOut);
        // Work with numbers, then convert to Prisma.Decimal when updating
        let hoursWorkedNum = existing.hoursWorked != null ? this.decToNum(existing.hoursWorked) : undefined;
        let overtimeNum = existing.overtime != null ? this.decToNum(existing.overtime) : undefined;
        if (checkIn && checkOut) {
            const hours = this.roundHours((checkOut.getTime() - checkIn.getTime()) / 3600000);
            hoursWorkedNum = hours;
            overtimeNum = hours > 8 ? this.roundHours(hours - 8) : 0;
        }
        return this.prisma.attendance.update({
            where: { id },
            data: {
                date: dto.date ? this.dateOnly(dto.date) : undefined,
                status: dto.status ?? undefined,
                checkIn: dto.checkIn ? new Date(dto.checkIn) : undefined,
                checkOut: dto.checkOut ? new Date(dto.checkOut) : undefined,
                hoursWorked: hoursWorkedNum !== undefined ? new shared_types_1.Prisma.Decimal(hoursWorkedNum) : undefined,
                overtime: overtimeNum !== undefined ? new shared_types_1.Prisma.Decimal(overtimeNum) : undefined,
                notes: dto.notes ?? undefined,
                location: dto.location ?? undefined,
                ipAddress: dto.ipAddress ?? undefined,
            },
        });
    }
    dateOnly(date) {
        const d = date ? new Date(date) : new Date();
        if (isNaN(d.getTime()))
            throw new common_1.BadRequestException('Invalid date');
        d.setHours(0, 0, 0, 0);
        return d;
    }
    roundHours(h) {
        return Math.round(h * 100) / 100;
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
            catch {
                // ignore
            }
        }
        const n = Number(value);
        return isNaN(n) ? 0 : n;
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map