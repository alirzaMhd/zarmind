'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  AlertCircle,
  QrCode,
  Box,
  Plus,
  Trash2,
  CheckCircle,
  Image as ImageIcon,
  Upload,
  ZoomIn,
  Tag,
  Package,
  DollarSign,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';

interface GeneralGoods {
  id: string;
  sku: string;
  qrCode: string;
  name: string;
  description?: string;
  brand?: string;
  model?: string;
  weight?: number;
  purchasePrice: number;
  sellingPrice: number;
  status: string;
  quantity: number;
  images?: string[];
  inventory?: Array<{
    branchId: string;
    quantity: number;
    minimumStock: number;
    location?: string;
    branch: {
      id: string;
      name: string;
      code: string;
      city?: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function GeneralGoodsDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [goods, setGoods] = useState<GeneralGoods | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brand: '',
    model: '',
    weight: '',
    purchasePrice: '',
    sellingPrice: '',
    quantity: '',
    images: [] as string[],
  });

  useEffect(() => {
    if (id) {
      fetchGoods();
      fetchQr();
    }
  }, [id]);

  const fetchGoods = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/inventory/general-goods/${id}`);
      const goodsData = response.data;
      setGoods(goodsData);
      
      // Populate form
      setFormData({
        name: goodsData.name || '',
        description: goodsData.description || '',
        brand: goodsData.brand || '',
        model: goodsData.model || '',
        weight: goodsData.weight?.toString() || '',
        purchasePrice: goodsData.purchasePrice?.toString() || '',
        sellingPrice: goodsData.sellingPrice?.toString() || '',
        quantity: goodsData.quantity?.toString() || '',
        images: goodsData.images || [],
      });
    } catch (error: any) {
      console.error('Failed to fetch general goods:', error);
      showMessage('error', 'خطا در بارگذاری اطلاعات کالا');
    } finally {
      setLoading(false);
    }
  };

  const fetchQr = async () => {
    try {
      const res = await api.get(`/utilities/qr-code/product/${id}`);
      if (res?.data?.dataUrl) setQrDataUrl(res.data.dataUrl);
    } catch {}
  };

  const handleSave = async () => {
    try {
      await api.patch(`/inventory/general-goods/${id}`, {
        name: formData.name,
        description: formData.description || undefined,
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        purchasePrice: parseFloat(formData.purchasePrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        quantity: parseInt(formData.quantity),
        images: formData.images.length > 0 ? formData.images : undefined,
      });

      showMessage('success', 'کالا با موفقیت ویرایش شد');
      setEditing(false);
      fetchGoods();
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'خطا در ویرایش کالا');
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

      if (newImages.length > 0) {
        showMessage('success', `${newImages.length} تصویر با موفقیت اضافه شد`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      showMessage('error', 'خطا در آپلود تصویر');
    } finally {
      setUploadingImage(false);
      // Reset input
      e.target.value = '';
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAddImageUrl = () => {
    const url = prompt('آدرس URL تصویر را وارد کنید:');
    if (url && url.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, url.trim()],
      });
      showMessage('success', 'تصویر از URL اضافه شد');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const formatWeight = (weight?: number) => {
    if (!weight) return '-';
    return new Intl.NumberFormat('fa-IR', { minimumFractionDigits: 2 }).format(weight) + ' گرم';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'SOLD':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'RESERVED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
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
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!goods) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">کالا یافت نشد</p>
        <Link
          href="/dashboard/inventory/general-goods"
          className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          بازگشت به لیست کالاها
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/inventory/general-goods"
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{goods.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                SKU: {goods.sku} | QR: {goods.qrCode}
              </p>
              {goods.brand && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  {goods.brand} {goods.model && `- ${goods.model}`}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Edit2 className="h-5 w-5" />
                ویرایش
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={uploadingImage}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-5 w-5" />
                  ذخیره
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    fetchGoods();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                >
                  <X className="h-5 w-5" />
                  انصراف
                </button>
              </>
            )}
          </div>
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
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)}>
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images & QR */}
          <div className="lg:col-span-1">
            {/* Product Images */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">تصاویر کالا</h3>
              
              {editing && (
                <div className="mb-4 space-y-2">
                  {/* Upload Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* File Upload */}
                    <label className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                      <Upload className="h-4 w-4" />
                      <span>{uploadingImage ? 'آپلود...' : 'از سیستم'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>

                    {/* URL Input */}
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4" />
                      <span>از URL</span>
                    </button>
                  </div>
                  
                  {uploadingImage && (
                    <div className="text-xs text-center text-blue-600 dark:text-blue-400">
                      در حال آپلود تصویر...
                    </div>
                  )}
                </div>
              )}

              {formData.images.length > 0 ? (
                <div className="space-y-3">
                  {/* Main Image */}
                  <div className="relative group">
                    <img
                      src={formData.images[0]}
                      alt={goods.name}
                      className="w-full aspect-square object-cover rounded-lg cursor-pointer"
                      onClick={() => setSelectedImage(formData.images[0])}
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400?text=No+Image';
                      }}
                    />
                    <button
                      onClick={() => setSelectedImage(formData.images[0])}
                      className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                    {editing && (
                      <button
                        onClick={() => handleRemoveImage(0)}
                        className="absolute top-2 left-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Thumbnail Grid */}
                  {formData.images.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {formData.images.slice(1).map((url, index) => (
                        <div key={index + 1} className="relative group">
                          <img
                            src={url}
                            alt={`${goods.name} ${index + 2}`}
                            className="w-full aspect-square object-cover rounded-lg cursor-pointer border-2 border-transparent hover:border-purple-500 transition-colors"
                            onClick={() => setSelectedImage(url)}
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image';
                            }}
                          />
                          {editing && (
                            <button
                              onClick={() => handleRemoveImage(index + 1)}
                              className="absolute top-1 left-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                          <div className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
                            {index + 2}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-lg flex flex-col items-center justify-center">
                  <Box className="h-24 w-24 text-purple-600 dark:text-purple-400 mb-2" />
                  {editing && (
                    <p className="text-xs text-purple-700 dark:text-purple-300 text-center px-4">
                      تصویری وجود ندارد. از دکمه‌های بالا استفاده کنید
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <QrCode className="h-4 w-4" /> کد QR
              </h3>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-center">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt={goods.qrCode} className="mx-auto w-56 h-56" />
                ) : (
                  <div className="py-10 text-gray-500 dark:text-gray-400 text-sm">در حال تولید QR...</div>
                )}
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-mono">{goods.qrCode}</div>
                <div className="mt-3">
                  <button
                    onClick={() => {
                      if (!qrDataUrl) return;
                      const w = window.open('', '_blank');
                      if (!w) return;
                      w.document.write(`<!DOCTYPE html><html><head><meta charset='utf-8'><title>Print QR</title>
                        <style>body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh} img{width:80mm;height:80mm}</style>
                      </head><body><img src='${qrDataUrl}' /></body></html>`);
                      w.document.close();
                      w.focus();
                      w.print();
                    }}
                    className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    چاپ QR
                  </button>
                </div>
              </div>
            </div>

            {/* Status & Quantity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">وضعیت</p>
                <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(goods.status)}`}>
                  {getStatusLabel(goods.status)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">موجودی کل</p>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-600" />
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {goods.quantity} عدد
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">اطلاعات پایه</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام کالا
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{goods.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    برند
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="مثلاً: Rolex"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{goods.brand || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    مدل
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="مثلاً: Submariner"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{goods.model || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    وزن
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="گرم"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{formatWeight(goods.weight)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تعداد
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{goods.quantity} عدد</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    قیمت خرید
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{formatCurrency(goods.purchasePrice)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    قیمت فروش
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{formatCurrency(goods.sellingPrice)}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توضیحات
                </label>
                {editing ? (
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="توضیحات کالا..."
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{goods.description || '-'}</p>
                )}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">خلاصه مالی</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">ارزش خرید کل</p>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(goods.purchasePrice * goods.quantity)}
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">ارزش فروش کل</p>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(goods.sellingPrice * goods.quantity)}
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">سود احتمالی</p>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency((goods.sellingPrice - goods.purchasePrice) * goods.quantity)}
                  </p>
                </div>
              </div>
            </div>

            {/* Inventory by Branch */}
            {goods.inventory && goods.inventory.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">موجودی شعب</h2>
                <div className="space-y-3">
                  {goods.inventory.map((inv) => (
                    <div key={inv.branchId} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <p className="font-medium text-gray-900 dark:text-white">{inv.branch.name}</p>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          کد: {inv.branch.code}
                          {inv.branch.city && ` | ${inv.branch.city}`}
                        </p>
                        {inv.location && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            مکان انبار: {inv.location}
                          </p>
                        )}
                      </div>
                      <div className="text-left">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          inv.quantity === 0
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : inv.quantity <= inv.minimumStock
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {inv.quantity} عدد
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          حداقل: {inv.minimumStock}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">اطلاعات سیستم</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">تاریخ ایجاد</p>
                  <p className="text-gray-900 dark:text-white font-medium mt-1">
                    {new Date(goods.createdAt).toLocaleDateString('fa-IR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">آخرین ویرایش</p>
                  <p className="text-gray-900 dark:text-white font-medium mt-1">
                    {new Date(goods.updatedAt).toLocaleDateString('fa-IR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={selectedImage}
            alt="Zoomed product"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg text-sm">
            کلیک کنید برای بستن
          </div>
        </div>
      )}
    </div>
  );
}