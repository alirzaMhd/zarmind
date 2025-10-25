import { PaymentMethod } from '@zarmind/shared-types';
export declare class GeneratePayrollDto {
    employeeId: string;
    payPeriodStart: string;
    payPeriodEnd: string;
    payDate: string;
    baseSalary?: number;
    commission?: number;
    bonus?: number;
    overtime?: number;
    allowances?: number;
    tax?: number;
    insurance?: number;
    loan?: number;
    otherDeductions?: number;
    paymentMethod?: PaymentMethod;
}
//# sourceMappingURL=generate-payroll.dto.d.ts.map