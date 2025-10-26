import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PurchaseStatus } from '@zarmind/shared-types';

type PagedResult<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
};

@Injectable()
export class PurchasesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreatePurchaseDto) {
        const purchaseNumber = dto.purchaseNumber ?? this.generatePurchaseNumber();

        // Verify supplier exists if provided
        if (dto.supplierId) {
            const supplier = await this.prisma.supplier.findUnique({
                where: { id: dto.supplierId },
                select: { id: true },
            });
            if (!supplier) throw new BadRequestException('Supplier not found');
        }

        // Verify branch exists
        const branch = await this.prisma.branch.findUnique({
            where: { id: dto.branchId },
            select: { id: true },
        });
        if (!branch) throw new BadRequestException('Branch not found');

        // Verify user exists
        const user = await this.prisma.user.findUnique({
            where: { id: dto.userId },
            select: { id: true },
        });
        if (!user) throw new BadRequestException('User not found');

        // Calculate or use provided totals
        let subtotal: number;
        let totalAmount: number;

        if (dto.items && dto.items.length > 0) {
            // Calculate from items if items exist
            subtotal = dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        } else {
            // Use provided subtotal or 0
            subtotal = dto.subtotal ?? 0;
        }

        const taxAmount = dto.taxAmount ?? 0;

        // Use provided totalAmount or calculate it
        if (dto.totalAmount !== undefined) {
            totalAmount = dto.totalAmount;
        } else {
            totalAmount = subtotal + taxAmount;
        }

        const paidAmount = dto.paidAmount ?? 0;

        // Determine status
        let status: PurchaseStatus = PurchaseStatus.PENDING;
        if (dto.status) {
            status = dto.status;
        } else if (paidAmount >= totalAmount) {
            status = PurchaseStatus.COMPLETED;
        }

        const created = await this.prisma.purchase.create({
            data: {
                purchaseNumber,
                purchaseDate: new Date(dto.purchaseDate),
                status,
                supplier: dto.supplierId ? { connect: { id: dto.supplierId } } : undefined,
                user: { connect: { id: dto.userId } },
                branch: { connect: { id: dto.branchId } },
                subtotal,
                taxAmount,
                totalAmount,
                paidAmount,
                paymentMethod: dto.paymentMethod,
                deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
                notes: dto.notes ?? null,
                items: {
                    create: dto.items.map((item) => ({
                        product: { connect: { id: item.productId } },
                        quantity: item.quantity,
                        weight: item.weight ?? null,
                        unitPrice: item.unitPrice,
                        subtotal: item.quantity * item.unitPrice,
                        receivedQuantity: 0,
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                sku: true,
                                name: true,
                                category: true,
                            },
                        },
                    },
                },
                supplier: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        phone: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        });

        // If purchase is completed, update inventory
        if (status === PurchaseStatus.COMPLETED) {
            await this.updateInventoryForPurchase(created.id, dto.branchId);
        }

        return this.mapPurchase(created);
    }

