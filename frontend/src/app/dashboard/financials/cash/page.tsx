'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Save,
  AlertCircle,
  DollarSign,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Building2,
} from 'lucide-react';

// ... interfaces remain the same ...

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface CashTransaction {
  id: string;
  type: string;
  amount: number;
  transactionDate: string;
  branchId: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  category?: string;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  receiptNumber?: string;
  createdAt: string;
}

interface Summary {
  period: {
    from: string;
    to: string;
  };
  branchId: string;
  totalCashIn: number;
  totalCashOut: number;
  netCashFlow: number;
  totalTransactions: number;
  byCategoryIn: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
  byCategoryOut: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
  byUser: Array<{
    userId: string;
    count: number;
  }>;
}

interface Balance {
  branchId: string;
  currentBalance: number;
}

const CASH_TRANSACTION_TYPES = [
  { value: 'CASH_IN', label: 'دریافت نقدی', icon: ArrowDownRight, color: 'text-green-600' },
  { value: 'CASH_OUT', label: 'پرداخت نقدی', icon: ArrowUpRight, color: 'text-red-600' },
  { value: 'OPENING_BALANCE', label: 'موجودی اول دوره', icon: Wallet, color: 'text-blue-600' },
  { value: 'CLOSING_BALANCE', label: 'موجودی پایان دوره', icon: Wallet, color: 'text-purple-600' },
  { value: 'PETTY_CASH', label: 'تنخواه', icon: DollarSign, color: 'text-amber-600' },
];

const CATEGORIES = [
  { value: 'SALE', label: 'فروش' },
  { value: 'PURCHASE', label: 'خرید' },
  { value: 'EXPENSE', label: 'هزینه' },
  { value: 'DEPOSIT', label: 'واریز' },
  { value: 'WITHDRAWAL', label: 'برداشت' },
  { value: 'REFUND', label: 'بازگشت وجه' },
  { value: 'OTHER', label: 'سایر' },
];

