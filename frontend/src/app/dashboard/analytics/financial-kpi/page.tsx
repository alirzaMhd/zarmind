'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  Building2,
  DollarSign,
  Activity,
  PieChart,
  BarChart3,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Wallet,
  CreditCard,
  Target,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

// Types
type Branch = {
  id: string;
  name: string;
  code: string;
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

export default function FinancialKPIPage() {
  const { user } = useAuthStore();

  // State
  const [loading, setLoading] = useState(true);
  const [financialKPI, setFinancialKPI] = useState<FinancialKPI | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Filters
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
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
      fetchFinancialKPI();
    }
  }, [fromDate, toDate, selectedBranchId]);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches', { params: { limit: 100, isActive: true } });
      const list = res.data?.items || res.data || [];
      setBranches(list);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const fetchFinancialKPI = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const formatPercent = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('fa-IR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(value) + '%';
  };

  const formatRatio = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('fa-IR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const formatDate = (dateString?: string | null) =>
    !dateString
      ? '—'
      : new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateString));

  const getTrendIcon = (value: number | undefined | null) => {
    if (value === undefined || value === null) return <Minus className="h-4 w-4 text-gray-400" />;
    if (value > 0) return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    if (value < 0) return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getHealthStatus = (ratio: number | null, type: 'current' | 'quick') => {
    if (ratio === null) return { color: 'gray', text: 'نامشخص', bgColor: 'bg-gray-100 dark:bg-gray-700' };
    
    if (type === 'current') {
      if (ratio >= 2) return { color: 'green', text: 'عالی', bgColor: 'bg-green-100 dark:bg-green-900/30' };
      if (ratio >= 1.5) return { color: 'blue', text: 'خوب', bgColor: 'bg-blue-100 dark:bg-blue-900/30' };
      if (ratio >= 1) return { color: 'yellow', text: 'قابل قبول', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' };
      return { color: 'red', text: 'ضعیف', bgColor: 'bg-red-100 dark:bg-red-900/30' };
    }
    
    // Quick ratio
    if (ratio >= 1.5) return { color: 'green', text: 'عالی', bgColor: 'bg-green-100 dark:bg-green-900/30' };
    if (ratio >= 1) return { color: 'blue', text: 'خوب', bgColor: 'bg-blue-100 dark:bg-blue-900/30' };
    if (ratio >= 0.75) return { color: 'yellow', text: 'قابل قبول', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' };
    return { color: 'red', text: 'ضعیف', bgColor: 'bg-red-100 dark:bg-red-900/30' };
  };

  const SimpleDonutChart = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
    const total = data.reduce((sum, item) => sum + Math.abs(item.value), 0);
    
    if (total === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          داده‌ای برای نمایش وجود ندارد
        </div>
      );
    }

    return (
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 grid grid-cols-1 gap-3">
          {data.map((item, idx) => {
            const percentage = (Math.abs(item.value) / total) * 100;
            return (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{formatPercent(percentage)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-amber-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                شاخص‌های کلیدی عملکرد مالی
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                تحلیل جامع وضعیت مالی و سلامت کسب‌وکار
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
              onClick={fetchFinancialKPI}
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
        ) : !financialKPI ? (
          <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
              داده‌ای برای نمایش وجود ندارد
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              لطفا بازه زمانی را تنظیم کرده و روی دکمه بروزرسانی کلیک کنید.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Period Info */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">دوره گزارش‌گیری</h2>
                  <p className="text-amber-100">
                    از {formatDate(financialKPI.range.from)} تا {formatDate(financialKPI.range.to)}
                  </p>
                </div>
                <Calendar className="h-16 w-16 opacity-50" />
              </div>
            </div>

            {/* Main Financial Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-t-4 border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">درآمد کل</h3>
                  <DollarSign className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(financialKPI.revenue)}
                </p>
                <div className="mt-2 flex items-center gap-1">
                  {getTrendIcon(financialKPI.revenue)}
                  <span className="text-xs text-gray-500 dark:text-gray-400">درآمد فروش</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-t-4 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">سود ناخالص</h3>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(financialKPI.grossProfit)}
                </p>
                <div className="mt-2 flex items-center gap-1">
                  <Percent className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    حاشیه: {formatPercent(financialKPI.grossProfitMargin)}
                  </span>
                </div>
              </div>

              <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-t-4 ${financialKPI.netProfit >= 0 ? 'border-emerald-500' : 'border-red-500'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">سود خالص</h3>
                  {financialKPI.netProfit >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <p className={`text-2xl font-bold ${financialKPI.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(financialKPI.netProfit)}
                </p>
                <div className="mt-2 flex items-center gap-1">
                  <Percent className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    حاشیه: {formatPercent(financialKPI.netProfitMargin)}
                  </span>
                </div>
              </div>

              <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-t-4 ${financialKPI.operatingCashFlow >= 0 ? 'border-purple-500' : 'border-orange-500'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">جریان نقدی عملیاتی</h3>
                  <Wallet className="h-5 w-5 text-purple-500" />
                </div>
                <p className={`text-2xl font-bold ${financialKPI.operatingCashFlow >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {formatCurrency(financialKPI.operatingCashFlow)}
                </p>
                <div className="mt-2 flex items-center gap-1">
                  {getTrendIcon(financialKPI.operatingCashFlow)}
                  <span className="text-xs text-gray-500 dark:text-gray-400">جریان نقد</span>
                </div>
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <PieChart className="h-6 w-6 text-amber-600" />
                  ترکیب درآمد و هزینه
                </h2>
              </div>
              <div className="p-6">
                <SimpleDonutChart
                  data={[
                    { label: 'درآمد فروش', value: financialKPI.revenue, color: 'bg-blue-500' },
                    { label: 'هزینه خرید', value: financialKPI.purchases, color: 'bg-red-500' },
                    { label: 'سایر هزینه‌ها', value: financialKPI.expenses, color: 'bg-orange-500' },
                  ]}
                />
              </div>
            </div>

            {/* Profit Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-amber-600" />
                    تحلیل سودآوری
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">درآمد کل</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(financialKPI.revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">بهای تمام شده کالا</span>
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">
                      -{formatCurrency(financialKPI.purchases)}
                    </span>
                  </div>
                  <div className="h-px bg-gray-300 dark:bg-gray-600"></div>
                  <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">سود ناخالص</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(financialKPI.grossProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">هزینه‌های عملیاتی</span>
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      -{formatCurrency(financialKPI.expenses)}
                    </span>
                  </div>
                  <div className="h-px bg-gray-300 dark:bg-gray-600"></div>
                  <div className={`flex justify-between items-center p-4 rounded-lg ${financialKPI.netProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">سود خالص</span>
                    <span className={`text-xl font-bold ${financialKPI.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(financialKPI.netProfit)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profit Margins */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Percent className="h-6 w-6 text-amber-600" />
                    حاشیه‌های سود
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">حاشیه سود ناخالص</span>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatPercent(financialKPI.grossProfitMargin)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(Math.max((financialKPI.grossProfitMargin || 0), 0), 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      نسبت سود ناخالص به درآمد کل
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">حاشیه سود خالص</span>
                      <span className={`text-2xl font-bold ${(financialKPI.netProfitMargin || 0) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatPercent(financialKPI.netProfitMargin)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${(financialKPI.netProfitMargin || 0) >= 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}
                        style={{ width: `${Math.min(Math.max(Math.abs(financialKPI.netProfitMargin || 0), 0), 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      نسبت سود خالص به درآمد کل
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-gray-700 dark:text-gray-300">
                        <p className="font-medium mb-1">راهنما:</p>
                        <p>• حاشیه سود ناخالص بالاتر از 30% عالی است</p>
                        <p>• حاشیه سود خالص بالاتر از 15% مطلوب است</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Ratios */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Target className="h-6 w-6 text-amber-600" />
                  نسبت‌های مالی و سلامت کسب‌وکار
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">نسبت جاری</span>
                      <CreditCard className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {formatRatio(financialKPI.currentRatio)}
                    </div>
                    {financialKPI.currentRatio !== null && (
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getHealthStatus(financialKPI.currentRatio, 'current').bgColor} text-${getHealthStatus(financialKPI.currentRatio, 'current').color}-700 dark:text-${getHealthStatus(financialKPI.currentRatio, 'current').color}-300`}>
                        {getHealthStatus(financialKPI.currentRatio, 'current').text}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      نسبت دارایی‌های جاری به بدهی‌های جاری
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">نسبت آنی</span>
                      <Activity className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {formatRatio(financialKPI.quickRatio)}
                    </div>
                    {financialKPI.quickRatio !== null && (
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getHealthStatus(financialKPI.quickRatio, 'quick').bgColor} text-${getHealthStatus(financialKPI.quickRatio, 'quick').color}-700 dark:text-${getHealthStatus(financialKPI.quickRatio, 'quick').color}-300`}>
                        {getHealthStatus(financialKPI.quickRatio, 'quick').text}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      نسبت دارایی‌های نقدشونده به بدهی‌های جاری
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">سرمایه در گردش</span>
                      <Wallet className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className={`text-3xl font-bold ${financialKPI.workingCapital >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(financialKPI.workingCapital)}
                    </div>
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${financialKPI.workingCapital >= 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                      {financialKPI.workingCapital >= 0 ? 'مثبت' : 'منفی'}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      تفاوت دارایی‌های جاری و بدهی‌های جاری
                    </p>
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