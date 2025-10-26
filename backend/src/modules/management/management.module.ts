import { Module } from '@nestjs/common';
import { BranchesModule } from './branches/branches.module';

@Module({
  imports: [BranchesModule],
  exports: [BranchesModule],
})
export class ManagementModule {}