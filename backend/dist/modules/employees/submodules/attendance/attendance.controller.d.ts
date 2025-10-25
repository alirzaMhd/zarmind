import { AttendanceService } from './attendance.service';
import { AttendanceStatus } from '@zarmind/shared-types';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import type { Request } from 'express';
export declare class AttendanceController {
    private readonly service;
    constructor(service: AttendanceService);
    clockIn(dto: ClockInDto, req: Request): Promise<any>;
    clockOut(dto: ClockOutDto, req: Request): Promise<any>;
    list(employeeId?: string, from?: string, to?: string, status?: AttendanceStatus, page?: string, limit?: string): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
    }>;
    get(id: string): Promise<any>;
    update(id: string, dto: UpdateAttendanceDto): Promise<any>;
    private toPosInt;
}
//# sourceMappingURL=attendance.controller.d.ts.map