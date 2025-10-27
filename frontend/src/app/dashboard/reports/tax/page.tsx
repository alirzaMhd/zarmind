'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import {
  Receipt,
  RefreshCw,
  Printer,
  Calendar,
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileBarChart,
  Calculator,
  ChevronDown,
  Scale,
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
    const from = new Date(today);
    from.setDate(today.getDate() - 30);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 no-print">
          <div className="flex items-center gap-3">
            <Receipt className="h-8 w-8 text-amber-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">گزارش مالیات</h1>
              <p className="text-gray-600 dark:text-gray-400">محاسبه مالیات بر ارزش افزوده (مالیات پرداختی و دریافتی).</p>
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

              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">نوع مالیات:</label>
                <input
                  type="text"
                  value={taxType}
                  onChange={(e) => setTaxType(e.target.value)}
                  className="px-3 py-1 w-24 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
          <div className="flex items-center justify-center h-64">
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
              <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">گزارش مالیات ({report.taxType})</h2>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                بازه زمانی: {formatDate(report.period.from)} تا {formatDate(report.period.to)}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Sales Tax */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    مالیات دریافتی (از فروش)
                  </h3>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(report.salesTaxCollected)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mr-8 mt-1">
                  از مجموع فروش: {formatCurrency(report.totalSales)}
                </p>
              </div>

              {/* Purchases Tax */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    مالیات پرداختی (در خرید)
                  </h3>
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">
                    -{formatCurrency(report.purchasesTaxPaid)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mr-8 mt-1">
                  از مجموع خرید: {formatCurrency(report.totalPurchases)}
                </p>
              </div>

              {/* Net Tax Liability */}
              <div className={`flex justify-between items-center text-2xl p-6 rounded-lg border-t-2 ${report.netTaxLiability >= 0 ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500' : 'bg-red-100 dark:bg-red-900/30 border-red-500'}`}>
                <span className="font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <Scale className="h-6 w-6" />
                  بدهی/طلب خالص مالیاتی
                </span>
                <div className="text-left">
                  <span className={`font-extrabold ${report.netTaxLiability >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
                    {formatCurrency(report.netTaxLiability)}
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {report.netTaxLiability >= 0 ? 'پرداختنی به سازمان امور مالیاتی' : 'طلب از سازمان امور مالیاتی'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}