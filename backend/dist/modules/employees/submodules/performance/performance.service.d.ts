import { PrismaService } from '../../../../core/database/prisma.service';
import { CreatePerformanceDto } from './dto/create-performance.dto';
import { UpdatePerformanceDto } from './dto/update-performance.dto';
export declare class PerformanceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreatePerformanceDto): Promise<any>;
    findAll(params: {
        employeeId?: string;
        period?: string;
        page: number;
        limit: number;
    }): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdatePerformanceDto): Promise<any>;
}
//# sourceMappingURL=performance.service.d.ts.map