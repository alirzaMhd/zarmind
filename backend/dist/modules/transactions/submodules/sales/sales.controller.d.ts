import { SalesService } from './sales.service';
import { UserRole, SaleStatus } from '@zarmind/shared-types';
import { CreateSaleDto } from './dto/update-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import type { Request } from 'express';
interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        email: string;
        role?: UserRole;
    };
}
export declare class SalesController {
    private readonly service;
    constructor(service: SalesService);
    create(dto: CreateSaleDto, req: AuthenticatedRequest): Promise<{
        id: any;
        invoiceNumber: any;
        saleDate: any;
        status: any;
        customerId: any;
        customer: any;
        userId: any;
        user: any;
        branchId: any;
        branch: any;
        subtotal: number;
        taxAmount: number;
        discountAmount: number;
        totalAmount: number;
        paidAmount: number;
        paymentMethod: any;
        notes: any;
        items: any;
        payments: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findAll(page?: string, limit?: string, search?: string, status?: SaleStatus, customerId?: string, branchId?: string, userId?: string, from?: string, to?: string, minAmount?: string, maxAmount?: string, paymentMethod?: string, sortBy?: 'createdAt' | 'updatedAt' | 'saleDate' | 'totalAmount', sortOrder?: 'asc' | 'desc'): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    getSummary(from?: string, to?: string, branchId?: string, userId?: string): Promise<{
        period: {
            from: string;
            to: string;
        };
        totalSales: any;
        totalRevenue: number;
        totalPaid: number;
        totalSubtotal: number;
        totalTax: number;
        totalDiscount: number;
        outstandingAmount: number;
        byStatus: any;
        byPaymentMethod: any;
        topCustomers: any;
        topProducts: any;
    }>;
    findOne(id: string): Promise<{
        id: any;
        invoiceNumber: any;
        saleDate: any;
        status: any;
        customerId: any;
        customer: any;
        userId: any;
        user: any;
        branchId: any;
        branch: any;
        subtotal: number;
        taxAmount: number;
        discountAmount: number;
        totalAmount: number;
        paidAmount: number;
        paymentMethod: any;
        notes: any;
        items: any;
        payments: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findByInvoiceNumber(invoiceNumber: string): Promise<{
        id: any;
        invoiceNumber: any;
        saleDate: any;
        status: any;
        customerId: any;
        customer: any;
        userId: any;
        user: any;
        branchId: any;
        branch: any;
        subtotal: number;
        taxAmount: number;
        discountAmount: number;
        totalAmount: number;
        paidAmount: number;
        paymentMethod: any;
        notes: any;
        items: any;
        payments: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, dto: UpdateSaleDto): Promise<{
        id: any;
        invoiceNumber: any;
        saleDate: any;
        status: any;
        customerId: any;
        customer: any;
        userId: any;
        user: any;
        branchId: any;
        branch: any;
        subtotal: number;
        taxAmount: number;
        discountAmount: number;
        totalAmount: number;
        paidAmount: number;
        paymentMethod: any;
        notes: any;
        items: any;
        payments: any;
        createdAt: any;
        updatedAt: any;
    }>;
    recordPayment(id: string, dto: RecordPaymentDto): Promise<{
        success: boolean;
        message: string;
        saleId: string;
        paidAmount: number;
        remainingAmount: number;
        status: SaleStatus;
    }>;
    complete(id: string, body: {
        notes?: string;
    }): Promise<{
        success: boolean;
        message: string;
        saleId: string;
        invoiceNumber: any;
    }>;
    cancel(id: string, body: {
        reason: string;
        notes?: string;
    }): Promise<{
        success: boolean;
        message: string;
        saleId: string;
        reason: string;
    }>;
    refund(id: string, body: {
        amount: number;
        reason: string;
        notes?: string;
    }): Promise<{
        success: boolean;
        message: string;
        saleId: string;
        refundAmount: number;
        reason: string;
        newStatus: SaleStatus;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private toPosInt;
}
export {};
//# sourceMappingURL=sales.controller.d.ts.map