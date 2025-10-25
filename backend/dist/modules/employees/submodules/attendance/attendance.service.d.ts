import { PrismaService } from '../../../../core/database/prisma.service';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AttendanceStatus } from '@zarmind/shared-types';
export declare class AttendanceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    clockIn(dto: ClockInDto, ip?: string, userAgent?: string): Promise<any>;
    clockOut(dto: ClockOutDto, ip?: string, userAgent?: string): Promise<any>;
    findAll(params: {
        employeeId?: string;
        from?: string;
        to?: string;
        status?: AttendanceStatus;
        page: number;
        limit: number;
    }): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateAttendanceDto): Promise<any>;
    private dateOnly;
    private roundHours;
    private decToNum;
}
//# sourceMappingURL=attendance.service.d.ts.map