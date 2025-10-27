// frontend/src/app/dashboard/financials/payables/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import {
  Plus,
  RefreshCw,
  X,
  Save,
  Edit2,
  Trash2,
  AlertCircle,
  Calendar,
  FileText,
  Banknote,
  Clock,
  CheckCircle2,
} from 'lucide-react';

type Supplier = {
  id: string;
  code?: string;
  name: string;
  phone?: string | null;
  email?: string | null;
};

type Payable = {
  id: string;
  supplierId: string;
  supplier?: Supplier;
  invoiceNumber: string;
  invoiceDate: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate?: string | null;
  status: string; // PENDING, PARTIAL, PAID, (OVERDUE by manual set)
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

type PagedResult = {
  items: Payable[];
  total: number;
  page: number;
  limit: number;
};

type Summary = {
  totalDue: number;      // sum remainingAmount
  totalPaid: number;     // sum amount where status = PAID
  totalPending: number;  // sum remainingAmount where status in [PENDING, PARTIAL]
  overdue: { amount: number; count: number };
};

type CreateEditForm = {
  supplierId: string;
  invoiceNumber: string;
  invoiceDate: string;
  amount: string;
  paidAmount: string;
  dueDate: string;
  notes: string;
};

type PaymentForm = {
  paymentAmount: string;
  notes: string;
};

const STATUS_BADGE = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'PARTIAL':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'PENDING':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    case 'OVERDUE':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

export default function PayablesPage() {
  // Data
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoaded, setSuppliersLoaded] = useState(false);
  const [manualSupplierId, setManualSupplierId] = useState('');

  const [payables, setPayables] = useState<Payable[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  // Loading
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Filters
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>(''); // '', PENDING, PARTIAL, PAID, OVERDUE
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [overdueOnly, setOverdueOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'invoiceDate' | 'dueDate' | 'amount' | 'remainingAmount'>('invoiceDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);

  // UI
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);

  // Forms
  const [formData, setFormData] = useState<CreateEditForm>({
    supplierId: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    amount: '',
    paidAmount: '',
    dueDate: '',
    notes: '',
  });

  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    paymentAmount: '',
    notes: '',
  });

  useEffect(() => {
    // Default last 30 days
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 30);
    setToDate(today.toISOString().split('T')[0]);
    setFromDate(from.toISOString().split('T')[0]);

    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchPayables();
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSupplierId, statusFilter, fromDate, toDate, overdueOnly, sortBy, sortOrder, page, limit]);

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

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers', { params: { limit: 100 } });
      const list = res.data?.items || res.data || [];
      setSuppliers(list);
      setSuppliersLoaded(true);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
      setSuppliers([]);
      setSuppliersLoaded(true);
    }
  };

  const fetchPayables = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit, sortBy, sortOrder };
      if (selectedSupplierId) params.supplierId = selectedSupplierId;
      if (statusFilter) params.status = statusFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (overdueOnly) params.overdue = 'true';

      const res = await api.get<PagedResult>('/financials/accounts-payable', { params });
      setPayables(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch payables:', err);
      showMessage('error', 'خطا در بارگذاری پرداختنی‌ها');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      const params: any = {};
      if (selectedSupplierId) params.supplierId = selectedSupplierId;
      const res = await api.get<Summary>('/financials/accounts-payable/summary', { params });
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      supplierId: selectedSupplierId || manualSupplierId || '',
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      amount: '',
      paidAmount: '',
      dueDate: '',
      notes: '',
    });
  };

  const openEdit = (row: Payable) => {
    setSelectedPayable(row);
    setFormData({
      supplierId: row.supplierId,
      invoiceNumber: row.invoiceNumber || '',
      invoiceDate: row.invoiceDate ? new Date(row.invoiceDate).toISOString().split('T')[0] : '',
      amount: row.amount?.toString() || '',
      paidAmount: row.paidAmount?.toString() || '',
      dueDate: row.dueDate ? new Date(row.dueDate).toISOString().split('T')[0] : '',
      notes: row.notes || '',
    });
    setShowEditModal(true);
  };

  const openPayment = (row: Payable) => {
    setSelectedPayable(row);
    setPaymentForm({ paymentAmount: '', notes: '' });
    setShowPaymentModal(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    const supplierIdToUse = formData.supplierId || manualSupplierId;
    if (!supplierIdToUse) return showMessage('error', 'لطفاً تامین‌کننده را انتخاب یا شناسه را وارد کنید');
    if (!formData.invoiceNumber.trim()) return showMessage('error', 'شماره فاکتور الزامی است');
    if (!formData.amount || isNaN(parseFloat(formData.amount))) return showMessage('error', 'مبلغ معتبر نیست');

    try {
      await api.post('/financials/accounts-payable', {
        supplierId: supplierIdToUse,
        invoiceNumber: formData.invoiceNumber,
        invoiceDate: formData.invoiceDate,
        amount: parseFloat(formData.amount),
        paidAmount: formData.paidAmount ? parseFloat(formData.paidAmount) : undefined,
        dueDate: formData.dueDate || undefined,
        notes: formData.notes || undefined,
      });

      showMessage('success', 'بدهی پرداختنی با موفقیت ثبت شد');
      setShowAddModal(false);
      resetForm();
      setPage(1);
      await Promise.all([fetchPayables(), fetchSummary()]);
    } catch (err: any) {
      console.error('Create AP error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در ثبت پرداختنی');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayable) return;

    try {
      await api.patch(`/financials/accounts-payable/${selectedPayable.id}`, {
        supplierId: formData.supplierId || undefined,
        invoiceNumber: formData.invoiceNumber || undefined,
        invoiceDate: formData.invoiceDate || undefined,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        paidAmount: formData.paidAmount ? parseFloat(formData.paidAmount) : undefined,
        dueDate: formData.dueDate || undefined,
        notes: formData.notes || undefined,
      });

      showMessage('success', 'پرداختنی با موفقیت ویرایش شد');
      setShowEditModal(false);
      setSelectedPayable(null);
      resetForm();
      await Promise.all([fetchPayables(), fetchSummary()]);
    } catch (err: any) {
      console.error('Update AP error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در ویرایش پرداختنی');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayable) return;
    if (!paymentForm.paymentAmount || isNaN(parseFloat(paymentForm.paymentAmount))) {
      return showMessage('error', 'مبلغ پرداخت معتبر نیست');
    }
    const payAmt = parseFloat(paymentForm.paymentAmount);
    if (payAmt <= 0) return showMessage('error', 'مبلغ پرداخت باید بزرگتر از صفر باشد');
    // Optional UI validation against remaining amount
    if (selectedPayable.remainingAmount != null && payAmt > selectedPayable.remainingAmount) {
      return showMessage('error', 'مبلغ پرداخت از بدهی باقی‌مانده بیشتر است');
    }

    try {
      await api.post(`/financials/accounts-payable/${selectedPayable.id}/payment`, {
        paymentAmount: payAmt,
        notes: paymentForm.notes || undefined,
      });

      showMessage('success', 'پرداخت ثبت شد');
      setShowPaymentModal(false);
      setSelectedPayable(null);
      await Promise.all([fetchPayables(), fetchSummary()]);
    } catch (err: any) {
      console.error('Record payment error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در ثبت پرداخت');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این پرداختنی اطمینان دارید؟')) return;
    try {
      await api.delete(`/financials/accounts-payable/${id}`);
      showMessage('success', 'پرداختنی حذف شد');
      await Promise.all([fetchPayables(), fetchSummary()]);
    } catch (err: any) {
      console.error('Delete AP error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در حذف پرداختنی');
    }
  };

  const topSupplier = useMemo(() => {
    if (!payables.length) return null;
    const map: Record<string, number> = {};
    for (const p of payables) {
      const key = p.supplier?.name || p.supplierId;
      map[key] = (map[key] || 0) + (p.remainingAmount || 0);
    }
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted.length ? { name: sorted[0][0], amount: sorted[0][1] } : null;
  }, [payables]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">حساب‌های پرداختنی</h1>
          <p className="text-gray-600 dark:text-gray-400">مدیریت بدهی‌ها و پرداخت‌ها به تامین‌کنندگان</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">مجموع بدهی مانده</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                  {formatCurrency(summary?.totalDue || 0)}
                </p>
              </div>
              <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">مبلغ پرداخت شده</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">بدهی‌های جاری</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
                  {formatCurrency(summary?.totalPending || 0)}
                </p>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-full">
                <Banknote className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">معوقات</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {new Intl.NumberFormat('fa-IR').format(summary?.overdue?.count || 0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(summary?.overdue?.amount || 0)}
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
                <Clock className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {/* Supplier selector or manual input */}
                {suppliersLoaded && suppliers.length > 0 ? (
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => {
                      setSelectedSupplierId(e.target.value);
                      setPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">همه تامین‌کنندگان</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.code ? `(${s.code})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={manualSupplierId}
                    onChange={(e) => {
                      setManualSupplierId(e.target.value);
                      setSelectedSupplierId(e.target.value);
                      setPage(1);
                    }}
                    placeholder="شناسه تامین‌کننده"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                )}

                {/* Status */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">همه وضعیت‌ها</option>
                  <option value="PENDING">در انتظار</option>
                  <option value="PARTIAL">جزئی پرداخت شده</option>
                  <option value="PAID">تسویه شده</option>
                  <option value="OVERDUE">معوق</option>
                </select>

                {/* Date range (Invoice date) */}
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
                    placeholder="از تاریخ فاکتور"
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
                    placeholder="تا تاریخ فاکتور"
                  />
                </div>

                {/* Overdue only */}
                <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={overdueOnly}
                    onChange={(e) => {
                      setOverdueOnly(e.target.checked);
                      setPage(1);
                    }}
                    className="h-4 w-4 text-amber-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">فقط معوق</span>
                </label>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="invoiceDate">مرتب‌سازی: تاریخ فاکتور</option>
                  <option value="dueDate">مرتب‌سازی: سررسید</option>
                  <option value="amount">مرتب‌سازی: مبلغ</option>
                  <option value="remainingAmount">مرتب‌سازی: مانده</option>
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
                  onClick={() => fetchPayables()}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span className="hidden md:inline">بروزرسانی</span>
                </button>

                <button
                  onClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-white bg-amber-600 rounded-lg hover:bg-amber-700"
                >
                  <Plus className="h-5 w-5" />
                  <span>ثبت پرداختنی</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
          ) : payables.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FileText className="h-16 w-16 mb-4 opacity-50" />
              <p>هیچ پرداختنی‌ای یافت نشد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      تامین‌کننده
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      فاکتور/تاریخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      سررسید
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      مبلغ‌ها
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
                  {payables.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {p.supplier?.name || '—'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {p.supplier?.code ? `کد: ${p.supplier.code}` : p.supplierId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        <div>فاکتور: {p.invoiceNumber}</div>
                        <div className="text-gray-500 dark:text-gray-400">تاریخ: {formatDate(p.invoiceDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {formatDate(p.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="text-gray-900 dark:text-gray-200">
                          کل: <span className="font-semibold">{formatCurrency(p.amount)}</span>
                        </div>
                        <div className="text-green-600 dark:text-green-400">
                          پرداخت‌شده: <span className="font-semibold">{formatCurrency(p.paidAmount)}</span>
                        </div>
                        <div className="text-red-600 dark:text-red-400">
                          باقی‌مانده: <span className="font-semibold">{formatCurrency(p.remainingAmount)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${STATUS_BADGE(p.status)}`}>{p.status}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(p)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="ویرایش"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {p.status !== 'PAID' && (
                            <button
                              onClick={() => openPayment(p)}
                              className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300"
                              title="ثبت پرداخت"
                            >
                              <Banknote className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="حذف"
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">ثبت پرداختنی جدید</h2>
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
              {/* Supplier field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تامین‌کننده *</label>
                {suppliersLoaded && suppliers.length > 0 ? (
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">انتخاب تامین‌کننده</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.code ? `(${s.code})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>
                    <input
                      type="text"
                      required
                      value={formData.supplierId || manualSupplierId}
                      onChange={(e) => {
                        setFormData({ ...formData, supplierId: e.target.value });
                        setManualSupplierId(e.target.value);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="شناسه تامین‌کننده (UUID)"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">لیست تامین‌کنندگان در دسترس نیست</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شماره فاکتور *</label>
                  <input
                    type="text"
                    required
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="INV-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ فاکتور *</label>
                  <input
                    type="date"
                    required
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مبلغ کل (ریال) *</label>
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
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">پرداخت‌شده (اختیاری)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="0"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ سررسید</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="توضیحات..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                >
                  <Save className="h-5 w-5" />
                  ثبت پرداختنی
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
      {showEditModal && selectedPayable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">ویرایش پرداختنی</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedPayable(null);
                  resetForm();
                }}
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="p-6 space-y-4">
              {/* Supplier - read only display */}
              <div className="text-sm text-gray-600 dark:text-gray-300">
                تامین‌کننده: <span className="font-medium">{selectedPayable.supplier?.name || selectedPayable.supplierId}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شماره فاکتور</label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ فاکتور</label>
                  <input
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مبلغ کل</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">پرداخت‌شده</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">سررسید</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="توضیحات..."
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
                    setSelectedPayable(null);
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

      {/* Record Payment Modal */}
      {showPaymentModal && selectedPayable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">ثبت پرداخت به تامین‌کننده</h2>
              </div>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPayable(null);
                }}
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                مانده قابل پرداخت: <span className="font-semibold">{formatCurrency(selectedPayable.remainingAmount)}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مبلغ پرداخت (ریال) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentForm.paymentAmount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentAmount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                <textarea
                  rows={3}
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="مانند شماره مرجع یا توضیحات پرداخت..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  ثبت پرداخت
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPayable(null);
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