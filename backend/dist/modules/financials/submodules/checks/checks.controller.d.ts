import { ChecksService } from './checks.service';
import { CheckType, CheckStatus } from '@zarmind/shared-types';
import { CreateCheckDto } from './dto/create-check.dto';
import { UpdateCheckDto } from './dto/update-check.dto';
import { UpdateCheckStatusDto } from './dto/update-check-status.dto';
export declare class ChecksController {
    private readonly service;
    constructor(service: ChecksService);
    create(dto: CreateCheckDto): Promise<{
        id: any;
        checkNumber: any;
        type: any;
        status: any;
        amount: number;
        issueDate: any;
        dueDate: any;
        bankName: any;
        branchName: any;
        accountNumber: any;
        issuerName: any;
        customerId: any;
        supplierId: any;
        payeeName: any;
        checkImages: any;
        notes: any;
        depositedDate: any;
        clearedDate: any;
        bouncedDate: any;
        bouncedReason: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findAll(page?: string, limit?: string, search?: string, type?: CheckType, status?: CheckStatus, fromDueDate?: string, toDueDate?: string, bankName?: string, minAmount?: string, maxAmount?: string, sortBy?: 'createdAt' | 'dueDate' | 'issueDate' | 'amount', sortOrder?: 'asc' | 'desc'): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    getSummary(type?: CheckType): Promise<{
        type: string;
        byStatus: any;
        upcomingDue: {
            count: any;
            totalAmount: number;
        };
        overdue: {
            count: any;
            totalAmount: number;
        };
    }>;
    findOne(id: string): Promise<{
        id: any;
        checkNumber: any;
        type: any;
        status: any;
        amount: number;
        issueDate: any;
        dueDate: any;
        bankName: any;
        branchName: any;
        accountNumber: any;
        issuerName: any;
        customerId: any;
        supplierId: any;
        payeeName: any;
        checkImages: any;
        notes: any;
        depositedDate: any;
        clearedDate: any;
        bouncedDate: any;
        bouncedReason: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, dto: UpdateCheckDto): Promise<{
        id: any;
        checkNumber: any;
        type: any;
        status: any;
        amount: number;
        issueDate: any;
        dueDate: any;
        bankName: any;
        branchName: any;
        accountNumber: any;
        issuerName: any;
        customerId: any;
        supplierId: any;
        payeeName: any;
        checkImages: any;
        notes: any;
        depositedDate: any;
        clearedDate: any;
        bouncedDate: any;
        bouncedReason: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateStatus(id: string, dto: UpdateCheckStatusDto): Promise<{
        id: any;
        checkNumber: any;
        type: any;
        status: any;
        amount: number;
        issueDate: any;
        dueDate: any;
        bankName: any;
        branchName: any;
        accountNumber: any;
        issuerName: any;
        customerId: any;
        supplierId: any;
        payeeName: any;
        checkImages: any;
        notes: any;
        depositedDate: any;
        clearedDate: any;
        bouncedDate: any;
        bouncedReason: any;
        createdAt: any;
        updatedAt: any;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private toPosInt;
}
//# sourceMappingURL=checks.controller.d.ts.map