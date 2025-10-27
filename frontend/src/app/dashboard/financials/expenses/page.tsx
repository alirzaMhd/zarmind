// frontend/src/app/dashboard/financials/expenses/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import {
  Plus,
  Search,
  RefreshCw,
  X,
  Save,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Tag,
  CreditCard,
  TrendingDown,
  Receipt,
} from 'lucide-react';

type ExpenseCategory = {
  id: string;
  name: string;
  nameEn?: string | null;
  description?: string | null;
};

type Expense = {
  id: string;
  categoryId: string;
  category?: ExpenseCategory;
  amount: number;
  expenseDate: string;
  title: string;
  description?: string | null;
  vendor?: string | null;
  invoiceNumber?: string | null;
  receiptImages: string[];
  paymentMethod: string;
  referenceNumber?: string | null;
  isRecurring?: boolean;
  recurringPattern?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

type ExpensesPagedResult = {
  items: Expense[];
  total: number;
  page: number;
  limit: number;
};

type ExpensesSummary = {
  period: { from: string; to: string };
  totalExpenses: number;
  totalAmount: number;
  byCategory: Array<{
    categoryId: string;
    categoryName?: string;
    categoryNameEn?: string | null;
    count: number;
    totalAmount: number;
  }>;
  byPaymentMethod: Array<{
    paymentMethod: string;
    count: number;
    totalAmount: number;
  }>;
};

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'نقدی' },
  { value: 'BANK_TRANSFER', label: 'حواله بانکی' },
  { value: 'CARD', label: 'کارت' },
  { value: 'CHECK', label: 'چک' },
  { value: 'INSTALLMENT', label: 'اقساط' },
  { value: 'TRADE_IN', label: 'معاوضه' },
  { value: 'MIXED', label: 'ترکیبی' },
];

type FormData = {
  categoryId: string;
  amount: string;
  expenseDate: string;
  title: string;
  description: string;
  vendor: string;
  invoiceNumber: string;
  receiptImagesText: string;
  paymentMethod: string;
  referenceNumber: string;
  isRecurring: boolean;
  recurringPattern: string;
};

