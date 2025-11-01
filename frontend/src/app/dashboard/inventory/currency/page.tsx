'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
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
  DollarSign,
  ArrowUpRight,
  Upload,
  Camera,
  Image as ImageIcon,
  Banknote,
  QrCode,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

interface CurrencyItem {
  id: string;
  sku: string;
  qrCode: string;
  name: string;
  currencyCode: string;
  purchasePrice: number; // buy rate
  sellingPrice: number; // sell rate
  status: string;
  quantity: number;
  description?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

interface Summary {
  totalQuantity: number;
  byCurrency: Array<{
    currencyCode: string;
    count: number;
    quantity: number;
    averagePurchaseRate: number;
    averageSellingRate: number;
  }>;
  lowStock?: Array<{
    productId: string;
    sku: string;
    name: string;
    currencyCode: string;
    currentQuantity: number;
    minimumStock: number;
  }>;
}

export default function CurrencyPage() {
  const [rows, setRows] = useState<CurrencyItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [goldData, setGoldData] = useState<any | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('IN_STOCK');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CurrencyItem | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showScaleCapture, setShowScaleCapture] = useState(false);
  const [scaleImageUrl, setScaleImageUrl] = useState<string>('');
  const [qrModal, setQrModal] = useState<{ open: boolean; qrCode?: string; dataUrl?: string }>({ open: false });

  const ScaleCapturePanel = dynamic(() => import('@/components/ScaleCapturePanel'), { ssr: false });

  const [formData, setFormData] = useState({
    name: '',
    currencyCode: 'USD',
    purchasePrice: '',
    sellingPrice: '',
    quantity: '0',
    description: '',
    images: [] as string[],
  });

  // Branch allocations state
  const [branches, setBranches] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [branchAllocations, setBranchAllocations] = useState<Array<{ id: string; branchId: string; quantity: string }>>([]);

  useEffect(() => {
    fetchRows();
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCode, selectedStatus]);

  // Load current market rates only when add modal opens
  useEffect(() => {
    if (!showAddModal) return;
    (async () => {
      try {
        const res = await api.get('/analytics/gold-currency-prices');
        setGoldData(res.data || null);
      } catch {}
    })();
  }, [showAddModal]);

  // Load branches when the add modal opens
  useEffect(() => {
    if (!showAddModal) return;
    (async () => {
      try {
        const res = await api.get('/branches', { params: { limit: 1000, isActive: 'true', sortBy: 'name', sortOrder: 'asc' } });
        const items = Array.isArray(res?.data?.items) ? res.data.items : [];
        setBranches(items.map((b: any) => ({ id: b.id, name: b.name, code: b.code })));
      } catch (e) {
        // silent
      }
    })();
  }, [showAddModal]);

