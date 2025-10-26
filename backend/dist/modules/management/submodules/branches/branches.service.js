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
exports.BranchesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../core/database/prisma.service");
let BranchesService = class BranchesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        // Check if code already exists
        const existing = await this.prisma.branch.findUnique({
            where: { code: dto.code },
        });
        if (existing) {
            throw new common_1.ConflictException('Branch code already exists');
        }
        // If this is set as main branch, unset other main branches
        if (dto.isMainBranch) {
            await this.prisma.branch.updateMany({
                where: { isMainBranch: true },
                data: { isMainBranch: false },
            });
        }
        const data = {
            name: dto.name,
            code: dto.code,
            address: dto.address ?? null,
            city: dto.city ?? null,
            phone: dto.phone ?? null,
            email: dto.email ?? null,
            isActive: dto.isActive ?? true,
            isMainBranch: dto.isMainBranch ?? false,
        };
        const created = await this.prisma.branch.create({ data });
        return this.mapBranch(created);
    }
    async findAll(params) {
        const { page, limit, search, isActive, city, sortBy = 'createdAt', sortOrder = 'desc', } = params;
        const where = {
            ...(isActive !== undefined ? { isActive } : {}),
            ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
            ...(search
                ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { code: { contains: search, mode: 'insensitive' } },
                        { address: { contains: search, mode: 'insensitive' } },
                        { city: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        const [total, rows] = await this.prisma.$transaction([
            this.prisma.branch.count({ where }),
            this.prisma.branch.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        const items = rows.map((r) => this.mapBranch(r));
        return { items, total, page, limit };
    }
    async findOne(id) {
        const branch = await this.prisma.branch.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        users: true,
                        employees: true,
                        inventory: true,
                        sales: true,
                        purchases: true,
                    },
                },
            },
        });
        if (!branch) {
            throw new common_1.NotFoundException('Branch not found');
        }
        return this.mapBranch(branch);
    }
    async update(id, dto) {
        const existing = await this.prisma.branch.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException('Branch not found');
        }
        // Check if code is being changed and already exists
        if (dto.code && dto.code !== existing.code) {
            const duplicate = await this.prisma.branch.findUnique({
                where: { code: dto.code },
            });
            if (duplicate) {
                throw new common_1.ConflictException('Branch code already exists');
            }
        }
        // If setting as main branch, unset other main branches
        if (dto.isMainBranch && !existing.isMainBranch) {
            await this.prisma.branch.updateMany({
                where: { isMainBranch: true, id: { not: id } },
                data: { isMainBranch: false },
            });
        }
        const data = {
            name: dto.name ?? undefined,
            code: dto.code ?? undefined,
            address: dto.address ?? undefined,
            city: dto.city ?? undefined,
            phone: dto.phone ?? undefined,
            email: dto.email ?? undefined,
            isActive: dto.isActive ?? undefined,
            isMainBranch: dto.isMainBranch ?? undefined,
        };
        const updated = await this.prisma.branch.update({
            where: { id },
            data,
        });
        return this.mapBranch(updated);
    }
    async toggleActive(id, isActive) {
        const existing = await this.prisma.branch.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException('Branch not found');
        }
        // Don't allow deactivating main branch
        if (!isActive && existing.isMainBranch) {
            throw new common_1.BadRequestException('Cannot deactivate the main branch');
        }
        const updated = await this.prisma.branch.update({
            where: { id },
            data: { isActive },
        });
        return {
            success: true,
            message: `Branch ${isActive ? 'activated' : 'deactivated'}`,
            isActive: updated.isActive,
        };
    }
    async remove(id) {
        const existing = await this.prisma.branch.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        users: true,
                        employees: true,
                        inventory: true,
                        sales: true,
                        purchases: true,
                    },
                },
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Branch not found');
        }
        // Don't allow deleting main branch
        if (existing.isMainBranch) {
            throw new common_1.BadRequestException('Cannot delete the main branch');
        }
        // Check if branch has associated data
        const hasData = existing._count.users > 0 ||
            existing._count.employees > 0 ||
            existing._count.inventory > 0 ||
            existing._count.sales > 0 ||
            existing._count.purchases > 0;
        if (hasData) {
            throw new common_1.BadRequestException('Cannot delete branch with associated users, employees, inventory, or transactions. Deactivate it instead.');
        }
        await this.prisma.branch.delete({ where: { id } });
        return { success: true, message: 'Branch deleted' };
    }
    async getSummary() {
        const [total, active, inactive, mainBranch, byCity] = await Promise.all([
            this.prisma.branch.count(),
            this.prisma.branch.count({ where: { isActive: true } }),
            this.prisma.branch.count({ where: { isActive: false } }),
            this.prisma.branch.findFirst({ where: { isMainBranch: true } }),
            this.prisma.branch.groupBy({
                by: ['city'],
                where: { city: { not: null } },
                _count: true,
            }),
        ]);
        return {
            total,
            active,
            inactive,
            mainBranch: mainBranch ? this.mapBranch(mainBranch) : null,
            byCity: byCity.map((c) => ({
                city: c.city,
                count: c._count,
            })),
        };
    }
    // Helper methods
    mapBranch(b) {
        return {
            id: b.id,
            name: b.name,
            code: b.code,
            address: b.address,
            city: b.city,
            phone: b.phone,
            email: b.email,
            isActive: b.isActive,
            isMainBranch: b.isMainBranch,
            _count: b._count ?? undefined,
            createdAt: b.createdAt,
            updatedAt: b.updatedAt,
        };
    }
};
exports.BranchesService = BranchesService;
exports.BranchesService = BranchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BranchesService);
//# sourceMappingURL=branches.service.js.map