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

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    if (user) {
      fetchDashboardData();
      // Refresh every 30 seconds
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
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
                داشبورد زرمند
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                خوش آمدید، {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div className="text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">امروز</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date().toLocaleDateString('fa-IR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today's Sales */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">فروش امروز</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatCurrency(data.today.sales.total)}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600 dark:text-green-400">
              <span>{data.today.sales.count} تراکنش</span>
            </div>
          </div>

          {/* Today's Purchases */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">خرید امروز</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatCurrency(data.today.purchases.total)}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span>{data.today.purchases.count} تراکنش</span>
            </div>
          </div>

          {/* Cash on Hand */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">موجودی نقدی</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatCurrency(data.totals.cashOnHand)}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span>حساب‌های بانکی</span>
            </div>
          </div>

          {/* Inventory Value */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">ارزش موجودی</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatCurrency(data.totals.inventoryValue)}
                </p>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-full">
                <Package className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Sparkles className="h-4 w-4 ml-1" />
              <span>کل موجودی انبار</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">دسترسی سریع</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow text-center group"
              >
                <div
                  className={`${link.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}
                >
                  <link.icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{link.title}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">آخرین تراکنش‌ها</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data.recentTransactions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">هیچ تراکنشی یافت نشد</p>
                ) : (
                  data.recentTransactions.map((transaction) => (
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
              <Link
                href="/dashboard/transactions/sales"
                className="mt-4 block text-center text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium"
              >
                مشاهده همه تراکنش‌ها ←
              </Link>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">هشدارهای موجودی</h2>
              {data.totals.lowStockCount > 0 && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-red-900 dark:text-red-300">
                  {data.totals.lowStockCount} مورد
                </span>
              )}
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data.lowStockItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-500">موجودی همه محصولات کافی است</p>
                  </div>
                ) : (
                  data.lowStockItems.map((item) => (
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
              <Link
                href="/dashboard/inventory/products"
                className="mt-4 block text-center text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium"
              >
                مدیریت موجودی ←
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}