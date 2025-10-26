'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Save,
  AlertCircle,
  Store,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Ban,
  AlertTriangle,
  Star,
  Tags as TagsIcon,
  Globe,
  Eye,
} from 'lucide-react';

type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED';

interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  paymentTerms?: string | null;
  rating?: number | null;
  categories: string[];
  licenseNumber?: string | null;
  taxId?: string | null;
  notes?: string | null;
  website?: string | null;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
  purchases?: Array<{
    id: string;
    purchaseNumber: string;
    purchaseDate: string;
    totalAmount: number;
    status: string;
  }>;
  payables?: Array<{
    id: string;
    invoiceNumber: string;
    amount: number;
    remainingAmount: number;
    status: string;
    dueDate: string | null;
  }>;
}

interface Summary {
  totalSuppliers: number;
  byStatus: Array<{ status: SupplierStatus; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
  topSuppliers: Array<{
    supplierId: string;
    code?: string;
    name?: string;
    rating?: number | null;
    purchaseCount: number;
    totalSpent: number;
  }>;
}

type Message = { type: 'success' | 'error'; text: string } | null;

export default function SuppliersPage() {
  // Data
  const [rows, setRows] = useState<Supplier[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  // UI State
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<Message>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<SupplierStatus | ''>('');
  const [city, setCity] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [minRating, setMinRating] = useState<string>('');
  const [maxRating, setMaxRating] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'name' | 'rating' | 'code'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Selection
  const [selected, setSelected] = useState<Supplier | null>(null);

  // Form
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    paymentTerms: '',
    rating: '',
    categories: '' as string, // comma separated
    licenseNumber: '',
    taxId: '',
    notes: '',
    website: '',
    status: 'ACTIVE' as SupplierStatus,
  });

