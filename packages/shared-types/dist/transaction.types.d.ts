import { IProduct } from './inventory.types';
import { ICustomer, IUser, ISupplier } from './user.types';
import { PaymentMethod } from './financial.types';
export declare enum SaleStatus {
    DRAFT = "DRAFT",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED",
    PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED"
}
export interface ISaleItem {
    id: string;
    saleId: string;
    productId: string;
    product?: Partial<IProduct>;
    quantity: number;
    weight?: number | null;
    unitPrice: number;
    goldPrice?: number | null;
    stonePrice?: number | null;
    craftsmanshipFee?: number | null;
    discount?: number | null;
    subtotal: number;
    createdAt: Date;
}
export interface ISalePayment {
    id: string;
    saleId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: Date;
    checkId?: string | null;
    bankAccountId?: string | null;
    referenceNumber?: string | null;
    notes?: string | null;
    createdAt: Date;
}
export interface ISale {
    id: string;
    invoiceNumber: string;
    saleDate: Date;
    status: SaleStatus;
    customerId?: string | null;
    customer?: Partial<ICustomer>;
    userId: string;
    user?: Partial<IUser>;
    branchId: string;
    branch?: {
        id: string;
        name: string;
        code: string;
    };
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    paidAmount: number;
    paymentMethod: PaymentMethod;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
    items: ISaleItem[];
    payments: ISalePayment[];
    returns?: IReturn[];
}
export declare enum PurchaseStatus {
    PENDING = "PENDING",
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export interface IPurchaseItem {
    id: string;
    purchaseId: string;
    productId: string;
    product?: Partial<IProduct>;
    quantity: number;
    weight?: number | null;
    unitPrice: number;
    subtotal: number;
    receivedQuantity?: number | null;
    createdAt: Date;
}
export interface IPurchase {
    id: string;
    purchaseNumber: string;
    purchaseDate: Date;
    status: PurchaseStatus;
    supplierId?: string | null;
    supplier?: Partial<ISupplier>;
    userId: string;
    user?: Partial<IUser>;
    branchId: string;
    branch?: {
        id: string;
        name: string;
        code: string;
    };
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    paidAmount: number;
    paymentMethod: PaymentMethod;
    deliveryDate?: Date | null;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
    items: IPurchaseItem[];
    returns?: IReturn[];
}
export declare enum ReturnType {
    CUSTOMER_RETURN = "CUSTOMER_RETURN",
    SUPPLIER_RETURN = "SUPPLIER_RETURN"
}
export declare enum ReturnStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    COMPLETED = "COMPLETED"
}
export declare enum ReturnReason {
    DEFECTIVE = "DEFECTIVE",
    WRONG_ITEM = "WRONG_ITEM",
    CUSTOMER_REQUEST = "CUSTOMER_REQUEST",
    QUALITY_ISSUE = "QUALITY_ISSUE",
    OTHER = "OTHER"
}
export interface IReturn {
    id: string;
    returnNumber: string;
    returnDate: Date;
    type: ReturnType;
    status: ReturnStatus;
    reason?: ReturnReason | null;
    originalSaleId?: string | null;
    originalSale?: Partial<ISale>;
    originalPurchaseId?: string | null;
    originalPurchase?: Partial<IPurchase>;
    customerId?: string | null;
    supplierId?: string | null;
    reasonDetails?: string | null;
    refundAmount: number;
    refundMethod?: PaymentMethod | null;
    approvedBy?: string | null;
    approvedAt?: Date | null;
    rejectedReason?: string | null;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=transaction.types.d.ts.map