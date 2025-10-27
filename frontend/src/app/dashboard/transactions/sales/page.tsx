// frontend/src/app/dashboard/transactions/sales/page.tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import {
  Plus,
  RefreshCw,
  Search,
  X,
  Save,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  DollarSign,
  Calendar,
  User,
  Building2,
  CreditCard,
  Receipt,
  TrendingUp,
  FileText,
} from 'lucide-react';

type Customer = {
  id: string;
  code?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  businessName?: string | null;
  phone?: string | null;
};

type Branch = {
  id: string;
  name: string;
  code: string;
};

type SaleItem = {
  id: string;
  productId: string;
  product?: {
    id: string;
    sku: string;
    name: string;
    category: string;
  };
  quantity: number;
  weight?: number | null;
  unitPrice: number;
  goldPrice?: number | null;
  stonePrice?: number | null;
  craftsmanshipFee?: number | null;
  discount?: number | null;
  subtotal: number;
};

type SalePayment = {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  checkId?: string | null;
  bankAccountId?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
};

type Sale = {
  id: string;
  invoiceNumber: string;
  saleDate: string;
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  customerId?: string | null;
  customer?: Customer;
  userId: string;
  branchId: string;
  branch?: Branch;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: string;
  notes?: string | null;
  items: SaleItem[];
  payments?: SalePayment[];
  createdAt: string;
  updatedAt: string;
};

type PagedResult = {
  items: Sale[];
  total: number;
  page: number;
  limit: number;
};

