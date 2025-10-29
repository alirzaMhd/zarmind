'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import {
  Gem,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Coins,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
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
    totalProducts: number;
    totalSuppliers: number;
    monthlyPurchases: number;
    monthlyExpenses: number;
    receivablesTotal: number;
    payablesTotal: number;
  };
  recentTransactions: Array<{
    id: string;
    type: string;
    invoiceNumber?: string;
    amount: number;
    customer?: string | null;
    date: string;
  }>;
  lowStockItems: Array<{
    id: string;
    name: string;
    sku: string;
    category: string;
    currentStock: number;
    minimumStock: number;
  }>;
}

interface GoldPrice {
  type: string;
  price: number;
  unit: string;
  change: number;
  changePercent: number;
}

interface CurrencyRate {
  currency: string;
  rate: number;
  change: number;
  changePercent: number;
}

interface GoldCurrencyData {
  goldPrices: GoldPrice[];
  currencyRates: CurrencyRate[];
  lastUpdated: string;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

function CollapsibleSection({ title, icon: Icon, children, defaultExpanded = true, className = '' }: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 ${className}`}>
      <div 
        className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </div>
      {isExpanded && (
        <div className="p-6">
          {children}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [goldCurrencyData, setGoldCurrencyData] = useState<GoldCurrencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Section visibility preferences
  const [sectionVisibility, setSectionVisibility] = useState({
    overview: true,
    financial: true,
    goldCurrency: true,
    quickLinks: true,
    recentActivity: true,
    alerts: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/analytics/dashboard');
        setData(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    const fetchGoldCurrencyData = async () => {
      try {
        const response = await api.get('/analytics/gold-currency-prices');
        setGoldCurrencyData(response.data);
      } catch (err: any) {
        console.error('Failed to fetch gold/currency data:', err);
        // Don't set error for gold/currency data as it's not critical
      }
    };

    if (user) {
      fetchDashboardData();
      fetchGoldCurrencyData();
      
      // Refresh dashboard every 30 seconds
      const dashboardInterval = setInterval(fetchDashboardData, 30000);
      // Refresh gold/currency every 5 minutes
      const goldCurrencyInterval = setInterval(fetchGoldCurrencyData, 300000);
      
      return () => {
        clearInterval(dashboardInterval);
        clearInterval(goldCurrencyInterval);
      };
    }
  }, [user]);

  const formatCurrency = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0 ریال';
    }
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'تاریخ نامشخص';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'تاریخ نامشخص';
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      return 'تاریخ نامشخص';
    }
  };

  const toggleSectionVisibility = (section: keyof typeof sectionVisibility) => {
    setSectionVisibility(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const quickLinks = [
    { title: 'فروش جدید', href: '/dashboard/transactions/sales/new', icon: ShoppingCart, color: 'bg-green-500' },
    { title: 'مدیریت موجودی', href: '/dashboard/inventory/products', icon: Package, color: 'bg-blue-500' },
    { title: 'مشتریان', href: '/dashboard/management/customers', icon: Users, color: 'bg-purple-500' },
    { title: 'گزارشات', href: '/dashboard/reports/profit-loss', icon: TrendingUp, color: 'bg-orange-500' },
    { title: 'سکه', href: '/dashboard/inventory/coins', icon: Coins, color: 'bg-amber-500' },
    { title: 'هزینه‌ها', href: '/dashboard/financials/expenses', icon: DollarSign, color: 'bg-red-500' },
  ];

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Gem className="h-8 w-8 text-amber-500" />
                داشبورد زرمایند
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                خوش آمدید، {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">امروز</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date().toLocaleDateString('fa-IR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Overview Section */}
        {sectionVisibility.overview && (
          <CollapsibleSection title="نمای کلی" icon={TrendingUp} defaultExpanded={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Today's Sales */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6 border border-green-200 dark:border-green-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400">فروش امروز</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {formatCurrency(data?.today?.sales?.total || 0)}
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600 dark:text-green-400">
                  <span>{data?.today?.sales?.count || 0} تراکنش</span>
                </div>
              </div>

              {/* Today's Purchases */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">خرید امروز</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {formatCurrency(data?.today?.purchases?.total || 0)}
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                    <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-blue-600 dark:text-blue-400">
                  <span>{data?.today?.purchases?.count || 0} تراکنش</span>
                </div>
              </div>

              {/* Cash on Hand */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">موجودی نقدی</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {formatCurrency(data?.totals?.cashOnHand || 0)}
                    </p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-purple-600 dark:text-purple-400">
                  <span>حساب‌های بانکی</span>
                </div>
              </div>

              {/* Inventory Value */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-6 border border-amber-200 dark:border-amber-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-600 dark:text-amber-400">ارزش موجودی</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {formatCurrency(data?.totals?.inventoryValue || 0)}
                    </p>
                  </div>
                  <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-full">
                    <Package className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-amber-600 dark:text-amber-400">
                  <Sparkles className="h-4 w-4 ml-1" />
                  <span>کل موجودی انبار</span>
                </div>
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* Financial Details Section */}
        {sectionVisibility.financial && (
          <CollapsibleSection title="جزئیات مالی" icon={DollarSign} defaultExpanded={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Monthly Purchases */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">خرید ماهانه</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {formatCurrency(data?.totals?.monthlyPurchases || 0)}
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                    <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span>این ماه</span>
                </div>
              </div>

              {/* Monthly Expenses */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">هزینه‌های ماهانه</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {formatCurrency(data?.totals?.monthlyExpenses || 0)}
                    </p>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                    <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span>این ماه</span>
                </div>
              </div>

              {/* Total Products */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">کل محصولات</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {data?.totals?.totalProducts || 0}
                    </p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                    <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span>موجود در انبار</span>
                </div>
              </div>

              {/* Active Suppliers */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">تامین‌کنندگان فعال</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {data?.totals?.totalSuppliers || 0}
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span>تامین‌کنندگان</span>
                </div>
              </div>
            </div>

            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Receivables */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">دریافتنی‌ها</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {formatCurrency(data?.totals?.receivablesTotal || 0)}
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                    <ArrowUpRight className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span>مبالغ در انتظار دریافت</span>
                </div>
              </div>

              {/* Payables */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">پرداختنی‌ها</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {formatCurrency(data?.totals?.payablesTotal || 0)}
                    </p>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                    <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span>مبالغ در انتظار پرداخت</span>
                </div>
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* Gold and Currency Prices Section */}
        {sectionVisibility.goldCurrency && goldCurrencyData && (
          <CollapsibleSection title="قیمت طلا و ارز" icon={Coins} defaultExpanded={false}>
            <div className="mb-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              آخرین بروزرسانی: {formatDate(goldCurrencyData.lastUpdated)}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gold Prices */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-6 border border-amber-200 dark:border-amber-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <Coins className="h-5 w-5 text-amber-500" />
                  قیمت طلا
                </h3>
                <div className="space-y-4">
                  {goldCurrencyData.goldPrices.slice(0, 5).map((gold, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between pb-4 border-b border-amber-200 dark:border-amber-700 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                          <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{gold.type}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{gold.unit}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(gold.price)}
                        </p>
                        <div className="flex items-center gap-1 text-xs">
                          <span className={gold.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {gold.change >= 0 ? '+' : ''}{formatCurrency(gold.change)}
                          </span>
                          <span className={gold.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            ({gold.changePercent >= 0 ? '+' : ''}{gold.changePercent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Currency Rates */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6 border border-green-200 dark:border-green-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  نرخ ارز
                </h3>
                <div className="space-y-4">
                  {goldCurrencyData.currencyRates.slice(0, 5).map((currency, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between pb-4 border-b border-green-200 dark:border-green-700 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{currency.currency}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">ریال</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(currency.rate)}
                        </p>
                        <div className="flex items-center gap-1 text-xs">
                          <span className={currency.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {currency.change >= 0 ? '+' : ''}{formatCurrency(currency.change)}
                          </span>
                          <span className={currency.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            ({currency.changePercent >= 0 ? '+' : ''}{currency.changePercent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* Quick Links Section */}
        {sectionVisibility.quickLinks && (
          <CollapsibleSection title="دسترسی سریع" icon={Sparkles} defaultExpanded={true}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {quickLinks.map((link) => (
                <div
                  key={link.href}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow text-center group cursor-pointer"
                  onClick={(e) => {
                    router.push(link.href);
                  }}
                >
                  <div
                    className={`${link.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}
                  >
                    <link.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{link.title}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Recent Activity & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          {sectionVisibility.recentActivity && (
            <CollapsibleSection title="آخرین تراکنش‌ها" icon={Clock} defaultExpanded={true}>
              <div className="space-y-4">
                {data?.recentTransactions?.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">هیچ تراکنشی یافت نشد</p>
                ) : (
                  data?.recentTransactions?.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">فروش</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {transaction.customer || 'مشتری ناشناس'}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div
                className="mt-4 block text-center text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium cursor-pointer"
                onClick={(e) => {
                  router.push('/dashboard/transactions/sales');
                }}
              >
                مشاهده همه تراکنش‌ها ←
              </div>
            </CollapsibleSection>
          )}

          {/* Low Stock Alerts */}
          {sectionVisibility.alerts && (
            <CollapsibleSection title="هشدارهای موجودی" icon={AlertTriangle} defaultExpanded={true}>
              <div className="space-y-4">
                {data?.lowStockItems?.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-500">موجودی همه محصولات کافی است</p>
                  </div>
                ) : (
                  data?.lowStockItems?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.category}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                          موجودی: {item.currentStock}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          حداقل: {item.minimumStock}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div
                className="mt-4 block text-center text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium cursor-pointer"
                onClick={(e) => {
                  router.push('/dashboard/inventory/products');
                }}
              >
                مدیریت موجودی ←
              </div>
            </CollapsibleSection>
          )}
        </div>
      </div>
    </div>
  );
}