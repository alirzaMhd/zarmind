import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
type PagedResult<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
};
export declare class ExpensesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    findAll(params: {
        page: number;
        limit: number;
        search?: string;
        categoryId?: string;
        from?: string;
        to?: string;
        vendor?: string;
        minAmount?: number;
        maxAmount?: number;
        isRecurring?: boolean;
        sortBy?: 'createdAt' | 'expenseDate' | 'amount' | 'title';
        sortOrder?: 'asc' | 'desc';
    }): Promise<PagedResult<any>>;
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
    approve(id: string, approvedByUserId: string): Promise<{
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
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private parseDateRange;
    private decimalToNumber;
    private mapExpense;
}
export {};
//# sourceMappingURL=expenses.service.d.ts.map