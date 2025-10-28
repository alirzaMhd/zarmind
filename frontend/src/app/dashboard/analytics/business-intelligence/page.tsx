'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  BarChart3,
  TrendingUp,
  RefreshCw,
  Calendar,
  Building2,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

// Types
type Branch = {
  id: string;
  name: string;
  code: string;
};

type DashboardSummary = {
  today: {
    sales: { count: number; total: number };
    purchases: { count: number; total: number };
    cashFlow: number;
  };
  month: {
    revenue: number;
  };
  totals: {
    activeCustomers: number;
    pendingOrders: number;
    lowStockCount: number;
    inventoryValue: number;
    cashOnHand: number;
  };
};

type SalesTrendPoint = {
  key: string;
  value: number;
};

type SalesTrendData = {
  range: { from: string; to: string };
  granularity: 'day' | 'week' | 'month';
  total: number;
  points: SalesTrendPoint[];
};

type TopProduct = {
  productId: string;
  name: string;
  sku: string | null;
  category: string;
  qty: number;
  revenue: number;
};

type TopProductsData = {
  range: { from: string; to: string };
  totalProducts: number;
  top: TopProduct[];
};

type FinancialKPI = {
  range: { from: string; to: string };
  revenue: number;
  purchases: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
  grossProfitMargin: number | null;
  netProfitMargin: number | null;
  operatingCashFlow: number;
  currentRatio: number | null;
  quickRatio: number | null;
  workingCapital: number;
};

export default function BusinessIntelligencePage() {
  const { user } = useAuthStore();

  // State
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrendData | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductsData | null>(null);
  const [financialKPI, setFinancialKPI] = useState<FinancialKPI | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Filters
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  useEffect(() => {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    setFromDate(from.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (user?.branchId) {
      setSelectedBranchId(user.branchId);
    }
  }, [user, branches]);

  useEffect(() => {
    if (fromDate && toDate) {
      fetchAllData();
    }
  }, [fromDate, toDate, granularity, selectedBranchId]);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches', { params: { limit: 100, isActive: true } });
      const list = res.data?.items || res.data || [];
      setBranches(list);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDashboardSummary(),
        fetchSalesTrend(),
        fetchTopProducts(),
        fetchFinancialKPI(),
      ]);
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardSummary = async () => {
    try {
      const params: any = {
        branchId: selectedBranchId || undefined,
      };
      const res = await api.get<DashboardSummary>('/analytics/dashboard', { params });
      setDashboardData(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard summary:', err);
      setDashboardData(null);
    }
  };

  const fetchSalesTrend = async () => {
    try {
      const params: any = {
        from: fromDate,
        to: toDate,
        granularity,
        branchId: selectedBranchId || undefined,
      };
      const res = await api.get<SalesTrendData>('/analytics/sales-trend', { params });
      setSalesTrend(res.data);
    } catch (err) {
      console.error('Failed to fetch sales trend:', err);
      setSalesTrend(null);
    }
  };

  const fetchTopProducts = async () => {
    try {
      const params: any = {
        from: fromDate,
        to: toDate,
        limit: 10,
        branchId: selectedBranchId || undefined,
      };
      const res = await api.get<TopProductsData>('/analytics/top-products', { params });
      setTopProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch top products:', err);
      setTopProducts(null);
    }
  };

  const fetchFinancialKPI = async () => {
    try {
      const params: any = {
        from: fromDate,
        to: toDate,
        branchId: selectedBranchId || undefined,
      };
      const res = await api.get<FinancialKPI>('/analytics/financial-kpi', { params });
      setFinancialKPI(res.data);
    } catch (err) {
      console.error('Failed to fetch financial KPI:', err);
      setFinancialKPI(null);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const formatNumber = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('fa-IR').format(value);
  };

  const formatPercent = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('fa-IR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(value) + '%';
  };

  const formatDate = (dateString?: string | null) =>
    !dateString
      ? '—'
      : new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateString));

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      RAW_GOLD: 'طلای خام',
      MANUFACTURED_PRODUCT: 'محصول ساخته‌شده',
      STONE: 'سنگ',
      COIN: 'سکه',
      CURRENCY: 'ارز',
      GENERAL_GOODS: 'کالای عمومی',
    };
    return labels[category] || category;
  };

  const SimpleBarChart = ({ data }: { data: SalesTrendPoint[] }) => {
    if (!data || data.length === 0) return <div className="text-center text-gray-500 py-8">داده‌ای موجود نیست</div>;

    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div className="flex items-end justify-between gap-2 h-64 px-4">
        {data.map((point, idx) => {
          const height = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {formatCurrency(point.value)}
              </div>
              <div 
                className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-lg transition-all hover:from-amber-700 hover:to-amber-500 cursor-pointer"
                style={{ height: `${height}%`, minHeight: point.value > 0 ? '4px' : '0' }}
                title={`${point.key}: ${formatCurrency(point.value)}`}
              />
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {formatDate(point.key)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-amber-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                هوش تجاری و تحلیل داده
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                داشبورد تحلیلی جامع برای مدیریت و تصمیم‌گیری
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
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
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">بازه:</label>
                <select
                  value={granularity}
                  onChange={(e) => setGranularity(e.target.value as 'day' | 'week' | 'month')}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="day">روزانه</option>
                  <option value="week">هفتگی</option>
                  <option value="month">ماهانه</option>
                </select>
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

            <button
              onClick={fetchAllData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'بارگذاری...' : 'بروزرسانی'}</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            {dashboardData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">فروش امروز</h3>
                    <ShoppingCart className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(dashboardData.today.sales.total)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatNumber(dashboardData.today.sales.count)} تراکنش
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">درآمد ماه</h3>
                    <DollarSign className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(dashboardData.month.revenue)}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">مشتریان فعال</h3>
                    <Users className="h-5 w-5 text-purple-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(dashboardData.totals.activeCustomers)}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">ارزش موجودی</h3>
                    <Package className="h-5 w-5 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(dashboardData.totals.inventoryValue)}
                  </p>
                </div>
              </div>
            )}

            {/* Financial KPIs */}
            {financialKPI && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-amber-600" />
                    شاخص‌های مالی کلیدی
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">درآمد کل</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(financialKPI.revenue)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">سود ناخالص</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(financialKPI.grossProfit)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">سود خالص</p>
                      <p className={`text-xl font-bold ${financialKPI.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(financialKPI.netProfit)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        حاشیه سود ناخالص
                        <Percent className="h-3 w-3" />
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatPercent(financialKPI.grossProfitMargin)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        حاشیه سود خالص
                        <Percent className="h-3 w-3" />
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatPercent(financialKPI.netProfitMargin)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">جریان نقدی عملیاتی</p>
                      <p className={`text-xl font-bold ${financialKPI.operatingCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(financialKPI.operatingCashFlow)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sales Trend Chart */}
            {salesTrend && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <BarChart3 className="h-6 w-6 text-amber-600" />
                      روند فروش
                    </h2>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      جمع: {formatCurrency(salesTrend.total)}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <SimpleBarChart data={salesTrend.points} />
                </div>
              </div>
            )}

            {/* Top Products */}
            {topProducts && topProducts.top.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Package className="h-6 w-6 text-amber-600" />
                    پرفروش‌ترین محصولات
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">رتبه</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">محصول</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">دسته‌بندی</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">تعداد فروش</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">درآمد</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {topProducts.top.map((product, idx) => (
                        <tr key={product.productId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {idx + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                            {product.sku && <div className="text-xs text-gray-500 dark:text-gray-400">SKU: {product.sku}</div>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {getCategoryLabel(product.category)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">
                            {formatNumber(product.qty)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(product.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}