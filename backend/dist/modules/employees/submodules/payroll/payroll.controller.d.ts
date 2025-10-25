import { PayrollService } from './payroll.service';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { PayPayrollDto } from './dto/pay-payroll.dto';
export declare class PayrollController {
    private readonly service;
    constructor(service: PayrollService);
    generate(dto: GeneratePayrollDto): Promise<any>;
    list(employeeId?: string, from?: string, to?: string, paid?: string, page?: string, limit?: string): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
    }>;
    get(id: string): Promise<any>;
    markPaid(id: string, dto: PayPayrollDto): Promise<any>;
    private toPosInt;
}
//# sourceMappingURL=payroll.controller.d.ts.map