  useEffect(() => {
    const onFocus = () => {
      try {
        const newImages: string[] = [];
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i) as string;
          if (!key || !key.startsWith('scale_img_')) continue;
          const img = localStorage.getItem(key);
          if (img) {
            newImages.push(img);
            keysToRemove.push(key);
          }
        }
        if (newImages.length) setFormData((p) => ({ ...p, images: [...p.images, ...newImages] }));
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch {}
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const findCurrencyRate = (code: string): number | null => {
    if (!goldData || !goldData.currencyRates) return null;
    const item = goldData.currencyRates.find((c: any) => c.symbol === code || c.currency === code || c.nameEn === code);
    return item && typeof item.rate === 'number' ? item.rate : null;
  };

  // Auto-fill rates based on selected currency and current market
  useEffect(() => {
    const rate = findCurrencyRate(formData.currencyCode);
    if (rate) {
      setFormData((p) => ({ ...p, purchasePrice: String(rate), sellingPrice: String(rate) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.currencyCode, goldData]);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      if (selectedStatus) params.status = selectedStatus;
      if (selectedCode) params.currencyCode = selectedCode;
      if (searchTerm) params.search = searchTerm;

      const res = await api.get('/inventory/currency', { params });
      const items: CurrencyItem[] = res.data.items || [];
      setRows(items);
    } catch (e: any) {
      console.error(e);
      showMessage('error', 'خطا در بارگذاری داده‌ها');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get('/inventory/currency/summary');
      setSummary(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const allocations = branchAllocations
        .filter((alloc) => alloc.branchId && parseInt(alloc.quantity || '0') > 0)
        .map((alloc) => ({ branchId: alloc.branchId, quantity: parseInt(alloc.quantity || '0') }));
      
      if (allocations.length === 0) {
        showMessage('error', 'لطفاً حداقل یک تخصیص به شعبه اضافه کنید');
        return;
      }

      const totalAlloc = allocations.reduce((s, a) => s + a.quantity, 0);

      const res = await api.post('/inventory/currency', {
        name: formData.name || `${formData.currencyCode} Currency`,
        currencyCode: formData.currencyCode,
        purchasePrice: parseFloat(formData.purchasePrice || '0'),
        sellingPrice: parseFloat(formData.sellingPrice || '0'),
        quantity: totalAlloc,
        description: formData.description || undefined,
        images: formData.images.length ? formData.images : undefined,
        allocations: allocations.length > 0 ? allocations : undefined,
      });
      showMessage('success', 'ارز با موفقیت اضافه شد');
      // Auto-open QR modal
      try {
        const createdId: string | undefined = res?.data?.id;
        if (createdId) {
          const q = await api.get(`/utilities/qr-code/product/${createdId}`);
          if (q?.data?.dataUrl) setQrModal({ open: true, qrCode: q.data.qrCode, dataUrl: q.data.dataUrl });
        }
      } catch {}
      setShowAddModal(false);
      resetForm();
      fetchRows();
      fetchSummary();
    } catch (e: any) {
      showMessage('error', e.response?.data?.message || 'خطا در افزودن ارز');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      await api.patch(`/inventory/currency/${selectedItem.id}`, {
        name: formData.name || undefined,
        currencyCode: formData.currencyCode || undefined,
        purchasePrice: formData.purchasePrice === '' ? undefined : parseFloat(formData.purchasePrice),
        sellingPrice: formData.sellingPrice === '' ? undefined : parseFloat(formData.sellingPrice),
        quantity: formData.quantity === '' ? undefined : parseInt(formData.quantity, 10),
        description: formData.description || undefined,
        images: formData.images.length ? formData.images : undefined,
      });
      showMessage('success', 'ارز با موفقیت ویرایش شد');
      setShowEditModal(false);
      setSelectedItem(null);
      resetForm();
      fetchRows();
      fetchSummary();
    } catch (e: any) {
      showMessage('error', e.response?.data?.message || 'خطا در ویرایش ارز');
    }
  };

  const handleDelete = async (id: string) => {
    const target = rows.find((r) => r.id === id);
    const isReturned = target?.status === 'RETURNED';
    const message = isReturned 
      ? 'آیا از حذف دائمی این ارز اطمینان دارید؟ این عمل قابل بازگشت نیست.'
      : 'آیا از حذف این ارز اطمینان دارید؟ وضعیت آن به "برگشت شده" تغییر خواهد کرد.';

    if (!confirm(message)) return;

    try {
      const response = await api.delete(`/inventory/currency/${id}`);
      showMessage('success', response.data?.message || (isReturned ? 'ارز با موفقیت حذف شد' : 'ارز به وضعیت برگشت شده تغییر یافت'));
      fetchRows(); // Automatically refresh the table
      fetchSummary();
    } catch (e: any) {
      showMessage('error', e.response?.data?.message || 'خطا در حذف ارز');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          showMessage('error', `فایل ${file.name} تصویر نیست`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          showMessage('error', `حجم فایل ${file.name} بیش از 5MB است`);
          continue;
        }
        const base64 = await convertFileToBase64(file);
        newImages.push(base64);
      }
      setFormData((p) => ({ ...p, images: [...p.images, ...newImages] }));
      if (newImages.length > 0) showMessage('success', `${newImages.length} تصویر اضافه شد`);
    } catch (e) {
      console.error(e);
      showMessage('error', 'خطا در آپلود تصویر');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const addScaleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 5 * 1024 * 1024) continue;
        const base64 = await convertFileToBase64(file);
        newImages.push(base64);
      }
      if (newImages.length) setFormData((p) => ({ ...p, images: [...p.images, ...newImages] }));
    } finally {
      e.target.value = '';
    }
  };

  const openScalePanel = () => setShowScaleCapture(true);
  const handleCaptured = (uploadedUrl: string) => {
    setScaleImageUrl(uploadedUrl);
    setShowScaleCapture(false);
  };

  const convertFileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });

  const handleRemoveImage = (index: number) => {
    setFormData((p) => ({ ...p, images: p.images.filter((_, i) => i !== index) }));
  };

