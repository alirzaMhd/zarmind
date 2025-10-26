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
exports.PerformanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../core/database/prisma.service");
let PerformanceService = class PerformanceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        // Ensure employee exists
        const emp = await this.prisma.employee.findUnique({
            where: { id: dto.employeeId },
            select: { id: true }
        });
        if (!emp)
            throw new common_1.NotFoundException('Employee not found');
        return this.prisma.performance.create({
            data: {
                employeeId: dto.employeeId,
                reviewPeriod: dto.reviewPeriod,
                reviewDate: dto.reviewDate ? new Date(dto.reviewDate) : undefined,
                totalSales: dto.totalSales ?? undefined,
                targetSales: dto.targetSales ?? undefined,
                achievementRate: dto.achievementRate ?? undefined,
                customersServed: dto.customersServed ?? undefined,
                qualityScore: dto.qualityScore ?? undefined,
                punctualityScore: dto.punctualityScore ?? undefined,
                teamworkScore: dto.teamworkScore ?? undefined,
                overallRating: dto.overallRating ?? undefined,
                strengths: dto.strengths ?? undefined,
                weaknesses: dto.weaknesses ?? undefined,
                feedback: dto.feedback ?? undefined,
                goals: dto.goals ?? undefined,
                reviewedBy: dto.reviewedBy ?? undefined,
            },
        });
    }
    async findAll(params) {
        const { sortBy = 'reviewDate', sortOrder = 'desc' } = params;
        const where = {
            ...(params.employeeId ? { employeeId: params.employeeId } : {}),
            ...(params.period ? { reviewPeriod: params.period } : {}),
        };
        const [total, rows] = await this.prisma.$transaction([
            this.prisma.performance.count({ where }),
            this.prisma.performance.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (params.page - 1) * params.limit,
                take: params.limit,
                include: {
                    employee: {
                        select: {
                            id: true,
                            employeeCode: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            }),
        ]);
        return { items: rows, total, page: params.page, limit: params.limit };
    }
    async findOne(id) {
        const row = await this.prisma.performance.findUnique({
            where: { id },
            include: {
                employee: {
                    select: {
                        id: true,
                        employeeCode: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        if (!row)
            throw new common_1.NotFoundException('Performance record not found');
        return row;
    }
    async update(id, dto) {
        const existing = await this.prisma.performance.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Performance record not found');
        return this.prisma.performance.update({
            where: { id },
            data: {
                reviewPeriod: dto.reviewPeriod ?? undefined,
                reviewDate: dto.reviewDate ? new Date(dto.reviewDate) : undefined,
                totalSales: dto.totalSales ?? undefined,
                targetSales: dto.targetSales ?? undefined,
                achievementRate: dto.achievementRate ?? undefined,
                customersServed: dto.customersServed ?? undefined,
                qualityScore: dto.qualityScore ?? undefined,
                punctualityScore: dto.punctualityScore ?? undefined,
                teamworkScore: dto.teamworkScore ?? undefined,
                overallRating: dto.overallRating ?? undefined,
                strengths: dto.strengths ?? undefined,
                weaknesses: dto.weaknesses ?? undefined,
                feedback: dto.feedback ?? undefined,
                goals: dto.goals ?? undefined,
                reviewedBy: dto.reviewedBy ?? undefined,
            },
        });
    }
    async remove(id) {
        const existing = await this.prisma.performance.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Performance record not found');
        await this.prisma.performance.delete({ where: { id } });
        return { success: true, message: 'Performance record deleted' };
    }
};
exports.PerformanceService = PerformanceService;
exports.PerformanceService = PerformanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PerformanceService);
//# sourceMappingURL=performance.service.js.map