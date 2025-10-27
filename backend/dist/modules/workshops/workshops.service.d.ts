import { PrismaService } from '../../core/database/prisma.service';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { WorkshopStatus } from '@zarmind/shared-types';
type PagedResult<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
};
export declare class WorkshopsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    findAll(params: {
        page: number;
        limit: number;
        search?: string;
        status?: WorkshopStatus;
        city?: string;
        specialization?: string;
        minRating?: number;
        maxRating?: number;
        sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'rating' | 'code';
        sortOrder?: 'asc' | 'desc';
    }): Promise<PagedResult<any>>;
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
    updateRating(id: string, rating: number, notes?: string): Promise<{
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
    getSummary(): Promise<{
        totalWorkshops: any;
        byStatus: any;
        bySpecialization: {
            specialization: string;
            count: number;
        }[];
        topWorkshops: any;
    }>;
    addPerformanceReview(id: string, data: {
        qualityRating?: number;
        timelinessRating?: number;
        costRating?: number;
        communicationRating?: number;
        notes?: string;
        reviewDate?: string;
    }): Promise<{
        success: boolean;
        message: string;
        review: {
            date: string;
            qualityRating: number | undefined;
            timelinessRating: number | undefined;
            costRating: number | undefined;
            communicationRating: number | undefined;
            averageRating: number | null;
            notes: string;
        };
    }>;
    getPerformanceHistory(id: string): Promise<{
        workshopId: string;
        workshopName: any;
        totalReviews: number;
        reviews: any[];
    }>;
    private getPerformanceFromNotes;
    private serializePerformanceToNotes;
    updatePerformanceReview(id: string, index: number, data: {
        qualityRating?: number;
        timelinessRating?: number;
        costRating?: number;
        communicationRating?: number;
        notes?: string;
        reviewDate?: string;
    }): Promise<{
        success: boolean;
        message: string;
        review: any;
    }>;
    deletePerformanceReview(id: string, index: number): Promise<{
        success: boolean;
        message: string;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private generateWorkshopCode;
    private parseDateRange;
    private decimalToNumber;
    private mapWorkshop;
}
export {};
//# sourceMappingURL=workshops.service.d.ts.map