type Summary = {
  period: { from: string; to: string };
  totalSales: number;
  totalRevenue: number;
  totalPaid: number;
  totalSubtotal: number;
  totalTax: number;
  totalDiscount: number;
  outstandingAmount: number;
  byStatus: Array<{ status: Sale['status']; count: number; totalAmount: number }>;
  byPaymentMethod: Array<{ paymentMethod: string; count: number; totalAmount: number }>;
  topCustomers: Array<{ customerId: string; salesCount: number; totalAmount: number }>;
  topProducts: Array<{ productId: string; salesCount: number; quantitySold: number; totalRevenue: number }>;
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

const STATUS_BADGE = (status: Sale['status']) => {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'REFUNDED':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'PARTIALLY_REFUNDED':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

export default function SalesPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Data
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Loading
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | Sale['status']>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'saleDate' | 'totalAmount'>('saleDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);

  // UI
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Forms
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    notes: '',
  });

  const [cancelInfo, setCancelInfo] = useState({ reason: '', notes: '' });
  const [refundInfo, setRefundInfo] = useState({ amount: '', reason: '', notes: '' });

  useEffect(() => {
    // Default last 30 days
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 30);
    setToDate(today.toISOString().split('T')[0]);
    setFromDate(from.toISOString().split('T')[0]);

    fetchCustomers();
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, selectedCustomerId, selectedBranchId, selectedUserId, paymentMethodFilter, fromDate, toDate, minAmount, maxAmount, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, selectedBranchId, selectedUserId]);

  // Auto-search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) {
        setPage(1);
      } else {
        fetchSales();
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  const formatDate = (dateString?: string | null) =>
    !dateString
      ? '—'
      : new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(
          new Date(dateString),
        );

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/crm/customers', { params: { limit: 100, status: 'ACTIVE' } });
      const list = res.data?.items || res.data || [];
      setCustomers(list);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setCustomers([]);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches', { params: { limit: 100, isActive: true } });
      const list = res.data?.items || res.data || [];
      setBranches(list);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
      setBranches([]);
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit, sortBy, sortOrder };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (selectedCustomerId) params.customerId = selectedCustomerId;
      if (selectedBranchId) params.branchId = selectedBranchId;
      if (selectedUserId) params.userId = selectedUserId;
      if (paymentMethodFilter) params.paymentMethod = paymentMethodFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (minAmount) params.minAmount = minAmount;
      if (maxAmount) params.maxAmount = maxAmount;

      const res = await api.get<PagedResult>('/transactions/sales', { params });
      setSales(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch sales:', err);
      showMessage('error', 'خطا در بارگذاری فروش‌ها');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      const params: any = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (selectedBranchId) params.branchId = selectedBranchId;
      if (selectedUserId) params.userId = selectedUserId;
      const res = await api.get<Summary>('/transactions/sales/summary', { params });
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to fetch sales summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const openView = async (sale: Sale) => {
    try {
      // Fetch full details
      const res = await api.get(`/transactions/sales/${sale.id}`);
      setSelectedSale(res.data);
      setShowViewModal(true);
    } catch (err) {
      console.error('Failed to fetch sale details:', err);
      showMessage('error', 'خطا در بارگذاری جزئیات فروش');
    }
  };

  const openPayment = (sale: Sale) => {
    setSelectedSale(sale);
    const remaining = Math.max(0, sale.totalAmount - sale.paidAmount);
    setPaymentForm({
      amount: remaining.toString(),
      paymentMethod: sale.paymentMethod || 'CASH',
      paymentDate: new Date().toISOString().split('T')[0],
      referenceNumber: '',
      notes: '',
    });
    setShowPaymentModal(true);
  };

  const openCancel = (sale: Sale) => {
    setSelectedSale(sale);
    setCancelInfo({ reason: '', notes: '' });
    setShowCancelModal(true);
  };

  const openRefund = (sale: Sale) => {
    setSelectedSale(sale);
    setRefundInfo({
      amount: sale.totalAmount.toString(),
      reason: '',
      notes: '',
    });
    setShowRefundModal(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;

    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      return showMessage('error', 'مبلغ پرداختی را وارد کنید');
    }

    try {
      await api.post(`/transactions/sales/${selectedSale.id}/payment`, {
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        paymentDate: paymentForm.paymentDate,
        referenceNumber: paymentForm.referenceNumber || undefined,
        notes: paymentForm.notes || undefined,
      });

      showMessage('success', 'پرداخت با موفقیت ثبت شد');
      setShowPaymentModal(false);
      setSelectedSale(null);
      await Promise.all([fetchSales(), fetchSummary()]);
    } catch (err: any) {
      console.error('Payment error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در ثبت پرداخت');
    }
  };

  const handleComplete = async (id: string) => {
    if (!confirm('تکمیل فروش و بروزرسانی موجودی؟')) return;
    try {
      await api.post(`/transactions/sales/${id}/complete`, { notes: '' });
      showMessage('success', 'فروش تکمیل شد');
      await Promise.all([fetchSales(), fetchSummary()]);
    } catch (err: any) {
      console.error('Complete sale error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در تکمیل فروش');
    }
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;
    if (!cancelInfo.reason.trim()) {
      return showMessage('error', 'علت لغو را وارد کنید');
    }

    try {
      await api.post(`/transactions/sales/${selectedSale.id}/cancel`, {
        reason: cancelInfo.reason,
        notes: cancelInfo.notes || undefined,
      });
      showMessage('success', 'فروش لغو شد');
      setShowCancelModal(false);
      setSelectedSale(null);
      await Promise.all([fetchSales(), fetchSummary()]);
    } catch (err: any) {
      console.error('Cancel sale error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در لغو فروش');
    }
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;
    if (!refundInfo.amount || parseFloat(refundInfo.amount) <= 0) {
      return showMessage('error', 'مبلغ استرداد را وارد کنید');
    }
    if (!refundInfo.reason.trim()) {
      return showMessage('error', 'علت استرداد را وارد کنید');
    }

    try {
      await api.post(`/transactions/sales/${selectedSale.id}/refund`, {
        amount: parseFloat(refundInfo.amount),
        reason: refundInfo.reason,
        notes: refundInfo.notes || undefined,
      });
      showMessage('success', 'استرداد با موفقیت ثبت شد');
      setShowRefundModal(false);
      setSelectedSale(null);
      await Promise.all([fetchSales(), fetchSummary()]);
    } catch (err: any) {
      console.error('Refund error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در ثبت استرداد');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این فروش اطمینان دارید?')) return;
    try {
      await api.delete(`/transactions/sales/${id}`);
      showMessage('success', 'فروش با موفقیت حذف شد');
      await Promise.all([fetchSales(), fetchSummary()]);
    } catch (err: any) {
      console.error('Delete sale error:', err);
      showMessage('error', err.response?.data?.message || 'حذف فروش ممکن نیست');
    }
  };

  const getCustomerName = (c?: Customer) => {
    if (!c) return '—';
    return c.businessName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.code || '—';
  };

  const outstanding = (s: Sale) => Math.max(0, s.totalAmount - s.paidAmount);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">مدیریت فروش</h1>
              <p className="text-gray-600 dark:text-gray-400">مشاهده و مدیریت فاکتورهای فروش</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/transactions/sales/new')}
              className="flex items-center gap-2 px-6 py-3 text-white bg-amber-600 rounded-lg hover:bg-amber-700 font-medium"
            >
              <Plus className="h-5 w-5" />
              <span>فروش جدید</span>
            </button>
          </div>
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
              <Receipt className="h-5 w-5" />
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
                <p className="text-sm text-gray-600 dark:text-gray-400">جمع فروش</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatCurrency(summary?.totalRevenue || 0)}
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {new Intl.NumberFormat('fa-IR').format(summary?.totalSales || 0)} فاکتور
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">دریافتی</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {formatCurrency(summary?.totalPaid || 0)}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">مانده</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
                  {formatCurrency(summary?.outstandingAmount || 0)}
                </p>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">وضعیت‌ها</p>
            <div className="flex flex-wrap gap-2">
              {summary?.byStatus?.map((s) => (
                <span key={s.status} className={`text-xs px-2 py-1 rounded ${STATUS_BADGE(s.status)}`}>
                  {s.status}: {new Intl.NumberFormat('fa-IR').format(s.count)}
                </span>
              )) || <span className="text-sm text-gray-500">—</span>}
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
                placeholder="جستجو بر اساس شماره فاکتور یا توضیحات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {/* Status */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as Sale['status'] | '');
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">همه وضعیت‌ها</option>
                  <option value="DRAFT">پیش‌نویس</option>
                  <option value="COMPLETED">تکمیل شده</option>
                  <option value="CANCELLED">لغو شده</option>
                  <option value="REFUNDED">استرداد شده</option>
                  <option value="PARTIALLY_REFUNDED">استرداد جزئی</option>
                </select>

                {/* Customer */}
                {customers.length > 0 && (
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      setPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">همه مشتریان</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {getCustomerName(c)}
                      </option>
                    ))}
                  </select>
                )}

                {/* Branch */}
                {branches.length > 0 && (
                  <select
                    value={selectedBranchId}
                    onChange={(e) => {
                      setSelectedBranchId(e.target.value);
                      setPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">همه شعبات</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                )}

                {/* Payment Method */}
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => {
                    setPaymentMethodFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">همه روش‌های پرداخت</option>
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.value} value={pm.value}>
                      {pm.label}
                    </option>
                  ))}
                </select>

                {/* Date range */}
                <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setPage(1);
                    }}
                    className="bg-transparent border-none focus:ring-0 text-sm dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setPage(1);
                    }}
                    className="bg-transparent border-none focus:ring-0 text-sm dark:text-white"
                  />
                </div>

                {/* Amount range */}
                <input
                  type="number"
                  value={minAmount}
                  onChange={(e) => {
                    setMinAmount(e.target.value);
                    setPage(1);
                  }}
                  placeholder="حداقل مبلغ"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <input
                  type="number"
                  value={maxAmount}
                  onChange={(e) => {
                    setMaxAmount(e.target.value);
                    setPage(1);
                  }}
                  placeholder="حداکثر مبلغ"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="saleDate">مرتب‌سازی: تاریخ فروش</option>
                  <option value="totalAmount">مرتب‌سازی: مبلغ کل</option>
                  <option value="createdAt">مرتب‌سازی: ایجاد</option>
                  <option value="updatedAt">مرتب‌سازی: بروزرسانی</option>
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

              <button
                onClick={() => fetchSales()}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <RefreshCw className="h-5 w-5" />
                <span className="hidden md:inline">بروزرسانی</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Receipt className="h-16 w-16 mb-4 opacity-50" />
              <p>هیچ فروشی یافت نشد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      شماره/تاریخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      مشتری/شعبه
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      مبالغ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      وضعیت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      پرداخت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {sales.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="text-gray-900 dark:text-white font-semibold">{s.invoiceNumber}</div>
                        <div className="text-gray-500 dark:text-gray-400">{formatDate(s.saleDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-200">
                          <User className="h-4 w-4 text-gray-400" />
                          {getCustomerName(s.customer)}
                        </div>
                        {s.branch && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <Building2 className="h-4 w-4" />
                            {s.branch.name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="text-gray-900 dark:text-gray-200">
                          کل: <span className="font-semibold">{formatCurrency(s.totalAmount)}</span>
                        </div>
                        {s.discountAmount > 0 && (
                          <div className="text-xs text-purple-600 dark:text-purple-400">
                            تخفیف: {formatCurrency(s.discountAmount)}
                          </div>
                        )}
                        {s.taxAmount > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            مالیات: {formatCurrency(s.taxAmount)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${STATUS_BADGE(s.status)}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="text-green-600 dark:text-green-400 font-semibold">
                          {formatCurrency(s.paidAmount)}
                        </div>
                        {outstanding(s) > 0 && (
                          <div className="text-amber-600 dark:text-amber-400 text-xs">
                            مانده: {formatCurrency(outstanding(s))}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {PAYMENT_METHODS.find(pm => pm.value === s.paymentMethod)?.label || s.paymentMethod}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openView(s)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="مشاهده"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          {s.status !== 'CANCELLED' && outstanding(s) > 0 && (
                            <button
                              onClick={() => openPayment(s)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="ثبت پرداخت"
                            >
                              <CreditCard className="h-4 w-4" />
                            </button>
                          )}
                          {s.status === 'DRAFT' && (
                            <button
                              onClick={() => handleComplete(s.id)}
                              className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300"
                              title="تکمیل فروش"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          {s.status !== 'CANCELLED' && s.status !== 'REFUNDED' && (
                            <>
                              <button
                                onClick={() => openCancel(s)}
                                className="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
                                title="لغو"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                              {s.status === 'COMPLETED' && (
                                <button
                                  onClick={() => openRefund(s)}
                                  className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                                  title="استرداد"
                                >
                                  <DollarSign className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                          {s.status === 'DRAFT' && (
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
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
                  {new Intl.NumberFormat('fa-IR').format(Math.min(page * limit, total || 0))} از{' '}
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

      {/* View Modal */}
      {showViewModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">جزئیات فاکتور</h2>
              <button onClick={() => { setShowViewModal(false); setSelectedSale(null); }}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">شماره فاکتور</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedSale.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">تاریخ</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatDate(selectedSale.saleDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">مشتری</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{getCustomerName(selectedSale.customer)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">وضعیت</p>
                  <span className={`inline-block px-3 py-1 rounded text-sm ${STATUS_BADGE(selectedSale.status)}`}>
                    {selectedSale.status}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">اقلام فاکتور</h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">محصول</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">تعداد</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">قیمت واحد</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">جمع</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedSale.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {item.product?.name || item.product?.sku || item.productId}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">جمع جزء:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">تخفیف:</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">-{formatCurrency(selectedSale.discountAmount)}</span>
                  </div>
                )}
                {selectedSale.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">مالیات:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedSale.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg border-t border-gray-300 dark:border-gray-600 pt-2">
                  <span className="font-bold text-gray-900 dark:text-white">جمع کل:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(selectedSale.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">پرداخت شده:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(selectedSale.paidAmount)}</span>
                </div>
                {outstanding(selectedSale) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">مانده:</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(outstanding(selectedSale))}</span>
                  </div>
                )}
              </div>

              {/* Payments */}
              {selectedSale.payments && selectedSale.payments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">پرداخت‌ها</h3>
                  <div className="space-y-2">
                    {selectedSale.payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(payment.paymentDate)} - {PAYMENT_METHODS.find(pm => pm.value === payment.paymentMethod)?.label}
                          </p>
                        </div>
                        {payment.referenceNumber && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            شماره پیگیری: {payment.referenceNumber}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">ثبت پرداخت</h2>
              </div>
              <button onClick={() => { setShowPaymentModal(false); setSelectedSale(null); }}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handlePayment} className="p-6 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">فاکتور:</span> {selectedSale.invoiceNumber}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">مبلغ کل:</span> {formatCurrency(selectedSale.totalAmount)}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">پرداخت شده:</span> {formatCurrency(selectedSale.paidAmount)}
                </p>
                <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  <span>مانده:</span> {formatCurrency(outstanding(selectedSale))}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مبلغ پرداختی *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">روش پرداخت *</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.value} value={pm.value}>{pm.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ پرداخت *</label>
                <input
                  type="date"
                  required
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شماره پیگیری</label>
                <input
                  type="text"
                  value={paymentForm.referenceNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                <textarea
                  rows={2}
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  <Save className="h-5 w-5" />
                  ثبت پرداخت
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPaymentModal(false); setSelectedSale(null); }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-medium"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">لغو فروش</h2>
              </div>
              <button onClick={() => { setShowCancelModal(false); setSelectedSale(null); }}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCancel} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">علت لغو *</label>
                <input
                  type="text"
                  required
                  value={cancelInfo.reason}
                  onChange={(e) => setCancelInfo({ ...cancelInfo, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                <textarea
                  rows={3}
                  value={cancelInfo.notes}
                  onChange={(e) => setCancelInfo({ ...cancelInfo, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                >
                  تایید لغو
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCancelModal(false); setSelectedSale(null); }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-medium"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">استرداد وجه</h2>
              </div>
              <button onClick={() => { setShowRefundModal(false); setSelectedSale(null); }}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleRefund} className="p-6 space-y-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  مبلغ فاکتور: {formatCurrency(selectedSale.totalAmount)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مبلغ استرداد *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={refundInfo.amount}
                  onChange={(e) => setRefundInfo({ ...refundInfo, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">علت استرداد *</label>
                <input
                  type="text"
                  required
                  value={refundInfo.reason}
                  onChange={(e) => setRefundInfo({ ...refundInfo, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                <textarea
                  rows={3}
                  value={refundInfo.notes}
                  onChange={(e) => setRefundInfo({ ...refundInfo, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  ثبت استرداد
                </button>
                <button
                  type="button"
                  onClick={() => { setShowRefundModal(false); setSelectedSale(null); }}
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