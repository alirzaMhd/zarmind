import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AttendanceStatus, Prisma } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async clockIn(dto: ClockInDto, ip?: string, userAgent?: string) {
    const dateOnly = this.dateOnly(dto.date);
    const employee = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
    if (!employee) throw new BadRequestException('Employee not found');

    const existing = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: dto.employeeId, date: dateOnly } },
    });

    if (existing) {
      if (existing.checkIn && !existing.checkOut) {
        throw new BadRequestException('Already clocked in for this date');
      }
      // If exists but no checkIn, proceed to set it
      return this.prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn: new Date(),
          status: AttendanceStatus.PRESENT,
          ipAddress: ip ?? existing.ipAddress ?? undefined,
          location: dto.location ?? existing.location ?? undefined,
          notes: dto.notes ?? existing.notes ?? undefined,
        },
      });
    }

    return this.prisma.attendance.create({
      data: {
        employeeId: dto.employeeId,
        date: dateOnly,
        checkIn: new Date(),
        status: AttendanceStatus.PRESENT,
        ipAddress: ip,
        location: dto.location,
        notes: dto.notes,
      },
    });
  }

  async clockOut(dto: ClockOutDto, ip?: string, userAgent?: string) {
    const dateOnly = this.dateOnly(dto.date);
    const attendance = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: dto.employeeId, date: dateOnly } },
    });

    if (!attendance) throw new BadRequestException('No attendance record for this date');
    if (!attendance.checkIn) throw new BadRequestException('Not clocked in yet');
    if (attendance.checkOut) throw new BadRequestException('Already clocked out');

    const now = new Date();
    const hoursWorkedNum = this.roundHours((now.getTime() - attendance.checkIn.getTime()) / 3600000);
    const overtimeNum = hoursWorkedNum > 8 ? this.roundHours(hoursWorkedNum - 8) : 0;

    return this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: now,
        hoursWorked: new Prisma.Decimal(hoursWorkedNum),
        overtime: new Prisma.Decimal(overtimeNum),
        ipAddress: ip ?? attendance.ipAddress ?? undefined,
        location: dto.location ?? attendance.location ?? undefined,
        notes: dto.notes ?? attendance.notes ?? undefined,
      },
    });
  }

  async findAll(params: {
    employeeId?: string;
    from?: string;
    to?: string;
    status?: AttendanceStatus;
    page: number;
    limit: number;
  }) {
    const where: Prisma.AttendanceWhereInput = {
      ...(params.employeeId ? { employeeId: params.employeeId } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.from || params.to
        ? {
            date: {
              gte: params.from ? this.dateOnly(params.from) : undefined,
              lte: params.to ? this.dateOnly(params.to) : undefined,
            },
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.attendance.count({ where }),
      this.prisma.attendance.findMany({
        where,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
    ]);

    return { items: rows, total, page: params.page, limit: params.limit };
  }

  async findOne(id: string) {
    const row = await this.prisma.attendance.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Attendance record not found');
    return row;
  }

  async update(id: string, dto: UpdateAttendanceDto) {
    const existing = await this.prisma.attendance.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Attendance record not found');

    let checkIn = existing.checkIn;
    let checkOut = existing.checkOut;

    if (dto.checkIn) checkIn = new Date(dto.checkIn);
    if (dto.checkOut) checkOut = new Date(dto.checkOut);

    // Work with numbers, then convert to Prisma.Decimal when updating
    let hoursWorkedNum: number | undefined =
      existing.hoursWorked != null ? this.decToNum(existing.hoursWorked) : undefined;
    let overtimeNum: number | undefined =
      existing.overtime != null ? this.decToNum(existing.overtime) : undefined;

    if (checkIn && checkOut) {
      const hours = this.roundHours((checkOut.getTime() - checkIn.getTime()) / 3600000);
      hoursWorkedNum = hours;
      overtimeNum = hours > 8 ? this.roundHours(hours - 8) : 0;
    }

    return this.prisma.attendance.update({
      where: { id },
      data: {
        date: dto.date ? this.dateOnly(dto.date) : undefined,
        status: dto.status ?? undefined,
        checkIn: dto.checkIn ? new Date(dto.checkIn) : undefined,
        checkOut: dto.checkOut ? new Date(dto.checkOut) : undefined,
        hoursWorked: hoursWorkedNum !== undefined ? new Prisma.Decimal(hoursWorkedNum) : undefined,
        overtime: overtimeNum !== undefined ? new Prisma.Decimal(overtimeNum) : undefined,
        notes: dto.notes ?? undefined,
        location: dto.location ?? undefined,
        ipAddress: dto.ipAddress ?? undefined,
      },
    });
  }

  private dateOnly(date?: string): Date {
    const d = date ? new Date(date) : new Date();
    if (isNaN(d.getTime())) throw new BadRequestException('Invalid date');
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private roundHours(h: number): number {
    return Math.round(h * 100) / 100;
  }

  private decToNum(value: any): number {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value?.toNumber === 'function') {
      try {
        return value.toNumber();
      } catch {
        // ignore
      }
    }
    const n = Number(value);
    return isNaN(n) ? 0 : n;
  }
}