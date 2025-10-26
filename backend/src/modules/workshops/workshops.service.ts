import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { WorkshopStatus } from '@zarmind/shared-types';

type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class WorkshopsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWorkshopDto) {
    const code = dto.code ?? this.generateWorkshopCode();

    // Check for duplicate code
    const existing = await this.prisma.workshop.findUnique({
      where: { code },
    });
    if (existing) throw new BadRequestException('Workshop code already exists');

    const data: any = {
      code,
      name: dto.name,
      contactPerson: dto.contactPerson ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      address: dto.address ?? null,
      city: dto.city ?? null,
      status: dto.status ?? WorkshopStatus.ACTIVE,
      specialization: dto.specialization ?? [],
      rating: dto.rating ?? null,
      paymentTerms: dto.paymentTerms ?? null,
      notes: dto.notes ?? null,
    };

    const created = await this.prisma.workshop.create({ data });
    return this.mapWorkshop(created);
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: WorkshopStatus;
    city?: string;
    specialization?: string;
    minRating?: number;
    maxRating?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'rating' | 'code';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PagedResult<any>> {
    const {
      page,
      limit,
      search,
      status,
      city,
      specialization,
      minRating,
      maxRating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: any = {
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

    const items = rows.map((w: any) => this.mapWorkshop(w));
    return { items, total, page, limit };
  }

  async findOne(id: string) {
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

    if (!workshop) throw new NotFoundException('Workshop not found');
    return this.mapWorkshop(workshop);
  }

  async update(id: string, dto: UpdateWorkshopDto) {
    const existing = await this.prisma.workshop.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Workshop not found');

    // Check for duplicate code if changed
    if (dto.code && dto.code !== existing.code) {
      const duplicate = await this.prisma.workshop.findUnique({
        where: { code: dto.code },
      });
      if (duplicate) throw new BadRequestException('Workshop code already exists');
    }

    const data: any = {
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

  async updateRating(id: string, rating: number, notes?: string) {
    const workshop = await this.prisma.workshop.findUnique({ where: { id } });
    if (!workshop) throw new NotFoundException('Workshop not found');

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
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

  async getWorkOrders(id: string, status?: string, from?: string, to?: string) {
    const workshop = await this.prisma.workshop.findUnique({ where: { id }, select: { id: true } });
    if (!workshop) throw new NotFoundException('Workshop not found');

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
      workOrders: workOrders.map((wo: any) => ({
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

  async getPerformance(id: string, from?: string, to?: string) {
    const workshop = await this.prisma.workshop.findUnique({ where: { id } });
    if (!workshop) throw new NotFoundException('Workshop not found');

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
    const specializationCount: Record<string, number> = {};
    bySpecialization.forEach((w: any) => {
      if (Array.isArray(w.specialization)) {
        w.specialization.forEach((spec: any) => {
          specializationCount[spec] = (specializationCount[spec] ?? 0) + 1;
        });
      }
    });

    // Get workshop details for top workshops
    const topWorkshopIds = topWorkshops.map((t: any) => t.workshopId).filter(Boolean) as string[];
    const workshopDetails = await this.prisma.workshop.findMany({
      where: { id: { in: topWorkshopIds } },
      select: { id: true, code: true, name: true, rating: true },
    });

    const workshopMap = new Map(workshopDetails.map((w: any) => [w.id, w]));

    return {
      totalWorkshops,
      byStatus: byStatus.map((s: any) => ({ status: s.status, count: s._count })),
      bySpecialization: Object.entries(specializationCount).map(([specialization, count]) => ({
        specialization,
        count,
      })),
      topWorkshops: topWorkshops.map((t: any) => {
        const workshop: any = workshopMap.get(t.workshopId as string);
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

  async remove(id: string) {
    const existing = await this.prisma.workshop.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Workshop not found');

    // Soft delete: mark as inactive
    await this.prisma.workshop.update({
      where: { id },
      data: { status: WorkshopStatus.INACTIVE },
    });

    return { success: true, message: 'Workshop marked as inactive' };
  }

  // Helpers

  private generateWorkshopCode(): string {
    const now = new Date();
    const y = String(now.getFullYear()).slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const t = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(
      now.getSeconds(),
    ).padStart(2, '0')}`;
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `WS-${y}${m}${d}-${t}-${rand}`;
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

  private mapWorkshop(w: any) {
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
}