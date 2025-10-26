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

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goldPurity: '',
    weight: '',
    purchasePrice: '',
    sellingPrice: '',
    craftsmanshipFee: '',
    productionStatus: '',
  });

  useEffect(() => {
    if (id) {
      fetchProduct();
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
      });
    } catch (error: any) {
      console.error('Failed to fetch product:', error);
      showMessage('error', 'خطا در بارگذاری اطلاعات محصول');
    } finally {
      setLoading(false);
    }
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
      });

      showMessage('success', 'محصول با موفقیت ویرایش شد');
      setEditing(false);
      fetchProduct();
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'خطا در ویرایش محصول');
    }
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
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
              <AlertCircle className="h-5 w-5" />
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)}>
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Image & QR */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <div className="aspect-square bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-24 w-24 text-amber-600 dark:text-amber-400" />
              </div>
              
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
                <QrCode className="h-12 w-12 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">{product.qrCode}</p>
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

            {/* Stones */}
            {product.stones && product.stones.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  سنگ‌های تعبیه شده
                </h2>
                <div className="space-y-3">
                  {product.stones.map((stone) => (
                    <div key={stone.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{stone.stoneType}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {stone.caratWeight} قیراط × {stone.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(stone.price)}
                      </p>
                    </div>
                  ))}
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
    </div>
  );
}