import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { TransferWorkOrderDto } from './dto/transfer-work-order.dto';
import { AddImagesDto } from './dto/add-images.dto';
import { UpdateQualityDto } from './dto/update-quality.dto';
import { WorkOrderPriority, WorkOrderStatus } from '@zarmind/shared-types';

type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class WorkOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // Create
  async create(dto: CreateWorkOrderDto) {
    // Verify workshop exists
    const workshop = await this.prisma.workshop.findUnique({
      where: { id: dto.workshopId },
      select: { id: true, name: true },
    });
    if (!workshop) throw new BadRequestException('Workshop not found');

    const orderNumber = dto.orderNumber ?? this.generateWorkOrderNumber();

    // Ensure orderNumber unique
    const existingOrderNumber = await this.prisma.workOrder.findUnique({
      where: { orderNumber },
      select: { id: true },
    });
    if (existingOrderNumber) {
      throw new BadRequestException('Order number already exists');
    }

    if (dto.qualityRating != null && (dto.qualityRating < 1 || dto.qualityRating > 5)) {
      throw new BadRequestException('qualityRating must be between 1 and 5');
    }

    const created = await this.prisma.workOrder.create({
      data: {
        orderNumber,
        workshop: { connect: { id: dto.workshopId } },
        productName: dto.productName,
        description: dto.description ?? null,
        specifications: dto.specifications ?? undefined,
        quantity: dto.quantity,
        status: dto.status ?? WorkOrderStatus.PENDING,
        priority: dto.priority ?? WorkOrderPriority.MEDIUM,
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
  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    workshopId?: string;
    status?: WorkOrderStatus;
    priority?: WorkOrderPriority;
    from?: string;
    to?: string;
    minRating?: number;
    maxRating?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'orderDate' | 'expectedEndDate' | 'status' | 'priority';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PagedResult<any>> {
    const {
      page,
      limit,
      search,
      workshopId,
      status,
      priority,
      from,
      to,
      minRating,
      maxRating,
      sortBy = 'orderDate',
      sortOrder = 'desc',
    } = params;

    const where: any = {
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

    const items = rows.map((r: any) => this.mapWorkOrder(r));
    return { items, total, page, limit };
  }

  // Get one
  async findOne(id: string) {
    const row = await this.prisma.workOrder.findUnique({
      where: { id },
      include: {
        workshop: { select: { id: true, code: true, name: true, city: true } },
      },
    });
    if (!row) throw new NotFoundException('Work order not found');
    return this.mapWorkOrder(row);
  }

  // Update general fields
  async update(id: string, dto: UpdateWorkOrderDto) {
    const existing = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Work order not found');

    // Validate orderNumber uniqueness if changing
    if (dto.orderNumber && dto.orderNumber !== existing.orderNumber) {
      const dup = await this.prisma.workOrder.findUnique({
        where: { orderNumber: dto.orderNumber },
      });
      if (dup) throw new BadRequestException('Order number already exists');
    }

    if (dto.qualityRating != null && (dto.qualityRating < 1 || dto.qualityRating > 5)) {
      throw new BadRequestException('qualityRating must be between 1 and 5');
    }

    const data: any = {
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
      if (!target) throw new BadRequestException('Target workshop not found');
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
  async updateStatus(id: string, dto: UpdateStatusDto) {
    const existing = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Work order not found');

    if (!dto.status) throw new BadRequestException('status is required');

    const data: any = {
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
    if (dto.status === WorkOrderStatus.IN_PROGRESS && existing.startDate == null && !dto.startDate) {
      data.startDate = now;
    }
    if (dto.status === WorkOrderStatus.COMPLETED && existing.completedDate == null && !dto.completedDate) {
      data.completedDate = now;
    }
    if (dto.status === WorkOrderStatus.DELIVERED && existing.deliveredDate == null && !dto.deliveredDate) {
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
  async transfer(id: string, dto: TransferWorkOrderDto) {
    if (!dto.workshopId) throw new BadRequestException('workshopId is required');
    const existing = await this.prisma.workOrder.findUnique({
      where: { id },
      include: { workshop: { select: { id: true, name: true } } },
    });
    if (!existing) throw new NotFoundException('Work order not found');

    if (dto.workshopId === existing.workshopId) {
      throw new BadRequestException('Work order is already in the target workshop');
    }

    const target = await this.prisma.workshop.findUnique({
      where: { id: dto.workshopId },
      select: { id: true, name: true },
    });
    if (!target) throw new BadRequestException('Target workshop not found');

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
  async updateImages(id: string, dto: AddImagesDto) {
    const existing = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Work order not found');

    const current = Array.isArray(existing.images) ? existing.images : [];
    const toAdd = Array.isArray(dto.imagesToAdd) ? dto.imagesToAdd : [];
    const toRemove = Array.isArray(dto.imagesToRemove) ? dto.imagesToRemove : [];

    const set = new Set(current);
    toAdd.forEach((img: any) => set.add(img));
    toRemove.forEach((img: any) => set.delete(img));

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
  async updateQuality(id: string, dto: UpdateQualityDto) {
    const existing = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Work order not found');

    if (dto.qualityRating != null && (dto.qualityRating < 1 || dto.qualityRating > 5)) {
      throw new BadRequestException('qualityRating must be between 1 and 5');
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
  async remove(id: string) {
    const existing = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Work order not found');

    if (existing.status !== WorkOrderStatus.CANCELLED) {
      await this.prisma.workOrder.update({
        where: { id },
        data: {
          status: WorkOrderStatus.CANCELLED,
          notes: `${existing.notes ?? ''}\nCANCELLED`.trim(),
        },
      });
      return { success: true, message: 'Work order cancelled' };
    }

    await this.prisma.workOrder.delete({ where: { id } });
    return { success: true, message: 'Work order deleted' };
  }

  // Helpers

  private generateWorkOrderNumber(): string {
    const now = new Date();
    const y = String(now.getFullYear());
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const token = Date.now().toString(36).toUpperCase();
    return `WO-${y}${m}${d}-${token}`;
  }

  private decimalToNumber(value: any): number | null {
    if (value == null) return null;
    if (typeof value === 'number') return value;
    if (typeof value?.toNumber === 'function') {
      try {
        return value.toNumber();
      } catch {}
    }
    const n = Number(value);
    return isNaN(n) ? null : n;
  }

  private mapWorkOrder(w: any) {
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
}