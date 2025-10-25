import { ExpensesService } from './expenses.service';
import { UserRole } from '@zarmind/shared-types';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
import type { Request } from 'express';
interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        email: string;
        role?: UserRole;
    };
}
export declare class ExpensesController {
    private readonly service;
    constructor(service: ExpensesService);
    createCategory(dto: CreateExpenseCategoryDto): Promise<any>;
    findAllCategories(search?: string): Promise<any>;
    updateCategory(id: string, dto: UpdateExpenseCategoryDto): Promise<any>;
    removeCategory(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    create(dto: CreateExpenseDto): Promise<{
        id: any;
        categoryId: any;
        category: any;
        amount: number;
        expenseDate: any;
        title: any;
        description: any;
        vendor: any;
        invoiceNumber: any;
        receiptImages: any;
        paymentMethod: any;
        referenceNumber: any;
        isRecurring: any;
        recurringPattern: any;
        approvedBy: any;
        approvedAt: any;
        notes: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findAll(page?: string, limit?: string, search?: string, categoryId?: string, from?: string, to?: string, vendor?: string, minAmount?: string, maxAmount?: string, isRecurring?: string, sortBy?: 'createdAt' | 'expenseDate' | 'amount' | 'title', sortOrder?: 'asc' | 'desc'): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    getSummary(from?: string, to?: string): Promise<{
        period: {
            from: string;
            to: string;
        };
        totalExpenses: any;
        totalAmount: number;
        byCategory: any;
        byPaymentMethod: any;
    }>;
    findOne(id: string): Promise<{
        id: any;
        categoryId: any;
        category: any;
        amount: number;
        expenseDate: any;
        title: any;
        description: any;
        vendor: any;
        invoiceNumber: any;
        receiptImages: any;
        paymentMethod: any;
        referenceNumber: any;
        isRecurring: any;
        recurringPattern: any;
        approvedBy: any;
        approvedAt: any;
        notes: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, dto: UpdateExpenseDto): Promise<{
        id: any;
        categoryId: any;
        category: any;
        amount: number;
        expenseDate: any;
        title: any;
        description: any;
        vendor: any;
        invoiceNumber: any;
        receiptImages: any;
        paymentMethod: any;
        referenceNumber: any;
        isRecurring: any;
        recurringPattern: any;
        approvedBy: any;
        approvedAt: any;
        notes: any;
        createdAt: any;
        updatedAt: any;
    }>;
    approve(id: string, req: AuthenticatedRequest): Promise<{
        id: any;
        categoryId: any;
        category: any;
        amount: number;
        expenseDate: any;
        title: any;
        description: any;
        vendor: any;
        invoiceNumber: any;
        receiptImages: any;
        paymentMethod: any;
        referenceNumber: any;
        isRecurring: any;
        recurringPattern: any;
        approvedBy: any;
        approvedAt: any;
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
export {};
//# sourceMappingURL=expenses.controller.d.ts.map