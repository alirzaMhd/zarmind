// frontend/src/app/dashboard/financials/checks/page.tsx
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
  AlertCircle,
  Calendar,
  FileText,
  BadgeCheck,
  BadgeX,
  ArrowRightLeft,
  CheckCircle2,
  Upload,
} from 'lucide-react';

type CheckType = 'RECEIVABLE' | 'PAYABLE';
type CheckStatus =
  | 'PENDING'
  | 'DEPOSITED'
  | 'CLEARED'
  | 'BOUNCED'
  | 'CANCELLED'
  | 'CASHED'
  | 'TRANSFERRED';

type Check = {
  id: string;
  checkNumber: string;
  type: CheckType;
  status: CheckStatus;
  amount: number;
  issueDate: string;
  dueDate: string;
  bankName: string;
  branchName?: string | null;
  accountNumber?: string | null;
  issuerName?: string | null;
  customerId?: string | null;
  supplierId?: string | null;
  payeeName?: string | null;
  checkImages: string[];
  notes?: string | null;
  depositedDate?: string | null;
  clearedDate?: string | null;
  bouncedDate?: string | null;
  bouncedReason?: string | null;
  createdAt: string;
  updatedAt: string;
};

type ChecksPagedResult = {
  items: Check[];
  total: number;
  page: number;
  limit: number;
};

type ChecksSummary = {
  type: CheckType | 'ALL';
  byStatus: Array<{
    status: CheckStatus;
    count: number;
    totalAmount: number;
  }>;
  upcomingDue: { count: number; totalAmount: number };
  overdue: { count: number; totalAmount: number };
};

const CHECK_TYPES: { value: CheckType; label: string }[] = [
  { value: 'RECEIVABLE', label: 'چک دریافتی' },
  { value: 'PAYABLE', label: 'چک پرداختی' },
];

const CHECK_STATUSES: { value: CheckStatus; label: string }[] = [
  { value: 'PENDING', label: 'در انتظار' },
  { value: 'DEPOSITED', label: 'واریز به بانک' },
  { value: 'CLEARED', label: 'پاس شده' },
  { value: 'BOUNCED', label: 'برگشتی' },
  { value: 'CANCELLED', label: 'لغو شده' },
  { value: 'CASHED', label: 'نقد شده' },
  { value: 'TRANSFERRED', label: 'انتقال یافته' },
];

