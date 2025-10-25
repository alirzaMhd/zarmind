import { SupplierStatus } from '@zarmind/shared-types';
export declare class CreateSupplierDto {
    code?: string;
    name: string;
    contactPerson?: string;
    phone: string;
    email?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    paymentTerms?: string;
    rating?: number;
    categories?: string[];
    licenseNumber?: string;
    taxId?: string;
    notes?: string;
    website?: string;
    status?: SupplierStatus;
}
//# sourceMappingURL=create-supplier.dto.d.ts.map