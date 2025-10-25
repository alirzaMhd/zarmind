import { ApService } from './ap.service';
import { CreateApDto } from './dto/create-ap.dto';
import { UpdateApDto } from './dto/update-ap.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
export declare class ApController {
    private readonly service;
    constructor(service: ApService);
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
    findAll(page?: string, limit?: string, supplierId?: string, status?: string, from?: string, to?: string, overdue?: string, sortBy?: 'invoiceDate' | 'dueDate' | 'amount' | 'remainingAmount', sortOrder?: 'asc' | 'desc'): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
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
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private toPosInt;
}
//# sourceMappingURL=ap.controller.d.ts.map