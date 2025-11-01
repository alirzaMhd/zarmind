/*
  Warnings:

  - You are about to drop the column `uploadedBy` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `roleTarget` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `scannedBy` on the `qr_code_scans` table. All the data in the column will be lost.
  - You are about to drop the column `generatedBy` on the `report_cache` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,invoiceNumber]` on the table `accounts_payable` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,invoiceNumber]` on the table `accounts_receivable` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employeeId,date,branchId]` on the table `attendance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,accountNumber]` on the table `bank_accounts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,code]` on the table `branches` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,code]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,employeeCode]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,nationalId]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,name]` on the table `expense_categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,productId,branchId]` on the table `inventory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,sku]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,qrCode]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,purchaseNumber]` on the table `purchases` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,returnNumber]` on the table `returns` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,invoiceNumber]` on the table `sales` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,code]` on the table `suppliers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,key]` on the table `system_settings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,orderNumber]` on the table `work_orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,code]` on the table `workshops` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `branchId` to the `accounts_payable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `accounts_payable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branchId` to the `accounts_receivable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `accounts_receivable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `bank_accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `bank_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `branches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branchId` to the `checks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `checks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `exchange_rates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `expense_categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branchId` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `gold_prices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `installments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `inventory` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `notifications` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `userId` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `qr_code_scans` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `reminders` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `userId` to the `report_cache` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branchId` to the `returns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `returns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `sale_payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `suppliers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `system_settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branchId` to the `work_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `work_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `workshops` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_branchId_fkey";

-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_employeeId_fkey";

-- DropIndex
DROP INDEX "public"."accounts_payable_invoiceNumber_key";

-- DropIndex
DROP INDEX "public"."accounts_receivable_invoiceNumber_key";

-- DropIndex
DROP INDEX "public"."attendance_employeeId_date_key";

-- DropIndex
DROP INDEX "public"."bank_accounts_accountNumber_key";

-- DropIndex
DROP INDEX "public"."branches_code_key";

-- DropIndex
DROP INDEX "public"."customers_code_idx";

-- DropIndex
DROP INDEX "public"."customers_code_key";

-- DropIndex
DROP INDEX "public"."employees_employeeCode_idx";

-- DropIndex
DROP INDEX "public"."employees_employeeCode_key";

-- DropIndex
DROP INDEX "public"."employees_nationalId_key";

-- DropIndex
DROP INDEX "public"."exchange_rates_fromCurrency_toCurrency_effectiveDate_idx";

-- DropIndex
DROP INDEX "public"."expense_categories_name_key";

-- DropIndex
DROP INDEX "public"."gold_prices_purity_effectiveDate_idx";

-- DropIndex
DROP INDEX "public"."inventory_productId_branchId_key";

-- DropIndex
DROP INDEX "public"."products_qrCode_idx";

-- DropIndex
DROP INDEX "public"."products_qrCode_key";

-- DropIndex
DROP INDEX "public"."products_sku_idx";

-- DropIndex
DROP INDEX "public"."products_sku_key";

-- DropIndex
DROP INDEX "public"."purchases_purchaseNumber_idx";

-- DropIndex
DROP INDEX "public"."purchases_purchaseNumber_key";

-- DropIndex
DROP INDEX "public"."returns_returnNumber_idx";

-- DropIndex
DROP INDEX "public"."returns_returnNumber_key";

-- DropIndex
DROP INDEX "public"."sales_invoiceNumber_idx";

-- DropIndex
DROP INDEX "public"."sales_invoiceNumber_key";

-- DropIndex
DROP INDEX "public"."suppliers_code_idx";

-- DropIndex
DROP INDEX "public"."suppliers_code_key";

-- DropIndex
DROP INDEX "public"."system_settings_key_key";

-- DropIndex
DROP INDEX "public"."users_employeeId_key";

-- DropIndex
DROP INDEX "public"."work_orders_orderNumber_idx";

-- DropIndex
DROP INDEX "public"."work_orders_orderNumber_key";

-- DropIndex
DROP INDEX "public"."workshops_code_key";

-- AlterTable
ALTER TABLE "accounts_payable" ADD COLUMN     "branchId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "accounts_receivable" ADD COLUMN     "branchId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "bank_accounts" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "bank_transactions" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "checks" ADD COLUMN     "branchId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "uploadedBy",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "exchange_rates" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "expense_categories" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "branchId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "gold_prices" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "installments" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "inventory" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "roleTarget",
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "qr_code_scans" DROP COLUMN "scannedBy",
ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "reminders" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "report_cache" DROP COLUMN "generatedBy",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "returns" ADD COLUMN     "branchId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sale_payments" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "branchId",
DROP COLUMN "employeeId",
DROP COLUMN "role";

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "branchId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "workshops" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "public"."UserRole";

-- CreateIndex
CREATE INDEX "accounts_payable_userId_idx" ON "accounts_payable"("userId");

-- CreateIndex
CREATE INDEX "accounts_payable_branchId_idx" ON "accounts_payable"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_payable_userId_invoiceNumber_key" ON "accounts_payable"("userId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "accounts_receivable_userId_idx" ON "accounts_receivable"("userId");

-- CreateIndex
CREATE INDEX "accounts_receivable_branchId_idx" ON "accounts_receivable"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_receivable_userId_invoiceNumber_key" ON "accounts_receivable"("userId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "attendance_branchId_idx" ON "attendance"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_employeeId_date_branchId_key" ON "attendance"("employeeId", "date", "branchId");

-- CreateIndex
CREATE INDEX "audit_logs_branchId_idx" ON "audit_logs"("branchId");

-- CreateIndex
CREATE INDEX "bank_accounts_userId_idx" ON "bank_accounts"("userId");

-- CreateIndex
CREATE INDEX "bank_accounts_branchId_idx" ON "bank_accounts"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_userId_accountNumber_key" ON "bank_accounts"("userId", "accountNumber");

-- CreateIndex
CREATE INDEX "bank_transactions_userId_idx" ON "bank_transactions"("userId");

-- CreateIndex
CREATE INDEX "bank_transactions_transactionDate_idx" ON "bank_transactions"("transactionDate");

-- CreateIndex
CREATE INDEX "branches_userId_idx" ON "branches"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "branches_userId_code_key" ON "branches"("userId", "code");

-- CreateIndex
CREATE INDEX "cash_transactions_userId_idx" ON "cash_transactions"("userId");

-- CreateIndex
CREATE INDEX "checks_userId_idx" ON "checks"("userId");

-- CreateIndex
CREATE INDEX "checks_branchId_idx" ON "checks"("branchId");

-- CreateIndex
CREATE INDEX "customers_userId_idx" ON "customers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_userId_code_key" ON "customers"("userId", "code");

-- CreateIndex
CREATE INDEX "documents_userId_idx" ON "documents"("userId");

-- CreateIndex
CREATE INDEX "employees_userId_idx" ON "employees"("userId");

-- CreateIndex
CREATE INDEX "employees_branchId_idx" ON "employees"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_employeeCode_key" ON "employees"("userId", "employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_nationalId_key" ON "employees"("userId", "nationalId");

-- CreateIndex
CREATE INDEX "exchange_rates_userId_idx" ON "exchange_rates"("userId");

-- CreateIndex
CREATE INDEX "exchange_rates_userId_fromCurrency_toCurrency_effectiveDate_idx" ON "exchange_rates"("userId", "fromCurrency", "toCurrency", "effectiveDate");

-- CreateIndex
CREATE INDEX "expense_categories_userId_idx" ON "expense_categories"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_userId_name_key" ON "expense_categories"("userId", "name");

-- CreateIndex
CREATE INDEX "expenses_userId_idx" ON "expenses"("userId");

-- CreateIndex
CREATE INDEX "expenses_branchId_idx" ON "expenses"("branchId");

-- CreateIndex
CREATE INDEX "gold_prices_userId_idx" ON "gold_prices"("userId");

-- CreateIndex
CREATE INDEX "gold_prices_userId_purity_effectiveDate_idx" ON "gold_prices"("userId", "purity", "effectiveDate");

-- CreateIndex
CREATE INDEX "installments_userId_idx" ON "installments"("userId");

-- CreateIndex
CREATE INDEX "inventory_userId_idx" ON "inventory"("userId");

-- CreateIndex
CREATE INDEX "inventory_productId_idx" ON "inventory"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_userId_productId_branchId_key" ON "inventory"("userId", "productId", "branchId");

-- CreateIndex
CREATE INDEX "products_userId_idx" ON "products"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "products_userId_sku_key" ON "products"("userId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_userId_qrCode_key" ON "products"("userId", "qrCode");

-- CreateIndex
CREATE INDEX "purchases_userId_idx" ON "purchases"("userId");

-- CreateIndex
CREATE INDEX "purchases_branchId_idx" ON "purchases"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_userId_purchaseNumber_key" ON "purchases"("userId", "purchaseNumber");

-- CreateIndex
CREATE INDEX "qr_code_scans_userId_idx" ON "qr_code_scans"("userId");

-- CreateIndex
CREATE INDEX "qr_code_scans_branchId_idx" ON "qr_code_scans"("branchId");

-- CreateIndex
CREATE INDEX "report_cache_userId_idx" ON "report_cache"("userId");

-- CreateIndex
CREATE INDEX "returns_userId_idx" ON "returns"("userId");

-- CreateIndex
CREATE INDEX "returns_branchId_idx" ON "returns"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "returns_userId_returnNumber_key" ON "returns"("userId", "returnNumber");

-- CreateIndex
CREATE INDEX "sale_payments_userId_idx" ON "sale_payments"("userId");

-- CreateIndex
CREATE INDEX "sale_payments_paymentDate_idx" ON "sale_payments"("paymentDate");

-- CreateIndex
CREATE INDEX "sales_userId_idx" ON "sales"("userId");

-- CreateIndex
CREATE INDEX "sales_branchId_idx" ON "sales"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_userId_invoiceNumber_key" ON "sales"("userId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "suppliers_userId_idx" ON "suppliers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_userId_code_key" ON "suppliers"("userId", "code");

-- CreateIndex
CREATE INDEX "system_settings_userId_idx" ON "system_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_userId_key_key" ON "system_settings"("userId", "key");

-- CreateIndex
CREATE INDEX "work_orders_userId_idx" ON "work_orders"("userId");

-- CreateIndex
CREATE INDEX "work_orders_branchId_idx" ON "work_orders"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_userId_orderNumber_key" ON "work_orders"("userId", "orderNumber");

-- CreateIndex
CREATE INDEX "workshops_userId_idx" ON "workshops"("userId");

-- CreateIndex
CREATE INDEX "workshops_branchId_idx" ON "workshops"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "workshops_userId_code_key" ON "workshops"("userId", "code");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gold_prices" ADD CONSTRAINT "gold_prices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checks" ADD CONSTRAINT "checks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checks" ADD CONSTRAINT "checks_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installments" ADD CONSTRAINT "installments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshops" ADD CONSTRAINT "workshops_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshops" ADD CONSTRAINT "workshops_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cache" ADD CONSTRAINT "report_cache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_code_scans" ADD CONSTRAINT "qr_code_scans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_code_scans" ADD CONSTRAINT "qr_code_scans_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
