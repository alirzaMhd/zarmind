'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import {
  TrendingUp,
  RefreshCw,
  Printer,
  Calendar,
  Building2,
  DollarSign,
  ShoppingCart,
  Receipt,
  FileBarChart,
  Calculator,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

type Branch = {
  id: string;
  name: string;
  code: string;
};

type ProfitLossData = {
  reportType: string;
  period: {
    from: string;
    to: string;
  };
  branchId: string;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  grossProfitMargin: number;
  operatingExpenses: number;
  netProfit: number;
  netProfitMargin: number;
  details: {
    salesSubtotal: number;
    salesTax: number;
    salesDiscount: number;
    purchasesSubtotal: number;
    purchasesTax: number;
  };
};

export default function ProfitLossPage() {
  const { user } = useAuthStore();
  
  // Data
  const [report, setReport] = useState<ProfitLossData | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Loading state
  const [loading, setLoading] = useState(true);

  // Filters
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // UI
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Default to last 30 days
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 30);
    setFromDate(from.toISOString().split('T')[0]);

    fetchBranches();
  }, []);

  useEffect(() => {
    if (user?.branchId) {
      setSelectedBranchId(user.branchId);
    } else if (branches.length > 0) {
      setSelectedBranchId(''); // Default to "All"
    }
  }, [user, branches]);

  useEffect(() => {
    // Fetch report only when fromDate is set
    if (fromDate) {
      fetchReport();
    }
  }, [fromDate, toDate, selectedBranchId]);
  
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

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches', { params: { limit: 100, isActive: true } });
      const list = res.data?.items || res.data || [];
      setBranches(list);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: any = {
        from: fromDate || undefined,
        to: toDate || undefined,
        branchId: selectedBranchId || undefined,
        format: 'json',
      };
      const res = await api.get<ProfitLossData>('/reports/profit-loss', { params });
      setReport(res.data);
    } catch (err) {
      console.error('Failed to fetch profit & loss report:', err);
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
      branchId: selectedBranchId || undefined,
    };
    
    const encodedParams = encodeURIComponent(JSON.stringify(params));
    const url = `/api/reports/export/profit-loss?format=${format}&params=${encodedParams}`;
    
    window.open(url, '_blank');
    setExportMenuOpen(false);
  };

  const handlePrint = () => {
    setExportMenuOpen(false);
    window.print();
  };

  const formatCurrency = (amount: number | undefined, options: { sign?: boolean } = {}) => {
    if (amount === undefined) return 'N/A';
    const sign = options.sign && amount > 0 ? '+' : '';
    return sign + new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const formatPercent = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return `% ${new Intl.NumberFormat('fa-IR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
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
            <TrendingUp className="h-8 w-8 text-amber-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">گزارش سود و زیان</h1>
              <p className="text-gray-600 dark:text-gray-400">نمایش درآمدها، هزینه‌ها و سود خالص در یک بازه زمانی.</p>
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
                <Building2 className="h-5 w-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">شعبه:</label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">همه شعبات</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
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
                      <li>
                        <button onClick={handlePrint} className="w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                          <Printer className="h-4 w-4" />
                          چاپ صفحه
                        </button>
                      </li>
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
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
              داده‌ای برای نمایش وجود ندارد
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              لطفا بازه زمانی را تنظیم کرده و روی دکمه بروزرسانی کلیک کنید.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden print-no-shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">
                صورت سود و زیان
              </h2>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                بازه زمانی: {formatDate(report.period.from)} تا {formatDate(report.period.to)}
              </p>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                شعبه: {branches.find(b => b.id === report.branchId)?.name || 'همه'}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Revenue */}
              <div className="flex justify-between items-center text-lg">
                <span className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  درآمد
                </span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(report.revenue, { sign: true })}
                </span>
              </div>
              <div className="mr-8 space-y-2 text-sm border-r-2 border-gray-200 dark:border-gray-600 pr-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">فروش</span>
                  <span>{formatCurrency(report.details.salesSubtotal)}</span>
                </div>
                {report.details.salesDiscount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">تخفیف فروش</span>
                    <span className="text-purple-600 dark:text-purple-400">-{formatCurrency(report.details.salesDiscount)}</span>
                  </div>
                )}
              </div>
              <hr className="dark:border-gray-700" />

              {/* COGS */}
              <div className="flex justify-between items-center text-lg">
                <span className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                  <ShoppingCart className="h-5 w-5 text-red-500" />
                  بهای تمام شده کالای فروش رفته (COGS)
                </span>
                <span className="font-bold text-red-600 dark:text-red-400">
                  -{formatCurrency(report.costOfGoodsSold)}
                </span>
              </div>
              <hr className="dark:border-gray-700" />

              {/* Gross Profit */}
              <div className={`flex justify-between items-center text-xl p-3 rounded-lg ${report.grossProfit >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                <span className="font-bold text-gray-900 dark:text-white">سود ناخالص</span>
                <div className="text-right">
                  <span className={`font-bold ${report.grossProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(report.grossProfit, { sign: true })}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    حاشیه سود ناخالص: {formatPercent(report.grossProfitMargin)}
                  </div>
                </div>
              </div>
              <hr className="dark:border-gray-700" />

              {/* Operating Expenses */}
              <div className="flex justify-between items-center text-lg">
                <span className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                  <Receipt className="h-5 w-5 text-red-500" />
                  هزینه‌های عملیاتی
                </span>
                <span className="font-bold text-red-600 dark:text-red-400">
                  -{formatCurrency(report.operatingExpenses)}
                </span>
              </div>
              <hr className="dark:border-gray-700" />

              {/* Net Profit */}
              <div className={`flex justify-between items-center text-2xl p-4 rounded-lg border-t-2 ${report.netProfit >= 0 ? 'bg-green-100 dark:bg-green-900/30 border-green-500' : 'bg-red-100 dark:bg-red-900/30 border-red-500'}`}>
                <span className="font-extrabold text-gray-900 dark:text-white">سود خالص</span>
                <div className="text-right">
                  <span className={`font-extrabold ${report.netProfit >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {formatCurrency(report.netProfit, { sign: true })}
                  </span>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    حاشیه سود خالص: {formatPercent(report.netProfitMargin)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}