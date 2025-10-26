import { WorkshopStatus } from '@zarmind/shared-types';
export declare class CreateWorkshopDto {
    code?: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    status?: WorkshopStatus;
    specialization?: string[];
    rating?: number;
    paymentTerms?: string;
    notes?: string;
}
//# sourceMappingURL=create-workshop.dto.d.ts.map