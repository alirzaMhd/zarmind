// frontend/src/app/dashboard/transactions/returns/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
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
  Package,
  Calendar,
  DollarSign,
  AlertCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

type Customer = {
  id: string;
  code?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  businessName?: string | null;
  phone?: string | null;
  email?: string | null;
};

type Supplier = {
  id: string;
  code?: string | null;
  name: string;
  phone?: string | null;
  email?: string | null;
};

type Sale = {
  id: string;
  invoiceNumber: string;
  saleDate: string;
  totalAmount: number;
  customer?: Customer;
};

type Purchase = {
  id: string;
  purchaseNumber: string;
  purchaseDate: string;
  totalAmount: number;
  supplier?: Supplier;
};

type Return = {
  id: string;
  returnNumber: string;
  returnDate: string;
  type: 'CUSTOMER_RETURN' | 'SUPPLIER_RETURN';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  reason?: 'DEFECTIVE' | 'WRONG_ITEM' | 'CUSTOMER_REQUEST' | 'QUALITY_ISSUE' | 'OTHER' | null;
  originalSaleId?: string | null;
  originalSale?: Sale;
  originalPurchaseId?: string | null;
  originalPurchase?: Purchase;
  customerId?: string | null;
  supplierId?: string | null;
  reasonDetails?: string | null;
  refundAmount: number;
  refundMethod?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedReason?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

type PagedResult = {
  items: Return[];
  total: number;
  page: number;
  limit: number;
};

type Summary = {
  period: { from: string; to: string };
  totalReturns: number;
  totalRefundAmount: number;
  byStatus: Array<{ status: Return['status']; count: number; refundAmount: number }>;
  byReason: Array<{ reason: string; count: number }>;
  byType: Array<{ type: Return['type']; count: number; refundAmount: number }>;
};

type CreateEditForm = {
  type: 'CUSTOMER_RETURN' | 'SUPPLIER_RETURN';
  returnDate: string;
  reason: '' | 'DEFECTIVE' | 'WRONG_ITEM' | 'CUSTOMER_REQUEST' | 'QUALITY_ISSUE' | 'OTHER';
  originalSaleId: string;
  originalPurchaseId: string;
  customerId: string;
  supplierId: string;
  reasonDetails: string;
  refundAmount: string;
  refundMethod: string;
  notes: string;
};

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'نقدی' },
  { value: 'BANK_TRANSFER', label: 'حواله بانکی' },
  { value: 'CARD', label: 'کارت' },
  { value: 'CHECK', label: 'چک' },
];

const RETURN_REASONS = [
  { value: 'DEFECTIVE', label: 'معیوب' },
  { value: 'WRONG_ITEM', label: 'کالای اشتباه' },
  { value: 'CUSTOMER_REQUEST', label: 'درخواست مشتری' },
  { value: 'QUALITY_ISSUE', label: 'مشکل کیفیت' },
  { value: 'OTHER', label: 'سایر' },
];

