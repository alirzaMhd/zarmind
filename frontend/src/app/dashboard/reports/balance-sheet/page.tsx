'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import {
  FileBarChart,
  RefreshCw,
  Printer,
  Calendar,
  Building2,
  DollarSign,
  Landmark,
  Package,
  ArrowRightLeft,
  Book,
  Scale,
  Shield,
  CreditCard,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

type Branch = {
  id: string;
  name: string;
  code: string;
};

type BalanceSheetData = {
  reportType: string;
  asOf: string;
  branchId: string;
  assets: {
    cash: number;
    bankAccounts: number;
    accountsReceivable: number;
    inventory: number;
    total: number;
  };
  liabilities: {
    accountsPayable: number;
    total: number;
  };
  equity: {
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
};

export default function BalanceSheetPage() {
  const { user } = useAuthStore();
  
  // Data
  const [report, setReport] = useState<BalanceSheetData | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Loading state
  const [loading, setLoading] = useState(true);

  // Filters
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportButtonRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
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
    fetchReport();
  }, [asOfDate, selectedBranchId]);

  // New useEffect to handle clicks outside the menu
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

  // New handlers
  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    if (!report) return;

    const params = {
      asOf: asOfDate,
      branchId: selectedBranchId || undefined,
    };
    
    // We need to encode the params object to be used in a URL
    const encodedParams = encodeURIComponent(JSON.stringify(params));

    // Construct the URL to the backend export endpoint
    const url = `/api/reports/export/balance-sheet?format=${format}&params=${encodedParams}`;
    
    // Open the URL in a new tab to trigger the download
    window.open(url, '_blank');
    setExportMenuOpen(false);
  };

  const handlePrint = () => {
    setExportMenuOpen(false);
    window.print();
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: any = {
        asOf: asOfDate || undefined,
        branchId: selectedBranchId || undefined,
        format: 'json',
      };
      const res = await api.get<BalanceSheetData>('/reports/balance-sheet', { params });
      setReport(res.data);
    } catch (err) {
      console.error('Failed to fetch balance sheet report:', err);
      setReport(null);
    } finally {
      setLoading(false);
    }
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
            <FileBarChart className="h-8 w-8 text-amber-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">گزارش ترازنامه</h1>
              <p className="text-gray-600 dark:text-gray-400">نمایش وضعیت دارایی‌ها، بدهی‌ها و حقوق صاحبان سهام.</p>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 no-print">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              {/* As Of Date */}
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  تا تاریخ:
                </label>
                <input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Branch Filter */}
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  شعبه:
                </label>
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
                        <button
                          onClick={handlePrint}
                          className="w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
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
              لطفا فیلترها را تنظیم کرده و روی دکمه بروزرسانی کلیک کنید.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden print-no-shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">
                ترازنامه
              </h2>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                تا تاریخ {formatDate(report.asOf)} | شعبه: {branches.find(b => b.id === report.branchId)?.name || 'همه'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200 dark:bg-gray-700">
              {/* Assets Section */}
              <div className="bg-white dark:bg-gray-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Book className="h-5 w-5 text-green-500" />
                    دارایی‌ها
                  </h3>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(report.assets.total)}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      نقدی
                    </span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(report.assets.cash)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Landmark className="h-4 w-4 text-gray-400" />
                      حساب‌های بانکی
                    </span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(report.assets.bankAccounts)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                      حساب‌های دریافتنی
                    </span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(report.assets.accountsReceivable)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Package className="h-4 w-4 text-gray-400" />
                      موجودی کالا
                    </span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(report.assets.inventory)}</span>
                  </div>
                </div>
              </div>

              {/* Liabilities and Equity Section */}
              <div className="bg-white dark:bg-gray-800 p-6">
                <div className="space-y-6">
                  {/* Liabilities */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-red-500" />
                        بدهی‌ها
                      </h3>
                      <div className="text-lg font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(report.liabilities.total)}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <ArrowRightLeft className="h-4 w-4 text-gray-400" />
                          حساب‌های پرداختنی
                        </span>
                        <span className="text-gray-900 dark:text-white">{formatCurrency(report.liabilities.accountsPayable)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Equity */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-500" />
                        حقوق صاحبان سهام
                      </h3>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(report.equity.totalEquity)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Row */}
            <div className="p-6 bg-gray-100 dark:bg-gray-800 border-t-2 border-amber-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-md font-bold text-gray-900 dark:text-white">
                    جمع دارایی‌ها
                  </span>
                  <span className="text-md font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(report.assets.total)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-md font-bold text-gray-900 dark:text-white">
                    جمع بدهی‌ها و حقوق صاحبان سهام
                  </span>
                  <span className="text-md font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Scale className="h-4 w-4 text-amber-500" />
                    {formatCurrency(report.totalLiabilitiesAndEquity)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}