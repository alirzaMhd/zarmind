import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { CreatePerformanceDto } from './dto/create-performance.dto';
import { UpdatePerformanceDto } from './dto/update-performance.dto';

@Injectable()
export class PerformanceService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreatePerformanceDto) {
    // Ensure employee exists
    const emp = await this.prisma.employee.findUnique({ where: { id: dto.employeeId }, select: { id: true } });
    if (!emp) throw new NotFoundException('Employee not found');

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

  async findAll(params: {
    employeeId?: string;
    period?: string;
    page: number;
    limit: number;
    sortBy?: 'reviewDate' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }) {
    const { sortBy = 'reviewDate', sortOrder = 'desc' } = params;

    const where: any = {
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

  async findOne(id: string) {
    const row = await this.prisma.performance.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Performance record not found');
    return row;
  }

  async update(id: string, dto: UpdatePerformanceDto) {
    const existing = await this.prisma.performance.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Performance record not found');

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
}