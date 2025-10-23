import { Module } from '@nestjs/common';
import { ApModule } from './submodules/accounts-payable/ap.module';
import { ArModule } from './submodules/accounts-receivable/ar.module';
import { BankAccountsModule } from './submodules/bank-accounts/bank-accounts.module';
import { CashModule } from './submodules/cash/cash.module';
import { ChecksModule } from './submodules/checks/checks.module';
import { ExpensesModule } from './submodules/expenses/expenses.module';

@Module({
  imports: [
    ApModule,
    ArModule,
    BankAccountsModule,
    CashModule,
    ChecksModule,
    ExpensesModule,
  ],
  exports: [
    ApModule,
    ArModule,
    BankAccountsModule,
    CashModule,
    ChecksModule,
    ExpensesModule,
  ],
})
export class FinancialsModule {}