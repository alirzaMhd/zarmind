import { Module } from '@nestjs/common';
import { BranchesModule } from './submodules/branches/branches.module';

@Module({
  imports: [BranchesModule],
  exports: [BranchesModule],
})
export class ManagementModule {}