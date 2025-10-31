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
  Sparkles,
  Hammer,
  Plus,
  Trash2,
  CheckCircle,
  Image as ImageIcon,
  Upload,
  ZoomIn,
} from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  sku: string;
  qrCode: string;
  name: string;
  description?: string;
  goldPurity: string | null;
  weight: number;
  purchasePrice: number;
  sellingPrice: number;
  craftsmanshipFee: number;
  status: string;
  quantity: number;
  productionStatus?: string;
  images?: string[];
  workshop?: {
    id: string;
    name: string;
    code: string;
    phone?: string;
  };
  stones?: Array<{
    id: string;
    stoneType: string;
    caratWeight: number;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  inventory?: Array<{
    branchId: string;
    quantity: number;
    location?: string;
    branch: {
      id: string;
      name: string;
      code: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goldPurity: '',
    weight: '',
    purchasePrice: '',
    sellingPrice: '',
    craftsmanshipFee: '',
    productionStatus: '',
    images: [] as string[],
  });

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchQr();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/inventory/products/${id}`);
      const productData = response.data;
      setProduct(productData);
      
      // Populate form
      setFormData({
        name: productData.name || '',
        description: productData.description || '',
        goldPurity: productData.goldPurity || '',
        weight: productData.weight?.toString() || '',
        purchasePrice: productData.purchasePrice?.toString() || '',
        sellingPrice: productData.sellingPrice?.toString() || '',
        craftsmanshipFee: productData.craftsmanshipFee?.toString() || '',
        productionStatus: productData.productionStatus || '',
        images: productData.images || [],
      });
    } catch (error: any) {
      console.error('Failed to fetch product:', error);
      showMessage('error', 'خطا در بارگذاری اطلاعات محصول');
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
      await api.patch(`/inventory/products/${id}`, {
        name: formData.name,
        description: formData.description || undefined,
        goldPurity: formData.goldPurity || undefined,
        weight: parseFloat(formData.weight),
        purchasePrice: parseFloat(formData.purchasePrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        craftsmanshipFee: parseFloat(formData.craftsmanshipFee),
        productionStatus: formData.productionStatus || undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
      });

      showMessage('success', 'محصول با موفقیت ویرایش شد');
      setEditing(false);
      fetchProduct();
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'خطا در ویرایش محصول');
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

  const formatWeight = (weight: number) => {
    return new Intl.NumberFormat('fa-IR', { minimumFractionDigits: 2 }).format(weight) + ' گرم';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">محصول یافت نشد</p>
        <Link
          href="/dashboard/inventory/products"
          className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          بازگشت به لیست محصولات
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
              href="/dashboard/inventory/products"
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                SKU: {product.sku} | QR: {product.qrCode}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
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
                    fetchProduct();
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">تصاویر محصول</h3>
              
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
                      alt={product.name}
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
                            alt={`${product.name} ${index + 2}`}
                            className="w-full aspect-square object-cover rounded-lg cursor-pointer border-2 border-transparent hover:border-amber-500 transition-colors"
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
                <div className="aspect-square bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 rounded-lg flex flex-col items-center justify-center">
                  <Sparkles className="h-24 w-24 text-amber-600 dark:text-amber-400 mb-2" />
                  {editing && (
                    <p className="text-xs text-amber-700 dark:text-amber-300 text-center px-4">
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
                  <img src={qrDataUrl} alt={product.qrCode} className="mx-auto w-56 h-56" />
                ) : (
                  <div className="py-10 text-gray-500 dark:text-gray-400 text-sm">در حال تولید QR...</div>
                )}
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-mono">{product.qrCode}</div>
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
                    className="px-3 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    چاپ QR
                  </button>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">وضعیت</p>
              <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                product.status === 'IN_STOCK' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                product.status === 'SOLD' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {product.status === 'IN_STOCK' ? 'موجود' : 
                 product.status === 'SOLD' ? 'فروخته شده' : product.status}
              </span>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">اطلاعات پایه</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام محصول
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{product.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    عیار طلا
                  </label>
                  {editing ? (
                    <select
                      value={formData.goldPurity}
                      onChange={(e) => setFormData({ ...formData, goldPurity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="K18">18 عیار</option>
                      <option value="K21">21 عیار</option>
                      <option value="K22">22 عیار</option>
                      <option value="K24">24 عیار</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 dark:text-white">{product.goldPurity || '-'}</p>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{formatWeight(product.weight)}</p>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{formatCurrency(product.purchasePrice)}</p>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{formatCurrency(product.sellingPrice)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    اجرت ساخت
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      value={formData.craftsmanshipFee}
                      onChange={(e) => setFormData({ ...formData, craftsmanshipFee: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{formatCurrency(product.craftsmanshipFee)}</p>
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{product.description || '-'}</p>
                )}
              </div>
            </div>

            {/* Workshop */}
            {product.workshop && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Hammer className="h-5 w-5 text-amber-500" />
                  کارگاه
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">نام کارگاه</p>
                    <p className="text-gray-900 dark:text-white font-medium">{product.workshop.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">کد</p>
                    <p className="text-gray-900 dark:text-white font-medium">{product.workshop.code}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Inventory */}
            {product.inventory && product.inventory.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">موجودی شعب</h2>
                <div className="space-y-3">
                  {product.inventory.map((inv) => (
                    <div key={inv.branchId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{inv.branch.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">کد: {inv.branch.code}</p>
                        {inv.location && (
                          <p className="text-xs text-gray-500 dark:text-gray-500">مکان: {inv.location}</p>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-semibold">
                        {inv.quantity} عدد
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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