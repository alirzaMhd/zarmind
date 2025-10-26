import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
type PagedResult<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
};
export declare class BranchesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateBranchDto): Promise<{
        id: any;
        name: any;
        code: any;
        address: any;
        city: any;
        phone: any;
        email: any;
        isActive: any;
        isMainBranch: any;
        _count: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findAll(params: {
        page: number;
        limit: number;
        search?: string;
        isActive?: boolean;
        city?: string;
        sortBy?: 'createdAt' | 'name' | 'code';
        sortOrder?: 'asc' | 'desc';
    }): Promise<PagedResult<any>>;
    findOne(id: string): Promise<{
        id: any;
        name: any;
        code: any;
        address: any;
        city: any;
        phone: any;
        email: any;
        isActive: any;
        isMainBranch: any;
        _count: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, dto: UpdateBranchDto): Promise<{
        id: any;
        name: any;
        code: any;
        address: any;
        city: any;
        phone: any;
        email: any;
        isActive: any;
        isMainBranch: any;
        _count: any;
        createdAt: any;
        updatedAt: any;
    }>;
    toggleActive(id: string, isActive: boolean): Promise<{
        success: boolean;
        message: string;
        isActive: any;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getSummary(): Promise<{
        total: any;
        active: any;
        inactive: any;
        mainBranch: {
            id: any;
            name: any;
            code: any;
            address: any;
            city: any;
            phone: any;
            email: any;
            isActive: any;
            isMainBranch: any;
            _count: any;
            createdAt: any;
            updatedAt: any;
        } | null;
        byCity: any;
    }>;
    private mapBranch;
}
export {};
//# sourceMappingURL=branches.service.d.ts.map