'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import {
  Calculator,
  RefreshCw,
  Printer,
  Calendar,
  Building2,
  Package,
  DollarSign,
  TrendingUp,
  FileBarChart,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

type Branch = {
  id: string;
  name: string;
  code: string;
};

const PRODUCT_CATEGORIES = [
  { value: '', label: 'همه دسته‌بندی‌ها' },
  { value: 'RAW_GOLD', label: 'طلای خام' },
  { value: 'MANUFACTURED_PRODUCT', label: 'محصول ساخته‌شده' },
  { value: 'STONE', label: 'سنگ' },
  { value: 'COIN', label: 'سکه' },
  { value: 'CURRENCY', label: 'ارز' },
  { value: 'GENERAL_GOODS', label: 'کالای عمومی' },
];

type CategoryValuation = {
  category: string;
  count: number;
  quantity: number;
  totalWeight: number;
  purchaseValue: number;
  sellingValue: number;
  potentialProfit: number;
};

type InventoryValuationData = {
  reportType: string;
  asOf: string;
  branchId: string;
  category: string;
  totalPurchaseValue: number;
  totalSellingValue: number;
  totalPotentialProfit: number;
  byCategory: CategoryValuation[];
};

export default function InventoryValuationPage() {
  const { user } = useAuthStore();
  
  // Data
  const [report, setReport] = useState<InventoryValuationData | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Loading state
  const [loading, setLoading] = useState(true);

  // Filters
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // UI
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
  }, [asOfDate, selectedBranchId, selectedCategory]);
  
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
        asOf: asOfDate || undefined,
        branchId: selectedBranchId || undefined,
        category: selectedCategory || undefined,
        format: 'json',
      };
      const res = await api.get<InventoryValuationData>('/reports/inventory-valuation', { params });
      setReport(res.data);
    } catch (err) {
      console.error('Failed to fetch inventory valuation report:', err);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    if (!report) return;
    const params = {
      asOf: asOfDate,
      branchId: selectedBranchId || undefined,
      category: selectedCategory || undefined,
    };
    const encodedParams = encodeURIComponent(JSON.stringify(params));
    const url = `/api/reports/export/inventory-valuation?format=${format}&params=${encodedParams}`;
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

  const formatNumber = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('fa-IR').format(value);
  };

  const formatDate = (dateString?: string | null) =>
    !dateString
      ? '—'
      : new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateString));

  const getCategoryLabel = (categoryValue: string) => {
    return PRODUCT_CATEGORIES.find(c => c.value === categoryValue)?.label || categoryValue;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 no-print">
          <div className="flex items-center gap-3">
            <Calculator className="h-8 w-8 text-amber-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">گزارش ارزش‌گذاری موجودی</h1>
              <p className="text-gray-600 dark:text-gray-400">نمایش ارزش خرید، فروش و سود بالقوه موجودی کالا.</p>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 no-print">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">تا تاریخ:</label>
                <input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
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

              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">دسته‌بندی:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
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
                      <li><button onClick={handlePrint} className="w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"><Printer className="h-4 w-4" />چاپ صفحه</button></li>
                      <li><button onClick={() => handleExport('pdf')} className="w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"><FileBarChart className="h-4 w-4" />خروجی PDF</button></li>
                      <li><button onClick={() => handleExport('excel')} className="w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"><Calculator className="h-4 w-4" />خروجی Excel</button></li>
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
            <p className="text-gray-500 dark:text-gray-400 mt-2">لطفا فیلترها را تنظیم کرده و روی دکمه بروزرسانی کلیک کنید.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden print-no-shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">گزارش ارزش‌گذاری موجودی</h2>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                تا تاریخ {formatDate(report.asOf)} | شعبه: {branches.find(b => b.id === report.branchId)?.name || 'همه'} | دسته‌بندی: {getCategoryLabel(report.category)}
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-200 dark:bg-gray-700">
              <div className="bg-white dark:bg-gray-800 p-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  ارزش خرید کل
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatCurrency(report.totalPurchaseValue)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  ارزش فروش کل
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatCurrency(report.totalSellingValue)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  سود بالقوه کل
                </p>
                <p className={`text-2xl font-bold mt-2 ${report.totalPotentialProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(report.totalPotentialProfit)}
                </p>
              </div>
            </div>

            {/* Details Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">دسته‌بندی</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">تعداد اقلام</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">تعداد کل</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ارزش خرید</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ارزش فروش</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">سود بالقوه</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {report.byCategory.map((item) => (
                    <tr key={item.category}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {getCategoryLabel(item.category)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{formatNumber(item.count)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{formatNumber(item.quantity)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{formatCurrency(item.purchaseValue)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{formatCurrency(item.sellingValue)}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-semibold ${item.potentialProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(item.potentialProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 dark:bg-gray-700">
                  <tr className="font-bold">
                    <td className="px-6 py-3 text-right text-sm text-gray-900 dark:text-white">جمع کل</td>
                    <td className="px-6 py-3 text-center text-sm text-gray-900 dark:text-white">{formatNumber(report.byCategory.reduce((sum, i) => sum + i.count, 0))}</td>
                    <td className="px-6 py-3 text-center text-sm text-gray-900 dark:text-white">{formatNumber(report.byCategory.reduce((sum, i) => sum + i.quantity, 0))}</td>
                    <td className="px-6 py-3 text-center text-sm text-gray-900 dark:text-white">{formatCurrency(report.totalPurchaseValue)}</td>
                    <td className="px-6 py-3 text-center text-sm text-gray-900 dark:text-white">{formatCurrency(report.totalSellingValue)}</td>
                    <td className={`px-6 py-3 text-center text-sm font-extrabold ${report.totalPotentialProfit >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      {formatCurrency(report.totalPotentialProfit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}