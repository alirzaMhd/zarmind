import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
export declare class BranchesController {
    private readonly service;
    constructor(service: BranchesService);
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
    findAll(page?: string, limit?: string, search?: string, isActive?: string, city?: string, sortBy?: 'createdAt' | 'name' | 'code', sortOrder?: 'asc' | 'desc'): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
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
    activate(id: string): Promise<{
        success: boolean;
        message: string;
        isActive: any;
    }>;
    deactivate(id: string): Promise<{
        success: boolean;
        message: string;
        isActive: any;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private toPosInt;
}
//# sourceMappingURL=branches.controller.d.ts.map