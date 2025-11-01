'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Save, Trash2, ArrowLeft, Plus, Upload, Camera, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';

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

type Category = 'PRODUCT' | 'COIN' | 'STONE' | 'RAW_GOLD' | 'GENERAL_GOODS';

interface BaseItem {
  id: string; // local id for UI
  category: Category;
  name: string;
  quantity: string;
  purchasePrice: string;
  sellingPrice: string;
  description: string;
  images: string[]; // base64 or URL as used elsewhere
}

interface ProductItem extends BaseItem {
  category: 'PRODUCT';
  goldPurity: 'K18' | 'K21' | 'K22' | 'K24';
  weight: string;
  craftsmanshipFee: string;
}

interface CoinItem extends BaseItem {
  category: 'COIN';
  coinType: string;
  coinYear: string;
  weight: string;
}

interface StoneItem extends BaseItem {
  category: 'STONE';
  stoneType: string;
  caratWeight: string;
  stoneQuality: string;
  certificateNumber: string;
}

interface RawGoldItem extends BaseItem {
  category: 'RAW_GOLD';
  goldPurity: 'K18' | 'K21' | 'K22' | 'K24';
  weight: string;
}

interface GeneralGoodsItem extends BaseItem {
  category: 'GENERAL_GOODS';
  brand: string;
  model: string;
  weight: string;
}

type DraftItem = ProductItem | CoinItem | StoneItem | RawGoldItem | GeneralGoodsItem;

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
};

// Lazy-load panel for client-only APIs (camera)
const ScaleCapturePanel = dynamic(() => import('@/components/ScaleCapturePanel'), { ssr: false });

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'نقدی' },
  { value: 'BANK_TRANSFER', label: 'حواله بانکی' },
  { value: 'CARD', label: 'کارت' },
  { value: 'CHECK', label: 'چک' },
  { value: 'INSTALLMENT', label: 'اقساط' },
  { value: 'TRADE_IN', label: 'معاوضه' },
  { value: 'MIXED', label: 'ترکیبی' },
];

function createDefaultItem(category: Category): DraftItem {
  const base: BaseItem = {
    id: crypto.randomUUID(),
    category,
    name: '',
    quantity: '1',
    purchasePrice: '',
    sellingPrice: '',
    description: '',
    images: [],
  };

  const currentYear = new Date().getFullYear().toString();

  switch (category) {
    case 'PRODUCT':
      return { ...base, category: 'PRODUCT', goldPurity: 'K18', weight: '', craftsmanshipFee: '' };
    case 'COIN':
      return { ...base, category: 'COIN', coinType: 'BAHAR_AZADI', coinYear: currentYear, weight: '' };
    case 'STONE':
      return { ...base, category: 'STONE', stoneType: 'DIAMOND', caratWeight: '', stoneQuality: '', certificateNumber: '' };
    case 'RAW_GOLD':
      return { ...base, category: 'RAW_GOLD', goldPurity: 'K24', weight: '' };
    case 'GENERAL_GOODS':
      return { ...base, category: 'GENERAL_GOODS', brand: '', model: '', weight: '' };
  }
}

function parseNumber(v: string | number | undefined, fallback = 0): number {
  if (v === undefined || v === null) return fallback;
  const n = typeof v === 'number' ? v : parseFloat(v || '');
  return Number.isFinite(n) ? n : fallback;
}

function pricePerGramFromApi(purity: 'K18' | 'K21' | 'K22' | 'K24', data: any | null): number | null {
  if (!data || !data.goldPrices) return null;
  const bySymbol = data.goldPrices.find((g: any) =>
    typeof g.symbol === 'string' && g.symbol.toUpperCase().endsWith(`${purity}`)
  );
  if (bySymbol && typeof bySymbol.price === 'number') return bySymbol.price;

  const swap = purity.replace('K', '') + 'K'; // e.g., K18 -> 18K
  const byMatch = data.goldPrices.find((g: any) =>
    typeof g.nameEn === 'string' && g.nameEn.toUpperCase().includes(swap)
  ) || data.goldPrices.find((g: any) => typeof g.type === 'string' && g.type.includes(swap));
  if (byMatch && typeof byMatch.price === 'number') return byMatch.price;
  const k24 = data.goldPrices.find((g: any) =>
    (g.nameEn && g.nameEn.toUpperCase().includes('K24')) || (g.type && g.type.includes('K24'))
  );
  if (k24 && typeof k24.price === 'number') {
    const ratio = purity === 'K24' ? 1 : purity === 'K22' ? 22 / 24 : purity === 'K21' ? 21 / 24 : 18 / 24;
    return Math.round(k24.price * ratio);
  }
  return null;
}