  // Rating Form
  const [ratingValue, setRatingValue] = useState<string>('');
  const [ratingNotes, setRatingNotes] = useState<string>('');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);
  const [showPayableModal, setShowPayableModal] = useState(false);
  const [editingPayable, setEditingPayable] = useState<any | null>(null);
  const [payableForm, setPayableForm] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    amount: '',
    paidAmount: '',
    dueDate: '',
    notes: '',
  });

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any | null>(null);
  const [purchaseForm, setPurchaseForm] = useState({
    purchaseNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    status: 'COMPLETED',
    subtotal: '',
    taxAmount: '',
    totalAmount: '',
    paidAmount: '',
    notes: '',
  });
  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, city, category, minRating, maxRating, sortBy, sortOrder]);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/suppliers/summary');
      setSummary(res.data);
    } catch (e) {
      console.error('Failed to fetch suppliers summary', e);
    }
  };

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
        sortBy,
        sortOrder,
      };
      if (status) params.status = status;
      if (city) params.city = city;
      if (category) params.category = category;
      if (minRating) params.minRating = minRating;
      if (maxRating) params.maxRating = maxRating;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get('/suppliers', { params });
      setRows(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error('Failed to fetch suppliers', e);
      showMessage('error', 'خطا در بارگذاری تامین‌کنندگان');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      postalCode: '',
      paymentTerms: '',
      rating: '',
      categories: '',
      licenseNumber: '',
      taxId: '',
      notes: '',
      website: '',
      status: 'ACTIVE',
    });
  };

  const openAddPayable = () => {
    setEditingPayable(null);
    setPayableForm({
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      amount: '',
      paidAmount: '',
      dueDate: '',
      notes: '',
    });
    setShowPayableModal(true);
  };

  const openEditPayable = (p: any) => {
    setEditingPayable(p);
    setPayableForm({
      invoiceNumber: p.invoiceNumber || '',
      invoiceDate: p.invoiceDate ? new Date(p.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      amount: String(p.amount ?? ''),
      paidAmount: String(p.paidAmount ?? ''),
      dueDate: p.dueDate ? new Date(p.dueDate).toISOString().split('T')[0] : '',
      notes: p.notes || '',
    });
    setShowPayableModal(true);
  };

  const handleSavePayable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    try {
      if (editingPayable) {
        await api.patch(`/financials/accounts-payable/${editingPayable.id}`, {
          invoiceNumber: payableForm.invoiceNumber,
          invoiceDate: payableForm.invoiceDate,
          amount: payableForm.amount ? parseFloat(payableForm.amount) : undefined,
          paidAmount: payableForm.paidAmount ? parseFloat(payableForm.paidAmount) : undefined,
          dueDate: payableForm.dueDate || undefined,
          notes: payableForm.notes || undefined,
        });
        showMessage('success', 'بدهی به‌روزرسانی شد');
      } else {
        await api.post('/financials/accounts-payable', {
          supplierId: selected.id,
          invoiceNumber: payableForm.invoiceNumber,
          invoiceDate: payableForm.invoiceDate,
          amount: parseFloat(payableForm.amount || '0'),
          paidAmount: payableForm.paidAmount ? parseFloat(payableForm.paidAmount) : undefined,
          dueDate: payableForm.dueDate || undefined,
          notes: payableForm.notes || undefined,
        });
        showMessage('success', 'بدهی افزوده شد');
      }
      setShowPayableModal(false);
      // refresh details
      const res = await api.get(`/suppliers/${selected.id}`);
      setSelected(res.data);
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در ثبت بدهی');
    }
  };

  const handleDeletePayable = async (id: string) => {
    if (!selected) return;
    if (!confirm('حذف این بدهی؟')) return;
    try {
      await api.delete(`/financials/accounts-payable/${id}`);
      showMessage('success', 'بدهی حذف شد');
      const res = await api.get(`/suppliers/${selected.id}`);
      setSelected(res.data);
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در حذف بدهی');
    }
  };

  const openAddPurchase = () => {
    setEditingPurchase(null);
    setPurchaseForm({
      purchaseNumber: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      status: 'COMPLETED',
      subtotal: '',
      taxAmount: '',
      totalAmount: '',
      paidAmount: '',
      notes: '',
    });
    setShowPurchaseModal(true);
  };

  const openEditPurchase = (p: any) => {
    setEditingPurchase(p);
    setPurchaseForm({
      purchaseNumber: p.purchaseNumber || '',
      purchaseDate: p.purchaseDate ? new Date(p.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: p.status || 'COMPLETED',
      subtotal: String(p.subtotal ?? ''),
      taxAmount: String(p.taxAmount ?? ''),
      totalAmount: String(p.totalAmount ?? ''),
      paidAmount: String(p.paidAmount ?? ''),
      notes: p.notes || '',
    });
    setShowPurchaseModal(true);
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    // Many backends require items for a purchase; this creates a minimal stub
    // Adjust if your CreatePurchaseDto requires more fields.
    try {
      if (editingPurchase) {
        await api.patch(`/transactions/purchases/${editingPurchase.id}`, {
          purchaseNumber: purchaseForm.purchaseNumber || undefined,
          purchaseDate: purchaseForm.purchaseDate || undefined,
          status: purchaseForm.status || undefined,
          subtotal: purchaseForm.subtotal ? parseFloat(purchaseForm.subtotal) : undefined,
          taxAmount: purchaseForm.taxAmount ? parseFloat(purchaseForm.taxAmount) : undefined,
          totalAmount: purchaseForm.totalAmount ? parseFloat(purchaseForm.totalAmount) : undefined,
          paidAmount: purchaseForm.paidAmount ? parseFloat(purchaseForm.paidAmount) : undefined,
          notes: purchaseForm.notes || undefined,
        });
        showMessage('success', 'خرید به‌روزرسانی شد');
      } else {
        await api.post('/transactions/purchases', {
          supplierId: selected.id,
          purchaseNumber: purchaseForm.purchaseNumber,
          purchaseDate: purchaseForm.purchaseDate,
          status: purchaseForm.status,
          subtotal: purchaseForm.subtotal ? parseFloat(purchaseForm.subtotal) : 0,
          taxAmount: purchaseForm.taxAmount ? parseFloat(purchaseForm.taxAmount) : 0,
          totalAmount: purchaseForm.totalAmount ? parseFloat(purchaseForm.totalAmount) : 0,
          paidAmount: purchaseForm.paidAmount ? parseFloat(purchaseForm.paidAmount) : 0,
          notes: purchaseForm.notes || undefined,
          items: [], // if backend requires items, you can add them later in Purchases page
        });
        showMessage('success', 'خرید افزوده شد');
      }
      setShowPurchaseModal(false);
      const res = await api.get(`/suppliers/${selected.id}`);
      setSelected(res.data);
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در ثبت خرید');
    }
  };

  const handleDeletePurchase = async (id: string) => {
    if (!selected) return;
    if (!confirm('حذف این خرید؟')) return;
    try {
      await api.delete(`/transactions/purchases/${id}`);
      showMessage('success', 'خرید حذف شد');
      const res = await api.get(`/suppliers/${selected.id}`);
      setSelected(res.data);
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در حذف خرید');
    }
  };

  const openAddModal = () => {
    resetForm();
    setSelected(null);
    setShowAddModal(true);
  };

  const openEditModal = (s: Supplier) => {
    setSelected(s);
    setFormData({
      code: s.code || '',
      name: s.name || '',
      contactPerson: s.contactPerson || '',
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      city: s.city || '',
      postalCode: s.postalCode || '',
      paymentTerms: s.paymentTerms || '',
      rating: s.rating != null ? String(s.rating) : '',
      categories: (s.categories || []).join(','),
      licenseNumber: s.licenseNumber || '',
      taxId: s.taxId || '',
      notes: s.notes || '',
      website: s.website || '',
      status: s.status || 'ACTIVE',
    });
    setShowEditModal(true);
  };

  const openRatingModal = (s: Supplier) => {
    setSelected(s);
    setRatingValue(s.rating != null ? String(s.rating) : '');
    setRatingNotes('');
    setShowRatingModal(true);
  };

  const openDetailsModal = async (s: Supplier) => {
    try {
      setSelected(null);
      setShowDetailsModal(true);
      const res = await api.get(`/suppliers/${s.id}`);
      setSelected(res.data);
    } catch (e) {
      console.error(e);
      showMessage('error', 'خطا در بارگذاری جزئیات تامین‌کننده');
      setShowDetailsModal(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        code: formData.code || undefined,
        name: formData.name,
        contactPerson: formData.contactPerson || undefined,
        phone: formData.phone,
        email: formData.email || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        postalCode: formData.postalCode || undefined,
        paymentTerms: formData.paymentTerms || undefined,
        rating: formData.rating ? parseInt(formData.rating, 10) : undefined,
        categories: formData.categories
          ? formData.categories.split(',').map((c) => c.trim()).filter(Boolean)
          : undefined,
        licenseNumber: formData.licenseNumber || undefined,
        taxId: formData.taxId || undefined,
        notes: formData.notes || undefined,
        website: formData.website || undefined,
        status: formData.status,
      };

      await api.post('/suppliers', payload);
      showMessage('success', 'تامین‌کننده با موفقیت اضافه شد');
      setShowAddModal(false);
      resetForm();
      setPage(1);
      fetchSuppliers();
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در افزودن تامین‌کننده');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    try {
      const payload: any = {
        code: formData.code || undefined,
        name: formData.name || undefined,
        contactPerson: formData.contactPerson || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        postalCode: formData.postalCode || undefined,
        paymentTerms: formData.paymentTerms || undefined,
        rating: formData.rating ? parseInt(formData.rating, 10) : undefined,
        categories: formData.categories
          ? formData.categories.split(',').map((c) => c.trim()).filter(Boolean)
          : undefined,
        licenseNumber: formData.licenseNumber || undefined,
        taxId: formData.taxId || undefined,
        notes: formData.notes || undefined,
        website: formData.website || undefined,
        status: formData.status || undefined,
      };

      await api.patch(`/suppliers/${selected.id}`, payload);
      showMessage('success', 'تامین‌کننده با موفقیت ویرایش شد');
      setShowEditModal(false);
      setSelected(null);
      resetForm();
      fetchSuppliers();
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در ویرایش تامین‌کننده');
    }
  };

  const handleUpdateRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    const parsed = parseInt(ratingValue, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 5) {
      showMessage('error', 'امتیاز باید بین 1 و 5 باشد');
      return;
    }

    try {
      await api.patch(`/suppliers/${selected.id}/rating`, { rating: parsed, notes: ratingNotes || undefined });
      showMessage('success', 'امتیاز تامین‌کننده به‌روزرسانی شد');
      setShowRatingModal(false);
      setSelected(null);
      fetchSuppliers();
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در به‌روزرسانی امتیاز');
    }
  };

  const handleChangeStatus = async (s: Supplier, newStatus: SupplierStatus) => {
    try {
      await api.patch(`/suppliers/${s.id}`, { status: newStatus });
      showMessage('success', 'وضعیت تامین‌کننده به‌روزرسانی شد');
      fetchSuppliers();
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در تغییر وضعیت تامین‌کننده');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف/غیرفعال کردن این تامین‌کننده اطمینان دارید؟')) return;

    try {
      await api.delete(`/suppliers/${id}`); // Soft delete -> INACTIVE
      showMessage('success', 'تامین‌کننده غیرفعال شد');
      if (rows.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchSuppliers();
      }
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در حذف تامین‌کننده');
    }
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchSuppliers();
    }
  };

  const onSearchClick = () => {
    setPage(1);
    fetchSuppliers();
  };

  const formatCurrency = (amount: number) => `${new Intl.NumberFormat('fa-IR').format(amount)} ریال`;

  const getStatusBadge = (s: SupplierStatus) => {
    switch (s) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'BLACKLISTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const activeCount = summary?.byStatus?.find((s) => s.status === 'ACTIVE')?.count ?? 0;
  const inactiveCount = summary?.byStatus?.find((s) => s.status === 'INACTIVE')?.count ?? 0;
  const blacklistedCount = summary?.byStatus?.find((s) => s.status === 'BLACKLISTED')?.count ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">مدیریت تامین‌کنندگان</h1>
          <p className="text-gray-600 dark:text-gray-400">افزودن، ویرایش و مدیریت تامین‌کنندگان</p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center justify-between ${message.type === 'success'
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
                <p className="text-sm text-gray-600 dark:text-gray-400">کل تامین‌کنندگان</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {summary?.totalSuppliers ?? 0}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <Store className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">فعال</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {activeCount}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">غیرفعال</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {inactiveCount}
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
                <Ban className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">لیست سیاه</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                  {blacklistedCount}
                </p>
              </div>
              <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="جستجو بر اساس کد، نام، تلفن، ایمیل یا مسئول..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearchClick()}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as SupplierStatus | '');
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">همه وضعیت‌ها</option>
                <option value="ACTIVE">فعال</option>
                <option value="INACTIVE">غیرفعال</option>
                <option value="BLACKLISTED">لیست سیاه</option>
              </select>

              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setPage(1);
                }}
                placeholder="شهر"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />

              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">همه دسته‌ها</option>
                {summary?.byCategory?.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.category} ({c.count})
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={minRating}
                onChange={(e) => {
                  setMinRating(e.target.value);
                  setPage(1);
                }}
                placeholder="حداقل امتیاز"
                min={1}
                max={5}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />

              <input
                type="number"
                value={maxRating}
                onChange={(e) => {
                  setMaxRating(e.target.value);
                  setPage(1);
                }}
                placeholder="حداکثر امتیاز"
                min={1}
                max={5}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="createdAt">جدیدترین</option>
                <option value="updatedAt">آخرین ویرایش</option>
                <option value="name">نام</option>
                <option value="rating">امتیاز</option>
                <option value="code">کد</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="desc">نزولی</option>
                <option value="asc">صعودی</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={() => {
                  setPage(1);
                  fetchSuppliers();
                }}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <RefreshCw className="h-5 w-5" />
                <span className="hidden md:inline">بروزرسانی</span>
              </button>

              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2 text-white bg-amber-600 rounded-lg hover:bg-amber-700"
              >
                <Plus className="h-5 w-5" />
                <span>افزودن تامین‌کننده</span>
              </button>

              <button
                onClick={onSearchClick}
                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 md:hidden"
              >
                <Search className="h-5 w-5" />
                جستجو
              </button>
            </div>
          </div>
        </div>

        {/* Top suppliers (optional) */}
        {summary?.topSuppliers && summary.topSuppliers.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">برترین تامین‌کنندگان (براساس مبلغ خرید)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {summary.topSuppliers.slice(0, 6).map((t) => (
                <div key={t.supplierId} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{t.name || 'نامشخص'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">کد: {t.code || '-'}</p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-4 w-4" />
                      <span className="text-sm">{t.rating ?? '-'}</span>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                    <p>تعداد خرید: {t.purchaseCount}</p>
                    <p className="mt-1">مجموع هزینه: {formatCurrency(t.totalSpent)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Store className="h-16 w-16 mb-4 opacity-50" />
              <p>هیچ تامین‌کننده‌ای یافت نشد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">نام/کد</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">تماس</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">مکان</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">امتیاز/دسته‌ها</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">وضعیت</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">عملیات</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {rows.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{s.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">کد: {s.code}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="ltr:font-mono">{s.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 mt-1">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="truncate max-w-[200px]">{s.email || '-'}</span>
                        </div>
                        {s.contactPerson && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">مسئول: {s.contactPerson}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="truncate max-w-[200px]">{s.city || '-'}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[240px]">
                          {s.address || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Star className={`h-4 w-4 ${s.rating ? 'text-amber-500' : 'text-gray-400'}`} />
                          <span className="text-sm text-gray-900 dark:text-white">{s.rating ?? '-'}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(s.categories || []).slice(0, 4).map((c, i) => (
                            <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                              {c}
                            </span>
                          ))}
                          {(s.categories || []).length > 4 && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-50 text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                              +{(s.categories || []).length - 4}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(s.status)}`}>
                          {s.status === 'ACTIVE' ? 'فعال' : s.status === 'INACTIVE' ? 'غیرفعال' : 'لیست سیاه'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openDetailsModal(s)}
                            className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                            title="جزئیات"
                          >
                            <Eye className="h-5 w-5" />
                          </button>

                          <button
                            onClick={() => openRatingModal(s)}
                            className="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
                            title="امتیاز"
                          >
                            <Star className="h-5 w-5" />
                          </button>

                          <button
                            onClick={() => openEditModal(s)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="ویرایش"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>

                          {s.status !== 'ACTIVE' && (
                            <button
                              onClick={() => handleChangeStatus(s, 'ACTIVE')}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="فعال‌سازی"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                          )}
                          {s.status !== 'INACTIVE' && (
                            <button
                              onClick={() => handleChangeStatus(s, 'INACTIVE')}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                              title="غیرفعال"
                            >
                              <Ban className="h-5 w-5" />
                            </button>
                          )}
                          {s.status !== 'BLACKLISTED' && (
                            <button
                              onClick={() => handleChangeStatus(s, 'BLACKLISTED')}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="لیست سیاه"
                            >
                              <AlertTriangle className="h-5 w-5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(s.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="حذف (غیرفعال)"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${page <= 1
                    ? 'text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                    : 'text-gray-700 border-gray-200 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
                    }`}
                >
                  قبلی
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  صفحه {page} از {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${page >= totalPages
                    ? 'text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                    : 'text-gray-700 border-gray-200 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
                    }`}
                >
                  بعدی
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">افزودن تامین‌کننده</h2>
                <button onClick={() => { setShowAddModal(false); resetForm(); }}>
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="p-6 space-y-4">
                {/* Identity */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="مثلاً: زرین تجارت"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">کد</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="در صورت خالی سیستم تولید می‌کند"
                    />
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام مسئول</label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تلفن *</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="مثلاً: 09121234567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ایمیل</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">آدرس</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="آدرس کامل"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شهر</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">کد پستی</label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شرایط پرداخت</label>
                    <input
                      type="text"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="NET 30, COD, ..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">امتیاز (1-5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">دسته‌ها (با کاما جدا شود)</label>
                    <div className="flex items-center gap-2">
                      <TagsIcon className="h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.categories}
                        onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="طلا، سنگ، ..."
                      />
                    </div>
                  </div>
                </div>

                {/* IDs & Website */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شماره مجوز</label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">کد مالیاتی</label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وبسایت</label>
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes & Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">یادداشت</label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="یادداشت‌های مربوط به تامین‌کننده..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وضعیت *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as SupplierStatus })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="ACTIVE">فعال</option>
                      <option value="INACTIVE">غیرفعال</option>
                      <option value="BLACKLISTED">لیست سیاه</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                  >
                    <Save className="h-5 w-5" />
                    ذخیره
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

        {/* Edit Modal */}
        {showEditModal && selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">ویرایش تامین‌کننده</h2>
                <button onClick={() => { setShowEditModal(false); setSelected(null); resetForm(); }}>
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleEdit} className="p-6 space-y-4">
                {/* Reuse same fields as Add Modal */}
                {/* Identity */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">کد</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام مسئول</label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تلفن *</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ایمیل</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">آدرس</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شهر</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">کد پستی</label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شرایط پرداخت</label>
                    <input
                      type="text"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">امتیاز (1-5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">دسته‌ها (با کاما جدا شود)</label>
                    <div className="flex items-center gap-2">
                      <TagsIcon className="h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.categories}
                        onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* IDs & Website */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شماره مجوز</label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">کد مالیاتی</label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وبسایت</label>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                {/* Notes & Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">یادداشت</label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وضعیت *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as SupplierStatus })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="ACTIVE">فعال</option>
                      <option value="INACTIVE">غیرفعال</option>
                      <option value="BLACKLISTED">لیست سیاه</option>
                    </select>
                  </div>
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
                    onClick={() => { setShowEditModal(false); setSelected(null); resetForm(); }}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-medium"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rating Modal */}
        {showRatingModal && selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  امتیازدهی: {selected.name}
                </h2>
                <button onClick={() => { setShowRatingModal(false); setSelected(null); }}>
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleUpdateRating} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    امتیاز (1-5) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={ratingValue}
                    onChange={(e) => setRatingValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="مثلاً: 4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    یادداشت
                  </label>
                  <textarea
                    rows={3}
                    value={ratingNotes}
                    onChange={(e) => setRatingNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="توضیح در مورد امتیاز..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    ذخیره
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowRatingModal(false); setSelected(null); }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selected.name}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">کد: {selected.code}</p>
                </div>
                <button onClick={() => { setShowDetailsModal(false); setSelected(null); }}>
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payables */}
                <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      بدهی‌ها (Payables)
                    </h3>
                    <button
                      onClick={openAddPayable}
                      className="px-3 py-1.5 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                    >
                      افزودن بدهی
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    مجموع بدهی‌های باز:{' '}
                    {formatCurrency(
                      (selected?.payables || []).reduce(
                        (sum, p) => sum + (p.remainingAmount ?? 0),
                        0
                      )
                    )}
                  </p>

                  {(!selected?.payables || selected.payables.length === 0) ? (
                    <p className="text-sm text-gray-500">موردی یافت نشد</p>
                  ) : (
                    <div className="space-y-2">
                      {selected.payables.map((p: any) => (
                        <div
                          key={p.id}
                          className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-900 dark:text-white">
                              فاکتور: {p.invoiceNumber}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              سررسید:{' '}
                              {p.dueDate ? new Date(p.dueDate).toLocaleDateString('fa-IR') : '-'}
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                            مبلغ: {formatCurrency(p.amount)}{' '}
                            {typeof p.paidAmount === 'number' && (
                              <>
                                | پرداخت‌شده: {formatCurrency(p.paidAmount)}
                              </>
                            )}{' '}
                            | باقیمانده: {formatCurrency(p.remainingAmount)}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => openEditPayable(p)}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              ویرایش
                            </button>
                            <button
                              onClick={() => handleDeletePayable(p.id)}
                              className="text-red-600 hover:text-red-900 text-xs"
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Purchases */}
                <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      خریدهای اخیر
                    </h3>
                    <button
                      onClick={openAddPurchase}
                      className="px-3 py-1.5 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                    >
                      افزودن خرید
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    تعداد: {selected?.purchases?.length || 0}
                  </p>

                  {(!selected?.purchases || selected.purchases.length === 0) ? (
                    <p className="text-sm text-gray-500">موردی یافت نشد</p>
                  ) : (
                    <div className="space-y-2">
                      {selected.purchases.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {p.purchaseNumber}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(p.purchaseDate).toLocaleDateString('fa-IR')}
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                            مبلغ: {formatCurrency(p.totalAmount)} | وضعیت: {p.status}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => openEditPurchase(p)}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              ویرایش
                            </button>
                            <button
                              onClick={() => handleDeletePurchase(p.id)}
                              className="text-red-600 hover:text-red-900 text-xs"
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => { setShowDetailsModal(false); setSelected(null); }}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Payable Modal */}
        {showPayableModal && selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingPayable ? 'ویرایش بدهی' : 'افزودن بدهی'}
                </h2>
                <button onClick={() => { setShowPayableModal(false); setEditingPayable(null); }}>
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSavePayable} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      شماره فاکتور *
                    </label>
                    <input
                      type="text"
                      required
                      value={payableForm.invoiceNumber}
                      onChange={(e) => setPayableForm({ ...payableForm, invoiceNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="INV-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      تاریخ فاکتور *
                    </label>
                    <input
                      type="date"
                      required
                      value={payableForm.invoiceDate}
                      onChange={(e) => setPayableForm({ ...payableForm, invoiceDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      مبلغ کل *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={payableForm.amount}
                      onChange={(e) => setPayableForm({ ...payableForm, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      مبلغ پرداخت‌شده
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={payableForm.paidAmount}
                      onChange={(e) => setPayableForm({ ...payableForm, paidAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="0"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      تاریخ سررسید
                    </label>
                    <input
                      type="date"
                      value={payableForm.dueDate}
                      onChange={(e) => setPayableForm({ ...payableForm, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      یادداشت
                    </label>
                    <textarea
                      rows={3}
                      value={payableForm.notes}
                      onChange={(e) => setPayableForm({ ...payableForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="یادداشت..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                  >
                    <Save className="h-5 w-5" />
                    ذخیره
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowPayableModal(false); setEditingPayable(null); }}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-medium"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Purchase Modal */}
        {showPurchaseModal && selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingPurchase ? 'ویرایش خرید' : 'افزودن خرید'}
                </h2>
                <button onClick={() => { setShowPurchaseModal(false); setEditingPurchase(null); }}>
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSavePurchase} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      شماره خرید *
                    </label>
                    <input
                      type="text"
                      required
                      value={purchaseForm.purchaseNumber}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="PUR-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      تاریخ خرید *
                    </label>
                    <input
                      type="date"
                      required
                      value={purchaseForm.purchaseDate}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      وضعیت *
                    </label>
                    <select
                      value={purchaseForm.status}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="PENDING">در انتظار</option>
                      <option value="COMPLETED">تکمیل شده</option>
                      <option value="CANCELLED">لغو شده</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      مبلغ کل *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={purchaseForm.totalAmount}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, totalAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      جمع جزء
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={purchaseForm.subtotal}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, subtotal: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      مالیات
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={purchaseForm.taxAmount}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, taxAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="0"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      مبلغ پرداخت‌شده
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={purchaseForm.paidAmount}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, paidAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="0"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      یادداشت
                    </label>
                    <textarea
                      rows={3}
                      value={purchaseForm.notes}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="یادداشت..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                  >
                    <Save className="h-5 w-5" />
                    ذخیره
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowPurchaseModal(false); setEditingPurchase(null); }}
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
    </div>
  );
}