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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/database/prisma.service");
const shared_types_1 = require("../../../../packages/shared-types/src");
let CustomersService = class CustomersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const code = dto.code ?? this.generateCustomerCode();
        const data = {
            code,
            type: dto.type ?? shared_types_1.CustomerType.INDIVIDUAL,
            status: dto.status ?? shared_types_1.CustomerStatus.ACTIVE,
            firstName: dto.firstName ?? null,
            lastName: dto.lastName ?? null,
            businessName: dto.businessName ?? null,
            phone: dto.phone,
            email: dto.email ?? null,
            nationalId: dto.nationalId ?? null,
            address: dto.address ?? null,
            city: dto.city ?? null,
            postalCode: dto.postalCode ?? null,
            creditLimit: dto.creditLimit ?? undefined,
            // currentBalance uses default 0
            notes: dto.notes ?? null,
            birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
            anniversary: dto.anniversary ? new Date(dto.anniversary) : null,
            loyaltyPoints: dto.loyaltyPoints ?? undefined,
            tags: dto.tags ?? [],
        };
        const created = await this.prisma.customer.create({ data });
        return this.mapCustomer(created);
    }
    async findAll(params) {
        const { page = 1, limit = 20, search, type, status, tags, city, sortBy = 'createdAt', sortOrder = 'desc', } = params;
        const where = {
            ...(type ? { type } : {}),
            ...(status ? { status } : {}),
            ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
            ...(tags && tags.length
                ? { tags: { hasEvery: tags } }
                : {}),
            ...(search
                ? {
                    OR: [
                        { code: { contains: search, mode: 'insensitive' } },
                        { phone: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                        { businessName: { contains: search, mode: 'insensitive' } },
                        { firstName: { contains: search, mode: 'insensitive' } },
                        { lastName: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        const [total, rows] = await this.prisma.$transaction([
            this.prisma.customer.count({ where }),
            this.prisma.customer.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        const items = rows.map((c) => this.mapCustomer(c));
        return { items, total, page, limit };
    }
    async findOne(id) {
        const customer = await this.prisma.customer.findUnique({ where: { id } });
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        return this.mapCustomer(customer);
    }
    async update(id, dto) {
        const existing = await this.prisma.customer.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Customer not found');
        const data = {
            code: dto.code ?? undefined,
            type: dto.type ?? undefined,
            status: dto.status ?? undefined,
            firstName: dto.firstName ?? undefined,
            lastName: dto.lastName ?? undefined,
            businessName: dto.businessName ?? undefined,
            phone: dto.phone ?? undefined,
            email: dto.email ?? undefined,
            nationalId: dto.nationalId ?? undefined,
            address: dto.address ?? undefined,
            city: dto.city ?? undefined,
            postalCode: dto.postalCode ?? undefined,
            creditLimit: dto.creditLimit ?? undefined,
            notes: dto.notes ?? undefined,
            birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
            anniversary: dto.anniversary ? new Date(dto.anniversary) : undefined,
            loyaltyPoints: dto.loyaltyPoints ?? undefined,
            tags: dto.tags ?? undefined,
        };
        const updated = await this.prisma.customer.update({
            where: { id },
            data,
        });
        return this.mapCustomer(updated);
    }
    // Soft-delete: mark as INACTIVE
    async remove(id) {
        const existing = await this.prisma.customer.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Customer not found');
        const updated = await this.prisma.customer.update({
            where: { id },
            data: { status: shared_types_1.CustomerStatus.INACTIVE },
        });
        return this.mapCustomer(updated);
    }
    async getReceivables(id) {
        // Confirm customer exists
        const customer = await this.prisma.customer.findUnique({ where: { id }, select: { id: true } });
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        const receivables = await this.prisma.accountsReceivable.findMany({
            where: { customerId: id },
            orderBy: { invoiceDate: 'desc' },
        });
        return receivables.map((r) => ({
            id: r.id,
            invoiceNumber: r.invoiceNumber,
            invoiceDate: r.invoiceDate,
            amount: this.decimalToNumber(r.amount),
            paidAmount: this.decimalToNumber(r.paidAmount),
            remainingAmount: this.decimalToNumber(r.remainingAmount),
            dueDate: r.dueDate,
            status: r.status,
            notes: r.notes,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
        }));
    }
    async getSales(id) {
        // Confirm customer exists
        const customer = await this.prisma.customer.findUnique({ where: { id }, select: { id: true } });
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        const sales = await this.prisma.sale.findMany({
            where: { customerId: id },
            orderBy: { saleDate: 'desc' },
            select: {
                id: true,
                invoiceNumber: true,
                saleDate: true,
                status: true,
                subtotal: true,
                taxAmount: true,
                discountAmount: true,
                totalAmount: true,
                paidAmount: true,
                paymentMethod: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return sales.map((s) => ({
            ...s,
            subtotal: this.decimalToNumber(s.subtotal),
            taxAmount: this.decimalToNumber(s.taxAmount),
            discountAmount: this.decimalToNumber(s.discountAmount),
            totalAmount: this.decimalToNumber(s.totalAmount),
            paidAmount: this.decimalToNumber(s.paidAmount),
        }));
    }
    // Helpers
    generateCustomerCode() {
        const now = new Date();
        const y = String(now.getFullYear()).slice(-2);
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const t = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
        return `CUST-${y}${m}${d}-${t}-${rand}`;
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
    mapCustomer(c) {
        return {
            id: c.id,
            code: c.code,
            type: c.type,
            status: c.status,
            firstName: c.firstName,
            lastName: c.lastName,
            businessName: c.businessName,
            phone: c.phone,
            email: c.email,
            nationalId: c.nationalId,
            address: c.address,
            city: c.city,
            postalCode: c.postalCode,
            creditLimit: this.decimalToNumber(c.creditLimit),
            currentBalance: this.decimalToNumber(c.currentBalance),
            notes: c.notes,
            birthDate: c.birthDate,
            anniversary: c.anniversary,
            loyaltyPoints: c.loyaltyPoints ?? 0,
            tags: Array.isArray(c.tags) ? c.tags : [],
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        };
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map