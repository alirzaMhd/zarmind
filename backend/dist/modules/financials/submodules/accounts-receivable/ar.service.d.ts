import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateArDto } from './dto/create-ar.dto';
import { UpdateArDto } from './dto/update-ar.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
export declare class ArService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateArDto): Promise<{
        id: any;
        customerId: any;
        customer: any;
        invoiceNumber: any;
        invoiceDate: any;
        amount: number;
        paidAmount: number;
        remainingAmount: number;
        dueDate: any;
        status: any;
        notes: any;
        installments: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findAll(params: any): Promise<{
        items: any;
        total: any;
        page: any;
        limit: any;
    }>;
    findOne(id: string): Promise<{
        id: any;
        customerId: any;
        customer: any;
        invoiceNumber: any;
        invoiceDate: any;
        amount: number;
        paidAmount: number;
        remainingAmount: number;
        dueDate: any;
        status: any;
        notes: any;
        installments: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, dto: UpdateArDto): Promise<{
        id: any;
        customerId: any;
        customer: any;
        invoiceNumber: any;
        invoiceDate: any;
        amount: number;
        paidAmount: number;
        remainingAmount: number;
        dueDate: any;
        status: any;
        notes: any;
        installments: any;
        createdAt: any;
        updatedAt: any;
    }>;
    recordPayment(id: string, dto: RecordPaymentDto): Promise<{
        success: boolean;
        message: string;
        paidAmount: number;
        remainingAmount: number;
    }>;
    getSummary(customerId?: string): Promise<{
        totalDue: number;
        totalPaid: number;
        totalPending: number;
        overdue: {
            amount: number;
            count: any;
        };
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private dec;
    private mapAr;
}
//# sourceMappingURL=ar.service.d.ts.map