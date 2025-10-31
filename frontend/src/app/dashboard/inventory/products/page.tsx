'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Eye,
  Package,
  X,
  Save,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Hammer,
  Sparkles,
  QrCode,
  Image as ImageIcon,
  Upload,
  Camera,
} from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  sku: string;
  qrCode: string;
  name: string;
  goldPurity: 'K18' | 'K21' | 'K22' | 'K24' | null;
  weight: number;
  purchasePrice: number;
  sellingPrice: number;
  craftsmanshipFee: number;
  status: string;
  quantity: number;
  description?: string;
  productionStatus?: string;
  images?: string[];
  workshop?: {
    id: string;
    name: string;
    code: string;
  };
  stones?: Array<{
    id: string;
    stoneType: string;
    caratWeight: number;
    quantity: number;
    price: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Summary {
  totalProducts: number;
  totalWeight: number;
  totalPurchaseValue: number;
  totalSellingValue: number;
  totalCraftsmanshipFees: number;
  byPurity: Array<{
    goldPurity: string | null;
    count: number;
    totalWeight: number;
    purchaseValue: number;
    sellingValue: number;
  }>;
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [goldData, setGoldData] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPurity, setSelectedPurity] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('IN_STOCK');
  const [showAddModal, setShowAddModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showScaleCapture, setShowScaleCapture] = useState(false);
  const [scaleImageUrl, setScaleImageUrl] = useState<string>('');

  const ScaleCapturePanel = dynamic(() => import('@/components/ScaleCapturePanel'), { ssr: false });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    goldPurity: 'K18' as 'K18' | 'K21' | 'K22' | 'K24',
    weight: '',
    purchasePrice: '',
    sellingPrice: '',
    craftsmanshipFee: '',
    quantity: '1',
    description: '',
    images: [] as string[],
  });

  useEffect(() => {
    fetchProducts();
    fetchSummary();
  }, [selectedPurity, selectedStatus]);

  useEffect(() => {
    if (searchParams?.get('add') === '1') {
      setShowAddModal(true);
    }
  }, [searchParams]);

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

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = {
        limit: 100,
        status: selectedStatus,
      };
      if (selectedPurity) params.goldPurity = selectedPurity;
      if (searchTerm) params.search = searchTerm;

      const response = await api.get('/inventory/products', { params });
      setProducts(response.data.items || []);
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      showMessage('error', 'خطا در بارگذاری اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get('/inventory/products/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  useEffect(() => {
    if (!showAddModal) return;
    (async () => {
      try {
        const res = await api.get('/analytics/gold-currency-prices');
        setGoldData(res.data || null);
      } catch {}
    })();
  }, [showAddModal]);

  const pricePerGramFromApi = (purity: 'K18' | 'K21' | 'K22' | 'K24'): number | null => {
    if (!goldData || !goldData.goldPrices) return null;
    const bySymbol = goldData.goldPrices.find((g: any) =>
      typeof g.symbol === 'string' && g.symbol.toUpperCase().endsWith(`${purity}`)
    );
    if (bySymbol && typeof bySymbol.price === 'number') return bySymbol.price;
    const swap = purity.replace('K', '') + 'K';
    const byMatch = goldData.goldPrices.find((g: any) =>
      (g.nameEn && g.nameEn.toUpperCase().includes(swap)) || (g.type && g.type.includes(swap))
    );
    if (byMatch && typeof byMatch.price === 'number') return byMatch.price;
    const k24 = goldData.goldPrices.find((g: any) =>
      (g.nameEn && g.nameEn.toUpperCase().includes('K24')) || (g.type && g.type.includes('K24'))
    );
    if (k24 && typeof k24.price === 'number') {
      const ratio = purity === 'K24' ? 1 : purity === 'K22' ? 22 / 24 : purity === 'K21' ? 21 / 24 : 18 / 24;
      return Math.round(k24.price * ratio);
    }
    return null;
  };

  useEffect(() => {
    const weight = parseFloat(formData.weight || '0');
    const qty = Math.max(1, parseInt(formData.quantity || '1'));
    const fee = parseFloat(formData.craftsmanshipFee || '0') || 0;
    const perGram = pricePerGramFromApi(formData.goldPurity);
    if (perGram && weight > 0) {
      const base = Math.round(perGram * weight * qty);
      const sell = Math.round(base + fee * qty);
      setFormData((prev) => ({ ...prev, purchasePrice: String(base), sellingPrice: String(sell) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.goldPurity, formData.weight, formData.quantity, formData.craftsmanshipFee, goldData]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory/products', {
        name: formData.name,
        goldPurity: formData.goldPurity,
        weight: parseFloat(formData.weight),
        purchasePrice: parseFloat(formData.purchasePrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        craftsmanshipFee: parseFloat(formData.craftsmanshipFee),
        quantity: parseInt(formData.quantity),
        description: formData.description || undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
      });

      showMessage('success', 'محصول با موفقیت اضافه شد');
      setShowAddModal(false);
      resetForm();
      fetchProducts();
      fetchSummary();
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'خطا در افزودن محصول');
    }
  };

  const handleDelete = async (product: Product) => {
    const isReturned = product.status === 'RETURNED';
    const question = isReturned
      ? 'این مورد قبلاً به حالت عودت درآمده است. حذف دائمی انجام شود؟'
      : 'آیا از حذف این محصول (عودت) اطمینان دارید؟';
    if (!confirm(question)) return;

    try {
      await api.delete(`/inventory/products/${product.id}`, {
        params: isReturned ? { force: 1 } : undefined,
      });
      showMessage('success', isReturned ? 'محصول برای همیشه حذف شد' : 'محصول به وضعیت عودت تغییر کرد');
      fetchProducts();
      fetchSummary();
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'خطا در حذف محصول');
    }
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, imageUrlInput.trim()],
      });
      setImageUrlInput('');
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
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          showMessage('error', `فایل ${file.name} یک تصویر نیست`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          showMessage('error', `حجم فایل ${file.name} بیش از 5 مگابایت است`);
          continue;
        }

        // Convert to base64
        const base64 = await convertFileToBase64(file);
        newImages.push(base64);
      }

      setFormData({
        ...formData,
        images: [...formData.images, ...newImages],
      });

      showMessage('success', `${newImages.length} تصویر با موفقیت اضافه شد`);
    } catch (error) {
      console.error('Error uploading images:', error);
      showMessage('error', 'خطا در آپلود تصویر');
    } finally {
      setUploadingImage(false);
      // Reset input
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

  const resetForm = () => {
    setFormData({
      name: '',
      goldPurity: 'K18',
      weight: '',
      purchasePrice: '',
      sellingPrice: '',
      craftsmanshipFee: '',
      quantity: '1',
      description: '',
      images: [],
    });
    setImageUrlInput('');
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const formatWeight = (weight: number) => {
    return new Intl.NumberFormat('fa-IR', { minimumFractionDigits: 2 }).format(weight) + ' گرم';
  };

  const getPurityBadgeColor = (purity: string | null) => {
    if (!purity) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    switch (purity) {
      case 'K24':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'K22':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'K21':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'K18':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'SOLD':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'RESERVED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'IN_WORKSHOP':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">مدیریت محصولات ساخته شده</h1>
          <p className="text-gray-600 dark:text-gray-400">مدیریت محصولات جواهرات و زیورآلات ساخته شده</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">تعداد کل</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {summary?.totalProducts || 0}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
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

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">اجرت کل</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatCurrency(summary?.totalCraftsmanshipFees || 0)}
                </p>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-full">
                <Hammer className="h-6 w-6 text-amber-600 dark:text-amber-400" />
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
                placeholder="جستجو بر اساس نام، SKU یا QR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchProducts()}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={selectedPurity}
                onChange={(e) => setSelectedPurity(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">همه عیارها</option>
                <option value="K24">24 عیار</option>
                <option value="K22">22 عیار</option>
                <option value="K21">21 عیار</option>
                <option value="K18">18 عیار</option>
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
                <option value="IN_WORKSHOP">در کارگاه</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={fetchProducts}
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
                <span>افزودن محصول</span>
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
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Package className="h-16 w-16 mb-4 opacity-50" />
              <p>هیچ محصولی یافت نشد</p>
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
                      عیار
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      وزن
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      قیمت فروش
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      اجرت
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
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg></div>';
                              }}
                            />
                          ) : (
                            <Sparkles className="h-8 w-8 text-amber-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{product.sku}</p>
                          {product.workshop && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                              <Hammer className="h-3 w-3" />
                              {product.workshop.name}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.goldPurity && (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPurityBadgeColor(product.goldPurity)}`}>
                            {product.goldPurity}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatWeight(product.weight)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(product.sellingPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(product.craftsmanshipFee)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(product.status)}`}>
                          {product.status === 'IN_STOCK' ? 'موجود' : 
                           product.status === 'SOLD' ? 'فروخته شده' :
                           product.status === 'RESERVED' ? 'رزرو' :
                           product.status === 'IN_WORKSHOP' ? 'در کارگاه' : product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/inventory/products/${product.id}`}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product)}
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">افزودن محصول جدید</h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام محصول *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="مثلاً: انگشتر الماس"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    عیار طلا *
                  </label>
                  <select
                    value={formData.goldPurity}
                    onChange={(e) => setFormData({ ...formData, goldPurity: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="K18">18 عیار</option>
                    <option value="K21">21 عیار</option>
                    <option value="K22">22 عیار</option>
                    <option value="K24">24 عیار</option>
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
                    step="0.01"
                    required
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    اجرت (ریال) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.craftsmanshipFee}
                    onChange={(e) => setFormData({ ...formData, craftsmanshipFee: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تعداد
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
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
                  placeholder="توضیحات محصول..."
                />
              </div>

              {/* Image Management Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تصاویر محصول
                </label>
                
                {/* Upload Buttons */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {/* File Upload */}
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

                  {/* URL Input Modal Toggle */}
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

                {/* Image Preview Grid */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {formData.images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Product ${index + 1}`}
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      هنوز تصویری اضافه نشده است
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      حداکثر حجم: 5MB | فرمت‌های مجاز: JPG, PNG, GIF
                    </p>
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
      {showAddModal && showScaleCapture && (
        <ScaleCapturePanel
          itemId={'product-form'}
          onClose={() => setShowScaleCapture(false)}
          onCaptured={handleCaptured}
        />
      )}
    </div>
  );
}