    async findAll(params: {
        page: number;
        limit: number;
        search?: string;
        status?: PurchaseStatus;
        supplierId?: string;
        branchId?: string;
        userId?: string;
        from?: string;
        to?: string;
        minAmount?: number;
        maxAmount?: number;
        sortBy?: 'createdAt' | 'updatedAt' | 'purchaseDate' | 'totalAmount';
        sortOrder?: 'asc' | 'desc';
    }): Promise<PagedResult<any>> {
        const {
            page,
            limit,
            search,
            status,
            supplierId,
            branchId,
            userId,
            from,
            to,
            minAmount,
            maxAmount,
            sortBy = 'purchaseDate',
            sortOrder = 'desc',
        } = params;

        const where: any = {
            ...(status ? { status } : {}),
            ...(supplierId ? { supplierId } : {}),
            ...(branchId ? { branchId } : {}),
            ...(userId ? { userId } : {}),
            ...(from || to
                ? {
                    purchaseDate: {
                        gte: from ? new Date(from) : undefined,
                        lte: to ? new Date(to) : undefined,
                    },
                }
                : {}),
            ...(minAmount !== undefined || maxAmount !== undefined
                ? {
                    totalAmount: {
                        gte: minAmount,
                        lte: maxAmount,
                    },
                }
                : {}),
            ...(search
                ? {
                    OR: [
                        { purchaseNumber: { contains: search, mode: 'insensitive' } },
                        { notes: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };

        const [total, rows] = await this.prisma.$transaction([
            this.prisma.purchase.count({ where }),
            this.prisma.purchase.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    sku: true,
                                    name: true,
                                    category: true,
                                },
                            },
                        },
                    },
                    supplier: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
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

        const items = rows.map((r: any) => this.mapPurchase(r));
        return { items, total, page, limit };
    }

    async findOne(id: string) {
        const purchase = await this.prisma.purchase.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                sku: true,
                                name: true,
                                category: true,
                                goldPurity: true,
                                weight: true,
                            },
                        },
                    },
                },
                supplier: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        contactPerson: true,
                        phone: true,
                        email: true,
                        address: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
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

        if (!purchase) throw new NotFoundException('Purchase not found');
        return this.mapPurchase(purchase);
    }

    async update(id: string, dto: UpdatePurchaseDto) {
        const existing = await this.prisma.purchase.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!existing) throw new NotFoundException('Purchase not found');

        // Calculate or use provided totals
        let subtotal: number;
        let totalAmount: number;

        if (dto.items && dto.items.length > 0) {
            // Recalculate from items if items are updated
            subtotal = dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        } else if (dto.subtotal !== undefined) {
            // Use provided subtotal
            subtotal = dto.subtotal;
        } else {
            // Keep existing subtotal
            subtotal = this.decimalToNumber(existing.subtotal);
        }

        const taxAmount = dto.taxAmount !== undefined
            ? dto.taxAmount
            : this.decimalToNumber(existing.taxAmount);

        if (dto.totalAmount !== undefined) {
            // Use provided totalAmount
            totalAmount = dto.totalAmount;
        } else {
            // Calculate totalAmount
            totalAmount = subtotal + taxAmount;
        }

        const data: any = {
            purchaseNumber: dto.purchaseNumber ?? undefined,
            purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
            status: dto.status ?? undefined,
            supplier: dto.supplierId ? { connect: { id: dto.supplierId } } : undefined,
            subtotal,
            taxAmount,
            totalAmount,
            paidAmount: dto.paidAmount ?? undefined,
            paymentMethod: dto.paymentMethod ?? undefined,
            deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
            notes: dto.notes ?? undefined,
        };

        // Remove undefined values
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

        const updated = await this.prisma.purchase.update({
            where: { id },
            data,
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                sku: true,
                                name: true,
                                category: true,
                            },
                        },
                    },
                },
                supplier: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        phone: true,
                        email: true,
                    },
                },
            },
        });

        return this.mapPurchase(updated);
    }

    async receiveItems(
        id: string,
        items: Array<{ itemId: string; receivedQuantity: number; notes?: string }>,
    ) {
        const purchase = await this.prisma.purchase.findUnique({
            where: { id },
            include: { items: true },
        });

        if (!purchase) throw new NotFoundException('Purchase not found');

        if (purchase.status === PurchaseStatus.CANCELLED) {
            throw new BadRequestException('Cannot receive items for cancelled purchase');
        }

        // Update each item's received quantity
        for (const item of items) {
            const purchaseItem = purchase.items.find((i: any) => i.id === item.itemId);
            if (!purchaseItem) {
                throw new BadRequestException(`Purchase item ${item.itemId} not found`);
            }

            if (item.receivedQuantity > purchaseItem.quantity) {
                throw new BadRequestException('Received quantity cannot exceed ordered quantity');
            }

            await this.prisma.purchaseItem.update({
                where: { id: item.itemId },
                data: { receivedQuantity: item.receivedQuantity },
            });

            // Update inventory if items are received
            if (item.receivedQuantity > 0) {
                await this.updateInventoryForItem(purchaseItem.productId, purchase.branchId, item.receivedQuantity);
            }
        }

        // Check if all items are fully received
        const updatedPurchase = await this.prisma.purchase.findUnique({
            where: { id },
            include: { items: true },
        });

        const allReceived = updatedPurchase!.items.every(
            (item: any) => (item.receivedQuantity ?? 0) >= item.quantity,
        );
        const partiallyReceived = updatedPurchase!.items.some((item: any) => (item.receivedQuantity ?? 0) > 0);

        // Fix: Explicitly type newStatus as PurchaseStatus
        let newStatus: PurchaseStatus = purchase.status;
        if (allReceived) {
            newStatus = PurchaseStatus.COMPLETED;
        } else if (partiallyReceived) {
            newStatus = PurchaseStatus.PARTIALLY_RECEIVED;
        }

        await this.prisma.purchase.update({
            where: { id },
            data: { status: newStatus },
        });

        return {
            success: true,
            message: 'Items received successfully',
            purchaseId: id,
            status: newStatus,
        };
    }

    async completePurchase(id: string, notes?: string) {
        const purchase = await this.prisma.purchase.findUnique({
            where: { id },
            include: { items: true },
        });

        if (!purchase) throw new NotFoundException('Purchase not found');

        if (purchase.status === PurchaseStatus.CANCELLED) {
            throw new BadRequestException('Cannot complete cancelled purchase');
        }

        // Mark all items as received - update each item individually
        for (const item of purchase.items) {
            await this.prisma.purchaseItem.update({
                where: { id: item.id },
                data: { receivedQuantity: item.quantity },
            });
        }

        // Update inventory for all items
        await this.updateInventoryForPurchase(id, purchase.branchId);

        // Update purchase status
        const updated = await this.prisma.purchase.update({
            where: { id },
            data: {
                status: PurchaseStatus.COMPLETED,
                notes: notes ? `${purchase.notes ?? ''}\n${notes}`.trim() : purchase.notes,
            },
        });

        return {
            success: true,
            message: 'Purchase completed successfully',
            purchaseId: id,
            purchaseNumber: updated.purchaseNumber,
        };
    }

    async cancelPurchase(id: string, reason: string, notes?: string) {
        const purchase = await this.prisma.purchase.findUnique({ where: { id } });
        if (!purchase) throw new NotFoundException('Purchase not found');

        if (purchase.status === PurchaseStatus.COMPLETED) {
            throw new BadRequestException('Cannot cancel completed purchase');
        }

        const updated = await this.prisma.purchase.update({
            where: { id },
            data: {
                status: PurchaseStatus.CANCELLED,
                notes: `${purchase.notes ?? ''}\nCANCELLED: ${reason}\n${notes ?? ''}`.trim(),
            },
        });

        return {
            success: true,
            message: 'Purchase cancelled',
            purchaseId: id,
            reason,
        };
    }

    async getSummary(from?: string, to?: string, branchId?: string) {
        const { fromDate, toDate } = this.parseDateRange(from, to);

        const where: any = {
            purchaseDate: { gte: fromDate, lte: toDate },
            ...(branchId ? { branchId } : {}),
        };

        const [total, byStatus, topSuppliers] = await Promise.all([
            this.prisma.purchase.aggregate({
                where,
                _count: true,
                _sum: { totalAmount: true, paidAmount: true },
            }),

            this.prisma.purchase.groupBy({
                by: ['status'],
                where,
                _count: true,
                _sum: { totalAmount: true },
            }),

            this.prisma.purchase.groupBy({
                by: ['supplierId'],
                where: { ...where, supplierId: { not: null } },
                _count: true,
                _sum: { totalAmount: true },
                orderBy: { _sum: { totalAmount: 'desc' } },
                take: 5,
            }),
        ]);

        return {
            period: { from: fromDate.toISOString(), to: toDate.toISOString() },
            totalPurchases: total._count,
            totalAmount: this.decimalToNumber(total._sum.totalAmount),
            totalPaid: this.decimalToNumber(total._sum.paidAmount),
            outstandingAmount:
                this.decimalToNumber(total._sum.totalAmount) - this.decimalToNumber(total._sum.paidAmount),
            byStatus: byStatus.map((s: any) => ({
                status: s.status,
                count: s._count,
                totalAmount: this.decimalToNumber(s._sum.totalAmount),
            })),
            topSuppliers: topSuppliers.map((s: any) => ({
                supplierId: s.supplierId,
                purchaseCount: s._count,
                totalAmount: this.decimalToNumber(s._sum.totalAmount),
            })),
        };
    }

    async remove(id: string) {
        const existing = await this.prisma.purchase.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Purchase not found');

        if (existing.status === PurchaseStatus.COMPLETED) {
            throw new BadRequestException('Cannot delete completed purchase. Cancel it first.');
        }

        await this.prisma.purchase.delete({ where: { id } });
        return { success: true, message: 'Purchase deleted' };
    }

    // Helper methods

    private async updateInventoryForPurchase(purchaseId: string, branchId: string) {
        const purchase = await this.prisma.purchase.findUnique({
            where: { id: purchaseId },
            include: { items: true },
        });

        if (!purchase) return;

        for (const item of purchase.items) {
            await this.updateInventoryForItem(item.productId, branchId, item.quantity);
        }
    }

    private async updateInventoryForItem(productId: string, branchId: string, quantity: number) {
        const inventory = await this.prisma.inventory.findUnique({
            where: { productId_branchId: { productId, branchId } },
        });

        if (inventory) {
            await this.prisma.inventory.update({
                where: { id: inventory.id },
                data: { quantity: (inventory.quantity ?? 0) + quantity },
            });
        } else {
            await this.prisma.inventory.create({
                data: {
                    productId,
                    branchId,
                    quantity,
                    minimumStock: 1,
                },
            });
        }

        // Also update product quantity
        await this.prisma.product.update({
            where: { id: productId },
            data: { quantity: { increment: quantity } },
        });
    }

    private generatePurchaseNumber(): string {
        const now = new Date();
        const y = String(now.getFullYear());
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const t = Date.now().toString(36).toUpperCase();
        return `PUR-${y}${m}${d}-${t}`;
    }

    private parseDateRange(from?: string, to?: string): { fromDate: Date; toDate: Date } {
        const fromDate = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 30));
        const toDate = to ? new Date(to) : new Date();
        toDate.setHours(23, 59, 59, 999);
        return { fromDate, toDate };
    }

    private decimalToNumber(value: any): number {
        if (value == null) return 0;
        if (typeof value === 'number') return value;
        if (typeof (value as any).toNumber === 'function') {
            try {
                return (value as any).toNumber();
            } catch {
                // ignore
            }
        }
        const n = Number(value);
        return isNaN(n) ? 0 : n;
    }

    private mapPurchase(p: any) {
        return {
            id: p.id,
            purchaseNumber: p.purchaseNumber,
            purchaseDate: p.purchaseDate,
            status: p.status,
            supplierId: p.supplierId,
            supplier: p.supplier ?? undefined,
            userId: p.userId,
            user: p.user ?? undefined,
            branchId: p.branchId,
            branch: p.branch ?? undefined,
            subtotal: this.decimalToNumber(p.subtotal),
            taxAmount: this.decimalToNumber(p.taxAmount),
            totalAmount: this.decimalToNumber(p.totalAmount),
            paidAmount: this.decimalToNumber(p.paidAmount),
            paymentMethod: p.paymentMethod,
            deliveryDate: p.deliveryDate,
            notes: p.notes,
            items: Array.isArray(p.items)
                ? p.items.map((i: any) => ({
                    id: i.id,
                    productId: i.productId,
                    product: i.product ?? undefined,
                    quantity: i.quantity,
                    weight: this.decimalToNumber(i.weight),
                    unitPrice: this.decimalToNumber(i.unitPrice),
                    subtotal: this.decimalToNumber(i.subtotal),
                    receivedQuantity: i.receivedQuantity ?? 0,
                }))
                : [],
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        };
    }
}