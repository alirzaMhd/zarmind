import { WorkshopsService } from './workshops.service';
import { WorkshopStatus } from '@zarmind/shared-types';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
export declare class WorkshopsController {
    private readonly service;
    constructor(service: WorkshopsService);
    create(dto: CreateWorkshopDto): Promise<{
        id: any;
        code: any;
        name: any;
        contactPerson: any;
        phone: any;
        email: any;
        address: any;
        city: any;
        status: any;
        specialization: any;
        rating: any;
        paymentTerms: any;
        notes: any;
        createdAt: any;
        updatedAt: any;
        workOrders: any;
    }>;
    findAll(page?: string, limit?: string, search?: string, status?: WorkshopStatus, city?: string, specialization?: string, minRating?: string, maxRating?: string, sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'rating' | 'code', sortOrder?: 'asc' | 'desc'): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    getSummary(): Promise<{
        totalWorkshops: any;
        byStatus: any;
        bySpecialization: {
            specialization: string;
            count: number;
        }[];
        topWorkshops: any;
    }>;
    findOne(id: string): Promise<{
        id: any;
        code: any;
        name: any;
        contactPerson: any;
        phone: any;
        email: any;
        address: any;
        city: any;
        status: any;
        specialization: any;
        rating: any;
        paymentTerms: any;
        notes: any;
        createdAt: any;
        updatedAt: any;
        workOrders: any;
    }>;
    update(id: string, dto: UpdateWorkshopDto): Promise<{
        id: any;
        code: any;
        name: any;
        contactPerson: any;
        phone: any;
        email: any;
        address: any;
        city: any;
        status: any;
        specialization: any;
        rating: any;
        paymentTerms: any;
        notes: any;
        createdAt: any;
        updatedAt: any;
        workOrders: any;
    }>;
    updateRating(id: string, body: {
        rating: number;
        notes?: string;
    }): Promise<{
        success: boolean;
        message: string;
        workshopId: string;
        rating: number;
        notes: string | undefined;
    }>;
    getWorkOrders(id: string, status?: string, from?: string, to?: string): Promise<{
        workshopId: string;
        period: {
            from: string;
            to: string;
        };
        totalOrders: any;
        workOrders: any;
    }>;
    getPerformance(id: string, from?: string, to?: string): Promise<{
        workshopId: string;
        workshopName: any;
        period: {
            from: string;
            to: string;
        };
        totalOrders: any;
        completedOrders: any;
        completionRate: number;
        totalCost: number;
        averageQualityRating: number | null;
        rating: any;
        specialization: any;
        paymentTerms: any;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private toPosInt;
}
//# sourceMappingURL=workshops.controller.d.ts.map