export default function CashPage() {
  const { user } = useAuthStore();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoaded, setBranchesLoaded] = useState(false);
  const [manualBranchId, setManualBranchId] = useState<string>('');
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<CashTransaction | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    type: 'CASH_IN',
    amount: '',
    transactionDate: new Date().toISOString().split('T')[0],
    branchId: '',
    category: '',
    description: '',
    receiptNumber: '',
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    // Set default date range to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setDateTo(today.toISOString().split('T')[0]);
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (dateFrom && dateTo) {
      // Only require branchId if branches are loaded
      if (branchesLoaded && branches.length > 0 && !selectedBranchId) {
        return;
      }
      fetchTransactions();
      fetchSummary();
      fetchBalance();
    }
  }, [selectedType, selectedCategory, selectedBranchId, dateFrom, dateTo, branchesLoaded]);

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches', { params: { limit: 100, isActive: true } });
      const branchList = response.data.items || response.data || [];
      setBranches(branchList);
      setBranchesLoaded(true);
      
      // Set default branch
      if (user?.branchId) {
        setSelectedBranchId(user.branchId);
        setFormData(prev => ({ ...prev, branchId: user.branchId }));
      } else if (branchList.length > 0) {
        setSelectedBranchId(branchList[0].id);
        setFormData(prev => ({ ...prev, branchId: branchList[0].id }));
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      setBranchesLoaded(true);
      
      // Use fallback: create a manual branch entry or use user's branchId
      if (user?.branchId) {
        setSelectedBranchId(user.branchId);
        setManualBranchId(user.branchId);
        setFormData(prev => ({ ...prev, branchId: user.branchId }));
        showMessage('error', 'API شعب در دسترس نیست - از شعبه کاربر استفاده می‌شود');
      }
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params: any = {
        limit: 100,
        sortBy: 'transactionDate',
        sortOrder: 'desc',
      };
      if (selectedType) params.type = selectedType;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedBranchId) params.branchId = selectedBranchId;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      if (searchTerm) params.search = searchTerm;

      const response = await api.get('/financials/cash', { params });
      setTransactions(response.data.items || []);
    } catch (error: any) {
      console.error('Failed to fetch cash transactions:', error);
      showMessage('error', 'خطا در بارگذاری اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const params: any = {};
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      if (selectedBranchId) params.branchId = selectedBranchId;
      
      const response = await api.get('/financials/cash/summary', { params });
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const fetchBalance = async () => {
    try {
      const params: any = {};
      if (selectedBranchId) params.branchId = selectedBranchId;
      
      const response = await api.get('/financials/cash/balance', { params });
      setBalance(response.data);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const branchIdToUse = formData.branchId || manualBranchId;
    
    if (!branchIdToUse) {
      showMessage('error', 'لطفاً شعبه را انتخاب یا شناسه شعبه را وارد کنید');
      return;
    }

    try {
      await api.post('/financials/cash', {
        type: formData.type,
        amount: parseFloat(formData.amount),
        transactionDate: formData.transactionDate,
        branchId: branchIdToUse,
        category: formData.category || undefined,
        description: formData.description || undefined,
        receiptNumber: formData.receiptNumber || undefined,
      });

      showMessage('success', 'تراکنش نقدی با موفقیت ثبت شد');
      setShowAddModal(false);
      resetForm();
      fetchTransactions();
      fetchSummary();
      fetchBalance();
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'خطا در ثبت تراکنش');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    try {
      await api.patch(`/financials/cash/${selectedTransaction.id}`, {
        type: formData.type,
        amount: parseFloat(formData.amount),
        transactionDate: formData.transactionDate,
        category: formData.category || undefined,
        description: formData.description || undefined,
        receiptNumber: formData.receiptNumber || undefined,
      });

      showMessage('success', 'تراکنش با موفقیت ویرایش شد');
      setShowEditModal(false);
      setSelectedTransaction(null);
      resetForm();
      fetchTransactions();
      fetchSummary();
      fetchBalance();
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'خطا در ویرایش تراکنش');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این تراکنش اطمینان دارید؟')) return;

    try {
      await api.delete(`/financials/cash/${id}`);
      showMessage('success', 'تراکنش با موفقیت حذف شد');
      fetchTransactions();
      fetchSummary();
      fetchBalance();
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'خطا در حذف تراکنش');
    }
  };

  const openEditModal = (transaction: CashTransaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      transactionDate: new Date(transaction.transactionDate).toISOString().split('T')[0],
      branchId: transaction.branchId,
      category: transaction.category || '',
      description: transaction.description || '',
      receiptNumber: transaction.receiptNumber || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'CASH_IN',
      amount: '',
      transactionDate: new Date().toISOString().split('T')[0],
      branchId: selectedBranchId || user?.branchId || manualBranchId || '',
      category: '',
      description: '',
      receiptNumber: '',
    });
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTransactionTypeInfo = (type: string) => {
    return CASH_TRANSACTION_TYPES.find(t => t.value === type) || CASH_TRANSACTION_TYPES[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header remains the same */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">مدیریت نقدینگی</h1>
          <p className="text-gray-600 dark:text-gray-400">مدیریت دریافت و پرداخت‌های نقدی</p>
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

        {/* Summary Cards - same as before */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* ... summary cards ... */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">موجودی نقدی</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatCurrency(balance?.currentBalance || 0)}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                <Wallet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">دریافت نقدی</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {formatCurrency(summary?.totalCashIn || 0)}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                <ArrowDownRight className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {summary?.byCategoryIn?.length || 0} دسته‌بندی
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">پرداخت نقدی</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                  {formatCurrency(summary?.totalCashOut || 0)}
                </p>
              </div>
              <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                <ArrowUpRight className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {summary?.byCategoryOut?.length || 0} دسته‌بندی
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">جریان خالص نقدی</p>
                <p className={`text-2xl font-bold mt-2 ${
                  (summary?.netCashFlow || 0) >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(summary?.netCashFlow || 0)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                (summary?.netCashFlow || 0) >= 0
                  ? 'bg-green-100 dark:bg-green-900'
                  : 'bg-red-100 dark:bg-red-900'
              }`}>
                {(summary?.netCashFlow || 0) >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {summary?.totalTransactions || 0} تراکنش
            </p>
          </div>
        </div>

        {/* Rest of the component continues... I'll continue in the next part */}

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="جستجو بر اساس شرح، شماره رسید یا دسته‌بندی..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchTransactions()}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {/* Branch selector or manual input */}
                {branches.length > 0 ? (
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">همه شعب</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={manualBranchId}
                    onChange={(e) => {
                      setManualBranchId(e.target.value);
                      setSelectedBranchId(e.target.value);
                    }}
                    placeholder="شناسه شعبه"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                )}

                {/* Rest of filters remain the same... */}
                <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-sm dark:text-white"
                    placeholder="از تاریخ"
                  />
                </div>

                <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-sm dark:text-white"
                    placeholder="تا تاریخ"
                  />
                </div>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">همه انواع</option>
                  {CASH_TRANSACTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">همه دسته‌بندی‌ها</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={fetchTransactions}
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
                  <span>ثبت تراکنش</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown and Transactions Table remain mostly the same... */}
        {/* For brevity, I'll focus on the modal changes */}

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Wallet className="h-16 w-16 mb-4 opacity-50" />
              <p>هیچ تراکنش نقدی یافت نشد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Table content - same as before */}
            </div>
          )}
        </div>
      </div>

      {/* Add Modal - Modified for manual branch input */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">ثبت تراکنش نقدی</h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {/* Branch field - dropdown if available, text input otherwise */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  شعبه *
                </label>
                {branches.length > 0 ? (
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">انتخاب شعبه</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>
                    <input
                      type="text"
                      required
                      value={formData.branchId || manualBranchId}
                      onChange={(e) => {
                        setFormData({ ...formData, branchId: e.target.value });
                        setManualBranchId(e.target.value);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="شناسه شعبه (UUID)"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      API شعب در دسترس نیست - شناسه شعبه را وارد کنید
                    </p>
                  </div>
                )}
              </div>

              {/* Rest of form fields remain the same... */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نوع تراکنش *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {CASH_TRANSACTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

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
                  تاریخ تراکنش *
                </label>
                <input
                  type="date"
                  required
                  value={formData.transactionDate}
                  onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  دسته‌بندی
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">انتخاب کنید</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  شماره رسید
                </label>
                <input
                  type="text"
                  value={formData.receiptNumber}
                  onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="شماره رسید"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  شرح
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="توضیحات تراکنش..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                >
                  <Save className="h-5 w-5" />
                  ثبت تراکنش
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-medium"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal remains the same */}
    </div>
  );
}