function autoPrice(item: DraftItem, data: any | null, overrideQty?: number): DraftItem {
  try {
    const qty = overrideQty !== undefined ? overrideQty : Math.max(1, parseInt(item.quantity || '1'));
    if (!data) return item;
    if (item.category === 'RAW_GOLD') {
      const rg = item as RawGoldItem;
      const perGram = pricePerGramFromApi(rg.goldPurity, data);
      const weight = parseNumber(rg.weight, 0);
      if (perGram && weight > 0) {
        const base = Math.round(perGram * weight * qty);
        return { ...item, purchasePrice: String(base), sellingPrice: String(base) } as DraftItem;
      }
    } else if (item.category === 'PRODUCT') {
      const p = item as ProductItem;
      const perGram = pricePerGramFromApi(p.goldPurity, data);
      const weight = parseNumber(p.weight, 0);
      const fee = parseNumber(p.craftsmanshipFee, 0);
      if (perGram && weight > 0) {
        const base = Math.round(perGram * weight * qty);
        const sell = Math.round(base + fee * qty);
        return { ...item, purchasePrice: String(base), sellingPrice: String(sell) } as DraftItem;
      }
    } else if (item.category === 'COIN') {
      const c = item as CoinItem;
      const symbolMap: Record<string, string> = {
        BAHAR_AZADI: 'IR_COIN_BAHAR',
        GERAMI: 'IR_COIN_1G',
        NIM_AZADI: 'IR_COIN_HALF',
        HALF_BAHAR: 'IR_COIN_HALF',
        ROB_AZADI: 'IR_COIN_QUARTER',
        QUARTER_BAHAR: 'IR_COIN_QUARTER',
        EMAMI: 'IR_COIN_EMAMI',
      };
      const coinSymbol = symbolMap[c.coinType] || '';
      const marketCoin = coinSymbol && data?.goldPrices?.find((g: any) => g.symbol === coinSymbol);
      if (marketCoin && typeof marketCoin.price === 'number') {
        const base = Math.round(marketCoin.price * qty);
        return { ...item, purchasePrice: String(base), sellingPrice: String(base) } as DraftItem;
      }
      const perGram = pricePerGramFromApi('K24', data);
      const weight = parseNumber(c.weight, 0);
      if (perGram && weight > 0) {
        const fallback = Math.round(perGram * weight * qty);
        return { ...item, purchasePrice: String(fallback), sellingPrice: String(fallback) } as DraftItem;
      }
    }
    return item;
  } catch {
    return item;
  }
}

