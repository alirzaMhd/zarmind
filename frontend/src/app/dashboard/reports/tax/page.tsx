'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import {
  Receipt,
  RefreshCw,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileBarChart,
  Calculator,
  ChevronDown,
  Scale,
  Info,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

type TaxReportData = {
  reportType: string;
  period: {
    from: string;
    to: string;
  };
  taxType: string;
  salesTaxCollected: number;
  purchasesTaxPaid: number;
  netTaxLiability: number;
  totalSales: number;
  totalPurchases: number;
};

export default function TaxReportPage() {
  const { user } = useAuthStore();
  
  // Data
  const [report, setReport] = useState<TaxReportData | null>(null);

  // Loading state
  const [loading, setLoading] = useState(true);

  // Filters
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [taxType, setTaxType] = useState<string>('VAT');

  // UI
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1); // Start of current month
    setFromDate(from.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (fromDate) {
      fetchReport();
    }
  }, [fromDate, toDate, taxType]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportButtonRef.current && !exportButtonRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: any = {
        from: fromDate || undefined,
        to: toDate || undefined,
        taxType: taxType || undefined,
        format: 'json',
      };
      const res = await api.get<TaxReportData>('/reports/tax', { params });
      setReport(res.data);
    } catch (err) {
      console.error('Failed to fetch tax report:', err);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    if (!report) return;
    const params = {
      from: fromDate,
      to: toDate,
      taxType: taxType || undefined,
    };
    const encodedParams = encodeURIComponent(JSON.stringify(params));
    const url = `/api/reports/export/tax?format=${format}&params=${encodedParams}`;
    window.open(url, '_blank');
    setExportMenuOpen(false);
  };

  const handlePrint = () => {
    setExportMenuOpen(false);
    window.print();
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const formatDate = (dateString?: string | null) =>
    !dateString
      ? '—'
      : new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateString));

  const netLiabilityStatus = report && report.netTaxLiability >= 0 
    ? {
        color: 'blue',
        text: 'پرداختنی به سازمان امور مالیاتی',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-700 dark:text-blue-300',
        borderColor: 'border-blue-500',
      } 
    : {
        color: 'purple',
        text: 'بستانکار از سازمان امور مالیاتی (اعتبار مالیاتی)',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        textColor: 'text-purple-700 dark:text-purple-300',
        borderColor: 'border-purple-500',
      };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 no-print">
          <div className="flex items-center gap-3">
            <Receipt className="h-8 w-8 text-amber-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">گزارش مالیات بر ارزش افزوده</h1>
              <p className="text-gray-600 dark:text-gray-400">محاسبه و نمایش بدهی یا طلب مالیاتی در بازه زمانی مشخص.</p>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 no-print">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">از:</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">تا:</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={fetchReport}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'بارگذاری...' : 'بروزرسانی'}</span>
              </button>
              <div className="relative" ref={exportButtonRef}>
                <button
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                  disabled={!report}
                  className="flex items-center gap-2 px-4 py-2 text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  <Printer className="h-5 w-5" />
                  <span>چاپ/خروجی</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {exportMenuOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                    <ul className="py-1">
                      <li><button onClick={handlePrint} className="w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"><Printer className="h-4 w-4" />چاپ صفحه</button></li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Report Display */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : !report ? (
          <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">داده‌ای برای نمایش وجود ندارد</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">لطفا بازه زمانی را تنظیم کرده و روی دکمه بروزرسانی کلیک کنید.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden print-no-shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">گزارش مالیات بر ارزش افزوده</h2>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                از {formatDate(report.period.from)} تا {formatDate(report.period.to)}
              </p>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              {/* Equation Visualization */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center">
                {/* Sales Tax Card */}
                <div className="flex-1 w-full p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex justify-center items-center gap-2 text-green-700 dark:text-green-300">
                    <TrendingUp className="h-6 w-6" />
                    <h3 className="text-lg font-semibold">مالیات دریافتی</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                    {formatCurrency(report.salesTaxCollected)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    (از فروش)
                  </p>
                </div>
                
                {/* Operator */}
                <span className="text-4xl font-light text-gray-400 dark:text-gray-500">-</span>

                {/* Purchases Tax Card */}
                <div className="flex-1 w-full p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex justify-center items-center gap-2 text-red-700 dark:text-red-300">
                    <TrendingDown className="h-6 w-6" />
                    <h3 className="text-lg font-semibold">مالیات پرداختی</h3>
                  </div>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                    {formatCurrency(report.purchasesTaxPaid)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    (در خرید)
                  </p>
                </div>
                
                {/* Operator */}
                <span className="text-4xl font-light text-gray-400 dark:text-gray-500">=</span>
                
                {/* Net Liability Card */}
                <div className={`flex-1 w-full p-6 rounded-lg border ${netLiabilityStatus.bgColor} ${netLiabilityStatus.borderColor}`}>
                  <div className={`flex justify-center items-center gap-2 ${netLiabilityStatus.textColor}`}>
                    <Scale className="h-6 w-6" />
                    <h3 className="text-lg font-semibold">تعهد خالص</h3>
                  </div>
                  <p className={`text-2xl font-bold mt-2 ${netLiabilityStatus.textColor}`}>
                    {formatCurrency(report.netTaxLiability)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    (بدهی/طلب)
                  </p>
                </div>
              </div>
              
              {/* Summary Box */}
              <div className={`p-6 rounded-lg border-2 ${netLiabilityStatus.bgColor} ${netLiabilityStatus.borderColor}`}>
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
                  <Info className={`h-10 w-10 shrink-0 ${netLiabilityStatus.textColor}`} />
                  <div className="text-right">
                    <h3 className={`text-xl font-bold ${netLiabilityStatus.textColor}`}>
                      {formatCurrency(report.netTaxLiability)}
                    </h3>
                    <p className="text-md text-gray-800 dark:text-gray-200">
                      {netLiabilityStatus.text}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details Table */}
              <div className="overflow-x-auto pt-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">جزئیات محاسبات</h3>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">شرح</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">مبلغ کل</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">مبلغ مالیات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">جمع فروش دوره</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{formatCurrency(report.totalSales)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600 dark:text-green-400 font-semibold">{formatCurrency(report.salesTaxCollected)}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">جمع خرید دوره</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{formatCurrency(report.totalPurchases)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-600 dark:text-red-400 font-semibold">{formatCurrency(report.purchasesTaxPaid)}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-gray-100 dark:bg-gray-900">
                    <tr className="font-bold">
                      <td className="px-6 py-4 text-right text-sm text-gray-900 dark:text-white">خالص تعهد مالیاتی</td>
                      <td className="px-6 py-4"></td>
                      <td className={`px-6 py-4 text-center text-lg font-extrabold ${netLiabilityStatus.textColor}`}>
                        {formatCurrency(report.netTaxLiability)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}