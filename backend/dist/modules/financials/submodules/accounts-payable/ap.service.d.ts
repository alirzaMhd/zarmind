import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateApDto } from './dto/create-ap.dto';
import { UpdateApDto } from './dto/update-ap.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
type PagedResult<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
};
export declare class ApService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateApDto): Promise<{
        id: any;
        supplierId: any;
        supplier: any;
        invoiceNumber: any;
        invoiceDate: any;
        amount: number;
        paidAmount: number;
        remainingAmount: number;
        dueDate: any;
        status: any;
        notes: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findAll(params: {
        page: number;
        limit: number;
        supplierId?: string;
        status?: string;
        from?: string;
        to?: string;
        overdue?: boolean;
        sortBy?: 'invoiceDate' | 'dueDate' | 'amount' | 'remainingAmount';
        sortOrder?: 'asc' | 'desc';
    }): Promise<PagedResult<any>>;
    findOne(id: string): Promise<{
        id: any;
        supplierId: any;
        supplier: any;
        invoiceNumber: any;
        invoiceDate: any;
        amount: number;
        paidAmount: number;
        remainingAmount: number;
        dueDate: any;
        status: any;
        notes: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, dto: UpdateApDto): Promise<{
        id: any;
        supplierId: any;
        supplier: any;
        invoiceNumber: any;
        invoiceDate: any;
        amount: number;
        paidAmount: number;
        remainingAmount: number;
        dueDate: any;
        status: any;
        notes: any;
        createdAt: any;
        updatedAt: any;
    }>;
    recordPayment(id: string, dto: RecordPaymentDto): Promise<{
        id: any;
        supplierId: any;
        supplier: any;
        invoiceNumber: any;
        invoiceDate: any;
        amount: number;
        paidAmount: number;
        remainingAmount: number;
        dueDate: any;
        status: any;
        notes: any;
        createdAt: any;
        updatedAt: any;
    }>;
    getSummary(supplierId?: string): Promise<{
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
    private decimalToNumber;
    private mapAp;
}
export {};
//# sourceMappingURL=ap.service.d.ts.map