const STATUS_BADGE = (status: CheckStatus) => {
  switch (status) {
    case 'PENDING':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    case 'DEPOSITED':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
    case 'CLEARED':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'CASHED':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
    case 'BOUNCED':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'CANCELLED':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'TRANSFERRED':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

type CreateEditForm = {
  checkNumber: string;
  type: CheckType;
  status?: CheckStatus;
  amount: string;
  issueDate: string;
  dueDate: string;
  bankName: string;
  branchName: string;
  accountNumber: string;
  issuerName: string;
  customerId: string;
  supplierId: string;
  payeeName: string;
  checkImagesText: string;
  notes: string;
};

type StatusForm = {
  status: CheckStatus;
  reason: string;
  date: string;
};

export default function ChecksPage() {
  // Data
  const [checks, setChecks] = useState<Check[]>([]);
  const [summary, setSummary] = useState<ChecksSummary | null>(null);

  // Loading
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | CheckType>('');
  const [statusFilter, setStatusFilter] = useState<'' | CheckStatus>('');
  const [dueFrom, setDueFrom] = useState('');
  const [dueTo, setDueTo] = useState('');
  const [bankName, setBankName] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'dueDate' | 'issueDate' | 'amount'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);

  // UI
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<Check | null>(null);

  // Forms
  const [formData, setFormData] = useState<CreateEditForm>({
    checkNumber: '',
    type: 'RECEIVABLE',
    status: undefined,
    amount: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    bankName: '',
    branchName: '',
    accountNumber: '',
    issuerName: '',
    customerId: '',
    supplierId: '',
    payeeName: '',
    checkImagesText: '',
    notes: '',
  });

  const [statusForm, setStatusForm] = useState<StatusForm>({
    status: 'PENDING',
    reason: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    // Default due range: next 60 days (for better visibility)
    const today = new Date();
    const in60 = new Date();
    in60.setDate(today.getDate() + 60);
    setDueFrom('');
    setDueTo(in60.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    fetchChecks();
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter, dueFrom, dueTo, bankName, minAmount, maxAmount, sortBy, sortOrder, page, limit]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(
      new Date(dateString),
    );

  const fetchChecks = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit, sortBy, sortOrder };
      if (searchTerm) params.search = searchTerm;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (dueFrom) params.fromDueDate = dueFrom;
      if (dueTo) params.toDueDate = dueTo;
      if (bankName) params.bankName = bankName;
      if (minAmount) params.minAmount = minAmount;
      if (maxAmount) params.maxAmount = maxAmount;

      const res = await api.get<ChecksPagedResult>('/financials/checks', { params });
      setChecks(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch checks:', err);
      showMessage('error', 'خطا در بارگذاری چک‌ها');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      const params: any = {};
      if (typeFilter) params.type = typeFilter;
      const res = await api.get<ChecksSummary>('/financials/checks/summary', { params });
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      checkNumber: '',
      type: 'RECEIVABLE',
      status: undefined,
      amount: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      bankName: '',
      branchName: '',
      accountNumber: '',
      issuerName: '',
      customerId: '',
      supplierId: '',
      payeeName: '',
      checkImagesText: '',
      notes: '',
    });
  };

  const openEditModal = (ck: Check) => {
    setSelectedCheck(ck);
    setFormData({
      checkNumber: ck.checkNumber || '',
      type: ck.type,
      status: ck.status,
      amount: ck.amount?.toString() || '',
      issueDate: new Date(ck.issueDate).toISOString().split('T')[0],
      dueDate: new Date(ck.dueDate).toISOString().split('T')[0],
      bankName: ck.bankName || '',
      branchName: ck.branchName || '',
      accountNumber: ck.accountNumber || '',
      issuerName: ck.issuerName || '',
      customerId: ck.customerId || '',
      supplierId: ck.supplierId || '',
      payeeName: ck.payeeName || '',
      checkImagesText: Array.isArray(ck.checkImages) ? ck.checkImages.join(', ') : '',
      notes: ck.notes || '',
    });
    setShowEditModal(true);
  };

  const openStatusModal = (ck: Check) => {
    setSelectedCheck(ck);
    setStatusForm({
      status: ck.status,
      reason: '',
      date: new Date().toISOString().split('T')[0],
    });
    setShowStatusModal(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.checkNumber) return showMessage('error', 'شماره چک الزامی است');
    if (!formData.amount || isNaN(parseFloat(formData.amount))) return showMessage('error', 'مبلغ معتبر نیست');
    if (!formData.bankName) return showMessage('error', 'نام بانک الزامی است');

    try {
      await api.post('/financials/checks', {
        checkNumber: formData.checkNumber,
        type: formData.type,
        status: formData.status || undefined,
        amount: parseFloat(formData.amount),
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        bankName: formData.bankName,
        branchName: formData.branchName || undefined,
        accountNumber: formData.accountNumber || undefined,
        issuerName: formData.issuerName || undefined,
        customerId: formData.type === 'RECEIVABLE' ? formData.customerId || undefined : undefined,
        supplierId: formData.type === 'PAYABLE' ? formData.supplierId || undefined : undefined,
        payeeName: formData.payeeName || undefined,
        checkImages: formData.checkImagesText
          ? formData.checkImagesText.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        notes: formData.notes || undefined,
      });

      showMessage('success', 'چک با موفقیت ثبت شد');
      setShowAddModal(false);
      resetForm();
      setPage(1);
      await Promise.all([fetchChecks(), fetchSummary()]);
    } catch (err: any) {
      console.error('Create check error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در ثبت چک');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCheck) return;
    try {
      await api.patch(`/financials/checks/${selectedCheck.id}`, {
        checkNumber: formData.checkNumber || undefined,
        type: formData.type || undefined,
        status: formData.status || undefined,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        issueDate: formData.issueDate || undefined,
        dueDate: formData.dueDate || undefined,
        bankName: formData.bankName || undefined,
        branchName: formData.branchName || undefined,
        accountNumber: formData.accountNumber || undefined,
        issuerName: formData.issuerName || undefined,
        customerId: formData.type === 'RECEIVABLE' ? formData.customerId || undefined : undefined,
        supplierId: formData.type === 'PAYABLE' ? formData.supplierId || undefined : undefined,
        payeeName: formData.payeeName || undefined,
        checkImages: formData.checkImagesText
          ? formData.checkImagesText.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        notes: formData.notes || undefined,
      });

      showMessage('success', 'چک با موفقیت ویرایش شد');
      setShowEditModal(false);
      setSelectedCheck(null);
      resetForm();
      await fetchChecks();
    } catch (err: any) {
      console.error('Update check error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در ویرایش چک');
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCheck) return;

    if (statusForm.status === 'BOUNCED' && !statusForm.reason.trim()) {
      return showMessage('error', 'علت برگشتی الزامی است');
    }

    try {
      await api.patch(`/financials/checks/${selectedCheck.id}/status`, {
        status: statusForm.status,
        reason: statusForm.reason || undefined,
        date: statusForm.date || undefined,
      });

      showMessage('success', 'وضعیت چک بروزرسانی شد');
      setShowStatusModal(false);
      setSelectedCheck(null);
      await Promise.all([fetchChecks(), fetchSummary()]);
    } catch (err: any) {
      console.error('Update status error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در بروزرسانی وضعیت چک');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این چک اطمینان دارید؟')) return;
    try {
      await api.delete(`/financials/checks/${id}`);
      showMessage('success', 'چک با موفقیت حذف شد');
      await Promise.all([fetchChecks(), fetchSummary()]);
    } catch (err: any) {
      console.error('Delete check error:', err);
      showMessage('error', err.response?.data?.message || 'حذف چک ممکن نیست');
    }
  };

  const totalAmountSummary = useMemo(() => {
    if (!summary?.byStatus?.length) return 0;
    return summary.byStatus.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  }, [summary]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">مدیریت چک‌ها</h1>
          <p className="text-gray-600 dark:text-gray-400">ثبت، مدیریت و پایش وضعیت چک‌های دریافتی/پرداختی</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">جمع مبلغ چک‌ها (خلاصه)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatCurrency(totalAmountSummary || 0)}
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
                <FileText className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              نوع: {summary?.type === 'RECEIVABLE' ? 'چک دریافتی' : summary?.type === 'PAYABLE' ? 'چک پرداختی' : 'همه'}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">سررسید ۷ روز آینده</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                  {new Intl.NumberFormat('fa-IR').format(summary?.upcomingDue?.count || 0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(summary?.upcomingDue?.totalAmount || 0)}
                </p>
              </div>
              <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">سررسید گذشته (معوق)</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                  {new Intl.NumberFormat('fa-IR').format(summary?.overdue?.count || 0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(summary?.overdue?.totalAmount || 0)}
                </p>
              </div>
              <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                <BadgeX className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">وضعیت‌ها</p>
            <div className="flex flex-wrap gap-2">
              {summary?.byStatus?.map((s) => (
                <span
                  key={s.status}
                  className={`text-xs px-2 py-1 rounded ${STATUS_BADGE(s.status)} whitespace-nowrap`}
                  title={formatCurrency(s.totalAmount)}
                >
                  {CHECK_STATUSES.find((x) => x.value === s.status)?.label || s.status}:{' '}
                  {new Intl.NumberFormat('fa-IR').format(s.count)}
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
                placeholder="جستجو بر اساس شماره چک، صادرکننده، ذی‌نفع یا توضیحات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (setPage(1), fetchChecks())}
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
                    setTypeFilter(e.target.value as CheckType | '');
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">همه انواع</option>
                  {CHECK_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>

                {/* Status */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as CheckStatus | '');
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">همه وضعیت‌ها</option>
                  {CHECK_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>

                {/* Due date range */}
                <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <input
                    type="date"
                    value={dueFrom}
                    onChange={(e) => {
                      setDueFrom(e.target.value);
                      setPage(1);
                    }}
                    className="bg-transparent border-none focus:ring-0 text-sm dark:text-white"
                    placeholder="سررسید از"
                  />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <input
                    type="date"
                    value={dueTo}
                    onChange={(e) => {
                      setDueTo(e.target.value);
                      setPage(1);
                    }}
                    className="bg-transparent border-none focus:ring-0 text-sm dark:text-white"
                    placeholder="سررسید تا"
                  />
                </div>

                {/* Bank name */}
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => {
                    setBankName(e.target.value);
                    setPage(1);
                  }}
                  placeholder="نام بانک"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />

                {/* Amount range */}
                <input
                  type="number"
                  inputMode="numeric"
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
                  inputMode="numeric"
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
                  <option value="dueDate">مرتب‌سازی: سررسید</option>
                  <option value="issueDate">مرتب‌سازی: تاریخ صدور</option>
                  <option value="amount">مرتب‌سازی: مبلغ</option>
                  <option value="createdAt">مرتب‌سازی: ایجاد</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="asc">صعودی</option>
                  <option value="desc">نزولی</option>
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
                  onClick={() => fetchChecks()}
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
                  <span>ثبت چک</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Checks Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
          ) : checks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FileText className="h-16 w-16 mb-4 opacity-50" />
              <p>هیچ چکی یافت نشد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      شماره چک
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      نوع/وضعیت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      مبلغ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      صدور/سررسید
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      بانک/شعبه
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      صادرکننده/ذی‌نفع
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {checks.map((ck) => (
                    <tr key={ck.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{ck.checkNumber}</div>
                        {ck.accountNumber ? (
                          <div className="text-xs text-gray-500 dark:text-gray-400">حساب: {ck.accountNumber}</div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 w-fit">
                            {ck.type === 'RECEIVABLE' ? 'دریافتی' : 'پرداختی'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded w-fit ${STATUS_BADGE(ck.status)}`}>
                            {CHECK_STATUSES.find((s) => s.value === ck.status)?.label || ck.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(ck.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        <div>صدور: {formatDate(ck.issueDate)}</div>
                        <div className="text-gray-500 dark:text-gray-400">سررسید: {formatDate(ck.dueDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        <div>{ck.bankName}</div>
                        {ck.branchName ? (
                          <div className="text-gray-500 dark:text-gray-400">شعبه: {ck.branchName}</div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        <div className="text-gray-700 dark:text-gray-300">
                          {ck.issuerName ? `صادرکننده: ${ck.issuerName}` : '—'}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {ck.payeeName ? `ذی‌نفع: ${ck.payeeName}` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(ck)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="ویرایش"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openStatusModal(ck)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="تغییر وضعیت"
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ck.id)}
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
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">ثبت چک جدید</h2>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شماره چک *</label>
                  <input
                    type="text"
                    required
                    value={formData.checkNumber}
                    onChange={(e) => setFormData({ ...formData, checkNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="CHK-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as CheckType })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {CHECK_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مبلغ (ریال) *</label>
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

                <div className="flex items-center gap-2">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ صدور *</label>
                    <input
                      type="date"
                      required
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ سررسید *</label>
                    <input
                      type="date"
                      required
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">بانک *</label>
                  <input
                    type="text"
                    required
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="نام بانک"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شعبه</label>
                  <input
                    type="text"
                    value={formData.branchName}
                    onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="نام شعبه"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شماره حساب</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="شماره حساب"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">صادرکننده</label>
                  <input
                    type="text"
                    value={formData.issuerName}
                    onChange={(e) => setFormData({ ...formData, issuerName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="نام صادرکننده"
                  />
                </div>

                {formData.type === 'RECEIVABLE' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شناسه مشتری</label>
                    <input
                      type="text"
                      value={formData.customerId}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="UUID مشتری (اختیاری)"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شناسه تامین‌کننده</label>
                      <input
                        type="text"
                        value={formData.supplierId}
                        onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="UUID تامین‌کننده (اختیاری)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ذی‌نفع</label>
                      <input
                        type="text"
                        value={formData.payeeName}
                        onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="نام ذی‌نفع (اختیاری)"
                      />
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تصاویر چک (URL ها با کاما جدا شوند)
                </label>
                <input
                  type="text"
                  value={formData.checkImagesText}
                  onChange={(e) => setFormData({ ...formData, checkImagesText: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="https://... , https://..."
                />
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
                  ثبت چک
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
      {showEditModal && selectedCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">ویرایش چک</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCheck(null);
                  resetForm();
                }}
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شماره چک</label>
                  <input
                    type="text"
                    value={formData.checkNumber}
                    onChange={(e) => setFormData({ ...formData, checkNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as CheckType })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {CHECK_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مبلغ (ریال)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ صدور</label>
                    <input
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div className="w-full">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">بانک</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شعبه</label>
                  <input
                    type="text"
                    value={formData.branchName}
                    onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شماره حساب</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">صادرکننده</label>
                  <input
                    type="text"
                    value={formData.issuerName}
                    onChange={(e) => setFormData({ ...formData, issuerName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                {formData.type === 'RECEIVABLE' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شناسه مشتری</label>
                    <input
                      type="text"
                      value={formData.customerId}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شناسه تامین‌کننده</label>
                      <input
                        type="text"
                        value={formData.supplierId}
                        onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ذی‌نفع</label>
                      <input
                        type="text"
                        value={formData.payeeName}
                        onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تصاویر چک (URL ها با کاما جدا شوند)
                </label>
                <input
                  type="text"
                  value={formData.checkImagesText}
                  onChange={(e) => setFormData({ ...formData, checkImagesText: e.target.value })}
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
                    setSelectedCheck(null);
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

      {/* Status Modal */}
      {showStatusModal && selectedCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">تغییر وضعیت چک</h2>
              </div>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedCheck(null);
                }}
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وضعیت جدید</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value as CheckStatus })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {CHECK_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ</label>
                  <input
                    type="date"
                    value={statusForm.date}
                    onChange={(e) => setStatusForm({ ...statusForm, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    علت (برای برگشتی الزامی)
                  </label>
                  <input
                    type="text"
                    value={statusForm.reason}
                    onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="مثال: عدم موجودی"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  بروزرسانی
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedCheck(null);
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