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
exports.WorkOrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../core/database/prisma.service");
const shared_types_1 = require("@zarmind/shared-types");
let WorkOrdersService = class WorkOrdersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    // Create
    async create(dto) {
        // Verify workshop exists
        const workshop = await this.prisma.workshop.findUnique({
            where: { id: dto.workshopId },
            select: { id: true, name: true },
        });
        if (!workshop)
            throw new common_1.BadRequestException('Workshop not found');
        const orderNumber = dto.orderNumber ?? this.generateWorkOrderNumber();
        // Ensure orderNumber unique
        const existingOrderNumber = await this.prisma.workOrder.findUnique({
            where: { orderNumber },
            select: { id: true },
        });
        if (existingOrderNumber) {
            throw new common_1.BadRequestException('Order number already exists');
        }
        if (dto.qualityRating != null && (dto.qualityRating < 1 || dto.qualityRating > 5)) {
            throw new common_1.BadRequestException('qualityRating must be between 1 and 5');
        }
        const created = await this.prisma.workOrder.create({
            data: {
                orderNumber,
                workshop: { connect: { id: dto.workshopId } },
                productName: dto.productName,
                description: dto.description ?? null,
                specifications: dto.specifications ?? undefined,
                quantity: dto.quantity,
                status: dto.status ?? shared_types_1.WorkOrderStatus.PENDING,
                priority: dto.priority ?? shared_types_1.WorkOrderPriority.MEDIUM,
                orderDate: dto.orderDate ? new Date(dto.orderDate) : undefined,
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                expectedEndDate: dto.expectedEndDate ? new Date(dto.expectedEndDate) : undefined,
                completedDate: dto.completedDate ? new Date(dto.completedDate) : undefined,
                deliveredDate: dto.deliveredDate ? new Date(dto.deliveredDate) : undefined,
                costEstimate: dto.costEstimate ?? null,
                actualCost: dto.actualCost ?? null,
                goldProvided: dto.goldProvided ?? null,
                stonesProvided: dto.stonesProvided ?? null,
                qualityRating: dto.qualityRating ?? null,
                images: dto.images ?? [],
                notes: dto.notes ?? null,
            },
            include: {
                workshop: { select: { id: true, code: true, name: true } },
            },
        });
        return this.mapWorkOrder(created);
    }
    // List
    async findAll(params) {
        const { page, limit, search, workshopId, status, priority, from, to, minRating, maxRating, sortBy = 'orderDate', sortOrder = 'desc', } = params;
        const where = {
            ...(workshopId ? { workshopId } : {}),
            ...(status ? { status } : {}),
            ...(priority ? { priority } : {}),
            ...(from || to
                ? {
                    orderDate: {
                        gte: from ? new Date(from) : undefined,
                        lte: to ? new Date(to) : undefined,
                    },
                }
                : {}),
            ...(minRating !== undefined || maxRating !== undefined
                ? {
                    qualityRating: {
                        gte: minRating,
                        lte: maxRating,
                    },
                }
                : {}),
            ...(search
                ? {
                    OR: [
                        { orderNumber: { contains: search, mode: 'insensitive' } },
                        { productName: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } },
                        { notes: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        const [total, rows] = await this.prisma.$transaction([
            this.prisma.workOrder.count({ where }),
            this.prisma.workOrder.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    workshop: { select: { id: true, code: true, name: true } },
                },
            }),
        ]);
        const items = rows.map((r) => this.mapWorkOrder(r));
        return { items, total, page, limit };
    }
    // Get one
    async findOne(id) {
        const row = await this.prisma.workOrder.findUnique({
            where: { id },
            include: {
                workshop: { select: { id: true, code: true, name: true, city: true } },
            },
        });
        if (!row)
            throw new common_1.NotFoundException('Work order not found');
        return this.mapWorkOrder(row);
    }
    // Update general fields
    async update(id, dto) {
        const existing = await this.prisma.workOrder.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Work order not found');
        // Validate orderNumber uniqueness if changing
        if (dto.orderNumber && dto.orderNumber !== existing.orderNumber) {
            const dup = await this.prisma.workOrder.findUnique({
                where: { orderNumber: dto.orderNumber },
            });
            if (dup)
                throw new common_1.BadRequestException('Order number already exists');
        }
        if (dto.qualityRating != null && (dto.qualityRating < 1 || dto.qualityRating > 5)) {
            throw new common_1.BadRequestException('qualityRating must be between 1 and 5');
        }
        const data = {
            orderNumber: dto.orderNumber ?? undefined,
            productName: dto.productName ?? undefined,
            description: dto.description ?? undefined,
            specifications: dto.specifications ?? undefined,
            quantity: dto.quantity ?? undefined,
            status: dto.status ?? undefined,
            priority: dto.priority ?? undefined,
            orderDate: dto.orderDate ? new Date(dto.orderDate) : undefined,
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            expectedEndDate: dto.expectedEndDate ? new Date(dto.expectedEndDate) : undefined,
            completedDate: dto.completedDate ? new Date(dto.completedDate) : undefined,
            deliveredDate: dto.deliveredDate ? new Date(dto.deliveredDate) : undefined,
            costEstimate: dto.costEstimate ?? undefined,
            actualCost: dto.actualCost ?? undefined,
            goldProvided: dto.goldProvided ?? undefined,
            stonesProvided: dto.stonesProvided ?? undefined,
            qualityRating: dto.qualityRating ?? undefined,
            images: Array.isArray(dto.images) ? dto.images : undefined,
            notes: dto.notes ?? undefined,
        };
        // If workshopId provided -> transfer
        if (dto.workshopId && dto.workshopId !== existing.workshopId) {
            const target = await this.prisma.workshop.findUnique({
                where: { id: dto.workshopId },
                select: { id: true },
            });
            if (!target)
                throw new common_1.BadRequestException('Target workshop not found');
            data.workshop = { connect: { id: dto.workshopId } };
        }
        // Remove undefined
        Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
        const updated = await this.prisma.workOrder.update({
            where: { id },
            data,
            include: {
                workshop: { select: { id: true, code: true, name: true } },
            },
        });
        return this.mapWorkOrder(updated);
    }
    // Update status (and auto-set related dates if needed)
    async updateStatus(id, dto) {
        const existing = await this.prisma.workOrder.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Work order not found');
        if (!dto.status)
            throw new common_1.BadRequestException('status is required');
        const data = {
            status: dto.status,
            // allow explicit date overrides
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            completedDate: dto.completedDate ? new Date(dto.completedDate) : undefined,
            deliveredDate: dto.deliveredDate ? new Date(dto.deliveredDate) : undefined,
            expectedEndDate: dto.expectedEndDate ? new Date(dto.expectedEndDate) : undefined,
            notes: dto.notes ? `${existing.notes ?? ''}\n${dto.notes}`.trim() : undefined,
        };
        // Auto-set dates based on status if not provided
        const now = new Date();
        if (dto.status === shared_types_1.WorkOrderStatus.IN_PROGRESS && existing.startDate == null && !dto.startDate) {
            data.startDate = now;
        }
        if (dto.status === shared_types_1.WorkOrderStatus.COMPLETED && existing.completedDate == null && !dto.completedDate) {
            data.completedDate = now;
        }
        if (dto.status === shared_types_1.WorkOrderStatus.DELIVERED && existing.deliveredDate == null && !dto.deliveredDate) {
            data.deliveredDate = now;
        }
        const updated = await this.prisma.workOrder.update({
            where: { id },
            data,
            include: {
                workshop: { select: { id: true, code: true, name: true } },
            },
        });
        return this.mapWorkOrder(updated);
    }
    // Transfer to another workshop (and append notes)
    async transfer(id, dto) {
        if (!dto.workshopId)
            throw new common_1.BadRequestException('workshopId is required');
        const existing = await this.prisma.workOrder.findUnique({
            where: { id },
            include: { workshop: { select: { id: true, name: true } } },
        });
        if (!existing)
            throw new common_1.NotFoundException('Work order not found');
        if (dto.workshopId === existing.workshopId) {
            throw new common_1.BadRequestException('Work order is already in the target workshop');
        }
        const target = await this.prisma.workshop.findUnique({
            where: { id: dto.workshopId },
            select: { id: true, name: true },
        });
        if (!target)
            throw new common_1.BadRequestException('Target workshop not found');
        const transferNote = `Transferred from "${existing.workshop?.name ?? existing.workshopId}" to "${target.name}"${dto.reason ? ` - Reason: ${dto.reason}` : ''}`;
        const updated = await this.prisma.workOrder.update({
            where: { id },
            data: {
                workshop: { connect: { id: dto.workshopId } },
                notes: `${existing.notes ?? ''}\n${transferNote}`.trim(),
            },
            include: {
                workshop: { select: { id: true, code: true, name: true } },
            },
        });
        return this.mapWorkOrder(updated);
    }
    // Update images set (add/remove)
    async updateImages(id, dto) {
        const existing = await this.prisma.workOrder.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Work order not found');
        const current = Array.isArray(existing.images) ? existing.images : [];
        const toAdd = Array.isArray(dto.imagesToAdd) ? dto.imagesToAdd : [];
        const toRemove = Array.isArray(dto.imagesToRemove) ? dto.imagesToRemove : [];
        const set = new Set(current);
        toAdd.forEach((img) => set.add(img));
        toRemove.forEach((img) => set.delete(img));
        const updated = await this.prisma.workOrder.update({
            where: { id },
            data: { images: Array.from(set) },
            include: {
                workshop: { select: { id: true, code: true, name: true } },
            },
        });
        return this.mapWorkOrder(updated);
    }
    // Update quality rating/notes
    async updateQuality(id, dto) {
        const existing = await this.prisma.workOrder.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Work order not found');
        if (dto.qualityRating != null && (dto.qualityRating < 1 || dto.qualityRating > 5)) {
            throw new common_1.BadRequestException('qualityRating must be between 1 and 5');
        }
        const updated = await this.prisma.workOrder.update({
            where: { id },
            data: {
                qualityRating: dto.qualityRating ?? undefined,
                qualityNotes: dto.qualityNotes ?? undefined,
            },
            include: {
                workshop: { select: { id: true, code: true, name: true } },
            },
        });
        return this.mapWorkOrder(updated);
    }
    // Remove: soft-cancel if not cancelled; hard delete if already cancelled
    async remove(id) {
        const existing = await this.prisma.workOrder.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Work order not found');
        if (existing.status !== shared_types_1.WorkOrderStatus.CANCELLED) {
            await this.prisma.workOrder.update({
                where: { id },
                data: {
                    status: shared_types_1.WorkOrderStatus.CANCELLED,
                    notes: `${existing.notes ?? ''}\nCANCELLED`.trim(),
                },
            });
            return { success: true, message: 'Work order cancelled' };
        }
        await this.prisma.workOrder.delete({ where: { id } });
        return { success: true, message: 'Work order deleted' };
    }
    // Helpers
    generateWorkOrderNumber() {
        const now = new Date();
        const y = String(now.getFullYear());
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const token = Date.now().toString(36).toUpperCase();
        return `WO-${y}${m}${d}-${token}`;
    }
    decimalToNumber(value) {
        if (value == null)
            return null;
        if (typeof value === 'number')
            return value;
        if (typeof value?.toNumber === 'function') {
            try {
                return value.toNumber();
            }
            catch { }
        }
        const n = Number(value);
        return isNaN(n) ? null : n;
    }
    mapWorkOrder(w) {
        return {
            id: w.id,
            orderNumber: w.orderNumber,
            workshopId: w.workshopId,
            workshop: w.workshop ?? undefined,
            productName: w.productName,
            description: w.description,
            specifications: w.specifications ?? undefined,
            quantity: w.quantity,
            status: w.status,
            priority: w.priority,
            orderDate: w.orderDate,
            startDate: w.startDate,
            expectedEndDate: w.expectedEndDate,
            completedDate: w.completedDate,
            deliveredDate: w.deliveredDate,
            costEstimate: this.decimalToNumber(w.costEstimate),
            actualCost: this.decimalToNumber(w.actualCost),
            goldProvided: this.decimalToNumber(w.goldProvided),
            stonesProvided: w.stonesProvided,
            qualityRating: w.qualityRating,
            qualityNotes: w.qualityNotes,
            images: Array.isArray(w.images) ? w.images : [],
            notes: w.notes,
            createdAt: w.createdAt,
            updatedAt: w.updatedAt,
        };
    }
};
exports.WorkOrdersService = WorkOrdersService;
exports.WorkOrdersService = WorkOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkOrdersService);
//# sourceMappingURL=work-orders.service.js.map