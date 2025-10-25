import { CustomerStatus, CustomerType } from '@zarmind/shared-types';
export declare class CreateCustomerDto {
    code?: string;
    type?: CustomerType;
    status?: CustomerStatus;
    firstName?: string;
    lastName?: string;
    businessName?: string;
    phone: string;
    email?: string;
    nationalId?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    creditLimit?: number;
    notes?: string;
    birthDate?: string;
    anniversary?: string;
    tags?: string[];
    loyaltyPoints?: number;
}
//# sourceMappingURL=create-customer.dto.d.ts.map