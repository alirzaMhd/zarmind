'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Save, Search, Trash2, ArrowLeft } from 'lucide-react';

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

export default function NewPurchasePage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [suppliersLoaded, setSuppliersLoaded] = useState(false);
  const [branchesLoaded, setBranchesLoaded] = useState(false);
  const [manualSupplierId, setManualSupplierId] = useState('');
  const [manualBranchId, setManualBranchId] = useState('');

  const [itemCategories, setItemCategories] = useState<Record<number, string>>({});
  const [itemSearchTerms, setItemSearchTerms] = useState<Record<number, string>>({});
  const [productSuggestions, setProductSuggestions] = useState<Record<number, any[]>>({});
  const [searchingProducts, setSearchingProducts] = useState<Record<number, boolean>>({});

  const [formData, setFormData] = useState<CreateEditForm>({
    supplierId: '',
    userId: user?.id || '',
    branchId: user?.branchId || '',
    purchaseDate: new Date().toISOString().split('T')[0],
    taxAmount: '',
    paidAmount: '',
    deliveryDate: '',
    paymentMethod: 'CASH',
    notes: '',
    items: [{ productId: '', quantity: '', unitPrice: '', weight: '' }],
  });

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';

  useEffect(() => {
    fetchSuppliers();
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers', { params: { limit: 100 } });
      const list = res.data?.items || res.data || [];
      setSuppliers(list);
      setSuppliersLoaded(true);
    } catch (err) {
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
      setBranches([]);
      setBranchesLoaded(true);
      if (user?.branchId) {
        setFormData((prev) => ({ ...prev, branchId: user.branchId || '' }));
      }
    }
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
        status: 'IN_STOCK',
      };

      if (category) {
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
        const res = await api.get('/inventory/products', { params });
        const items = res.data?.items || res.data || [];
        setProductSuggestions((prev) => ({ ...prev, [itemIndex]: items }));
      }
    } catch (err) {
      setProductSuggestions((prev) => ({ ...prev, [itemIndex]: [] }));
    } finally {
      setSearchingProducts((prev) => ({ ...prev, [itemIndex]: false }));
    }
  };

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
    return () => timers.forEach((t) => clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemSearchTerms, itemCategories]);

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

      router.push('/dashboard/transactions/purchases');
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در ثبت خرید');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>بازگشت</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">ثبت خرید جدید</h1>
          <p className="text-gray-600 dark:text-gray-400">فرم ایجاد خرید و افزودن اقلام</p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleAdd} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">دسته‌بندی</label>
                      <select
                        value={itemCategories[idx] || ''}
                        onChange={(e) => {
                          setItemCategories((prev) => ({ ...prev, [idx]: e.target.value }));
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
                            if (it.productId) {
                              const items = [...formData.items];
                              items[idx].productId = '';
                              setFormData({ ...formData, items });
                            }
                          }}
                          placeholder={it.productId ? 'محصول انتخاب شده - برای تغییر تایپ کنید' : 'جستجو برای انتخاب محصول...'}
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
                                setItemSearchTerms((prev) => {
                                  const updated = { ...prev };
                                  delete updated[idx];
                                  return updated;
                                });
                                setProductSuggestions((prev) => ({ ...prev, [idx]: [] }));
                              }}
                              className="w-full px-4 py-2 text-right hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
                            >
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name || product.sku}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <span>SKU: {product.sku}</span>
                                {product.category && (
                                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">{product.category}</span>
                                )}
                                {product.sellingPrice && <span>قیمت: {formatCurrency(product.sellingPrice)}</span>}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">شناسه محصول (UUID) {it.productId && '✓'}</label>
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
              onClick={() => router.push('/dashboard/transactions/purchases')}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-medium"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


