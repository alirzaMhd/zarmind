'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  DollarSign,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Gem,
  Building2,
  UserCog,
  Store,
  Factory,
  UsersRound,
} from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, logout, isLoading } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [financialsOpen, setFinancialsOpen] = useState(false);
  const [managementOpen, setManagementOpen] = useState(false); // Add this
  const [transactionsOpen, setTransactionsOpen] = useState(false);
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 z-30 h-full w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Gem className="h-8 w-8 text-amber-500" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">زرمند</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mb-2"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>داشبورد</span>
            </Link>

            {/* Inventory Dropdown */}
            <div className="mb-2">
              <button
                onClick={() => setInventoryOpen(!inventoryOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5" />
                  <span>موجودی</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transform transition-transform ${inventoryOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>
              {inventoryOpen && (
                <div className="mr-8 mt-2 space-y-1">
                  <Link
                    href="/dashboard/inventory/raw-gold"
                    className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    طلا خام
                  </Link>
                  <Link
                    href="/dashboard/inventory/products"
                    className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    محصولات
                  </Link>
                  <Link
                    href="/dashboard/inventory/coins"
                    className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    سکه
                  </Link>
                  <Link
                    href="/dashboard/inventory/stones"
                    className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    سنگ
                  </Link>
                  <Link
                    href="/dashboard/inventory/currency"
                    className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    ارز
                  </Link>
                </div>
              )}
            </div>

            {/* Transactions Dropdown - NEW */}
            <div className="mb-2">
              <button
                onClick={() => setTransactionsOpen(!transactionsOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Store className="h-5 w-5" />
                  <span>تراکنش‌ها</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transform transition-transform ${transactionsOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>
              {transactionsOpen && (
                <div className="mr-8 mt-2 space-y-1">
                  <Link
                    href="/dashboard/transactions/purchases"
                    className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    خریدها
                  </Link>
                  <Link
                    href="/dashboard/transactions/returns"
                    className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    مرجوعی‌ها
                  </Link>
                  <Link
                    href="/dashboard/transactions/sales"
                    className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    فروش‌ها
                  </Link>
                </div>
              )}
            </div>

            {/* Management Dropdown - NEW */}
            <div className="mb-2">
              <button
                onClick={() => setManagementOpen(!managementOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5" />
                  <span>مدیریت</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transform transition-transform ${managementOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>
              {managementOpen && (
                <div className="mr-8 mt-2 space-y-1">
                  <Link
                    href="/dashboard/management/branches"
                    className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    شعب
                  </Link>
                  <Link
                    href="/dashboard/management/customers"
                    className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    مشتریان
                  </Link>
                  <Link
                    href="/dashboard/management/suppliers"
                    className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    تامین‌کنندگان
                  </Link>
                  <Link
                    href="/dashboard/management/employees"
                    className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    کارکنان
                  </Link>
                  <Link
                    href="/dashboard/management/workshops"
                    className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    کارگاه‌ها
                  </Link>
                </div>
              )}
            </div>

            {/* Financials Dropdown */}
            <div className="mb-2">
              <button
                onClick={() => setFinancialsOpen(!financialsOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5" />
                  <span>مالی</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transform transition-transform ${financialsOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>
              {financialsOpen && (
                <div className="mr-8 mt-2 space-y-1">
                  <Link
                    href="/dashboard/financials/cash"
                    className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    نقدینگی
                  </Link>
                  <Link
                    href="/dashboard/financials/bank-accounts"
                    className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    حساب‌های بانکی
                  </Link>
                  <Link
                    href="/dashboard/financials/expenses"
                    className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    هزینه‌ها
                  </Link>
                  <Link
                    href="/dashboard/financials/checks"
                    className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    چک‌ها
                  </Link>
                  <Link
                    href="/dashboard/financials/receivables"
                    className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    دریافتنی‌ها
                  </Link>
                  <Link
                    href="/dashboard/financials/payables"
                    className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    پرداختنی‌ها
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/dashboard/reports/profit-loss"
              className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mb-2"
            >
              <FileText className="h-5 w-5" />
              <span>گزارشات</span>
            </Link>

            <Link
              href="/dashboard/settings/general"
              className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mb-2"
            >
              <Settings className="h-5 w-5" />
              <span>تنظیمات</span>
            </Link>
          </nav>

          {/* User Profile & Logout */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                {user.firstName[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              <LogOut className="h-5 w-5" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:mr-64">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Gem className="h-6 w-6 text-amber-500" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">زرمند</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Page Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}