export declare enum ProductCategory {
    RAW_GOLD = "RAW_GOLD",
    MANUFACTURED_PRODUCT = "MANUFACTURED_PRODUCT",
    STONE = "STONE",
    COIN = "COIN",
    CURRENCY = "CURRENCY",
    GENERAL_GOODS = "GENERAL_GOODS"
}
export declare enum ProductStatus {
    IN_STOCK = "IN_STOCK",
    SOLD = "SOLD",
    RESERVED = "RESERVED",
    IN_WORKSHOP = "IN_WORKSHOP",
    RETURNED = "RETURNED",
    DAMAGED = "DAMAGED"
}
export declare enum GoldPurity {
    K18 = "K18",
    K21 = "K21",
    K22 = "K22",
    K24 = "K24"
}
export declare enum StoneType {
    DIAMOND = "DIAMOND",
    RUBY = "RUBY",
    EMERALD = "EMERALD",
    SAPPHIRE = "SAPPHIRE",
    PEARL = "PEARL",
    TOPAZ = "TOPAZ",
    AMETHYST = "AMETHYST",
    TURQUOISE = "TURQUOISE",
    ONYX = "ONYX",
    OTHER = "OTHER"
}
export declare enum CoinType {
    BAHAR_AZADI = "BAHAR_AZADI",
    GERAMI = "GERAMI",
    HALF_BAHAR = "HALF_BAHAR",
    QUARTER_BAHAR = "QUARTER_BAHAR",
    NIM_AZADI = "NIM_AZADI",
    ROB_AZADI = "ROB_AZADI",
    OTHER = "OTHER"
}
export interface IProductStone {
    id: string;
    productId: string;
    stoneType: StoneType;
    caratWeight: number;
    quantity: number;
    price: number;
    notes?: string | null;
    createdAt: Date;
}
export interface IInventory {
    id: string;
    productId: string;
    branchId: string;
    quantity: number;
    minimumStock: number;
    location?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface IProduct {
    id: string;
    sku: string;
    qrCode?: string | null;
    name: string;
    description?: string | null;
    category: ProductCategory;
    status: ProductStatus;
    weight?: number | null;
    purchasePrice?: number | null;
    sellingPrice?: number | null;
    goldPurity?: GoldPurity | null;
    craftsmanshipFee?: number | null;
    stoneType?: StoneType | null;
    caratWeight?: number | null;
    stoneQuality?: string | null;
    certificateNumber?: string | null;
    coinType?: CoinType | null;
    coinYear?: number | null;
    quantity?: number | null;
    currencyCode?: string | null;
    brand?: string | null;
    model?: string | null;
    images: string[];
    scaleImage?: string | null;
    workshopId?: string | null;
    productionStatus?: string | null;
    createdAt: Date;
    updatedAt: Date;
    inventory?: IInventory[];
    productStones?: IProductStone[];
}
export interface IGoldPrice {
    id: string;
    purity: GoldPurity;
    pricePerGram: number;
    source?: string | null;
    effectiveDate: Date;
    createdAt: Date;
}
export interface IExchangeRate {
    id: string;
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    source?: string | null;
    effectiveDate: Date;
    createdAt: Date;
}
export declare enum WorkshopStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    SUSPENDED = "SUSPENDED"
}
export declare enum WorkOrderStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    IN_PROGRESS = "IN_PROGRESS",
    QUALITY_CHECK = "QUALITY_CHECK",
    COMPLETED = "COMPLETED",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
    REJECTED = "REJECTED"
}
export declare enum WorkOrderPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export interface IWorkshop {
    id: string;
    name: string;
    code: string;
    contactPerson?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    status: WorkshopStatus;
    specialization: string[];
    rating?: number | null;
    paymentTerms?: string | null;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface IWorkOrder {
    id: string;
    orderNumber: string;
    workshopId: string;
    productName: string;
    description?: string | null;
    specifications?: any | null;
    quantity: number;
    status: WorkOrderStatus;
    priority: WorkOrderPriority;
    orderDate: Date;
    startDate?: Date | null;
    expectedEndDate?: Date | null;
    completedDate?: Date | null;
    deliveredDate?: Date | null;
    costEstimate?: number | null;
    actualCost?: number | null;
    goldProvided?: number | null;
    stonesProvided?: string | null;
    qualityRating?: number | null;
    qualityNotes?: string | null;
    images: string[];
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=inventory.types.d.ts.map