export default function ExpensesPage() {
  // Data
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpensesSummary | null>(null);

  // Loading
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [vendor, setVendor] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<string>(''); // '', 'true', 'false'
  const [sortBy, setSortBy] = useState<'createdAt' | 'expenseDate' | 'amount' | 'title'>('expenseDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);

  // UI
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form
  const [formData, setFormData] = useState<FormData>({
    categoryId: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    vendor: '',
    invoiceNumber: '',
    receiptImagesText: '',
    paymentMethod: 'CASH',
    referenceNumber: '',
    isRecurring: false,
    recurringPattern: '',
  });

  useEffect(() => {
    // Default last 30 days
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 30);
    setDateTo(today.toISOString().split('T')[0]);
    setDateFrom(from.toISOString().split('T')[0]);

    fetchCategories();
  }, []);

  useEffect(() => {
    fetchExpenses();
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, vendor, dateFrom, dateTo, isRecurring, sortBy, sortOrder, page, limit]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  };

  const getPaymentLabel = (pm: string) => PAYMENT_METHODS.find((p) => p.value === pm)?.label || pm;

  const fetchCategories = async () => {
    try {
      const res = await api.get('/financials/expenses/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setCategories([]);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
        sortBy,
        sortOrder,
      };
      if (searchTerm) params.search = searchTerm;
      if (selectedCategoryId) params.categoryId = selectedCategoryId;
      if (vendor) params.vendor = vendor;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      if (minAmount) params.minAmount = minAmount;
      if (maxAmount) params.maxAmount = maxAmount;
      if (isRecurring) params.isRecurring = isRecurring;

      const res = await api.get<ExpensesPagedResult>('/financials/expenses', { params });
      setExpenses(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
      showMessage('error', 'خطا در بارگذاری هزینه‌ها');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      const params: any = {};
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const res = await api.get<ExpensesSummary>('/financials/expenses/summary', { params });
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      categoryId: '',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      title: '',
      description: '',
      vendor: '',
      invoiceNumber: '',
      receiptImagesText: '',
      paymentMethod: 'CASH',
      referenceNumber: '',
      isRecurring: false,
      recurringPattern: '',
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) return showMessage('error', 'لطفاً دسته‌بندی را انتخاب کنید');
    if (!formData.amount || isNaN(parseFloat(formData.amount))) return showMessage('error', 'مبلغ معتبر نیست');

    try {
      await api.post('/financials/expenses', {
        categoryId: formData.categoryId,
        amount: parseFloat(formData.amount),
        expenseDate: formData.expenseDate,
        title: formData.title,
        description: formData.description || undefined,
        vendor: formData.vendor || undefined,
        invoiceNumber: formData.invoiceNumber || undefined,
        receiptImages: formData.receiptImagesText
          ? formData.receiptImagesText.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber || undefined,
        isRecurring: formData.isRecurring || undefined,
        recurringPattern: formData.recurringPattern || undefined,
      });

      showMessage('success', 'هزینه با موفقیت ثبت شد');
      setShowAddModal(false);
      resetForm();
      // Refresh list + summary
      setPage(1);
      await Promise.all([fetchExpenses(), fetchSummary()]);
    } catch (err: any) {
      console.error('Create expense error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در ثبت هزینه');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;

    try {
      await api.patch(`/financials/expenses/${selectedExpense.id}`, {
        categoryId: formData.categoryId || undefined,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        expenseDate: formData.expenseDate || undefined,
        title: formData.title || undefined,
        description: formData.description || undefined,
        vendor: formData.vendor || undefined,
        invoiceNumber: formData.invoiceNumber || undefined,
        receiptImages: formData.receiptImagesText
          ? formData.receiptImagesText.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        paymentMethod: formData.paymentMethod || undefined,
        referenceNumber: formData.referenceNumber || undefined,
        isRecurring: formData.isRecurring,
        recurringPattern: formData.recurringPattern || undefined,
      });

      showMessage('success', 'هزینه با موفقیت ویرایش شد');
      setShowEditModal(false);
      setSelectedExpense(null);
      resetForm();
      await Promise.all([fetchExpenses(), fetchSummary()]);
    } catch (err: any) {
      console.error('Update expense error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در ویرایش هزینه');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/financials/expenses/${id}/approve`);
      showMessage('success', 'هزینه تایید شد');
      await fetchExpenses();
    } catch (err: any) {
      console.error('Approve expense error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در تایید هزینه');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این هزینه اطمینان دارید؟')) return;
    try {
      await api.delete(`/financials/expenses/${id}`);
      showMessage('success', 'هزینه با موفقیت حذف شد');
      await Promise.all([fetchExpenses(), fetchSummary()]);
    } catch (err: any) {
      console.error('Delete expense error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در حذف هزینه');
    }
  };

  const openEditModal = (exp: Expense) => {
    setSelectedExpense(exp);
    setFormData({
      categoryId: exp.categoryId || '',
      amount: exp.amount?.toString() || '',
      expenseDate: new Date(exp.expenseDate).toISOString().split('T')[0],
      title: exp.title || '',
      description: exp.description || '',
      vendor: exp.vendor || '',
      invoiceNumber: exp.invoiceNumber || '',
      receiptImagesText: Array.isArray(exp.receiptImages) ? exp.receiptImages.join(', ') : '',
      paymentMethod: exp.paymentMethod || 'CASH',
      referenceNumber: exp.referenceNumber || '',
      isRecurring: !!exp.isRecurring,
      recurringPattern: exp.recurringPattern || '',
    });
    setShowEditModal(true);
  };

  // Derived
  const topCategory = useMemo(() => {
    if (!summary?.byCategory?.length) return null;
    return [...summary.byCategory].sort((a, b) => b.totalAmount - a.totalAmount)[0];
  }, [summary]);

  const pmTotals = useMemo(() => {
    const find = (pm: string) => summary?.byPaymentMethod?.find((x) => x.paymentMethod === pm)?.totalAmount || 0;
    return {
      CASH: find('CASH'),
      BANK_TRANSFER: find('BANK_TRANSFER'),
      CHECK: find('CHECK'),
    };
  }, [summary]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">مدیریت هزینه‌ها</h1>
          <p className="text-gray-600 dark:text-gray-400">ثبت، مدیریت و گزارش‌گیری از هزینه‌ها</p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)}>
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">مجموع مبلغ هزینه‌ها</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                  {formatCurrency(summary?.totalAmount || 0)}
                </p>
              </div>
              <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              بازه: {summary ? `${formatDate(summary.period.from)} تا ${formatDate(summary.period.to)}` : '—'}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">تعداد هزینه‌ها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {new Intl.NumberFormat('fa-IR').format(summary?.totalExpenses || 0)}
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
                <Receipt className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">بیشترین دسته‌بندی</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">
                  {topCategory?.categoryName || '—'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {topCategory ? formatCurrency(topCategory.totalAmount) : ''}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <Tag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">روش‌های پرداخت (مبلغ)</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
                    نقدی: {formatCurrency(pmTotals.CASH || 0)}
                  </span>
                  <span className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 px-2 py-1 rounded">
                    حواله: {formatCurrency(pmTotals.BANK_TRANSFER || 0)}
                  </span>
                  <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 px-2 py-1 rounded">
                    چک: {formatCurrency(pmTotals.CHECK || 0)}
                  </span>
                </div>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="جستجو بر اساس عنوان، توضیح، فروشنده یا شماره فاکتور..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (setPage(1), fetchExpenses())}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {/* Date range */}
                <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setPage(1);
                      setDateFrom(e.target.value);
                    }}
                    className="bg-transparent border-none focus:ring-0 text-sm dark:text-white"
                    placeholder="از تاریخ"
                  />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setPage(1);
                      setDateTo(e.target.value);
                    }}
                    className="bg-transparent border-none focus:ring-0 text-sm dark:text-white"
                    placeholder="تا تاریخ"
                  />
                </div>

                {/* Category */}
                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    setPage(1);
                    setSelectedCategoryId(e.target.value);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">همه دسته‌بندی‌ها</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Vendor */}
                <input
                  type="text"
                  value={vendor}
                  onChange={(e) => {
                    setPage(1);
                    setVendor(e.target.value);
                  }}
                  placeholder="فروشنده"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />

                {/* Amount range */}
                <input
                  type="number"
                  inputMode="numeric"
                  value={minAmount}
                  onChange={(e) => {
                    setPage(1);
                    setMinAmount(e.target.value);
                  }}
                  placeholder="حداقل مبلغ"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={maxAmount}
                  onChange={(e) => {
                    setPage(1);
                    setMaxAmount(e.target.value);
                  }}
                  placeholder="حداکثر مبلغ"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />

                {/* Recurring */}
                <select
                  value={isRecurring}
                  onChange={(e) => {
                    setPage(1);
                    setIsRecurring(e.target.value);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">دوره‌ای/غیردوره‌ای</option>
                  <option value="true">دوره‌ای</option>
                  <option value="false">غیردوره‌ای</option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="expenseDate">مرتب‌سازی: تاریخ</option>
                  <option value="amount">مرتب‌سازی: مبلغ</option>
                  <option value="title">مرتب‌سازی: عنوان</option>
                  <option value="createdAt">مرتب‌سازی: ایجاد</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="desc">نزولی</option>
                  <option value="asc">صعودی</option>
                </select>

                {/* Page size */}
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(parseInt(e.target.value, 10));
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n} در صفحه
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => fetchExpenses()}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span className="hidden md:inline">بروزرسانی</span>
                </button>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-white bg-amber-600 rounded-lg hover:bg-amber-700"
                >
                  <Plus className="h-5 w-5" />
                  <span>ثبت هزینه</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Receipt className="h-16 w-16 mb-4 opacity-50" />
              <p>هیچ هزینه‌ای یافت نشد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      عنوان
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      مبلغ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      تاریخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      دسته‌بندی
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      روش پرداخت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      فروشنده/فاکتور
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      وضعیت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {exp.title}
                        </div>
                        {exp.description ? (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {exp.description}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                          {formatCurrency(exp.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {formatDate(exp.expenseDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {exp.category?.name || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {getPaymentLabel(exp.paymentMethod)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {exp.vendor || '—'}
                        {exp.invoiceNumber ? (
                          <span className="text-xs text-gray-400"> / {exp.invoiceNumber}</span>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          {exp.approvedAt ? (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-4 w-4" /> تایید شده
                            </span>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">در انتظار تایید</span>
                          )}
                          {exp.isRecurring ? (
                            <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                              دوره‌ای
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(exp)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {!exp.approvedAt && (
                            <button
                              onClick={() => handleApprove(exp.id)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="تایید"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(exp.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {new Intl.NumberFormat('fa-IR').format((page - 1) * limit + 1)} تا{' '}
                  {new Intl.NumberFormat('fa-IR').format(
                    Math.min(page * limit, total || 0),
                  )}{' '}
                  از{' '}
                  {new Intl.NumberFormat('fa-IR').format(total || 0)}
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={`px-3 py-1.5 rounded border ${
                      page <= 1
                        ? 'text-gray-400 border-gray-200 dark:text-gray-500 dark:border-gray-700'
                        : 'text-gray-700 border-gray-300 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                    }`}
                  >
                    قبلی
                  </button>
                  <button
                    disabled={page * limit >= (total || 0)}
                    onClick={() => setPage((p) => p + 1)}
                    className={`px-3 py-1.5 rounded border ${
                      page * limit >= (total || 0)
                        ? 'text-gray-400 border-gray-200 dark:text-gray-500 dark:border-gray-700'
                        : 'text-gray-700 border-gray-300 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                    }`}
                  >
                    بعدی
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">ثبت هزینه جدید</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  دسته‌بندی *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">انتخاب دسته‌بندی</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    مبلغ (ریال) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تاریخ هزینه *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  عنوان *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="عنوان هزینه"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    فروشنده
                  </label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="نام فروشنده"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    شماره فاکتور
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="شماره فاکتور"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  روش پرداخت *
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.value} value={pm.value}>
                      {pm.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    شماره مرجع/رسید
                  </label>
                  <input
                    type="text"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="شماره مرجع"
                  />
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <input
                    id="recurring"
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    className="h-4 w-4 text-amber-600 border-gray-300 rounded"
                  />
                  <label htmlFor="recurring" className="text-sm text-gray-700 dark:text-gray-300">
                    هزینه دوره‌ای
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الگوی تکرار (مثال: MONTHLY)
                </label>
                <input
                  type="text"
                  value={formData.recurringPattern}
                  onChange={(e) => setFormData({ ...formData, recurringPattern: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="MONTHLY, YEARLY, ..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تصاویر رسید (URL ها با کاما جدا شوند)
                </label>
                <input
                  type="text"
                  value={formData.receiptImagesText}
                  onChange={(e) => setFormData({ ...formData, receiptImagesText: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="https://... , https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توضیحات
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="توضیحات هزینه..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                >
                  <Save className="h-5 w-5" />
                  ثبت هزینه
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-medium"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">ویرایش هزینه</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedExpense(null);
                  resetForm();
                }}
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  دسته‌بندی
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">انتخاب دسته‌بندی</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    مبلغ (ریال)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تاریخ هزینه
                  </label>
                  <input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  عنوان
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="عنوان هزینه"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    فروشنده
                  </label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="نام فروشنده"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    شماره فاکتور
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="شماره فاکتور"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  روش پرداخت
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.value} value={pm.value}>
                      {pm.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    شماره مرجع/رسید
                  </label>
                  <input
                    type="text"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="شماره مرجع"
                  />
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <input
                    id="recurring-edit"
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    className="h-4 w-4 text-amber-600 border-gray-300 rounded"
                  />
                  <label htmlFor="recurring-edit" className="text-sm text-gray-700 dark:text-gray-300">
                    هزینه دوره‌ای
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الگوی تکرار
                </label>
                <input
                  type="text"
                  value={formData.recurringPattern}
                  onChange={(e) => setFormData({ ...formData, recurringPattern: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="MONTHLY, YEARLY, ..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تصاویر رسید (URL ها با کاما جدا شوند)
                </label>
                <input
                  type="text"
                  value={formData.receiptImagesText}
                  onChange={(e) => setFormData({ ...formData, receiptImagesText: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="https://... , https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توضیحات
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="توضیحات هزینه..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                >
                  <Save className="h-5 w-5" />
                  ذخیره تغییرات
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedExpense(null);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-medium"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}