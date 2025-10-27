// frontend/src/app/dashboard/transactions/purchases/page.tsx
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
  Truck,
  Package,
  Calendar,
  DollarSign,
  Building2,
  Store,
} from 'lucide-react';

type Supplier = {
  id: string;
  code?: string | null;
  name: string;
  phone?: string | null;
  email?: string | null;
};

type Branch = {
  id: string;
  name: string;
  code: string;
};

type PurchaseItem = {
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
  subtotal: number;
  receivedQuantity?: number | null;
};

type Purchase = {
  id: string;
  purchaseNumber: string;
  purchaseDate: string;
  status: 'PENDING' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CANCELLED';
  supplierId?: string | null;
  supplier?: Supplier;
  userId: string;
  branchId: string;
  branch?: Branch;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: string;
  deliveryDate?: string | null;
  notes?: string | null;
  items: PurchaseItem[];
  createdAt: string;
  updatedAt: string;
};

type PagedResult = {
  items: Purchase[];
  total: number;
  page: number;
  limit: number;
};

type Summary = {
  period: { from: string; to: string };
  totalPurchases: number;
  totalAmount: number;
  totalPaid: number;
  outstandingAmount: number;
  byStatus: Array<{ status: Purchase['status']; count: number; totalAmount: number }>;
  topSuppliers: Array<{ supplierId: string; purchaseCount: number; totalAmount: number }>;
};

type CreateItemForm = {
  productId: string;
  quantity: string;
  unitPrice: string;
  weight?: string;
};