const STATUS_BADGE = (status: Return['status']) => {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'APPROVED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'REJECTED':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

const TYPE_BADGE = (type: Return['type']) => {
  return type === 'CUSTOMER_RETURN'
    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
};

export default function ReturnsPage() {
  const { user } = useAuthStore();

  // Data
  const [returns, setReturns] = useState<Return[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Loading
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | Return['type']>('');
  const [statusFilter, setStatusFilter] = useState<'' | Return['status']>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'returnDate' | 'refundAmount'>('returnDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);

  // UI
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);

  // Forms
  const [formData, setFormData] = useState<CreateEditForm>({
    type: 'CUSTOMER_RETURN',
    returnDate: new Date().toISOString().split('T')[0],
    reason: '',
    originalSaleId: '',
    originalPurchaseId: '',
    customerId: '',
    supplierId: '',
    reasonDetails: '',
    refundAmount: '',
    refundMethod: 'CASH',
    notes: '',
  });

  const [approveNotes, setApproveNotes] = useState('');
  const [rejectInfo, setRejectInfo] = useState<{ reason: string; notes: string }>({ reason: '', notes: '' });
  const [completeNotes, setCompleteNotes] = useState('');

  useEffect(() => {
    // Default last 30 days
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 30);
    setToDate(today.toISOString().split('T')[0]);
    setFromDate(from.toISOString().split('T')[0]);

    fetchCustomers();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchReturns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter, selectedCustomerId, selectedSupplierId, fromDate, toDate, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, typeFilter]);

  // Auto-search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) {
        setPage(1);
      } else {
        fetchReturns();
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

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers', { params: { limit: 100, status: 'ACTIVE' } });
      const list = res.data?.items || res.data || [];
      setSuppliers(list);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
      setSuppliers([]);
    }
  };

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit, sortBy, sortOrder };
      if (searchTerm) params.search = searchTerm;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (selectedCustomerId) params.customerId = selectedCustomerId;
      if (selectedSupplierId) params.supplierId = selectedSupplierId;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res = await api.get<PagedResult>('/transactions/returns', { params });
      setReturns(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch returns:', err);
      showMessage('error', 'خطا در بارگذاری مرجوعی‌ها');
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
      if (typeFilter) params.type = typeFilter;
      const res = await api.get<Summary>('/transactions/returns/summary', { params });
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to fetch returns summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'CUSTOMER_RETURN',
      returnDate: new Date().toISOString().split('T')[0],
      reason: '',
      originalSaleId: '',
      originalPurchaseId: '',
      customerId: '',
      supplierId: '',
      reasonDetails: '',
      refundAmount: '',
      refundMethod: 'CASH',
      notes: '',
    });
  };

  const openEdit = (row: Return) => {
    setSelectedReturn(row);
    setFormData({
      type: row.type,
      returnDate: row.returnDate ? new Date(row.returnDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      reason: (row.reason as any) || '',
      originalSaleId: row.originalSaleId || '',
      originalPurchaseId: row.originalPurchaseId || '',
      customerId: row.customerId || '',
      supplierId: row.supplierId || '',
      reasonDetails: row.reasonDetails || '',
      refundAmount: row.refundAmount?.toString() || '',
      refundMethod: row.refundMethod || 'CASH',
      notes: row.notes || '',
    });
    setShowEditModal(true);
  };

  const openApprove = (row: Return) => {
    setSelectedReturn(row);
    setApproveNotes('');
    setShowApproveModal(true);
  };

  const openReject = (row: Return) => {
    setSelectedReturn(row);
    setRejectInfo({ reason: '', notes: '' });
    setShowRejectModal(true);
  };

  const openComplete = (row: Return) => {
    setSelectedReturn(row);
    setCompleteNotes('');
    setShowCompleteModal(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.type === 'CUSTOMER_RETURN' && !formData.originalSaleId) {
      return showMessage('error', 'لطفاً شماره فاکتور فروش را وارد کنید');
    }

    if (formData.type === 'SUPPLIER_RETURN' && !formData.originalPurchaseId) {
      return showMessage('error', 'لطفاً شماره خرید را وارد کنید');
    }

    if (!formData.refundAmount || parseFloat(formData.refundAmount) <= 0) {
      return showMessage('error', 'مبلغ مرجوعی را وارد کنید');
    }

    try {
      await api.post('/transactions/returns', {
        type: formData.type,
        returnDate: formData.returnDate,
        reason: formData.reason || undefined,
        originalSaleId: formData.type === 'CUSTOMER_RETURN' ? formData.originalSaleId : undefined,
        originalPurchaseId: formData.type === 'SUPPLIER_RETURN' ? formData.originalPurchaseId : undefined,
        customerId: formData.customerId || undefined,
        supplierId: formData.supplierId || undefined,
        reasonDetails: formData.reasonDetails || undefined,
        refundAmount: parseFloat(formData.refundAmount),
        refundMethod: formData.refundMethod || undefined,
        notes: formData.notes || undefined,
      });

      showMessage('success', 'مرجوعی با موفقیت ثبت شد');
      setShowAddModal(false);
      resetForm();
      setPage(1);
      await Promise.all([fetchReturns(), fetchSummary()]);
    } catch (err: any) {
      console.error('Create return error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در ثبت مرجوعی');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;

    try {
      await api.patch(`/transactions/returns/${selectedReturn.id}`, {
        returnDate: formData.returnDate || undefined,
        reason: formData.reason || undefined,
        reasonDetails: formData.reasonDetails || undefined,
        refundAmount: formData.refundAmount ? parseFloat(formData.refundAmount) : undefined,
        refundMethod: formData.refundMethod || undefined,
        notes: formData.notes || undefined,
      });

      showMessage('success', 'مرجوعی با موفقیت ویرایش شد');
      setShowEditModal(false);
      setSelectedReturn(null);
      resetForm();
      await Promise.all([fetchReturns(), fetchSummary()]);
    } catch (err: any) {
      console.error('Update return error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در ویرایش مرجوعی');
    }
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;

    try {
      await api.post(`/transactions/returns/${selectedReturn.id}/approve`, {
        notes: approveNotes || undefined,
      });

      showMessage('success', 'مرجوعی تایید شد');
      setShowApproveModal(false);
      setSelectedReturn(null);
      await Promise.all([fetchReturns(), fetchSummary()]);
    } catch (err: any) {
      console.error('Approve return error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در تایید مرجوعی');
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;
    if (!rejectInfo.reason.trim()) {
      return showMessage('error', 'علت رد را وارد کنید');
    }

    try {
      await api.post(`/transactions/returns/${selectedReturn.id}/reject`, {
        reason: rejectInfo.reason,
        notes: rejectInfo.notes || undefined,
      });

      showMessage('success', 'مرجوعی رد شد');
      setShowRejectModal(false);
      setSelectedReturn(null);
      await Promise.all([fetchReturns(), fetchSummary()]);
    } catch (err: any) {
      console.error('Reject return error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در رد مرجوعی');
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;

    try {
      await api.post(`/transactions/returns/${selectedReturn.id}/complete`, {
        notes: completeNotes || undefined,
      });

      showMessage('success', 'مرجوعی تکمیل شد');
      setShowCompleteModal(false);
      setSelectedReturn(null);
      await Promise.all([fetchReturns(), fetchSummary()]);
    } catch (err: any) {
      console.error('Complete return error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در تکمیل مرجوعی');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این مرجوعی اطمینان دارید؟')) return;
    try {
      await api.delete(`/transactions/returns/${id}`);
      showMessage('success', 'مرجوعی با موفقیت حذف شد');
      await Promise.all([fetchReturns(), fetchSummary()]);
    } catch (err: any) {
      console.error('Delete return error:', err);
      showMessage('error', err.response?.data?.message || 'حذف مرجوعی ممکن نیست');
    }
  };

  const getCustomerLabel = (r: Return) => {
    if (r.originalSale?.customer) {
      const c = r.originalSale.customer;
      return c.businessName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.code || '—';
    }
    return '—';
  };

  const getSupplierLabel = (r: Return) => {
    if (r.originalPurchase?.supplier) {
      return r.originalPurchase.supplier.name || r.originalPurchase.supplier.code || '—';
    }
    return '—';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">مدیریت مرجوعی‌ها</h1>
          <p className="text-gray-600 dark:text-gray-400">ثبت و مدیریت مرجوعی از مشتری و به تامین‌کننده</p>
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
              <Package className="h-5 w-5" />
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
                <p className="text-sm text-gray-600 dark:text-gray-400">مجموع مرجوعی‌ها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {new Intl.NumberFormat('fa-IR').format(summary?.totalReturns || 0)}
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
                <Package className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              بازه: {summary ? `${formatDate(summary.period.from)} تا ${formatDate(summary.period.to)}` : '—'}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">جمع مبلغ استرداد</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                  {formatCurrency(summary?.totalRefundAmount || 0)}
                </p>
              </div>
              <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">بر اساس نوع</p>
            <div className="space-y-2">
              {summary?.byType?.map((t) => (
                <div key={t.type} className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded ${TYPE_BADGE(t.type)}`}>
                    {t.type === 'CUSTOMER_RETURN' ? 'از مشتری' : 'به تامین‌کننده'}
                  </span>
                  <div className="text-sm text-gray-900 dark:text-gray-200">
                    {new Intl.NumberFormat('fa-IR').format(t.count)} - {formatCurrency(t.refundAmount)}
                  </div>
                </div>
              )) || <span className="text-sm text-gray-500">—</span>}
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
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              <p className="font-semibold mb-1">دلایل مرجوعی:</p>
              {summary?.byReason?.slice(0, 3).map((r) => (
                <div key={r.reason} className="flex justify-between">
                  <span>{RETURN_REASONS.find(rr => rr.value === r.reason)?.label || r.reason}</span>
                  <span>{new Intl.NumberFormat('fa-IR').format(r.count)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* Search - Auto search */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="جستجو بر اساس شماره مرجوعی، دلیل یا توضیحات..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {/* Type */}
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value as Return['type'] | '');
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">همه انواع</option>
                  <option value="CUSTOMER_RETURN">مرجوعی از مشتری</option>
                  <option value="SUPPLIER_RETURN">مرجوعی به تامین‌کننده</option>
                </select>

                {/* Status */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as Return['status'] | '');
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">همه وضعیت‌ها</option>
                  <option value="PENDING">در انتظار</option>
                  <option value="APPROVED">تایید شده</option>
                  <option value="REJECTED">رد شده</option>
                  <option value="COMPLETED">تکمیل شده</option>
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
                        {c.businessName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.code}
                      </option>
                    ))}
                  </select>
                )}

                {/* Supplier */}
                {suppliers.length > 0 && (
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
                )}

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

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="returnDate">مرتب‌سازی: تاریخ</option>
                  <option value="refundAmount">مرتب‌سازی: مبلغ</option>
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

              <div className="flex gap-2">
                <button
                  onClick={() => fetchReturns()}
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
                  <span>ثبت مرجوعی</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Returns Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
          ) : returns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Package className="h-16 w-16 mb-4 opacity-50" />
              <p>هیچ مرجوعی یافت نشد</p>
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
                      نوع/مرجع
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      مشتری/تامین‌کننده
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      مبلغ استرداد
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      دلیل
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
                  {returns.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="text-gray-900 dark:text-white font-semibold">{r.returnNumber}</div>
                        <div className="text-gray-500 dark:text-gray-400">{formatDate(r.returnDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${TYPE_BADGE(r.type)}`}>
                            {r.type === 'CUSTOMER_RETURN' ? (
                              <span className="flex items-center gap-1">
                                <TrendingDown className="h-3 w-3" />
                                مشتری
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                تامین‌کننده
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {r.type === 'CUSTOMER_RETURN'
                            ? `فاکتور: ${r.originalSale?.invoiceNumber || '—'}`
                            : `خرید: ${r.originalPurchase?.purchaseNumber || '—'}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {r.type === 'CUSTOMER_RETURN' ? getCustomerLabel(r) : getSupplierLabel(r)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="text-red-600 dark:text-red-400 font-semibold">
                          {formatCurrency(r.refundAmount)}
                        </div>
                        {r.refundMethod && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {PAYMENT_METHODS.find(pm => pm.value === r.refundMethod)?.label || r.refundMethod}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {r.reason && (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-amber-500" />
                            <span className="text-gray-900 dark:text-gray-200">
                              {RETURN_REASONS.find(rr => rr.value === r.reason)?.label || r.reason}
                            </span>
                          </div>
                        )}
                        {r.reasonDetails && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs truncate">
                            {r.reasonDetails}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${STATUS_BADGE(r.status)}`}>{r.status}</span>
                        {r.status === 'REJECTED' && r.rejectedReason && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {r.rejectedReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {r.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => openEdit(r)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="ویرایش"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openApprove(r)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                title="تایید"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openReject(r)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                title="رد"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {r.status === 'APPROVED' && (
                            <button
                              onClick={() => openComplete(r)}
                              className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300"
                              title="تکمیل"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          {r.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">ثبت مرجوعی جدید</h2>
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
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع مرجوعی *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="CUSTOMER_RETURN">مرجوعی از مشتری</option>
                  <option value="SUPPLIER_RETURN">مرجوعی به تامین‌کننده</option>
                </select>
              </div>

              {/* Original Sale/Purchase */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.type === 'CUSTOMER_RETURN' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      شناسه فاکتور فروش *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.originalSaleId}
                      onChange={(e) => setFormData({ ...formData, originalSaleId: e.target.value })}
                      placeholder="UUID فاکتور فروش"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      شناسه خرید *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.originalPurchaseId}
                      onChange={(e) => setFormData({ ...formData, originalPurchaseId: e.target.value })}
                      placeholder="UUID خرید"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ مرجوعی *</label>
                  <input
                    type="date"
                    required
                    value={formData.returnDate}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Reason and Amount */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">دلیل مرجوعی</label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">انتخاب کنید</option>
                    {RETURN_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مبلغ استرداد *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.refundAmount}
                    onChange={(e) => setFormData({ ...formData, refundAmount: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">روش استرداد</label>
                  <select
                    value={formData.refundMethod}
                    onChange={(e) => setFormData({ ...formData, refundMethod: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm.value} value={pm.value}>
                        {pm.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reason Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">جزئیات دلیل</label>
                <textarea
                  rows={2}
                  value={formData.reasonDetails}
                  onChange={(e) => setFormData({ ...formData, reasonDetails: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="توضیحات دلیل مرجوعی..."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="توضیحات اضافی..."
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                >
                  <Save className="h-5 w-5" />
                  ثبت مرجوعی
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
      {showEditModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">ویرایش مرجوعی</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedReturn(null);
                  resetForm();
                }}
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ مرجوعی</label>
                  <input
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">دلیل</label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">انتخاب کنید</option>
                    {RETURN_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مبلغ استرداد</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.refundAmount}
                    onChange={(e) => setFormData({ ...formData, refundAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">روش استرداد</label>
                  <select
                    value={formData.refundMethod}
                    onChange={(e) => setFormData({ ...formData, refundMethod: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm.value} value={pm.value}>
                        {pm.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">جزئیات دلیل</label>
                <textarea
                  rows={2}
                  value={formData.reasonDetails}
                  onChange={(e) => setFormData({ ...formData, reasonDetails: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex gap-4 pt-2">
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
                    setSelectedReturn(null);
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

      {/* Approve Modal */}
      {showApproveModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">تایید مرجوعی</h2>
              </div>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedReturn(null);
                }}
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleApprove} className="p-6 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">شماره:</span> {selectedReturn.returnNumber}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">مبلغ:</span> {formatCurrency(selectedReturn.refundAmount)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                <textarea
                  rows={3}
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="توضیحات تایید (اختیاری)..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  تایید
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedReturn(null);
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

      {/* Reject Modal */}
      {showRejectModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">رد مرجوعی</h2>
              </div>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedReturn(null);
                }}
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleReject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">علت رد *</label>
                <input
                  type="text"
                  required
                  value={rejectInfo.reason}
                  onChange={(e) => setRejectInfo({ ...rejectInfo, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="علت رد را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                <textarea
                  rows={3}
                  value={rejectInfo.notes}
                  onChange={(e) => setRejectInfo({ ...rejectInfo, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="توضیحات اضافی (اختیاری)"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  تایید رد
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedReturn(null);
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

      {/* Complete Modal */}
      {showCompleteModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">تکمیل مرجوعی</h2>
              </div>
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setSelectedReturn(null);
                }}
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleComplete} className="p-6 space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  با تکمیل این مرجوعی، تغییرات موجودی اعمال خواهد شد:
                </p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                  {selectedReturn.type === 'CUSTOMER_RETURN' ? (
                    <li>اقلام به موجودی برگشت داده می‌شود</li>
                  ) : (
                    <li>اقلام از موجودی کسر می‌شود</li>
                  )}
                  <li>مبلغ استرداد: {formatCurrency(selectedReturn.refundAmount)}</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                <textarea
                  rows={3}
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="توضیحات تکمیل (اختیاری)..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  تکمیل مرجوعی
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCompleteModal(false);
                    setSelectedReturn(null);
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