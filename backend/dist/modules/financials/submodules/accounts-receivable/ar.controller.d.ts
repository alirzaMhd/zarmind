import { ArService } from './ar.service';
import { CreateArDto } from './dto/create-ar.dto';
import { UpdateArDto } from './dto/update-ar.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
export declare class ArController {
    private readonly service;
    constructor(service: ArService);
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
    findAll(page?: string, limit?: string, customerId?: string, status?: string, from?: string, to?: string, overdue?: string, sortBy?: 'invoiceDate' | 'dueDate' | 'amount' | 'remainingAmount', sortOrder?: 'asc' | 'desc'): Promise<{
        items: any;
        total: any;
        page: any;
        limit: any;
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
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private toPosInt;
}
//# sourceMappingURL=ar.controller.d.ts.map