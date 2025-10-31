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
  TrendingUp,
  DollarSign,
  Coins as CoinsIcon,
  Upload,
  Camera,
  Image as ImageIcon,
  QrCode,
} from 'lucide-react';

interface Coin {
  id: string;
  sku: string;
  qrCode: string;
  name: string;
  coinType: string;
  coinYear?: number;
  weight: number;
  purchasePrice: number;
  sellingPrice: number;
  status: string;
  quantity: number;
  description?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

interface Summary {
  totalQuantity: number;
  totalPurchaseValue: number;
  totalSellingValue: number;
  byType: Array<{
    coinType: string;
    count: number;
    quantity: number;
    purchaseValue: number;
    sellingValue: number;
  }>;
}

export default function CoinsPage() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [goldData, setGoldData] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('IN_STOCK');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Coin | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showScaleCapture, setShowScaleCapture] = useState(false);
  const [scaleImageUrl, setScaleImageUrl] = useState<string>('');
  const [qrModal, setQrModal] = useState<{ open: boolean; qrCode?: string; dataUrl?: string }>({ open: false });

  const ScaleCapturePanel = dynamic(() => import('@/components/ScaleCapturePanel'), { ssr: false });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    coinType: 'BAHAR_AZADI' as string,
    coinYear: new Date().getFullYear().toString(),
    weight: '',
    purchasePrice: '',
    sellingPrice: '',
    quantity: '1',
    description: '',
    images: [] as string[],
  });

  useEffect(() => {
    fetchCoins();
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, selectedYear, selectedStatus]);

  useEffect(() => {
    if (!showAddModal) return;
    (async () => {
      try {
        const res = await api.get('/analytics/gold-currency-prices');
        setGoldData(res.data || null);
      } catch {}
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
        if (newImages.length) {
          setFormData((p) => ({ ...p, images: [...p.images, ...newImages] }));
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch {}
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const pricePerGramK24 = (): number | null => {
    if (!goldData || !goldData.goldPrices) return null;
    const k24 = goldData.goldPrices.find((g: any) =>
      (g.nameEn && g.nameEn.toUpperCase().includes('K24')) || (g.type && g.type.includes('K24'))
    );
    return k24 && typeof k24.price === 'number' ? k24.price : null;
  };

  const coinMarketPrice = (coinType: string): number | null => {
    if (!goldData || !goldData.goldPrices) return null;
    const symbolMap: Record<string, string> = {
      BAHAR_AZADI: 'IR_COIN_BAHAR',
      GERAMI: 'IR_COIN_1G',
      NIM_AZADI: 'IR_COIN_HALF',
      HALF_BAHAR: 'IR_COIN_HALF',
      ROB_AZADI: 'IR_COIN_QUARTER',
      QUARTER_BAHAR: 'IR_COIN_QUARTER',
      EMAMI: 'IR_COIN_EMAMI',
    };
    const symbol = symbolMap[coinType];
    if (!symbol) return null;
    const found = goldData.goldPrices.find((g: any) => g.symbol === symbol);
    return found && typeof found.price === 'number' ? found.price : null;
  };

  useEffect(() => {
    const qty = Math.max(1, parseInt(formData.quantity || '1'));
    const market = coinMarketPrice(formData.coinType);
    if (market) {
      const base = Math.round(market * qty);
      setFormData((prev) => ({ ...prev, purchasePrice: String(base), sellingPrice: String(base) }));
      return;
    }
    const weight = parseFloat(formData.weight || '0');
    const perGram = pricePerGramK24();
    if (perGram && weight > 0) {
      const fallback = Math.round(perGram * weight * qty);
      setFormData((prev) => ({ ...prev, purchasePrice: String(fallback), sellingPrice: String(fallback) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.coinType, formData.weight, formData.quantity, goldData]);

  const fetchCoins = async () => {
    try {
      setLoading(true);
      const params: any = {
        limit: 100,
        status: selectedStatus,
      };
      if (selectedType) params.coinType = selectedType;
      if (selectedYear) params.coinYear = selectedYear;
      if (searchTerm) params.search = searchTerm;

      const response = await api.get('/inventory/coins', { params });
      setCoins(response.data.items || []);
    } catch (error: any) {
      console.error('Failed to fetch coins:', error);
      showMessage('error', 'خطا در بارگذاری اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get('/inventory/coins/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/inventory/coins', {
        name: formData.name,
        coinType: formData.coinType,
        coinYear: parseInt(formData.coinYear),
        weight: parseFloat(formData.weight),
        purchasePrice: parseFloat(formData.purchasePrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        quantity: parseInt(formData.quantity),
        description: formData.description || undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
      });

      showMessage('success', 'سکه با موفقیت اضافه شد');
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
      fetchCoins();
      fetchSummary();
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'خطا در افزودن سکه');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      await api.patch(`/inventory/coins/${selectedItem.id}`, {
        name: formData.name,
        coinType: formData.coinType,
        coinYear: parseInt(formData.coinYear),
        weight: parseFloat(formData.weight),
        purchasePrice: parseFloat(formData.purchasePrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        quantity: parseInt(formData.quantity),
        description: formData.description || undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
      });

      showMessage('success', 'سکه با موفقیت ویرایش شد');
      setShowEditModal(false);
      setSelectedItem(null);
      resetForm();
      fetchCoins();
      fetchSummary();
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'خطا در ویرایش سکه');
    }
  };

  const handleDelete = async (coin: Coin) => {
    const isReturned = coin.status === 'RETURNED';
    const question = isReturned
      ? 'این مورد قبلاً به حالت عودت درآمده است. حذف دائمی انجام شود؟'
      : 'آیا از حذف این سکه (عودت) اطمینان دارید؟';
    if (!confirm(question)) return;

    try {
      await api.delete(`/inventory/coins/${coin.id}`, {
        params: isReturned ? { force: 1 } : undefined,
      });
      showMessage('success', isReturned ? 'سکه برای همیشه حذف شد' : 'سکه به وضعیت عودت تغییر کرد');
      fetchCoins();
      fetchSummary();
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'خطا در حذف سکه');
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
          showMessage('error', `فایل ${file.name} یک تصویر نیست`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          showMessage('error', `حجم فایل ${file.name} بیش از 5 مگابایت است`);
          continue;
        }

        const base64 = await convertFileToBase64(file);
        newImages.push(base64);
      }

      setFormData({
        ...formData,
        images: [...formData.images, ...newImages],
      });

      if (newImages.length > 0) {
        showMessage('success', `${newImages.length} تصویر با موفقیت اضافه شد`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
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

  const openScalePanel = () => {
    setShowScaleCapture(true);
  };

  const handleCaptured = (uploadedUrl: string) => {
    setScaleImageUrl(uploadedUrl);
    setShowScaleCapture(false);
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleRemoveImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const openEditModal = (item: Coin) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      coinType: item.coinType,
      coinYear: item.coinYear?.toString() || new Date().getFullYear().toString(),
      weight: item.weight.toString(),
      purchasePrice: item.purchasePrice.toString(),
      sellingPrice: item.sellingPrice.toString(),
      quantity: item.quantity.toString(),
      description: item.description || '',
      images: item.images || [],
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      coinType: 'BAHAR_AZADI',
      coinYear: new Date().getFullYear().toString(),
      weight: '',
      purchasePrice: '',
      sellingPrice: '',
      quantity: '1',
      description: '',
      images: [],
    });
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const formatWeight = (weight: number) => {
    return new Intl.NumberFormat('fa-IR', { minimumFractionDigits: 3 }).format(weight) + ' گرم';
  };

  const getCoinTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'BAHAR_AZADI':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'GERAMI':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'NIM_AZADI':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'ROB_AZADI':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'HALF_BAHAR':
        return 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200';
      case 'QUARTER_BAHAR':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getCoinTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      BAHAR_AZADI: 'بهار آزادی',
      GERAMI: 'گرمی',
      NIM_AZADI: 'نیم آزادی',
      ROB_AZADI: 'ربع آزادی',
      HALF_BAHAR: 'نیم بهار',
      QUARTER_BAHAR: 'ربع بهار',
      OTHER: 'سایر',
    };
    return labels[type] || type;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'SOLD':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'RESERVED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Generate year options (current year - 20 to current year + 1)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 22 }, (_, i) => currentYear - 20 + i);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">مدیریت سکه</h1>
          <p className="text-gray-600 dark:text-gray-400">مدیریت موجودی سکه‌های طلا</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">تعداد کل</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {summary?.totalQuantity || 0}
                </p>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-full">
                <CoinsIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {summary?.byType?.length || 0} نوع سکه
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">ارزش خرید</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatCurrency(summary?.totalPurchaseValue || 0)}
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
                <p className="text-sm text-gray-600 dark:text-gray-400">ارزش فروش</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatCurrency(summary?.totalSellingValue || 0)}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="جستجو بر اساس نام یا SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchCoins()}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">همه انواع</option>
                  <option value="BAHAR_AZADI">بهار آزادی</option>
                  <option value="GERAMI">گرمی</option>
                  <option value="NIM_AZADI">نیم آزادی</option>
                  <option value="ROB_AZADI">ربع آزادی</option>
                  <option value="HALF_BAHAR">نیم بهار</option>
                  <option value="QUARTER_BAHAR">ربع بهار</option>
                  <option value="OTHER">سایر</option>
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">همه سال‌ها</option>
                  {[...yearOptions].reverse().map((year) => (
                    <option key={year} value={year}>
                      {new Intl.NumberFormat('fa-IR').format(year)}
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

              <div className="flex gap-2">
                <button
                  onClick={fetchCoins}
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
                  <span>افزودن سکه</span>
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
          ) : coins.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <CoinsIcon className="h-16 w-16 mb-4 opacity-50" />
              <p>هیچ سکه‌ای یافت نشد</p>
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
                      نوع
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      سال
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      وزن
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      قیمت فروش
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
                  {coins.map((coin) => (
                    <tr key={coin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                          {coin.images && coin.images.length > 0 ? (
                            <img
                              src={coin.images[0]}
                              alt={coin.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML =
                                  '<div class="flex items-center justify-center w-full h-full"><svg class="h-8 w-8 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/></svg></div>';
                              }}
                            />
                          ) : (
                            <CoinsIcon className="h-8 w-8 text-amber-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{coin.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{coin.sku}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getCoinTypeBadgeColor(
                            coin.coinType,
                          )}`}
                        >
                          {getCoinTypeLabel(coin.coinType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {coin.coinYear ? new Intl.NumberFormat('fa-IR').format(coin.coinYear) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatWeight(coin.weight)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(coin.sellingPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            coin.quantity > 10
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : coin.quantity > 5
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          {coin.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(coin.status)}`}>
                          {coin.status === 'IN_STOCK'
                            ? 'موجود'
                            : coin.status === 'SOLD'
                            ? 'فروخته شده'
                            : coin.status === 'RESERVED'
                            ? 'رزرو'
                            : coin.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                const q = await api.get(`/utilities/qr-code/product/${coin.id}`);
                                if (q?.data?.dataUrl) setQrModal({ open: true, qrCode: q.data.qrCode, dataUrl: q.data.dataUrl });
                              } catch {}
                            }}
                            className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                            title="QR"
                          >
                            <QrCode className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openEditModal(coin)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(coin)}
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
                {showAddModal ? 'افزودن سکه جدید' : 'ویرایش سکه'}
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
                    نام سکه *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="مثلاً: سکه بهار آزادی تمام"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نوع سکه *
                  </label>
                  <select
                    value={formData.coinType}
                    onChange={(e) => setFormData({ ...formData, coinType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="BAHAR_AZADI">بهار آزادی</option>
                    <option value="GERAMI">گرمی</option>
                    <option value="NIM_AZADI">نیم آزادی</option>
                    <option value="ROB_AZADI">ربع آزادی</option>
                    <option value="HALF_BAHAR">نیم بهار</option>
                    <option value="QUARTER_BAHAR">ربع بهار</option>
                    <option value="OTHER">سایر</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    سال ضرب
                  </label>
                  <select
                    value={formData.coinYear}
                    onChange={(e) => setFormData({ ...formData, coinYear: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {[...yearOptions].reverse().map((year) => (
                      <option key={year} value={year}>
                        {new Intl.NumberFormat('fa-IR').format(year)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">وزن (گرم) *</label>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer text-xs">
                        <Upload className="h-3 w-3" />
                        <span>آپلود</span>
                        <input type="file" accept="image/*" className="hidden" onChange={addScaleImageFile} />
                      </label>
                      <button
                        type="button"
                        onClick={openScalePanel}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-xs"
                      >
                        <Camera className="h-3 w-3" />
                        <span>دوربین</span>
                      </button>
                      {scaleImageUrl && (
                        <img src={scaleImageUrl} alt="scale" className="w-8 h-8 rounded border border-white/20 object-cover" />
                      )}
                    </div>
                  </div>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تعداد *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    قیمت خرید (ریال) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    قیمت فروش (ریال) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
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
                  placeholder="توضیحات سکه..."
                />
              </div>

              {/* Image Management */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تصاویر سکه
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
                        setFormData({
                          ...formData,
                          images: [...formData.images, url.trim()],
                        });
                      }
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>افزودن از URL</span>
                  </button>
                </div>

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {formData.images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Coin ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/150?text=Invalid+Image';
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
                )}

                {formData.images.length === 0 && (
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
          itemId={'coin-form'}
          onClose={() => setShowScaleCapture(false)}
          onCaptured={handleCaptured}
        />
      )}

      {/* QR Modal */}
      {qrModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کد QR سکه</h3>
              <button onClick={() => setQrModal({ open: false })}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center gap-3">
              {qrModal.dataUrl && (
                <img src={qrModal.dataUrl} alt={qrModal.qrCode || 'QR'} className="w-64 h-64" />
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
                    w.document.write(`<!DOCTYPE html><html><head><meta charset='utf-8'><title>Print QR</title>
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