export default function NewPurchasePage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [suppliersLoaded, setSuppliersLoaded] = useState(false);
  const [branchesLoaded, setBranchesLoaded] = useState(false);
  const [manualSupplierId, setManualSupplierId] = useState('');
  const [manualBranchId, setManualBranchId] = useState('');

  const [goldData, setGoldData] = useState<any | null>(null);
  const [items, setItems] = useState<DraftItem[]>([createDefaultItem('PRODUCT')]);
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});
  const [showScaleCapture, setShowScaleCapture] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string>('');
  const [scaleImageByItem, setScaleImageByItem] = useState<Record<string, string>>({});

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
  });

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  useEffect(() => {
    // Fetch current gold and currency prices once
    (async () => {
      try {
        const res = await api.get('/analytics/gold-currency-prices');
        setGoldData(res.data || null);
      } catch (e) {
        // ignore, fallback to manual entry
      }
    })();

    fetchSuppliers();
    fetchBranches();

    const onFocus = () => {
      try {
        setItems((prev) => {
          let updated = prev;
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i) as string;
            if (!key || !key.startsWith('scale_img_')) continue;
            const parts = key.split('_');
            const itemId = parts[2];
            if (!itemId) continue;
            const img = localStorage.getItem(key);
            if (!img) continue;
            const index = updated.findIndex((it) => it.id === itemId);
            if (index !== -1) {
              const it = updated[index];
              const next = { ...it, images: [...it.images, img] } as DraftItem;
              updated = [...updated.slice(0, index), next, ...updated.slice(index + 1)];
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((k) => localStorage.removeItem(k));
          return updated;
        });
      } catch {}
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
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

  const addItemRow = (category?: Category) => {
    setItems((prev) => [...prev, createDefaultItem(category || 'PRODUCT')]);
  };

  const removeItemRow = (id: string) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((it) => it.id !== id)));
  };

  const updateItem = (id: string, partial: Partial<DraftItem>) => {
    setItems((prev) => prev.map((it) => {
      if (it.id !== id) return it;
      const next = { ...it, ...partial } as DraftItem;
      return autoPrice(next, goldData);
    }));
  };

  const handleCategoryChange = (id: string, category: Category) => {
    setItems((prev) => prev.map((it) => (it.id === id ? createDefaultItem(category) : it)));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
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
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, images: [...it.images, ...newImages] } : it)));
    } finally {
      e.target.value = '';
    }
  };

  const handleRemoveImage = (id: string, index: number) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, images: it.images.filter((_, i) => i !== index) } : it)));
  };

  const addScaleImageFile = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
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
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, images: [...it.images, ...newImages] } : it)));
    } finally {
      e.target.value = '';
    }
  };

  const openScalePanel = (id: string) => {
    setActiveItemId(id);
    setShowScaleCapture(true);
  };

  const handleCaptured = (uploadedUrl: string) => {
    if (!activeItemId) return;
    setScaleImageByItem((prev) => ({ ...prev, [activeItemId]: uploadedUrl }));
    setShowScaleCapture(false);
  };

  const toggleCollapsed = (id: string) => {
    setCollapsedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddImageUrl = (id: string) => {
    const url = prompt('آدرس URL تصویر را وارد کنید:');
    if (url && url.trim()) {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, images: [...it.images, url.trim()] } : it)));
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const supplierIdToUse = formData.supplierId || manualSupplierId || undefined;
    const branchIdToUse = formData.branchId || manualBranchId;
    const userIdToUse = formData.userId || user?.id;

    if (!userIdToUse) return showMessage('error', 'شناسه کاربر موجود نیست');
    if (!branchIdToUse) return showMessage('error', 'لطفاً شعبه را انتخاب یا شناسه شعبه را وارد کنید');

    if (items.length === 0) return showMessage('error', 'حداقل یک قلم کالا اضافه کنید');

    setSubmitting(true);
    try {
      const purchaseItems: Array<{ productId: string; quantity: number; unitPrice: number; weight?: number }> = [];

      // First, create all inventory items
      for (const it of items) {
        if (!it.name || !it.purchasePrice) {
          showMessage('error', `لطفاً نام و قیمت خرید را برای همه اقلام وارد کنید`);
          setSubmitting(false);
          return;
        }

        const ensured = autoPrice(it, goldData);
        const qty = parseInt(ensured.quantity || '1', 10);
        const purchasePrice = parseFloat(ensured.purchasePrice);
        const sellingPrice = parseFloat(ensured.sellingPrice || ensured.purchasePrice);

        if (qty <= 0 || purchasePrice <= 0) {
          showMessage('error', `مقادیر نامعتبر برای "${it.name || 'آیتم'}"`);
          setSubmitting(false);
          return;
        }

        let productId: string;

        if (it.category === 'PRODUCT') {
          const p = ensured as ProductItem;
          const res = await api.post('/inventory/products', {
            name: p.name,
            goldPurity: p.goldPurity,
            weight: parseFloat(p.weight || '0') || 0,
            purchasePrice,
            sellingPrice,
            craftsmanshipFee: parseFloat(p.craftsmanshipFee || '0') || 0,
            quantity: qty,
            description: p.description || undefined,
            images: p.images.length > 0 ? p.images : undefined,
            allocations: [{ branchId: branchIdToUse, quantity: qty }],
          });
          productId = res.data.id;
        } else if (it.category === 'COIN') {
          const c = ensured as CoinItem;
          const res = await api.post('/inventory/coins', {
            name: c.name,
            coinType: c.coinType,
            coinYear: parseInt(c.coinYear || new Date().getFullYear().toString()),
            weight: parseFloat(c.weight || '0') || 0,
            purchasePrice,
            sellingPrice,
            quantity: qty,
            description: c.description || undefined,
            images: c.images.length > 0 ? c.images : undefined,
            allocations: [{ branchId: branchIdToUse, quantity: qty }],
          });
          productId = res.data.id;
        } else if (it.category === 'STONE') {
          const s = ensured as StoneItem;
          const res = await api.post('/inventory/stones', {
            name: s.name,
            stoneType: s.stoneType,
            caratWeight: parseFloat(s.caratWeight || '0') || 0,
            stoneQuality: s.stoneQuality || undefined,
            certificateNumber: s.certificateNumber || undefined,
            purchasePrice,
            sellingPrice,
            quantity: qty,
            description: s.description || undefined,
            images: s.images.length > 0 ? s.images : undefined,
            allocations: [{ branchId: branchIdToUse, quantity: qty }],
          });
          productId = res.data.id;
        } else if (it.category === 'RAW_GOLD') {
          const r = ensured as RawGoldItem;
          const res = await api.post('/inventory/raw-gold', {
            name: r.name,
            goldPurity: r.goldPurity,
            weight: parseFloat(r.weight || '0') || 0,
            purchasePrice,
            sellingPrice,
            quantity: qty,
            description: r.description || undefined,
            allocations: [{ branchId: branchIdToUse, quantity: qty }],
          });
          productId = res.data.id;
        } else if (it.category === 'GENERAL_GOODS') {
          const g = ensured as GeneralGoodsItem;
          const res = await api.post('/inventory/general-goods', {
            name: g.name,
            brand: g.brand || undefined,
            model: g.model || undefined,
            weight: g.weight ? parseFloat(g.weight) : undefined,
            purchasePrice,
            sellingPrice,
            quantity: qty,
            description: g.description || undefined,
            images: g.images.length > 0 ? g.images : undefined,
            allocations: [{ branchId: branchIdToUse, quantity: qty }],
          });
          productId = res.data.id;
        } else {
          showMessage('error', 'نوع دسته‌بندی نامعتبر');
          setSubmitting(false);
          return;
        }

        // Add to purchase items
        let weight: number | undefined;
        if (it.category === 'STONE') {
          weight = (it as StoneItem).caratWeight ? parseFloat((it as StoneItem).caratWeight) : undefined;
        } else if (it.category === 'PRODUCT' || it.category === 'COIN' || it.category === 'RAW_GOLD' || it.category === 'GENERAL_GOODS') {
          weight = (it as ProductItem | CoinItem | RawGoldItem | GeneralGoodsItem).weight ? parseFloat((it as ProductItem | CoinItem | RawGoldItem | GeneralGoodsItem).weight) : undefined;
        }

        purchaseItems.push({
          productId,
          quantity: qty,
          unitPrice: purchasePrice,
          weight,
        });
      }

      // Now create the purchase with the created product IDs
      await api.post('/transactions/purchases', {
        purchaseDate: formData.purchaseDate,
        supplierId: supplierIdToUse,
        userId: userIdToUse,
        branchId: branchIdToUse,
        items: purchaseItems,
        taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : undefined,
        paidAmount: formData.paidAmount ? parseFloat(formData.paidAmount) : undefined,
        paymentMethod: formData.paymentMethod,
        deliveryDate: formData.deliveryDate || undefined,
        notes: formData.notes || undefined,
      });

      showMessage('success', 'خرید با موفقیت ثبت شد و اقلام به موجودی اضافه شدند');
      setTimeout(() => {
      router.push('/dashboard/transactions/purchases');
      }, 1500);
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در ثبت خرید');
      setSubmitting(false);
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
                onClick={() => addItemRow('PRODUCT')}
                className="flex items-center gap-1 px-3 py-2 text-white bg-amber-600 rounded-lg hover:bg-amber-700 text-sm"
              >
                <Plus className="h-4 w-4" />
                افزودن قلم
              </button>
            </div>

            <div className="space-y-3">
              {items.map((it, idx) => (
                <div key={it.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCollapsed(it.id)}
                        className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {collapsedIds[it.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      </button>
                      <span className="text-sm text-gray-500 dark:text-gray-400">#{idx + 1}</span>
                      <select
                        value={it.category}
                        onChange={(e) => handleCategoryChange(it.id, e.target.value as Category)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="PRODUCT">محصول ساخته شده</option>
                        <option value="COIN">سکه</option>
                        <option value="STONE">سنگ قیمتی</option>
                        <option value="RAW_GOLD">طلا خام</option>
                        <option value="GENERAL_GOODS">کالاهای عمومی</option>
                      </select>
                      <input
                        type="text"
                        value={it.name}
                        onChange={(e) => updateItem(it.id, { name: e.target.value })}
                        placeholder="نام"
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => updateItem(it.id, { quantity: e.target.value })}
                        placeholder="تعداد"
                        className="w-24 px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div className="flex gap-2 self-start md:self-auto">
                      <button
                        type="button"
                        onClick={() => addItemRow(it.category)}
                        className="flex items-center gap-1 px-3 py-2 text-white bg-amber-600 rounded-lg hover:bg-amber-700 text-sm"
                      >
                        <Plus className="h-4 w-4" />
                        <span>افزودن مشابه</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItemRow(it.id)}
                        className="flex items-center gap-1 px-3 py-2 text-red-700 bg-red-100 rounded-lg hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 text-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>

                  {!collapsedIds[it.id] && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام *</label>
                        <input
                          type="text"
                          value={it.name}
                          onChange={(e) => updateItem(it.id, { name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="نام اقلام"
                        />
                          </div>

                      {it.category === 'PRODUCT' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">عیار *</label>
                            <select
                              value={(it as ProductItem).goldPurity}
                              onChange={(e) => updateItem(it.id, { ...(it as ProductItem), goldPurity: e.target.value as any })}
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
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">وزن (گرم)</label>
                              <div className="flex items-center gap-2">
                                <label className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer text-xs">
                                  <Upload className="h-3 w-3" />
                                  <span>آپلود</span>
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => addScaleImageFile(it.id, e)} />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => openScalePanel(it.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-xs"
                                >
                                  <Camera className="h-3 w-3" />
                                  <span>دوربین</span>
                                </button>
                                {scaleImageByItem[it.id] && (
                                  <img
                                    src={scaleImageByItem[it.id]}
                                    alt="ترازو"
                                    className="w-8 h-8 rounded border border-white/20 object-cover"
                                  />
                        )}
                      </div>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              value={(it as ProductItem).weight}
                              onChange={(e) => updateItem(it.id, { ...(it as ProductItem), weight: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">اجرت</label>
                            <input
                              type="number"
                              value={(it as ProductItem).craftsmanshipFee}
                              onChange={(e) => updateItem(it.id, { ...(it as ProductItem), craftsmanshipFee: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                        </>
                      )}

                      {it.category === 'COIN' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع سکه *</label>
                            <select
                              value={(it as CoinItem).coinType}
                              onChange={(e) => updateItem(it.id, { ...(it as CoinItem), coinType: e.target.value })}
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">سال ضرب</label>
                            <input
                              type="number"
                              value={(it as CoinItem).coinYear}
                              onChange={(e) => updateItem(it.id, { ...(it as CoinItem), coinYear: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">وزن (گرم)</label>
                              <div className="flex items-center gap-2">
                                <label className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer text-xs">
                                  <Upload className="h-3 w-3" />
                                  <span>آپلود</span>
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => addScaleImageFile(it.id, e)} />
                                </label>
                            <button
                              type="button"
                                  onClick={() => openScalePanel(it.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-xs"
                                >
                                  <Camera className="h-3 w-3" />
                                  <span>دوربین</span>
                                </button>
                                {scaleImageByItem[it.id] && (
                                  <img
                                    src={scaleImageByItem[it.id]}
                                    alt="ترازو"
                                    className="w-8 h-8 rounded border border-white/20 object-cover"
                                  />
                                )}
                              </div>
                            </div>
                            <input
                              type="number"
                              step="0.001"
                              value={(it as CoinItem).weight}
                              onChange={(e) => updateItem(it.id, { ...(it as CoinItem), weight: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                        </>
                      )}

                      {it.category === 'STONE' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع سنگ *</label>
                            <select
                              value={(it as StoneItem).stoneType}
                              onChange={(e) => updateItem(it.id, { ...(it as StoneItem), stoneType: e.target.value })}
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
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => addScaleImageFile(it.id, e)} />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => openScalePanel(it.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-xs"
                                >
                                  <Camera className="h-3 w-3" />
                                  <span>دوربین</span>
                            </button>
                                {scaleImageByItem[it.id] && (
                                  <img
                                    src={scaleImageByItem[it.id]}
                                    alt="ترازو"
                                    className="w-8 h-8 rounded border border-white/20 object-cover"
                                  />
                                )}
                        </div>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              value={(it as StoneItem).caratWeight}
                              onChange={(e) => updateItem(it.id, { ...(it as StoneItem), caratWeight: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">کیفیت</label>
                            <input
                              type="text"
                              value={(it as StoneItem).stoneQuality}
                              onChange={(e) => updateItem(it.id, { ...(it as StoneItem), stoneQuality: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شماره گواهی</label>
                            <input
                              type="text"
                              value={(it as StoneItem).certificateNumber}
                              onChange={(e) => updateItem(it.id, { ...(it as StoneItem), certificateNumber: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                        </>
                      )}

                      {it.category === 'RAW_GOLD' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">عیار *</label>
                            <select
                              value={(it as RawGoldItem).goldPurity}
                              onChange={(e) => updateItem(it.id, { ...(it as RawGoldItem), goldPurity: e.target.value as any })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                              <option value="K24">24 عیار</option>
                              <option value="K22">22 عیار</option>
                              <option value="K21">21 عیار</option>
                              <option value="K18">18 عیار</option>
                            </select>
                    </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">وزن (گرم) *</label>
                              <div className="flex items-center gap-2">
                                <label className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer text-xs">
                                  <Upload className="h-3 w-3" />
                                  <span>آپلود</span>
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => addScaleImageFile(it.id, e)} />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => openScalePanel(it.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-xs"
                                >
                                  <Camera className="h-3 w-3" />
                                  <span>دوربین</span>
                                </button>
                                {scaleImageByItem[it.id] && (
                                  <img
                                    src={scaleImageByItem[it.id]}
                                    alt="ترازو"
                                    className="w-8 h-8 rounded border border-white/20 object-cover"
                                  />
                                )}
                  </div>
                            </div>
                            <input
                              type="number"
                              step="0.001"
                              value={(it as RawGoldItem).weight}
                              onChange={(e) => updateItem(it.id, { ...(it as RawGoldItem), weight: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                        </>
                      )}

                      {it.category === 'GENERAL_GOODS' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">برند</label>
                      <input
                        type="text"
                              value={(it as GeneralGoodsItem).brand}
                              onChange={(e) => updateItem(it.id, { ...(it as GeneralGoodsItem), brand: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مدل</label>
                            <input
                              type="text"
                              value={(it as GeneralGoodsItem).model}
                              onChange={(e) => updateItem(it.id, { ...(it as GeneralGoodsItem), model: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وزن (گرم)</label>
                      <input
                        type="number"
                              step="0.01"
                              value={(it as GeneralGoodsItem).weight}
                              onChange={(e) => updateItem(it.id, { ...(it as GeneralGoodsItem), weight: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تعداد *</label>
                        <input
                          type="number"
                          min="1"
                        value={it.quantity}
                          onChange={(e) => updateItem(it.id, { quantity: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">قیمت خرید (ریال) *</label>
                      <input
                        type="number"
                          value={it.purchasePrice}
                          onChange={(e) => updateItem(it.id, { purchasePrice: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">قیمت فروش (ریال) *</label>
                        <input
                          type="number"
                          value={it.sellingPrice}
                          onChange={(e) => updateItem(it.id, { sellingPrice: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                        <textarea
                          rows={2}
                          value={it.description}
                          onChange={(e) => updateItem(it.id, { description: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                  </div>
                  )}
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
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              {submitting ? 'در حال ثبت...' : 'ثبت خرید'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/transactions/purchases')}
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
      {showScaleCapture && activeItemId && (
        <ScaleCapturePanel
          itemId={activeItemId}
          onClose={() => setShowScaleCapture(false)}
          onCaptured={handleCaptured}
        />
      )}
    </div>
  );
}


