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
exports.WorkshopsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/database/prisma.service");
const shared_types_1 = require("@zarmind/shared-types");
let WorkshopsService = class WorkshopsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const code = dto.code ?? this.generateWorkshopCode();
        // Check for duplicate code
        const existing = await this.prisma.workshop.findUnique({
            where: { code },
        });
        if (existing)
            throw new common_1.BadRequestException('Workshop code already exists');
        const data = {
            code,
            name: dto.name,
            contactPerson: dto.contactPerson ?? null,
            phone: dto.phone ?? null,
            email: dto.email ?? null,
            address: dto.address ?? null,
            city: dto.city ?? null,
            status: dto.status ?? shared_types_1.WorkshopStatus.ACTIVE,
            specialization: dto.specialization ?? [],
            rating: dto.rating ?? null,
            paymentTerms: dto.paymentTerms ?? null,
            notes: dto.notes ?? null,
        };
        const created = await this.prisma.workshop.create({ data });
        return this.mapWorkshop(created);
    }
    async findAll(params) {
        const { page, limit, search, status, city, specialization, minRating, maxRating, sortBy = 'createdAt', sortOrder = 'desc', } = params;
        const where = {
            ...(status ? { status } : {}),
            ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
            ...(specialization ? { specialization: { has: specialization } } : {}),
            ...(minRating !== undefined || maxRating !== undefined
                ? {
                    rating: {
                        gte: minRating,
                        lte: maxRating,
                    },
                }
                : {}),
            ...(search
                ? {
                    OR: [
                        { code: { contains: search, mode: 'insensitive' } },
                        { name: { contains: search, mode: 'insensitive' } },
                        { phone: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                        { contactPerson: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        const [total, rows] = await this.prisma.$transaction([
            this.prisma.workshop.count({ where }),
            this.prisma.workshop.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        const items = rows.map((w) => this.mapWorkshop(w));
        return { items, total, page, limit };
    }
    async findOne(id) {
        const workshop = await this.prisma.workshop.findUnique({
            where: { id },
            include: {
                workOrders: {
                    select: {
                        id: true,
                        orderNumber: true,
                        productName: true,
                        status: true,
                        priority: true,
                        orderDate: true,
                        expectedEndDate: true,
                        costEstimate: true,
                        actualCost: true,
                    },
                    orderBy: { orderDate: 'desc' },
                    take: 10,
                },
            },
        });
        if (!workshop)
            throw new common_1.NotFoundException('Workshop not found');
        return this.mapWorkshop(workshop);
    }
    async update(id, dto) {
        const existing = await this.prisma.workshop.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Workshop not found');
        // Check for duplicate code if changed
        if (dto.code && dto.code !== existing.code) {
            const duplicate = await this.prisma.workshop.findUnique({
                where: { code: dto.code },
            });
            if (duplicate)
                throw new common_1.BadRequestException('Workshop code already exists');
        }
        const data = {
            code: dto.code ?? undefined,
            name: dto.name ?? undefined,
            contactPerson: dto.contactPerson ?? undefined,
            phone: dto.phone ?? undefined,
            email: dto.email ?? undefined,
            address: dto.address ?? undefined,
            city: dto.city ?? undefined,
            status: dto.status ?? undefined,
            specialization: dto.specialization ?? undefined,
            rating: dto.rating ?? undefined,
            paymentTerms: dto.paymentTerms ?? undefined,
            notes: dto.notes ?? undefined,
        };
        // Remove undefined values
        Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);
        const updated = await this.prisma.workshop.update({
            where: { id },
            data,
        });
        return this.mapWorkshop(updated);
    }
    async updateRating(id, rating, notes) {
        const workshop = await this.prisma.workshop.findUnique({ where: { id } });
        if (!workshop)
            throw new common_1.NotFoundException('Workshop not found');
        if (rating < 1 || rating > 5) {
            throw new common_1.BadRequestException('Rating must be between 1 and 5');
        }
        const updated = await this.prisma.workshop.update({
            where: { id },
            data: {
                rating,
                notes: notes ? `${workshop.notes ?? ''}\n${notes}`.trim() : workshop.notes,
            },
        });
        return {
            success: true,
            message: 'Workshop rating updated',
            workshopId: id,
            rating,
            notes,
        };
    }
    async getWorkOrders(id, status, from, to) {
        const workshop = await this.prisma.workshop.findUnique({ where: { id }, select: { id: true } });
        if (!workshop)
            throw new common_1.NotFoundException('Workshop not found');
        const { fromDate, toDate } = this.parseDateRange(from, to);
        const workOrders = await this.prisma.workOrder.findMany({
            where: {
                workshopId: id,
                ...(status ? { status } : {}),
                orderDate: { gte: fromDate, lte: toDate },
            },
            orderBy: { orderDate: 'desc' },
        });
        return {
            workshopId: id,
            period: { from: fromDate.toISOString(), to: toDate.toISOString() },
            totalOrders: workOrders.length,
            workOrders: workOrders.map((wo) => ({
                id: wo.id,
                orderNumber: wo.orderNumber,
                productName: wo.productName,
                status: wo.status,
                priority: wo.priority,
                orderDate: wo.orderDate,
                expectedEndDate: wo.expectedEndDate,
                completedDate: wo.completedDate,
                deliveredDate: wo.deliveredDate,
                costEstimate: this.decimalToNumber(wo.costEstimate),
                actualCost: this.decimalToNumber(wo.actualCost),
                qualityRating: wo.qualityRating,
            })),
        };
    }
    async getPerformance(id, from, to) {
        const workshop = await this.prisma.workshop.findUnique({ where: { id } });
        if (!workshop)
            throw new common_1.NotFoundException('Workshop not found');
        const { fromDate, toDate } = this.parseDateRange(from, to);
        const [totalOrders, completedOrders, totalCost, avgQuality] = await Promise.all([
            this.prisma.workOrder.count({
                where: {
                    workshopId: id,
                    orderDate: { gte: fromDate, lte: toDate },
                },
            }),
            this.prisma.workOrder.count({
                where: {
                    workshopId: id,
                    orderDate: { gte: fromDate, lte: toDate },
                    status: 'COMPLETED',
                },
            }),
            this.prisma.workOrder.aggregate({
                where: {
                    workshopId: id,
                    orderDate: { gte: fromDate, lte: toDate },
                    status: 'COMPLETED',
                },
                _sum: { actualCost: true },
            }),
            this.prisma.workOrder.aggregate({
                where: {
                    workshopId: id,
                    orderDate: { gte: fromDate, lte: toDate },
                    status: 'COMPLETED',
                    qualityRating: { not: null },
                },
                _avg: { qualityRating: true },
            }),
        ]);
        const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
        return {
            workshopId: id,
            workshopName: workshop.name,
            period: { from: fromDate.toISOString(), to: toDate.toISOString() },
            totalOrders,
            completedOrders,
            completionRate: Math.round(completionRate * 100) / 100,
            totalCost: this.decimalToNumber(totalCost._sum.actualCost),
            averageQualityRating: avgQuality._avg.qualityRating
                ? Math.round(avgQuality._avg.qualityRating * 100) / 100
                : null,
            rating: workshop.rating,
            specialization: workshop.specialization,
            paymentTerms: workshop.paymentTerms,
        };
    }
    async getSummary() {
        const [totalWorkshops, byStatus, bySpecialization, topWorkshops] = await Promise.all([
            this.prisma.workshop.count(),
            this.prisma.workshop.groupBy({
                by: ['status'],
                _count: true,
            }),
            this.prisma.workshop.findMany({
                where: { specialization: { isEmpty: false } },
                select: { specialization: true },
            }),
            this.prisma.workOrder.groupBy({
                by: ['workshopId'],
                _count: true,
                _sum: { actualCost: true },
                orderBy: { _count: { workshopId: 'desc' } },
                take: 10,
            }),
        ]);
        // Count workshops by specialization
        const specializationCount = {};
        bySpecialization.forEach((w) => {
            if (Array.isArray(w.specialization)) {
                w.specialization.forEach((spec) => {
                    specializationCount[spec] = (specializationCount[spec] ?? 0) + 1;
                });
            }
        });
        // Get workshop details for top workshops
        const topWorkshopIds = topWorkshops.map((t) => t.workshopId).filter(Boolean);
        const workshopDetails = await this.prisma.workshop.findMany({
            where: { id: { in: topWorkshopIds } },
            select: { id: true, code: true, name: true, rating: true },
        });
        const workshopMap = new Map(workshopDetails.map((w) => [w.id, w]));
        return {
            totalWorkshops,
            byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
            bySpecialization: Object.entries(specializationCount).map(([specialization, count]) => ({
                specialization,
                count,
            })),
            topWorkshops: topWorkshops.map((t) => {
                const workshop = workshopMap.get(t.workshopId);
                return {
                    workshopId: t.workshopId,
                    code: workshop?.code,
                    name: workshop?.name ?? 'Unknown',
                    rating: workshop?.rating,
                    orderCount: t._count,
                    totalCost: this.decimalToNumber(t._sum.actualCost),
                };
            }),
        };
    }
    async addPerformanceReview(id, data) {
        const workshop = await this.prisma.workshop.findUnique({ where: { id } });
        if (!workshop)
            throw new common_1.NotFoundException('Workshop not found');
        // Validate ratings (1-5)
        const ratings = [
            data.qualityRating,
            data.timelinessRating,
            data.costRating,
            data.communicationRating,
        ].filter((r) => r != null);
        for (const rating of ratings) {
            if (rating < 1 || rating > 5) {
                throw new common_1.BadRequestException('Ratings must be between 1 and 5');
            }
        }
        // Calculate average rating
        const avgRating = ratings.length > 0
            ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100
            : null;
        // Create performance review entry
        const reviewDate = data.reviewDate || new Date().toISOString();
        const reviewEntry = {
            date: reviewDate,
            qualityRating: data.qualityRating,
            timelinessRating: data.timelinessRating,
            costRating: data.costRating,
            communicationRating: data.communicationRating,
            averageRating: avgRating,
            notes: data.notes || '',
        };
        // Store in workshop notes as JSON
        const performanceHistory = this.getPerformanceFromNotes(workshop.notes);
        performanceHistory.push(reviewEntry);
        const updatedNotes = this.serializePerformanceToNotes(performanceHistory);
        // Update workshop rating to latest average
        await this.prisma.workshop.update({
            where: { id },
            data: {
                notes: updatedNotes,
                rating: avgRating || workshop.rating,
            },
        });
        return {
            success: true,
            message: 'Performance review added',
            review: reviewEntry,
        };
    }
    async getPerformanceHistory(id) {
        const workshop = await this.prisma.workshop.findUnique({ where: { id } });
        if (!workshop)
            throw new common_1.NotFoundException('Workshop not found');
        const history = this.getPerformanceFromNotes(workshop.notes);
        return {
            workshopId: id,
            workshopName: workshop.name,
            totalReviews: history.length,
            reviews: history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        };
    }
    getPerformanceFromNotes(notes) {
        if (!notes)
            return [];
        const marker = '###PERFORMANCE_REVIEWS###';
        const parts = notes.split(marker);
        if (parts.length < 2)
            return [];
        try {
            return JSON.parse(parts[1].trim());
        }
        catch {
            return [];
        }
    }
    serializePerformanceToNotes(reviews) {
        const marker = '###PERFORMANCE_REVIEWS###';
        return `${marker}\n${JSON.stringify(reviews, null, 2)}`;
    }
    async updatePerformanceReview(id, index, data) {
        const workshop = await this.prisma.workshop.findUnique({ where: { id } });
        if (!workshop)
            throw new common_1.NotFoundException('Workshop not found');
        const performanceHistory = this.getPerformanceFromNotes(workshop.notes);
        if (index < 0 || index >= performanceHistory.length) {
            throw new common_1.NotFoundException('Performance review not found');
        }
        // Validate ratings (1-5)
        const ratings = [
            data.qualityRating,
            data.timelinessRating,
            data.costRating,
            data.communicationRating,
        ].filter((r) => r != null);
        for (const rating of ratings) {
            if (rating < 1 || rating > 5) {
                throw new common_1.BadRequestException('Ratings must be between 1 and 5');
            }
        }
        // Update the review
        const existingReview = performanceHistory[index];
        const updatedReview = {
            ...existingReview,
            qualityRating: data.qualityRating ?? existingReview.qualityRating,
            timelinessRating: data.timelinessRating ?? existingReview.timelinessRating,
            costRating: data.costRating ?? existingReview.costRating,
            communicationRating: data.communicationRating ?? existingReview.communicationRating,
            notes: data.notes ?? existingReview.notes,
            reviewDate: data.reviewDate ?? existingReview.date,
            date: data.reviewDate ?? existingReview.date,
        };
        // Recalculate average rating
        const newRatings = [
            updatedReview.qualityRating,
            updatedReview.timelinessRating,
            updatedReview.costRating,
            updatedReview.communicationRating,
        ].filter((r) => r != null);
        updatedReview.averageRating = newRatings.length > 0
            ? Math.round((newRatings.reduce((a, b) => a + b, 0) / newRatings.length) * 100) / 100
            : null;
        performanceHistory[index] = updatedReview;
        const updatedNotes = this.serializePerformanceToNotes(performanceHistory);
        // Calculate overall workshop rating from all reviews
        const allAverages = performanceHistory
            .map(r => r.averageRating)
            .filter(r => r != null);
        const overallRating = allAverages.length > 0
            ? Math.round((allAverages.reduce((a, b) => a + b, 0) / allAverages.length) * 100) / 100
            : workshop.rating;
        await this.prisma.workshop.update({
            where: { id },
            data: {
                notes: updatedNotes,
                rating: overallRating,
            },
        });
        return {
            success: true,
            message: 'Performance review updated',
            review: updatedReview,
        };
    }
    async deletePerformanceReview(id, index) {
        const workshop = await this.prisma.workshop.findUnique({ where: { id } });
        if (!workshop)
            throw new common_1.NotFoundException('Workshop not found');
        const performanceHistory = this.getPerformanceFromNotes(workshop.notes);
        if (index < 0 || index >= performanceHistory.length) {
            throw new common_1.NotFoundException('Performance review not found');
        }
        // Remove the review
        performanceHistory.splice(index, 1);
        const updatedNotes = this.serializePerformanceToNotes(performanceHistory);
        // Recalculate overall workshop rating
        const allAverages = performanceHistory
            .map(r => r.averageRating)
            .filter(r => r != null);
        const overallRating = allAverages.length > 0
            ? Math.round((allAverages.reduce((a, b) => a + b, 0) / allAverages.length) * 100) / 100
            : null;
        await this.prisma.workshop.update({
            where: { id },
            data: {
                notes: updatedNotes,
                rating: overallRating,
            },
        });
        return {
            success: true,
            message: 'Performance review deleted',
        };
    }
    async remove(id) {
        const existing = await this.prisma.workshop.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Workshop not found');
        // Soft delete: mark as inactive
        await this.prisma.workshop.update({
            where: { id },
            data: { status: shared_types_1.WorkshopStatus.INACTIVE },
        });
        return { success: true, message: 'Workshop marked as inactive' };
    }
    // Helpers
    generateWorkshopCode() {
        const now = new Date();
        const y = String(now.getFullYear()).slice(-2);
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const t = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
        return `WS-${y}${m}${d}-${t}-${rand}`;
    }
    parseDateRange(from, to) {
        const fromDate = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 30));
        const toDate = to ? new Date(to) : new Date();
        toDate.setHours(23, 59, 59, 999);
        return { fromDate, toDate };
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
    mapWorkshop(w) {
        return {
            id: w.id,
            code: w.code,
            name: w.name,
            contactPerson: w.contactPerson,
            phone: w.phone,
            email: w.email,
            address: w.address,
            city: w.city,
            status: w.status,
            specialization: Array.isArray(w.specialization) ? w.specialization : [],
            rating: w.rating,
            paymentTerms: w.paymentTerms,
            notes: w.notes,
            createdAt: w.createdAt,
            updatedAt: w.updatedAt,
            workOrders: w.workOrders ?? undefined,
        };
    }
};
exports.WorkshopsService = WorkshopsService;
exports.WorkshopsService = WorkshopsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkshopsService);
//# sourceMappingURL=workshops.service.js.map