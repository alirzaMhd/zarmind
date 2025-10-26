import { PerformanceService } from './performance.service';
import { CreatePerformanceDto } from './dto/create-performance.dto';
import { UpdatePerformanceDto } from './dto/update-performance.dto';
export declare class PerformanceController {
    private readonly service;
    constructor(service: PerformanceService);
    create(dto: CreatePerformanceDto): Promise<any>;
    list(employeeId?: string, period?: string, page?: string, limit?: string, sortBy?: 'reviewDate' | 'createdAt', sortOrder?: 'asc' | 'desc'): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
    }>;
    get(id: string): Promise<any>;
    update(id: string, dto: UpdatePerformanceDto): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private toPosInt;
}
//# sourceMappingURL=performance.controller.d.ts.map