  const openEditModal = (item: CurrencyItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name || '',
      currencyCode: item.currencyCode || 'USD',
      purchasePrice: item.purchasePrice?.toString() || '',
      sellingPrice: item.sellingPrice?.toString() || '',
      quantity: item.quantity?.toString() || '',
      description: item.description || '',
      images: item.images || [],
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      currencyCode: 'USD',
      purchasePrice: '',
      sellingPrice: '',
      quantity: '0',
      description: '',
      images: [],
    });
    setBranchAllocations([]);
  };

  const addBranchAllocation = () => {
    const availableBranches = branches.filter(
      (b) => !branchAllocations.some((alloc) => alloc.branchId === b.id)
    );
    if (availableBranches.length === 0) return;
    
    setBranchAllocations((prev) => [
      ...prev,
      {
        id: `alloc-${Date.now()}-${Math.random()}`,
        branchId: availableBranches[0].id,
        quantity: '1',
      },
    ]);
  };

  const removeBranchAllocation = (id: string) => {
    setBranchAllocations((prev) => prev.filter((alloc) => alloc.id !== id));
  };

  const updateBranchAllocation = (id: string, field: 'branchId' | 'quantity', value: string) => {
    setBranchAllocations((prev) =>
      prev.map((alloc) => (alloc.id === id ? { ...alloc, [field]: value } : alloc))
    );
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const formatNumber = (n: number) => new Intl.NumberFormat('fa-IR').format(n);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'SOLD':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'RESERVED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'RETURNED':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'DAMAGED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'IN_STOCK': return 'موجود';
      case 'SOLD': return 'فروخته شده';
      case 'RESERVED': return 'رزرو';
      case 'DAMAGED': return 'آسیب دیده';
      case 'RETURNED': return 'برگشت شده';
      default: return status;
    }
  };

  const currencyCodes = ['USD', 'EUR', 'AED', 'TRY', 'GBP', 'CNY', 'INR'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">مدیریت ارز</h1>
          <p className="text-gray-600 dark:text-gray-400">مدیریت موجودی ارزهای خارجی</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">کل موجودی ارزی</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatNumber(summary?.totalQuantity || 0)}
                </p>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-full">
                <Banknote className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {(summary?.byCurrency?.length || 0).toString()} نوع ارز
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">مجموع میانگین نرخ خرید</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatNumber((summary?.byCurrency || []).reduce((acc, c) => acc + (c.averagePurchaseRate || 0), 0))}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">مجموع میانگین نرخ فروش</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatNumber((summary?.byCurrency || []).reduce((acc, c) => acc + (c.averageSellingRate || 0), 0))}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                <ArrowUpRight className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="جستجو بر اساس نام، کد ارز یا SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchRows()}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={selectedCode}
                onChange={(e) => setSelectedCode(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">همه ارزها</option>
                {currencyCodes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">همه وضعیت‌ها</option>
                <option value="IN_STOCK">موجود</option>
                <option value="SOLD">فروخته شده</option>
                <option value="RESERVED">رزرو شده</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={fetchRows}
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
                <span>افزودن ارز</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Banknote className="h-16 w-16 mb-4 opacity-50" />
              <p>هیچ ارزی یافت نشد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      تصویر
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      نام
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      کد ارز
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      نرخ خرید
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      نرخ فروش
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      موجودی
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      وضعیت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {rows.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.images && item.images.length > 0 ? (
                            <img
                              src={item.images[0]}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML =
                                  '<div class="flex items-center justify-center w-full h-full"><svg class="h-8 w-8 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg></div>';
                              }}
                            />
                          ) : (
                            <Banknote className="h-8 w-8 text-amber-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.sku}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.currencyCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatNumber(item.purchasePrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatNumber(item.sellingPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            item.quantity > 5000
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : item.quantity > 1000
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          {formatNumber(item.quantity)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                const q = await api.get(`/utilities/qr-code/product/${item.id}`);
                                if (q?.data?.dataUrl) setQrModal({ open: true, qrCode: q.data.qrCode, dataUrl: q.data.dataUrl });
                              } catch {}
                            }}
                            className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                            title="کد QR"
                          >
                            <QrCode className="h-5 w-5" />
                          </button>
                          <Link
                            href={`/dashboard/inventory/currency/${item.id}`}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => openEditModal(item)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {showAddModal ? 'افزودن ارز جدید' : 'ویرایش ارز'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setSelectedItem(null);
                  resetForm();
                }}
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleAdd : handleEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام ارز
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="مثلاً: دلار آمریکا (USD)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    کد ارز *
                  </label>
                  <select
                    value={formData.currencyCode}
                    onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {currencyCodes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">نرخ خرید (ریال)</label>
                  </div>
                  <input
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نرخ فروش (ریال)
                  </label>
                  <input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    موجودی (بر اساس تخصیص به شعب محاسبه می‌شود)
                  </label>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    جمع تخصیص فعلی: {branchAllocations.reduce((sum, alloc) => sum + (parseInt(alloc.quantity || '0') || 0), 0)} عدد
                  </div>
                </div>
              </div>

              {/* Branch allocations */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    تخصیص به شعب *
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      جمع کل: {branchAllocations.reduce((sum, alloc) => sum + (parseInt(alloc.quantity || '0') || 0), 0)}
                    </span>
                    <button
                      type="button"
                      onClick={addBranchAllocation}
                      disabled={branches.length === 0 || branchAllocations.length >= branches.length}
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4" />
                      افزودن شعبه
                    </button>
                  </div>
                </div>

                {branchAllocations.length === 0 && (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      هنوز شعبه‌ای اضافه نشده است
                    </p>
                    <button
                      type="button"
                      onClick={addBranchAllocation}
                      disabled={branches.length === 0}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4" />
                      افزودن اولین شعبه
                    </button>
                  </div>
                )}

                {branchAllocations.length > 0 && (
                  <div className="space-y-2">
                    {branchAllocations.map((alloc) => {
                      const availableBranches = branches.filter(
                        (b) => !branchAllocations.some((a) => a.branchId === b.id && a.id !== alloc.id)
                      );
                      const selectedBranch = branches.find((b) => b.id === alloc.branchId);
                      
                      return (
                        <div
                          key={alloc.id}
                          className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
                        >
                          <select
                            value={alloc.branchId}
                            onChange={(e) => updateBranchAllocation(alloc.id, 'branchId', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          >
                            {selectedBranch ? (
                              <option value={selectedBranch.id}>
                                {selectedBranch.name} ({selectedBranch.code})
                              </option>
                            ) : (
                              <option value="">انتخاب شعبه</option>
                            )}
                            {availableBranches.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name} ({b.code})
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="1"
                            required
                            value={alloc.quantity}
                            onChange={(e) => updateBranchAllocation(alloc.id, 'quantity', e.target.value)}
                            placeholder="تعداد"
                            className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeBranchAllocation(alloc.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            title="حذف"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توضیحات
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="توضیحات ارز..."
                />
              </div>

              {/* Image Management */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تصاویر ارز
                </label>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <label className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                    <Upload className="h-4 w-4" />
                    <span>{uploadingImage ? 'در حال آپلود...' : 'آپلود از سیستم'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt('آدرس URL تصویر را وارد کنید:');
                      if (url && url.trim()) {
                        setFormData((p) => ({ ...p, images: [...p.images, url.trim()] }));
                      }
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>افزودن از URL</span>
                  </button>
                </div>

                {formData.images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {formData.images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`ارز ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/150?text=تصویر+نامعتبر';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">هنوز تصویری اضافه نشده است</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-5 w-5" />
                  {showAddModal ? 'ذخیره' : 'ذخیره تغییرات'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedItem(null);
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
      {(showAddModal || showEditModal) && showScaleCapture && (
        <ScaleCapturePanel
          itemId={'currency-form'}
          onClose={() => setShowScaleCapture(false)}
          onCaptured={handleCaptured}
        />
      )}

      {/* QR Modal */}
      {qrModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کد QR ارز</h3>
              <button onClick={() => setQrModal({ open: false })}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center gap-3">
              {qrModal.dataUrl && (
                <img src={qrModal.dataUrl} alt={qrModal.qrCode || 'کد QR'} className="w-64 h-64" />
              )}
              {qrModal.qrCode && (
                <div className="text-sm text-gray-600 dark:text-gray-300">{qrModal.qrCode}</div>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    if (!qrModal.dataUrl) return;
                    const w = window.open('', '_blank');
                    if (!w) return;
                    w.document.write(`<!DOCTYPE html><html><head><meta charset='utf-8'><title>چاپ کد QR</title>
                      <style>body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh} img{width:80mm;height:80mm}</style>
                    </head><body><img src='${qrModal.dataUrl}' /></body></html>`);
                    w.document.close();
                    w.focus();
                    w.print();
                  }}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  چاپ
                </button>
                <button
                  onClick={() => setQrModal({ open: false })}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}