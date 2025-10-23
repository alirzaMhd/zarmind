import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/guards/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  // Profit & Loss Statement
  @Get('profit-loss')
  async getProfitLoss(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
    @Query('format') format?: 'json' | 'pdf' | 'excel',
  ) {
    this.validateDateRange(from, to);
    return this.service.getProfitLossReport(from, to, branchId, format);
  }

  // Balance Sheet
  @Get('balance-sheet')
  async getBalanceSheet(
    @Query('asOf') asOf?: string,
    @Query('branchId') branchId?: string,
    @Query('format') format?: 'json' | 'pdf' | 'excel',
  ) {
    return this.service.getBalanceSheetReport(asOf, branchId, format);
  }

  // Inventory Valuation Report
  @Get('inventory-valuation')
  async getInventoryValuation(
    @Query('asOf') asOf?: string,
    @Query('branchId') branchId?: string,
    @Query('category') category?: string,
    @Query('format') format?: 'json' | 'pdf' | 'excel',
  ) {
    return this.service.getInventoryValuationReport(asOf, branchId, category, format);
  }

  // Sales Report
  @Get('sales')
  async getSalesReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
    @Query('userId') userId?: string,
    @Query('customerId') customerId?: string,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month' | 'product' | 'customer' | 'user',
    @Query('format') format?: 'json' | 'pdf' | 'excel',
  ) {
    this.validateDateRange(from, to);
    return this.service.getSalesReport(from, to, branchId, userId, customerId, groupBy, format);
  }

  // Purchase Report
  @Get('purchases')
  async getPurchasesReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('format') format?: 'json' | 'pdf' | 'excel',
  ) {
    this.validateDateRange(from, to);
    return this.service.getPurchasesReport(from, to, branchId, supplierId, format);
  }

  // Cash Flow Statement
  @Get('cash-flow')
  async getCashFlow(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
    @Query('format') format?: 'json' | 'pdf' | 'excel',
  ) {
    this.validateDateRange(from, to);
    return this.service.getCashFlowReport(from, to, branchId, format);
  }

  // Accounts Receivable Aging Report
  @Get('ar-aging')
  async getARAgingReport(
    @Query('asOf') asOf?: string,
    @Query('customerId') customerId?: string,
    @Query('format') format?: 'json' | 'pdf' | 'excel',
  ) {
    return this.service.getARAgingReport(asOf, customerId, format);
  }

  // Accounts Payable Aging Report
  @Get('ap-aging')
  async getAPAgingReport(
    @Query('asOf') asOf?: string,
    @Query('supplierId') supplierId?: string,
    @Query('format') format?: 'json' | 'pdf' | 'excel',
  ) {
    return this.service.getAPAgingReport(asOf, supplierId, format);
  }

  // Tax Report
  @Get('tax')
  async getTaxReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('taxType') taxType?: string,
    @Query('format') format?: 'json' | 'pdf' | 'excel',
  ) {
    this.validateDateRange(from, to);
    return this.service.getTaxReport(from, to, taxType, format);
  }

  // Employee Performance Report
  @Get('employee-performance')
  async getEmployeePerformance(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('employeeId') employeeId?: string,
    @Query('branchId') branchId?: string,
    @Query('format') format?: 'json' | 'pdf' | 'excel',
  ) {
    this.validateDateRange(from, to);
    return this.service.getEmployeePerformanceReport(from, to, employeeId, branchId, format);
  }

  // Customer Transaction History
  @Get('customer-transactions')
  async getCustomerTransactions(
    @Query('customerId') customerId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('format') format?: 'json' | 'pdf' | 'excel',
  ) {
    if (!customerId) {
      throw new BadRequestException('customerId is required');
    }
    return this.service.getCustomerTransactionsReport(customerId, from, to, format);
  }

  // Product Movement Report
  @Get('product-movement')
  async getProductMovement(
    @Query('productId') productId?: string,
    @Query('category') category?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
    @Query('format') format?: 'json' | 'pdf' | 'excel',
  ) {
    return this.service.getProductMovementReport(productId, category, from, to, branchId, format);
  }

  // Gold Price Impact Report
  @Get('gold-price-impact')
  async getGoldPriceImpact(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('format') format?: 'json' | 'pdf' | 'excel',
  ) {
    this.validateDateRange(from, to);
    return this.service.getGoldPriceImpactReport(from, to, format);
  }

  // Workshop Performance Report
  @Get('workshop-performance')
  async getWorkshopPerformance(
    @Query('workshopId') workshopId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('format') format?: 'json' | 'pdf' | 'excel',
  ) {
    return this.service.getWorkshopPerformanceReport(workshopId, from, to, format);
  }

  // Custom Report Builder
  @Get('custom')
  async getCustomReport(
    @Query('reportId') reportId?: string,
    @Query('params') params?: string, // JSON string of parameters
    @Query('format') format?: 'json' | 'pdf' | 'excel',
  ) {
    if (!reportId) {
      throw new BadRequestException('reportId is required');
    }
    const parsedParams = params ? JSON.parse(params) : {};
    return this.service.getCustomReport(reportId, parsedParams, format);
  }

  // Export Report
  @Get('export/:reportType')
  async exportReport(
    @Query('format') format: 'pdf' | 'excel' | 'csv',
    @Query('params') params?: string,
    @Res() res?: Response,
  ) {
    if (!format) {
      throw new BadRequestException('format is required (pdf, excel, or csv)');
    }
    const parsedParams = params ? JSON.parse(params) : {};
    return this.service.exportReport(format, parsedParams, res);
  }

  // Helper method
  private validateDateRange(from?: string, to?: string) {
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw new BadRequestException('Invalid date format');
      }
      if (fromDate > toDate) {
        throw new BadRequestException('from date must be before to date');
      }
    }
  }
}