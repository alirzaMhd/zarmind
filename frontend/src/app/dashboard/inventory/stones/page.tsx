'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
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
  Sparkles,
  Award,
  FileCheck,
  Upload,
  Camera,
  Image as ImageIcon,
  QrCode,
} from 'lucide-react';
import Link from 'next/link';

interface Stone {
  id: string;
  sku: string;
  qrCode: string;
  name: string;
  stoneType: string;
  caratWeight: number;
  stoneQuality?: string;
  certificateNumber?: string;
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
  totalStones: number;
  totalQuantity: number;
  totalCaratWeight: number;
  totalPurchaseValue: number;
  totalSellingValue: number;
  certifiedStones: number;
  byType: Array<{
    stoneType: string;
    count: number;
    quantity: number;
    totalCaratWeight: number;
    purchaseValue: number;
    sellingValue: number;
  }>;
  byQuality: Array<{
    quality: string;
    count: number;
    quantity: number;
    totalCaratWeight: number;
  }>;
}

export default function StonesPage() {
  const router = useRouter();
  const [stones, setStones] = useState<Stone[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedQuality, setSelectedQuality] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('IN_STOCK');
  const [showCertifiedOnly, setShowCertifiedOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Stone | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showScaleCapture, setShowScaleCapture] = useState(false);
  const [scaleImageUrl, setScaleImageUrl] = useState<string>('');
  const [qrModal, setQrModal] = useState<{ open: boolean; qrCode?: string; dataUrl?: string }>({ open: false });

  const ScaleCapturePanel = dynamic(() => import('@/components/ScaleCapturePanel'), { ssr: false });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    stoneType: 'DIAMOND' as string,
    caratWeight: '',
    stoneQuality: '',
    certificateNumber: '',
    purchasePrice: '',
    sellingPrice: '',
    quantity: '1',
    description: '',
    images: [] as string[],
  });

  // Branch allocations state
  const [branches, setBranches] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [branchAllocations, setBranchAllocations] = useState<Array<{ id: string; branchId: string; quantity: string }>>([]);

  useEffect(() => {
    fetchStones();
    fetchSummary();
  }, [selectedType, selectedQuality, selectedStatus, showCertifiedOnly]);

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

  const fetchStones = async () => {
    try {
      setLoading(true);
      const params: any = {
        limit: 100,
        status: selectedStatus,
      };
      if (selectedType) params.stoneType = selectedType;
      if (selectedQuality) params.quality = selectedQuality;
      if (showCertifiedOnly) params.hasCertificate = 'true';
      if (searchTerm) params.search = searchTerm;

      const response = await api.get('/inventory/stones', { params });
      setStones(response.data.items || []);
    } catch (error: any) {
      console.error('Failed to fetch stones:', error);
      showMessage('error', 'خطا در بارگذاری اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get('/inventory/stones/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

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

      const res = await api.post('/inventory/stones', {
        name: formData.name,
        stoneType: formData.stoneType,
        caratWeight: parseFloat(formData.caratWeight),
        stoneQuality: formData.stoneQuality || undefined,
        certificateNumber: formData.certificateNumber || undefined,
        purchasePrice: parseFloat(formData.purchasePrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        quantity: totalAlloc,
        description: formData.description || undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
        allocations: allocations.length > 0 ? allocations : undefined,
      });

      showMessage('success', 'سنگ با موفقیت اضافه شد');
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
      fetchStones();
      fetchSummary();
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'خطا در افزودن سنگ');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      await api.patch(`/inventory/stones/${selectedItem.id}`, {
        name: formData.name,
        stoneType: formData.stoneType,
        caratWeight: parseFloat(formData.caratWeight),
        stoneQuality: formData.stoneQuality || undefined,
        certificateNumber: formData.certificateNumber || undefined,
        purchasePrice: parseFloat(formData.purchasePrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        quantity: parseInt(formData.quantity),
        description: formData.description || undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
      });

      showMessage('success', 'سنگ با موفقیت ویرایش شد');
      setShowEditModal(false);
      setSelectedItem(null);
      resetForm();
      fetchStones();
      fetchSummary();
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'خطا در ویرایش سنگ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این سنگ اطمینان دارید؟')) return;

    try {
      await api.delete(`/inventory/stones/${id}`);
      showMessage('success', 'سنگ با موفقیت حذف شد');
      fetchStones();
      fetchSummary();
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'خطا در حذف سنگ');
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

  const openEditModal = (item: Stone) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      stoneType: item.stoneType,
      caratWeight: item.caratWeight.toString(),
      stoneQuality: item.stoneQuality || '',
      certificateNumber: item.certificateNumber || '',
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
      stoneType: 'DIAMOND',
      caratWeight: '',
      stoneQuality: '',
      certificateNumber: '',
      purchasePrice: '',
      sellingPrice: '',
      quantity: '1',
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const formatCarat = (carat: number) => {
    return new Intl.NumberFormat('fa-IR', { minimumFractionDigits: 2 }).format(carat) + ' قیراط';
  };

  const getStoneTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'DIAMOND':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'RUBY':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'EMERALD':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'SAPPHIRE':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'PEARL':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'TURQUOISE':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      default:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    }
  };

  const getStoneTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      DIAMOND: 'الماس',
      RUBY: 'یاقوت',
      EMERALD: 'زمرد',
      SAPPHIRE: 'نیلم',
      PEARL: 'مروارید',
      TURQUOISE: 'فیروزه',
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
      case 'RETURNED':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'DAMAGED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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

  // Derived totals based on current list to ensure quantity is applied
  const derivedTotalQuantity = stones.reduce((sum, s) => sum + (s.quantity || 0), 0);
  const derivedTotalCaratWeight = stones.reduce((sum, s) => sum + (s.caratWeight || 0) * (s.quantity || 0), 0);
  const derivedTotalSellingValue = stones.reduce((sum, s) => sum + (s.sellingPrice || 0) * (s.quantity || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">مدیریت سنگ‌های قیمتی</h1>
          <p className="text-gray-600 dark:text-gray-400">مدیریت موجودی سنگ‌های قیمتی و گواهی‌نامه‌ها</p>
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
                  {summary?.totalStones || 0}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              موجودی: {summary?.totalQuantity || 0} عدد
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">وزن کل</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatCarat(derivedTotalCaratWeight || summary?.totalCaratWeight || 0)}
                </p>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-full">
                <Award className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">ارزش فروش</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatCurrency(derivedTotalSellingValue || summary?.totalSellingValue || 0)}
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
                <p className="text-sm text-gray-600 dark:text-gray-400">گواهی شده</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {summary?.certifiedStones || 0}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <FileCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
                placeholder="جستجو بر اساس نام، گواهی یا SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchStones()}
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
                  <option value="DIAMOND">الماس</option>
                  <option value="RUBY">یاقوت</option>
                  <option value="EMERALD">زمرد</option>
                  <option value="SAPPHIRE">نیلم</option>
                  <option value="PEARL">مروارید</option>
                  <option value="TURQUOISE">فیروزه</option>
                  <option value="OTHER">سایر</option>
                </select>

                <select
                  value={selectedQuality}
                  onChange={(e) => setSelectedQuality(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">همه کیفیت‌ها</option>
                  <option value="AAA">AAA</option>
                  <option value="AA">AA</option>
                  <option value="A">A</option>
                  <option value="VVS1">VVS1</option>
                  <option value="VVS2">VVS2</option>
                  <option value="VS">VS</option>
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

                <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="checkbox"
                    checked={showCertifiedOnly}
                    onChange={(e) => setShowCertifiedOnly(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm">فقط گواهی‌دار</span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={fetchStones}
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
                  <span>افزودن سنگ</span>
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
          ) : stones.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Sparkles className="h-16 w-16 mb-4 opacity-50" />
              <p>هیچ سنگی یافت نشد</p>
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
                      وزن
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      کیفیت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      قیمت فروش
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      تعداد
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      وضعیت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      گواهی
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {stones.map((stone) => (
                    <tr key={stone.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                          {stone.images && stone.images.length > 0 ? (
                            <img
                              src={stone.images[0]}
                              alt={stone.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg></div>';
                              }}
                            />
                          ) : (
                            <Sparkles className="h-8 w-8 text-purple-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{stone.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{stone.sku}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStoneTypeBadgeColor(stone.stoneType)}`}>
                          {getStoneTypeLabel(stone.stoneType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCarat(stone.caratWeight)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {stone.stoneQuality || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(stone.sellingPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-sm font-semibold rounded-full ${
                          stone.quantity === 0
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : stone.quantity < 5
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {stone.quantity} عدد
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(stone.status)}`}>
                          {getStatusLabel(stone.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {stone.certificateNumber ? (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <FileCheck className="h-4 w-4" />
                            <span className="text-xs">{stone.certificateNumber}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                const q = await api.get(`/utilities/qr-code/product/${stone.id}`);
                                if (q?.data?.dataUrl) setQrModal({ open: true, qrCode: q.data.qrCode, dataUrl: q.data.dataUrl });
                              } catch {}
                            }}
                            className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                            title="QR"
                          >
                            <QrCode className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openEditModal(stone)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(stone.id)}
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
                {showAddModal ? 'افزودن سنگ جدید' : 'ویرایش سنگ'}
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
                    نام سنگ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="مثلاً: الماس تراش برلیان"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نوع سنگ *
                  </label>
                  <select
                    value={formData.stoneType}
                    onChange={(e) => setFormData({ ...formData, stoneType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="DIAMOND">الماس</option>
                    <option value="RUBY">یاقوت</option>
                    <option value="EMERALD">زمرد</option>
                    <option value="SAPPHIRE">نیلم</option>
                    <option value="PEARL">مروارید</option>
                    <option value="TURQUOISE">فیروزه</option>
                    <option value="OTHER">سایر</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">وزن (قیراط) *</label>
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
                    value={formData.caratWeight}
                    onChange={(e) => setFormData({ ...formData, caratWeight: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    کیفیت
                  </label>
                  <input
                    type="text"
                    value={formData.stoneQuality}
                    onChange={(e) => setFormData({ ...formData, stoneQuality: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="مثلاً: VVS1، AAA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    شماره گواهی
                  </label>
                  <input
                    type="text"
                    value={formData.certificateNumber}
                    onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="مثلاً: GIA-123456789"
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
                    تعداد (بر اساس تخصیص به شعب محاسبه می‌شود)
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توضیحات
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="توضیحات سنگ..."
                />
              </div>

              {/* Image Management */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تصاویر سنگ
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
                          alt={`Stone ${index + 1}`}
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
          itemId={'stone-form'}
          onClose={() => setShowScaleCapture(false)}
          onCaptured={handleCaptured}
        />
      )}

      {/* QR Modal */}
      {qrModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کد QR سنگ</h3>
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