import { PrismaService } from '../../../../core/database/prisma.service';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { PayPayrollDto } from './dto/pay-payroll.dto';
export declare class PayrollService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    generate(dto: GeneratePayrollDto): Promise<any>;
    findAll(params: {
        employeeId?: string;
        from?: string;
        to?: string;
        paid?: boolean;
        page: number;
        limit: number;
        sortBy?: 'payDate' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    markPaid(id: string, dto: PayPayrollDto): Promise<any>;
    private decToNum;
    private dec;
    private mapPayroll;
}
//# sourceMappingURL=payroll.service.d.ts.map