type CreateEditForm = {
  supplierId: string;
  userId: string;
  branchId: string;
  purchaseDate: string;
  taxAmount: string;
  paidAmount: string;
  deliveryDate: string;
  paymentMethod: string;
  notes: string;
  items: CreateItemForm[];
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

const STATUS_BADGE = (status: Purchase['status']) => {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'PARTIALLY_RECEIVED':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
    case 'PENDING':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

export default function PurchasesPage() {
  const { user } = useAuthStore();

  // Data
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [suppliersLoaded, setSuppliersLoaded] = useState(false);
  const [branchesLoaded, setBranchesLoaded] = useState(false);
  const [manualSupplierId, setManualSupplierId] = useState('');
  const [manualBranchId, setManualBranchId] = useState('');

  // Loading
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | Purchase['status']>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'purchaseDate' | 'totalAmount'>('purchaseDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);

  // UI
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const [itemCategories, setItemCategories] = useState<Record<number, string>>({});
const [itemSearchTerms, setItemSearchTerms] = useState<Record<number, string>>({});
const [productSuggestions, setProductSuggestions] = useState<Record<number, any[]>>({});
const [searchingProducts, setSearchingProducts] = useState<Record<number, boolean>>({});

  // Forms
  const [formData, setFormData] = useState<CreateEditForm>({
    supplierId: '',
    userId: user?.id || '',
    branchId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    taxAmount: '',
    paidAmount: '',
    deliveryDate: '',
    paymentMethod: 'CASH',
    notes: '',
    items: [{ productId: '', quantity: '', unitPrice: '', weight: '' }],
  });

  const [receiveItems, setReceiveItems] = useState<{ itemId: string; receivedQuantity: string; notes?: string }[]>([]);
  const [cancelInfo, setCancelInfo] = useState<{ reason: string; notes: string }>({ reason: '', notes: '' });

  useEffect(() => {
    // Default last 30 days
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 30);
    setToDate(today.toISOString().split('T')[0]);
    setFromDate(from.toISOString().split('T')[0]);

    fetchSuppliers();
    fetchBranches();
  }, []);

  useEffect(() => {
    if (branchesLoaded) {
      // Set default branch
      if (user?.branchId) {
        setSelectedBranchId(user.branchId);
      } else if (branches.length > 0) {
        setSelectedBranchId(branches[0].id);
      }
    }
  }, [branchesLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchPurchases();
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, selectedSupplierId, selectedBranchId, fromDate, toDate, minAmount, maxAmount, sortBy, sortOrder, page, limit]);

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

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches', { params: { limit: 100, isActive: true } });
      const list = res.data?.items || res.data || [];
      setBranches(list);
      setBranchesLoaded(true);
      setFormData((prev) => ({ ...prev, branchId: user?.branchId || list[0]?.id || '' }));
    } catch (err) {
      console.error('Failed to fetch branches:', err);
      setBranches([]);
      setBranchesLoaded(true);
      if (user?.branchId) {
        setFormData((prev) => ({ ...prev, branchId: user.branchId || '' }));
      }
    }
  };

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit, sortBy, sortOrder };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (selectedSupplierId) params.supplierId = selectedSupplierId;
      if (selectedBranchId) params.branchId = selectedBranchId;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (minAmount) params.minAmount = minAmount;
      if (maxAmount) params.maxAmount = maxAmount;

      const res = await api.get<PagedResult>('/transactions/purchases', { params });
      setPurchases(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch purchases:', err);
      showMessage('error', 'خطا در بارگذاری خریدها');
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
      const res = await api.get<Summary>('/transactions/purchases/summary', { params });
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to fetch purchases summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

const resetForm = () => {
  setFormData({
    supplierId: selectedSupplierId || manualSupplierId || '',
    userId: user?.id || '',
    branchId: selectedBranchId || user?.branchId || manualBranchId || '',
    purchaseDate: new Date().toISOString().split('T')[0],
    taxAmount: '',
    paidAmount: '',
    deliveryDate: '',
    paymentMethod: 'CASH',
    notes: '',
    items: [{ productId: '', quantity: '', unitPrice: '', weight: '' }],
  });
  setItemCategories({});
  setItemSearchTerms({});
  setProductSuggestions({});
  setSearchingProducts({});
};

const searchProducts = async (searchTerm: string, category: string, itemIndex: number) => {
  if (!searchTerm || searchTerm.length < 2) {
    setProductSuggestions((prev) => ({ ...prev, [itemIndex]: [] }));
    return;
  }

  try {
    setSearchingProducts((prev) => ({ ...prev, [itemIndex]: true }));
    
    const params: any = { 
      search: searchTerm, 
      limit: 10,
      status: 'IN_STOCK' 
    };
    
    if (category) {
      // Map to correct endpoint based on category
      let endpoint = '/inventory/products';
      switch (category) {
        case 'RAW_GOLD':
          endpoint = '/inventory/raw-gold';
          break;
        case 'MANUFACTURED_PRODUCT':
          endpoint = '/inventory/products';
          break;
        case 'STONE':
          endpoint = '/inventory/stones';
          break;
        case 'COIN':
          endpoint = '/inventory/coins';
          break;
        case 'CURRENCY':
          endpoint = '/inventory/currency';
          break;
        case 'GENERAL_GOODS':
          endpoint = '/inventory/general-goods';
          break;
      }
      
      const res = await api.get(endpoint, { params });
      const items = res.data?.items || res.data || [];
      setProductSuggestions((prev) => ({ ...prev, [itemIndex]: items }));
    } else {
      // Search all products if no category selected
      const res = await api.get('/inventory/products', { params });
      const items = res.data?.items || res.data || [];
      setProductSuggestions((prev) => ({ ...prev, [itemIndex]: items }));
    }
  } catch (err) {
    console.error('Product search error:', err);
    setProductSuggestions((prev) => ({ ...prev, [itemIndex]: [] }));
  } finally {
    setSearchingProducts((prev) => ({ ...prev, [itemIndex]: false }));
  }
};

// Debounced search effect
useEffect(() => {
  const timers: NodeJS.Timeout[] = [];
  
  Object.entries(itemSearchTerms).forEach(([index, term]) => {
    const idx = parseInt(index, 10);
    const timer = setTimeout(() => {
      const category = itemCategories[idx] || '';
      searchProducts(term, category, idx);
    }, 300);
    timers.push(timer);
  });

  return () => timers.forEach(t => clearTimeout(t));
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [itemSearchTerms, itemCategories]);

  const openEdit = (row: Purchase) => {
    setSelectedPurchase(row);
    setFormData({
      supplierId: row.supplierId || '',
      userId: row.userId || user?.id || '',
      branchId: row.branchId || selectedBranchId || user?.branchId || '',
      purchaseDate: row.purchaseDate ? new Date(row.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      taxAmount: row.taxAmount?.toString() || '',
      paidAmount: row.paidAmount?.toString() || '',
      deliveryDate: row.deliveryDate ? new Date(row.deliveryDate).toISOString().split('T')[0] : '',
      paymentMethod: row.paymentMethod || 'CASH',
      notes: row.notes || '',
      items: row.items?.length
        ? row.items.map((i) => ({
            productId: i.productId,
            quantity: String(i.quantity),
            unitPrice: String(i.unitPrice),
            weight: i.weight != null ? String(i.weight) : '',
          }))
        : [{ productId: '', quantity: '', unitPrice: '', weight: '' }],
    });
    setShowEditModal(true);
  };

  const openReceive = (row: Purchase) => {
    setSelectedPurchase(row);
    setReceiveItems(
      row.items.map((i) => ({
        itemId: i.id,
        receivedQuantity: i.receivedQuantity != null ? String(i.receivedQuantity) : '0',
      })),
    );
    setShowReceiveModal(true);
  };

  const openCancel = (row: Purchase) => {
    setSelectedPurchase(row);
    setCancelInfo({ reason: '', notes: '' });
    setShowCancelModal(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    const supplierIdToUse = formData.supplierId || manualSupplierId || undefined;
    const branchIdToUse = formData.branchId || manualBranchId;
    const userIdToUse = formData.userId || user?.id;

    if (!userIdToUse) return showMessage('error', 'شناسه کاربر موجود نیست');
    if (!branchIdToUse) return showMessage('error', 'لطفاً شعبه را انتخاب یا شناسه شعبه را وارد کنید');

    const items = formData.items
      .map((it) => ({
        productId: it.productId.trim(),
        quantity: parseInt(it.quantity || '0', 10),
        weight: it.weight ? parseFloat(it.weight) : undefined,
        unitPrice: parseFloat(it.unitPrice || '0'),
      }))
      .filter((it) => it.productId && it.quantity > 0 && it.unitPrice >= 0);

    if (items.length === 0) return showMessage('error', 'حداقل یک قلم کالا با مقدار معتبر وارد کنید');

    try {
      await api.post('/transactions/purchases', {
        purchaseDate: formData.purchaseDate,
        supplierId: supplierIdToUse,
        userId: userIdToUse,
        branchId: branchIdToUse,
        items,
        taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : undefined,
        paidAmount: formData.paidAmount ? parseFloat(formData.paidAmount) : undefined,
        paymentMethod: formData.paymentMethod,
        deliveryDate: formData.deliveryDate || undefined,
        notes: formData.notes || undefined,
      });

      showMessage('success', 'خرید با موفقیت ثبت شد');
      setShowAddModal(false);
      resetForm();
      setPage(1);
      await Promise.all([fetchPurchases(), fetchSummary()]);
    } catch (err: any) {
      console.error('Create purchase error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در ثبت خرید');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchase) return;

    try {
      await api.patch(`/transactions/purchases/${selectedPurchase.id}`, {
        supplierId: formData.supplierId || undefined,
        purchaseDate: formData.purchaseDate || undefined,
        taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : undefined,
        paidAmount: formData.paidAmount ? parseFloat(formData.paidAmount) : undefined,
        deliveryDate: formData.deliveryDate || undefined,
        paymentMethod: formData.paymentMethod || undefined,
        notes: formData.notes || undefined,
        // items editing is not included here to keep UI simple
      });

      showMessage('success', 'خرید با موفقیت ویرایش شد');
      setShowEditModal(false);
      setSelectedPurchase(null);
      resetForm();
      await Promise.all([fetchPurchases(), fetchSummary()]);
    } catch (err: any) {
      console.error('Update purchase error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در ویرایش خرید');
    }
  };

  const handleReceiveItems = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchase) return;

    try {
      const payload = receiveItems.map((ri) => ({
        itemId: ri.itemId,
        receivedQuantity: parseInt(ri.receivedQuantity || '0', 10),
      }));

      await api.post(`/transactions/purchases/${selectedPurchase.id}/receive`, payload);

      showMessage('success', 'دریافت اقلام ثبت شد');
      setShowReceiveModal(false);
      setSelectedPurchase(null);
      await Promise.all([fetchPurchases(), fetchSummary()]);
    } catch (err: any) {
      console.error('Receive items error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در ثبت دریافت اقلام');
    }
  };

  const handleComplete = async (id: string) => {
    if (!confirm('تکمیل خرید و دریافت کامل اقلام؟')) return;
    try {
      await api.post(`/transactions/purchases/${id}/complete`, { notes: '' });
      showMessage('success', 'خرید تکمیل شد');
      await Promise.all([fetchPurchases(), fetchSummary()]);
    } catch (err: any) {
      console.error('Complete purchase error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در تکمیل خرید');
    }
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchase) return;
    if (!cancelInfo.reason.trim()) {
      return showMessage('error', 'علت لغو را وارد کنید');
    }
    try {
      await api.post(`/transactions/purchases/${selectedPurchase.id}/cancel`, {
        reason: cancelInfo.reason,
        notes: cancelInfo.notes || undefined,
      });
      showMessage('success', 'خرید لغو شد');
      setShowCancelModal(false);
      setSelectedPurchase(null);
      await Promise.all([fetchPurchases(), fetchSummary()]);
    } catch (err: any) {
      console.error('Cancel purchase error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در لغو خرید');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این خرید اطمینان دارید؟')) return;
    try {
      await api.delete(`/transactions/purchases/${id}`);
      showMessage('success', 'خرید با موفقیت حذف شد');
      await Promise.all([fetchPurchases(), fetchSummary()]);
    } catch (err: any) {
      console.error('Delete purchase error:', err);
      showMessage('error', err.response?.data?.message || 'حذف خرید ممکن نیست');
    }
  };

  const outstanding = (p: Purchase) => Math.max(0, (p.totalAmount || 0) - (p.paidAmount || 0));

  const topSupplierLabel = useMemo(() => {
    if (!summary?.topSuppliers?.length) return '—';
    const first = summary.topSuppliers[0];
    const sup = suppliers.find((s) => s.id === first.supplierId);
    return sup?.name || first.supplierId || '—';
  }, [summary, suppliers]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">مدیریت خریدها</h1>
          <p className="text-gray-600 dark:text-gray-400">ثبت، مدیریت و دریافت اقلام خریداری‌شده</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">جمع مبلغ خریدها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatCurrency(summary?.totalAmount || 0)}
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              بازه: {summary ? `${formatDate(summary.period.from)} تا ${formatDate(summary.period.to)}` : '—'}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">پرداخت شده</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">مانده پرداخت</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
                  {formatCurrency(summary?.outstandingAmount || 0)}
                </p>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-full">
                <Truck className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">وضعیت‌ها</p>
            <div className="flex flex-wrap gap-2">
              {summary?.byStatus?.map((s) => (
                <span key={s.status} className={`text-xs px-2 py-1 rounded ${STATUS_BADGE(s.status)}`}>
                  {s.status}:{' '}
                  {new Intl.NumberFormat('fa-IR').format(s.count)}
                </span>
              )) || <span className="text-sm text-gray-500">—</span>}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              برترین تامین‌کننده: {topSupplierLabel}
            </p>
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
                placeholder="جستجو بر اساس شماره خرید یا توضیحات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (setPage(1), fetchPurchases())}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Filters Row */}
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

                {/* Branch selector or manual input */}
                {branchesLoaded && branches.length > 0 ? (
                  <select
                    value={selectedBranchId}
                    onChange={(e) => {
                      setSelectedBranchId(e.target.value);
                      setPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
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
                      setPage(1);
                    }}
                    placeholder="شناسه شعبه"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
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

                {/* Status */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as Purchase['status'] | '');
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">همه وضعیت‌ها</option>
                  <option value="PENDING">در انتظار</option>
                  <option value="PARTIALLY_RECEIVED">دریافت جزئی</option>
                  <option value="COMPLETED">تکمیل شده</option>
                  <option value="CANCELLED">لغو شده</option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="purchaseDate">مرتب‌سازی: تاریخ خرید</option>
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

              <div className="flex gap-2">
                <button
                  onClick={() => fetchPurchases()}
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
                  <span>ثبت خرید</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Purchases Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
          ) : purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Package className="h-16 w-16 mb-4 opacity-50" />
              <p>هیچ خریدی یافت نشد</p>
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
                      تامین‌کننده/شعبه
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      مبالغ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      وضعیت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      اقلام
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="text-gray-900 dark:text-white font-semibold">{p.purchaseNumber}</div>
                        <div className="text-gray-500 dark:text-gray-400">{formatDate(p.purchaseDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-200">
                          <Store className="h-4 w-4 text-gray-400" />
                          {p.supplier?.name || '—'}
                          <span className="text-xs text-gray-500">{p.supplier?.code ? `(${p.supplier.code})` : ''}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <Building2 className="h-4 w-4" />
                          {p.branch?.name} {p.branch?.code ? `(${p.branch.code})` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="text-gray-900 dark:text-gray-200">
                          کل: <span className="font-semibold">{formatCurrency(p.totalAmount)}</span>
                        </div>
                        <div className="text-green-600 dark:text-green-400">
                          پرداخت‌شده: <span className="font-semibold">{formatCurrency(p.paidAmount)}</span>
                        </div>
                        <div className="text-amber-600 dark:text-amber-400">
                          مانده: <span className="font-semibold">{formatCurrency(outstanding(p))}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${STATUS_BADGE(p.status)}`}>{p.status}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                        {p.items?.length ? (
                          <div className="max-w-xs truncate">
                            {p.items.slice(0, 3).map((i) => (
                              <div key={i.id} className="flex items-center gap-2">
                                <span className="text-gray-500">{i.product?.sku || i.productId}</span>
                                <span>×{i.quantity}</span>
                              </div>
                            ))}
                            {p.items.length > 3 && <div className="text-gray-400">+ {p.items.length - 3} مورد دیگر</div>}
                          </div>
                        ) : (
                          '—'
                        )}
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
                          {p.status !== 'CANCELLED' && (
                            <button
                              onClick={() => openReceive(p)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              title="ثبت دریافت اقلام"
                            >
                              <Truck className="h-4 w-4" />
                            </button>
                          )}
                          {p.status !== 'CANCELLED' && p.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleComplete(p.id)}
                              className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300"
                              title="تکمیل خرید"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openCancel(p)}
                            className="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
                            title="لغو"
                          >
                            <X className="h-4 w-4" />
                          </button>
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
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">ثبت خرید جدید</h2>
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
              {/* Supplier & Branch & Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تامین‌کننده</label>
                  {suppliersLoaded && suppliers.length > 0 ? (
                    <select
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">بدون تامین‌کننده</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.code ? `(${s.code})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.supplierId || manualSupplierId}
                      onChange={(e) => {
                        setFormData({ ...formData, supplierId: e.target.value });
                        setManualSupplierId(e.target.value);
                      }}
                      placeholder="شناسه تامین‌کننده (اختیاری)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شعبه *</label>
                  {branchesLoaded && branches.length > 0 ? (
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">انتخاب شعبه</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={formData.branchId || manualBranchId}
                      onChange={(e) => {
                        setFormData({ ...formData, branchId: e.target.value });
                        setManualBranchId(e.target.value);
                      }}
                      placeholder="شناسه شعبه (UUID)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ خرید *</label>
                  <input
                    type="date"
                    required
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Payment & Delivery */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">روش پرداخت *</label>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مالیات</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.taxAmount}
                    onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">پرداخت شده</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ تحویل</label>
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

{/* Items */}
<div>
  <div className="flex items-center justify-between mb-2">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">اقلام خرید</label>
    <button
      type="button"
      onClick={() => {
        const newIndex = formData.items.length;
        setFormData((prev) => ({
          ...prev,
          items: [...prev.items, { productId: '', quantity: '', unitPrice: '', weight: '' }],
        }));
        setItemCategories((prev) => ({ ...prev, [newIndex]: '' }));
        setItemSearchTerms((prev) => ({ ...prev, [newIndex]: '' }));
      }}
      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded dark:bg-gray-700 dark:hover:bg-gray-600"
    >
      افزودن قلم
    </button>
  </div>
  <div className="space-y-3">
    {formData.items.map((it, idx) => (
      <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
        {/* Category and Search Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">دسته‌بندی</label>
            <select
              value={itemCategories[idx] || ''}
              onChange={(e) => {
                setItemCategories((prev) => ({ ...prev, [idx]: e.target.value }));
                // Clear search and suggestions when category changes
                setItemSearchTerms((prev) => ({ ...prev, [idx]: '' }));
                setProductSuggestions((prev) => ({ ...prev, [idx]: [] }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">همه دسته‌بندی‌ها</option>
              <option value="RAW_GOLD">طلای خام</option>
              <option value="MANUFACTURED_PRODUCT">محصول ساخته‌شده</option>
              <option value="STONE">سنگ</option>
              <option value="COIN">سکه</option>
              <option value="CURRENCY">ارز</option>
              <option value="GENERAL_GOODS">کالای عمومی</option>
            </select>
          </div>

<div className="relative">
  <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
    جستجوی محصول (SKU/نام) {it.productId && '✓'}
  </label>
  <div className="relative">
    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
    <input
      type="text"
      value={itemSearchTerms[idx] || ''}
      onChange={(e) => {
        setItemSearchTerms((prev) => ({ ...prev, [idx]: e.target.value }));
        // Clear productId when user types (to allow selecting a different product)
        if (it.productId) {
          const items = [...formData.items];
          items[idx].productId = '';
          setFormData({ ...formData, items });
        }
      }}
      placeholder={it.productId ? "محصول انتخاب شده - برای تغییر تایپ کنید" : "جستجو برای انتخاب محصول..."}
      className={`w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white ${
        it.productId 
          ? 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20' 
          : 'border-gray-300 dark:border-gray-600'
      }`}
    />
    {searchingProducts[idx] && (
      <div className="absolute left-3 top-1/2 -translate-y-1/2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
      </div>
    )}
  </div>

  {/* Product Suggestions Dropdown */}
  {productSuggestions[idx] && productSuggestions[idx].length > 0 && (
    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
      {productSuggestions[idx].map((product: any) => (
        <button
          key={product.id}
          type="button"
          onClick={() => {
            const items = [...formData.items];
            items[idx].productId = product.id;
            items[idx].unitPrice = String(product.purchasePrice || product.sellingPrice || 0);
            if (product.weight) {
              items[idx].weight = String(product.weight);
            }
            setFormData({ ...formData, items });
            
            // Clear search term and suggestions immediately
            setItemSearchTerms((prev) => {
              const updated = { ...prev };
              delete updated[idx]; // Remove search term completely
              return updated;
            });
            setProductSuggestions((prev) => ({ ...prev, [idx]: [] }));
          }}
          className="w-full px-4 py-2 text-right hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
        >
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {product.name || product.sku}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span>SKU: {product.sku}</span>
            {product.category && <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">{product.category}</span>}
            {product.sellingPrice && <span>قیمت: {formatCurrency(product.sellingPrice)}</span>}
          </div>
        </button>
      ))}
    </div>
  )}
</div>
        </div>

        {/* Product Details Row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
              شناسه محصول (UUID) {it.productId && '✓'}
            </label>
            <input
              type="text"
              value={it.productId}
              onChange={(e) => {
                const items = [...formData.items];
                items[idx].productId = e.target.value;
                setFormData({ ...formData, items });
              }}
              placeholder="UUID محصول (از جستجو انتخاب شود)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs"
              readOnly
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">تعداد</label>
            <input
              type="number"
              value={it.quantity}
              onChange={(e) => {
                const items = [...formData.items];
                items[idx].quantity = e.target.value;
                setFormData({ ...formData, items });
              }}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">قیمت واحد</label>
            <input
              type="number"
              step="0.01"
              value={it.unitPrice}
              onChange={(e) => {
                const items = [...formData.items];
                items[idx].unitPrice = e.target.value;
                setFormData({ ...formData, items });
              }}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">وزن (گرم)</label>
              <input
                type="number"
                step="0.001"
                value={it.weight}
                onChange={(e) => {
                  const items = [...formData.items];
                  items[idx].weight = e.target.value;
                  setFormData({ ...formData, items });
                }}
                placeholder="0.000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  items: prev.items.filter((_, i) => i !== idx),
                }));
                // Clean up states for removed item
                const newCategories = { ...itemCategories };
                const newSearchTerms = { ...itemSearchTerms };
                const newSuggestions = { ...productSuggestions };
                const newSearching = { ...searchingProducts };
                delete newCategories[idx];
                delete newSearchTerms[idx];
                delete newSuggestions[idx];
                delete newSearching[idx];
                setItemCategories(newCategories);
                setItemSearchTerms(newSearchTerms);
                setProductSuggestions(newSuggestions);
                setSearchingProducts(newSearching);
              }}
              className="px-3 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 mt-5"
              title="حذف قلم"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="توضیحات خرید..."
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                >
                  <Save className="h-5 w-5" />
                  ثبت خرید
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
      {showEditModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">ویرایش خرید</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedPurchase(null);
                  resetForm();
                }}
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تامین‌کننده</label>
                  {suppliersLoaded && suppliers.length > 0 ? (
                    <select
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">بدون تامین‌کننده</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.code ? `(${s.code})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs text-gray-500 dark:text-gray-400">شناسه: {selectedPurchase.supplierId || '—'}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ خرید</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ تحویل</label>
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مالیات</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.taxAmount}
                    onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">پرداخت‌شده</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">روش پرداخت</label>
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
                    setSelectedPurchase(null);
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

      {/* Receive Items Modal */}
      {showReceiveModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">ثبت دریافت اقلام</h2>
              </div>
              <button
                onClick={() => {
                  setShowReceiveModal(false);
                  setSelectedPurchase(null);
                }}
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleReceiveItems} className="p-6 space-y-4">
              <div className="space-y-3">
                {selectedPurchase.items.map((it, idx) => {
                  const maxQ = it.quantity;
                  const current = receiveItems.find((ri) => ri.itemId === it.id)?.receivedQuantity || '0';
                  return (
                    <div key={it.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                      <div className="md:col-span-2">
                        <div className="text-sm text-gray-900 dark:text-gray-200 font-medium">
                          {it.product?.name || it.productId}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          SKU: {it.product?.sku || '—'} | تعداد سفارش: {it.quantity}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400">دریافت‌شده</label>
                        <input
                          type="number"
                          min={0}
                          max={maxQ}
                          value={current}
                          onChange={(e) => {
                            const list = [...receiveItems];
                            const iix = list.findIndex((r) => r.itemId === it.id);
                            if (iix >= 0) {
                              list[iix].receivedQuantity = e.target.value;
                            } else {
                              list.push({ itemId: it.id, receivedQuantity: e.target.value });
                            }
                            setReceiveItems(list);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        واحد: {formatCurrency(it.unitPrice)} | مجموع: {formatCurrency(it.subtotal)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  <Save className="h-5 w-5" />
                  ثبت دریافت
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReceiveModal(false);
                    setSelectedPurchase(null);
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

      {/* Cancel Modal */}
      {showCancelModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <X className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">لغو خرید</h2>
              </div>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedPurchase(null);
                }}
              >
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
                  placeholder="علت لغو را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                <textarea
                  rows={3}
                  value={cancelInfo.notes}
                  onChange={(e) => setCancelInfo({ ...cancelInfo, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="توضیحات اضافی (اختیاری)"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                >
                  تایید لغو
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedPurchase(null);
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