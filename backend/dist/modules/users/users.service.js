"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/database/prisma.service");
const shared_types_1 = require("../../../../packages/shared-types/src");
const bcrypt = __importStar(require("bcryptjs"));
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        // Check if email already exists
        const existingEmail = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingEmail) {
            throw new common_1.ConflictException('Email already exists');
        }
        // Check if username already exists
        const existingUsername = await this.prisma.user.findUnique({
            where: { username: dto.username },
        });
        if (existingUsername) {
            throw new common_1.ConflictException('Username already exists');
        }
        // Verify branch exists if provided
        if (dto.branchId) {
            const branch = await this.prisma.branch.findUnique({
                where: { id: dto.branchId },
                select: { id: true },
            });
            if (!branch)
                throw new common_1.BadRequestException('Branch not found');
        }
        // Verify employee exists if provided
        if (dto.employeeId) {
            const employee = await this.prisma.employee.findUnique({
                where: { id: dto.employeeId },
                select: { id: true },
            });
            if (!employee)
                throw new common_1.BadRequestException('Employee not found');
            // Check if employee is already linked to another user
            const existingUser = await this.prisma.user.findUnique({
                where: { employeeId: dto.employeeId },
            });
            if (existingUser) {
                throw new common_1.ConflictException('Employee is already linked to another user');
            }
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const data = {
            email: dto.email,
            username: dto.username,
            password: hashedPassword,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone ?? null,
            role: dto.role ?? shared_types_1.UserRole.SALES_STAFF,
            status: dto.status ?? shared_types_1.UserStatus.ACTIVE,
            branch: dto.branchId ? { connect: { id: dto.branchId } } : undefined,
            employee: dto.employeeId ? { connect: { id: dto.employeeId } } : undefined,
        };
        const created = await this.prisma.user.create({
            data,
            include: {
                branch: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
                employee: {
                    select: {
                        id: true,
                        employeeCode: true,
                        firstName: true,
                        lastName: true,
                        position: true,
                    },
                },
            },
        });
        return this.mapUser(created);
    }
    async findAll(params) {
        const { page, limit, search, role, status, branchId, sortBy = 'createdAt', sortOrder = 'desc', } = params;
        const where = {
            ...(role ? { role } : {}),
            ...(status ? { status } : {}),
            ...(branchId ? { branchId } : {}),
            ...(search
                ? {
                    OR: [
                        { email: { contains: search, mode: 'insensitive' } },
                        { username: { contains: search, mode: 'insensitive' } },
                        { firstName: { contains: search, mode: 'insensitive' } },
                        { lastName: { contains: search, mode: 'insensitive' } },
                        { phone: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        const [total, rows] = await this.prisma.$transaction([
            this.prisma.user.count({ where }),
            this.prisma.user.findMany({
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
                    employee: {
                        select: {
                            id: true,
                            employeeCode: true,
                            firstName: true,
                            lastName: true,
                            position: true,
                        },
                    },
                },
            }),
        ]);
        const items = rows.map((r) => this.mapUser(r));
        return { items, total, page, limit };
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                branch: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        address: true,
                        city: true,
                    },
                },
                employee: {
                    select: {
                        id: true,
                        employeeCode: true,
                        firstName: true,
                        lastName: true,
                        position: true,
                        department: true,
                        phone: true,
                        email: true,
                    },
                },
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return this.mapUser(user);
    }
    async update(id, dto) {
        const existing = await this.prisma.user.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('User not found');
        // Check if email is being changed and already exists
        if (dto.email && dto.email !== existing.email) {
            const existingEmail = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });
            if (existingEmail) {
                throw new common_1.ConflictException('Email already exists');
            }
        }
        // Check if username is being changed and already exists
        if (dto.username && dto.username !== existing.username) {
            const existingUsername = await this.prisma.user.findUnique({
                where: { username: dto.username },
            });
            if (existingUsername) {
                throw new common_1.ConflictException('Username already exists');
            }
        }
        // Verify branch if being updated
        if (dto.branchId && dto.branchId !== existing.branchId) {
            const branch = await this.prisma.branch.findUnique({
                where: { id: dto.branchId },
                select: { id: true },
            });
            if (!branch)
                throw new common_1.BadRequestException('Branch not found');
        }
        // Verify employee if being updated
        if (dto.employeeId && dto.employeeId !== existing.employeeId) {
            const employee = await this.prisma.employee.findUnique({
                where: { id: dto.employeeId },
                select: { id: true },
            });
            if (!employee)
                throw new common_1.BadRequestException('Employee not found');
            // Check if employee is already linked to another user
            const existingUser = await this.prisma.user.findUnique({
                where: { employeeId: dto.employeeId },
            });
            if (existingUser && existingUser.id !== id) {
                throw new common_1.ConflictException('Employee is already linked to another user');
            }
        }
        const data = {
            email: dto.email ?? undefined,
            username: dto.username ?? undefined,
            firstName: dto.firstName ?? undefined,
            lastName: dto.lastName ?? undefined,
            phone: dto.phone ?? undefined,
            role: dto.role ?? undefined,
            status: dto.status ?? undefined,
            branch: dto.branchId ? { connect: { id: dto.branchId } } : undefined,
            employee: dto.employeeId ? { connect: { id: dto.employeeId } } : undefined,
        };
        const updated = await this.prisma.user.update({
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
                employee: {
                    select: {
                        id: true,
                        employeeCode: true,
                        firstName: true,
                        lastName: true,
                        position: true,
                    },
                },
            },
        });
        return this.mapUser(updated);
    }
    async changePassword(id, dto) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        // Verify current password
        const isValid = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        // Hash new password
        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
        return {
            success: true,
            message: 'Password changed successfully',
        };
    }
    async resetPassword(id, newPassword) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
        return {
            success: true,
            message: 'Password reset successfully',
            userId: id,
        };
    }
    async updateStatus(id, status) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const updated = await this.prisma.user.update({
            where: { id },
            data: { status },
        });
        return {
            success: true,
            message: `User status updated to ${status}`,
            userId: id,
            status: updated.status,
        };
    }
    async updateRole(id, role) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const updated = await this.prisma.user.update({
            where: { id },
            data: { role },
        });
        return {
            success: true,
            message: `User role updated to ${role}`,
            userId: id,
            role: updated.role,
        };
    }
    async getSummary() {
        const [totalUsers, byRole, byStatus, recentLogins] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.groupBy({
                by: ['role'],
                _count: true,
            }),
            this.prisma.user.groupBy({
                by: ['status'],
                _count: true,
            }),
            this.prisma.user.findMany({
                where: { lastLoginAt: { not: null } },
                orderBy: { lastLoginAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    lastLoginAt: true,
                },
            }),
        ]);
        return {
            totalUsers,
            byRole: byRole.map((r) => ({ role: r.role, count: r._count })),
            byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
            recentLogins,
        };
    }
    async getActivity(id, from, to, limit = 50) {
        const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const { fromDate, toDate } = this.parseDateRange(from, to);
        const [auditLogs, sales, purchases] = await Promise.all([
            this.prisma.auditLog.findMany({
                where: {
                    userId: id,
                    createdAt: { gte: fromDate, lte: toDate },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),
            this.prisma.sale.count({
                where: {
                    userId: id,
                    saleDate: { gte: fromDate, lte: toDate },
                },
            }),
            this.prisma.purchase.count({
                where: {
                    userId: id,
                    purchaseDate: { gte: fromDate, lte: toDate },
                },
            }),
        ]);
        return {
            userId: id,
            period: { from: fromDate.toISOString(), to: toDate.toISOString() },
            salesCount: sales,
            purchasesCount: purchases,
            recentActivity: auditLogs,
        };
    }
    async remove(id) {
        const existing = await this.prisma.user.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('User not found');
        if (existing.role === shared_types_1.UserRole.SUPER_ADMIN) {
            throw new common_1.BadRequestException('Cannot delete super admin user');
        }
        // Soft delete: mark as inactive
        await this.prisma.user.update({
            where: { id },
            data: { status: shared_types_1.UserStatus.INACTIVE },
        });
        return { success: true, message: 'User marked as inactive' };
    }
    // Helper methods
    parseDateRange(from, to) {
        const fromDate = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 30));
        const toDate = to ? new Date(to) : new Date();
        toDate.setHours(23, 59, 59, 999);
        return { fromDate, toDate };
    }
    mapUser(u) {
        return {
            id: u.id,
            email: u.email,
            username: u.username,
            firstName: u.firstName,
            lastName: u.lastName,
            phone: u.phone,
            role: u.role,
            status: u.status,
            branchId: u.branchId,
            employeeId: u.employeeId,
            lastLoginAt: u.lastLoginAt,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
            branch: u.branch ?? undefined,
            employee: u.employee ?? undefined,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map