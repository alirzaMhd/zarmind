import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { PayPayrollDto } from './dto/pay-payroll.dto';
import { PaymentMethod, Prisma } from '@zarmind/shared-types';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(dto: GeneratePayrollDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
      select: { id: true, baseSalary: true },
    });
    if (!employee) throw new BadRequestException('Employee not found');

    const baseSalary = dto.baseSalary ?? this.dec(employee.baseSalary);

    const commission = dto.commission ?? 0;
    const bonus = dto.bonus ?? 0;
    const overtime = dto.overtime ?? 0;
    const allowances = dto.allowances ?? 0;

    const tax = dto.tax ?? 0;
    const insurance = dto.insurance ?? 0;
    const loan = dto.loan ?? 0;
    const otherDeductions = dto.otherDeductions ?? 0;

    const totalEarnings = baseSalary + commission + bonus + overtime + allowances;
    const totalDeductions = tax + insurance + loan + otherDeductions;
    const netSalary = totalEarnings - totalDeductions;

    const created = await this.prisma.payroll.create({
      data: {
        employeeId: dto.employeeId,
        payPeriodStart: new Date(dto.payPeriodStart),
        payPeriodEnd: new Date(dto.payPeriodEnd),
        payDate: new Date(dto.payDate),
        baseSalary,
        commission,
        bonus,
        overtime,
        allowances,
        tax,
        insurance,
        loan,
        otherDeductions,
        totalEarnings,
        totalDeductions,
        netSalary,
        paymentMethod: dto.paymentMethod ?? null,
        paid: false,
      },
    });

    return created;
  }

  async findAll(params: {
    employeeId?: string;
    from?: string;
    to?: string;
    paid?: boolean;
    page: number;
    limit: number;
  }) {
    const where: Prisma.PayrollWhereInput = {
      ...(params.employeeId ? { employeeId: params.employeeId } : {}),
      ...(params.paid === undefined ? {} : { paid: params.paid }),
      ...(params.from || params.to
        ? {
            payDate: {
              gte: params.from ? new Date(params.from) : undefined,
              lte: params.to ? new Date(params.to) : undefined,
            },
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.payroll.count({ where }),
      this.prisma.payroll.findMany({
        where,
        orderBy: { payDate: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
    ]);

    return {
      items: rows.map((r) => this.mapPayroll(r)),
      total,
      page: params.page,
      limit: params.limit,
    };
  }

  async findOne(id: string) {
    const row = await this.prisma.payroll.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Payroll record not found');
    return this.mapPayroll(row);
  }

  async markPaid(id: string, dto: PayPayrollDto) {
    const row = await this.prisma.payroll.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Payroll record not found');
    if (row.paid) throw new BadRequestException('Already marked as paid');

    const updated = await this.prisma.payroll.update({
      where: { id },
      data: {
        paid: true,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
        paymentMethod: dto.paymentMethod ?? PaymentMethod.CASH,
        notes: dto.notes ?? undefined,
      },
    });

    return this.mapPayroll(updated);
  }

  private decToNum(value: any): number {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value?.toNumber === 'function') {
      try { return value.toNumber(); } catch {}
    }
    const n = Number(value);
    return isNaN(n) ? 0 : n;
  }

  private dec(value: any): number | null {
    const n = this.decToNum(value);
    return n === 0 ? 0 : n;
  }

  private mapPayroll(r: any) {
    return {
      ...r,
      baseSalary: this.decToNum(r.baseSalary),
      commission: this.decToNum(r.commission),
      bonus: this.decToNum(r.bonus),
      overtime: this.decToNum(r.overtime),
      allowances: this.decToNum(r.allowances),
      tax: this.decToNum(r.tax),
      insurance: this.decToNum(r.insurance),
      loan: this.decToNum(r.loan),
      otherDeductions: this.decToNum(r.otherDeductions),
      totalEarnings: this.decToNum(r.totalEarnings),
      totalDeductions: this.decToNum(r.totalDeductions),
      netSalary: this.decToNum(r.netSalary),
    };
  }
}