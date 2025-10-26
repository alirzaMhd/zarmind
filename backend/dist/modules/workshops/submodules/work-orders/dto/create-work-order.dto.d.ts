import { WorkOrderPriority, WorkOrderStatus } from '@zarmind/shared-types';
export declare class CreateWorkOrderDto {
    workshopId: string;
    orderNumber?: string;
    productName: string;
    description?: string;
    specifications?: Record<string, any>;
    quantity: number;
    status?: WorkOrderStatus;
    priority?: WorkOrderPriority;
    orderDate?: string;
    startDate?: string;
    expectedEndDate?: string;
    completedDate?: string;
    deliveredDate?: string;
    costEstimate?: number;
    actualCost?: number;
    goldProvided?: number;
    stonesProvided?: string;
    images?: string[];
    qualityRating?: number;
    notes?: string;
}
//# sourceMappingURL=create-work-order.dto.d.ts.map