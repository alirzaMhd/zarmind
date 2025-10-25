export declare enum PaymentMethod {
    CASH = "CASH",
    CHECK = "CHECK",
    BANK_TRANSFER = "BANK_TRANSFER",
    CARD = "CARD",
    INSTALLMENT = "INSTALLMENT",
    TRADE_IN = "TRADE_IN",
    MIXED = "MIXED"
}
export declare enum CashTransactionType {
    CASH_IN = "CASH_IN",
    CASH_OUT = "CASH_OUT",
    OPENING_BALANCE = "OPENING_BALANCE",
    CLOSING_BALANCE = "CLOSING_BALANCE",
    PETTY_CASH = "PETTY_CASH"
}
export declare enum CheckType {
    RECEIVABLE = "RECEIVABLE",// چک دریافتی
    PAYABLE = "PAYABLE"
}
export declare enum CheckStatus {
    PENDING = "PENDING",
    DEPOSITED = "DEPOSITED",
    CLEARED = "CLEARED",
    BOUNCED = "BOUNCED",
    CANCELLED = "CANCELLED",
    CASHED = "CASHED",
    TRANSFERRED = "TRANSFERRED"
}
export declare enum BankTransactionType {
    DEPOSIT = "DEPOSIT",
    WITHDRAWAL = "WITHDRAWAL",
    TRANSFER_IN = "TRANSFER_IN",
    TRANSFER_OUT = "TRANSFER_OUT",
    FEE = "FEE",
    INTEREST = "INTEREST",
    CHECK_DEPOSIT = "CHECK_DEPOSIT",
    CHECK_WITHDRAWAL = "CHECK_WITHDRAWAL"
}
export interface IBankAccount {
    id: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
    branchName?: string | null;
    iban?: string | null;
    swiftCode?: string | null;
    branchId?: string | null;
    balance: number;
    currency: string;
    accountType?: string | null;
    isActive: boolean;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface IBankTransaction {
    id: string;
    bankAccountId: string;
    type: BankTransactionType;
    amount: number;
    transactionDate: Date;
    referenceNumber?: string | null;
    description?: string | null;
    category?: string | null;
    balanceAfter?: number | null;
    reconciled: boolean;
    reconciledDate?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface ICashTransaction {
    id: string;
    type: CashTransactionType;
    amount: number;
    transactionDate: Date;
    branchId: string;
    userId: string;
    category?: string | null;
    referenceType?: string | null;
    referenceId?: string | null;
    description?: string | null;
    receiptNumber?: string | null;
    createdAt: Date;
}
export interface ICheck {
    id: string;
    checkNumber: string;
    type: CheckType;
    status: CheckStatus;
    amount: number;
    issueDate: Date;
    dueDate: Date;
    bankName: string;
    branchName?: string | null;
    accountNumber?: string | null;
    issuerName?: string | null;
    customerId?: string | null;
    supplierId?: string | null;
    payeeName?: string | null;
    checkImages: string[];
    notes?: string | null;
    depositedDate?: Date | null;
    clearedDate?: Date | null;
    bouncedDate?: Date | null;
    bouncedReason?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface IReceivablePayable {
    id: string;
    invoiceNumber: string;
    invoiceDate: Date;
    amount: number;
    paidAmount: number;
    remainingAmount: number;
    dueDate?: Date | null;
    status: string;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface IAccountsReceivable extends IReceivablePayable {
    customerId: string;
    installments?: IInstallment[];
}
export interface IAccountsPayable extends IReceivablePayable {
    supplierId: string;
}
export interface IInstallment {
    id: string;
    receivableId: string;
    installmentNumber: number;
    amount: number;
    dueDate: Date;
    paidDate?: Date | null;
    paidAmount?: number | null;
    status: string;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface IExpenseCategory {
    id: string;
    name: string;
    nameEn?: string | null;
    description?: string | null;
    parentId?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface IExpense {
    id: string;
    categoryId: string;
    category: IExpenseCategory;
    amount: number;
    expenseDate: Date;
    title: string;
    description?: string | null;
    vendor?: string | null;
    invoiceNumber?: string | null;
    receiptImages: string[];
    paymentMethod: PaymentMethod;
    referenceNumber?: string | null;
    isRecurring: boolean;
    recurringPattern?: string | null;
    approvedBy?: string | null;
    approvedAt?: Date | null;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=financial.types.d.ts.map