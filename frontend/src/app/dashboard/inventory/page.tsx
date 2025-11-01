'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import {
  Plus,
  Trash2,
  Save,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  Camera,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

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

export default function InventoryAddPage() {
  const [goldData, setGoldData] = useState<any | null>(null);
  const [items, setItems] = useState<DraftItem[]>([createDefaultItem('PRODUCT')]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});
  const [showScaleCapture, setShowScaleCapture] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string>('');
  const [scaleImageByItem, setScaleImageByItem] = useState<Record<string, string>>({});
  const [branches, setBranches] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [branchAllocationsByItem, setBranchAllocationsByItem] = useState<Record<string, Array<{ id: string; branchId: string; quantity: string }>>>({});

  // Lazy-load panel for client-only APIs (camera)
  const ScaleCapturePanel = dynamic(() => import('@/components/ScaleCapturePanel'), { ssr: false });

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

    // Load branches once
    (async () => {
      try {
        const res = await api.get('/branches', { params: { limit: 1000, isActive: 'true', sortBy: 'name', sortOrder: 'asc' } });
        const items = Array.isArray(res?.data?.items) ? res.data.items : [];
        setBranches(items.map((b: any) => ({ id: b.id, name: b.name, code: b.code })));
      } catch (e) {
        // silent
      }
    })();

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
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

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

  const addItemRow = (category?: Category) => {
    setItems((prev) => [...prev, createDefaultItem(category || 'PRODUCT')]);
  };

  const removeItemRow = (id: string) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((it) => it.id !== id)));
    setBranchAllocationsByItem((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const addBranchAllocation = (itemId: string) => {
    const currentAllocations = branchAllocationsByItem[itemId] || [];
    const availableBranches = branches.filter(
      (b) => !currentAllocations.some((alloc) => alloc.branchId === b.id)
    );
    if (availableBranches.length === 0) return;
    
    setBranchAllocationsByItem((prev) => {
      const next = {
        ...prev,
        [itemId]: [
          ...(prev[itemId] || []),
          {
            id: `alloc-${Date.now()}-${Math.random()}`,
            branchId: availableBranches[0].id,
            quantity: '1',
          },
        ],
      };
      // Recalculate prices
      const totalQty = (next[itemId] || []).reduce((sum, alloc) => sum + (parseInt(alloc.quantity || '0') || 0), 0) || 1;
      setItems((currentItems) =>
        currentItems.map((it) => {
          if (it.id !== itemId) return it;
          const nextWithQty = { ...it, quantity: String(totalQty) } as DraftItem;
          return autoPrice(nextWithQty, goldData);
        })
      );
      return next;
    });
  };

  const removeBranchAllocation = (itemId: string, allocId: string) => {
    setBranchAllocationsByItem((prev) => {
      const next = {
        ...prev,
        [itemId]: (prev[itemId] || []).filter((alloc) => alloc.id !== allocId),
      };
      // Recalculate prices
      const totalQty = (next[itemId] || []).reduce((sum, alloc) => sum + (parseInt(alloc.quantity || '0') || 0), 0) || 1;
      setItems((currentItems) =>
        currentItems.map((it) => {
          if (it.id !== itemId) return it;
          const nextWithQty = { ...it, quantity: String(totalQty) } as DraftItem;
          return autoPrice(nextWithQty, goldData);
        })
      );
      return next;
    });
  };

  const updateBranchAllocation = (itemId: string, allocId: string, field: 'branchId' | 'quantity', value: string) => {
    setBranchAllocationsByItem((prev) => {
      const next = {
        ...prev,
        [itemId]: (prev[itemId] || []).map((alloc) => (alloc.id === allocId ? { ...alloc, [field]: value } : alloc)),
      };
      // Recalculate prices when allocations change
      const totalQty = (next[itemId] || []).reduce((sum, alloc) => sum + (parseInt(alloc.quantity || '0') || 0), 0) || 1;
      setItems((currentItems) =>
        currentItems.map((it) => {
          if (it.id !== itemId) return it;
          const nextWithQty = { ...it, quantity: String(totalQty) } as DraftItem;
          return autoPrice(nextWithQty, goldData);
        })
      );
      return next;
    });
  };

  const updateItem = (id: string, partial: Partial<DraftItem>) => {
    setItems((prev) => prev.map((it) => {
      if (it.id !== id) return it;
      const next = { ...it, ...partial } as DraftItem;
      // Calculate quantity from branch allocations
      const totalQty = (branchAllocationsByItem[id] || []).reduce((sum, alloc) => sum + (parseInt(alloc.quantity || '0') || 0), 0) || 1;
      const nextWithQty = { ...next, quantity: String(totalQty) } as DraftItem;
      return autoPrice(nextWithQty, goldData);
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

  const handleAddImageUrl = (id: string) => {
    const url = prompt('آدرس URL تصویر را وارد کنید:');
    if (url && url.trim()) {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, images: [...it.images, url.trim()] } : it)));
    }
  };

  const handleRemoveImage = (id: string, index: number) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, images: it.images.filter((_, i) => i !== index) } : it)));
  };

  // Scale images (OCR) are stored alongside but managed separately in UI, later merged into images on submit
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

  const addScaleImageUrl = (id: string) => {
    const url = prompt('آدرس URL تصویر ترازو را وارد کنید:');
    if (url && url.trim()) {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, images: [...it.images, url.trim()] } : it)));
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

  const submitAll = async () => {
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      for (const it of items) {
        const allocations = (branchAllocationsByItem[it.id] || [])
          .filter((alloc) => alloc.branchId && parseInt(alloc.quantity || '0') > 0)
          .map((alloc) => ({ branchId: alloc.branchId, quantity: parseInt(alloc.quantity || '0') }));
        
        if (allocations.length === 0) {
          showMessage('error', `لطفاً برای "${it.name || 'آیتم'}" حداقل یک تخصیص به شعبه اضافه کنید`);
          setSubmitting(false);
          return;
        }

        const totalAlloc = allocations.reduce((s, a) => s + a.quantity, 0);
        const ensured = autoPrice(it, goldData);
        if (!ensured.name || !ensured.purchasePrice || !ensured.sellingPrice) continue;
        
        if (it.category === 'PRODUCT') {
          const p = ensured as ProductItem;
          await api.post('/inventory/products', {
            name: p.name,
            goldPurity: p.goldPurity,
            weight: parseFloat(p.weight || '0') || 0,
            purchasePrice: parseFloat(p.purchasePrice),
            sellingPrice: parseFloat(p.sellingPrice),
            craftsmanshipFee: parseFloat(p.craftsmanshipFee || '0') || 0,
            quantity: totalAlloc,
            description: p.description || undefined,
            images: p.images.length > 0 ? p.images : undefined,
            allocations: allocations.length > 0 ? allocations : undefined,
          });
        } else if (it.category === 'COIN') {
          const c = ensured as CoinItem;
          await api.post('/inventory/coins', {
            name: c.name,
            coinType: c.coinType,
            coinYear: parseInt(c.coinYear || new Date().getFullYear().toString()),
            weight: parseFloat(c.weight || '0') || 0,
            purchasePrice: parseFloat(c.purchasePrice),
            sellingPrice: parseFloat(c.sellingPrice),
            quantity: totalAlloc,
            description: c.description || undefined,
            images: c.images.length > 0 ? c.images : undefined,
            allocations: allocations.length > 0 ? allocations : undefined,
          });
        } else if (it.category === 'STONE') {
          const s = ensured as StoneItem;
          await api.post('/inventory/stones', {
            name: s.name,
            stoneType: s.stoneType,
            caratWeight: parseFloat(s.caratWeight || '0') || 0,
            stoneQuality: s.stoneQuality || undefined,
            certificateNumber: s.certificateNumber || undefined,
            purchasePrice: parseFloat(s.purchasePrice),
            sellingPrice: parseFloat(s.sellingPrice),
            quantity: totalAlloc,
            description: s.description || undefined,
            images: s.images.length > 0 ? s.images : undefined,
            allocations: allocations.length > 0 ? allocations : undefined,
          });
        } else if (it.category === 'RAW_GOLD') {
          const r = ensured as RawGoldItem;
          await api.post('/inventory/raw-gold', {
            name: r.name,
            goldPurity: r.goldPurity,
            weight: parseFloat(r.weight || '0') || 0,
            purchasePrice: parseFloat(r.purchasePrice),
            sellingPrice: parseFloat(r.sellingPrice),
            quantity: totalAlloc,
            description: r.description || undefined,
            allocations: allocations.length > 0 ? allocations : undefined,
          });
        } else if (it.category === 'GENERAL_GOODS') {
          const g = ensured as GeneralGoodsItem;
          await api.post('/inventory/general-goods', {
            name: g.name,
            brand: g.brand || undefined,
            model: g.model || undefined,
            weight: g.weight ? parseFloat(g.weight) : undefined,
            purchasePrice: parseFloat(g.purchasePrice),
            sellingPrice: parseFloat(g.sellingPrice),
            quantity: totalAlloc,
            description: g.description || undefined,
            images: g.images.length > 0 ? g.images : undefined,
            allocations: allocations.length > 0 ? allocations : undefined,
          });
        }
      }
      showMessage('success', 'اقلام با موفقیت اضافه شدند');
      setItems([createDefaultItem('PRODUCT')]);
      setBranchAllocationsByItem({});
    } catch (error: any) {
      showMessage('error', error?.response?.data?.message || 'خطا در ذخیره اقلام');
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">افزودن موجودی جدید</h1>
          <p className="text-gray-600 dark:text-gray-400">افزودن چندگانه اقلام در دسته‌های مختلف</p>
        </div>

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
            <button onClick={() => setMessage(null)} className="px-2">×</button>
          </div>
        )}

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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تعداد (بر اساس تخصیص به شعب محاسبه می‌شود)</label>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    جمع تخصیص فعلی: {(branchAllocationsByItem[it.id] || []).reduce((sum, alloc) => sum + (parseInt(alloc.quantity || '0') || 0), 0)} عدد
                  </div>
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

                {/* Branch allocations */}
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      تخصیص به شعب *
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                        جمع کل: {(branchAllocationsByItem[it.id] || []).reduce((sum, alloc) => sum + (parseInt(alloc.quantity || '0') || 0), 0)}
                      </span>
                      <button
                        type="button"
                        onClick={() => addBranchAllocation(it.id)}
                        disabled={branches.length === 0 || (branchAllocationsByItem[it.id] || []).length >= branches.length}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4" />
                        افزودن شعبه
                      </button>
                    </div>
                  </div>

                  {(branchAllocationsByItem[it.id] || []).length === 0 && (
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        هنوز شعبه‌ای اضافه نشده است
                      </p>
                      <button
                        type="button"
                        onClick={() => addBranchAllocation(it.id)}
                        disabled={branches.length === 0}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4" />
                        افزودن اولین شعبه
                      </button>
                    </div>
                  )}

                  {(branchAllocationsByItem[it.id] || []).length > 0 && (
                    <div className="space-y-2">
                      {(branchAllocationsByItem[it.id] || []).map((alloc) => {
                        const currentAllocations = branchAllocationsByItem[it.id] || [];
                        const availableBranches = branches.filter(
                          (b) => !currentAllocations.some((a) => a.branchId === b.id && a.id !== alloc.id)
                        );
                        const selectedBranch = branches.find((b) => b.id === alloc.branchId);
                        
                        return (
                          <div
                            key={alloc.id}
                            className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
                          >
                            <select
                              value={alloc.branchId}
                              onChange={(e) => updateBranchAllocation(it.id, alloc.id, 'branchId', e.target.value)}
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
                              onChange={(e) => updateBranchAllocation(it.id, alloc.id, 'quantity', e.target.value)}
                              placeholder="تعداد"
                              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => removeBranchAllocation(it.id, alloc.id)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                              title="حذف"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تصاویر</label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <label className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                      <Upload className="h-4 w-4" />
                      <span>آپلود از سیستم</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileUpload(it.id, e)}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAddImageUrl(it.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4" />
                      <span>افزودن از URL</span>
                    </button>
                  </div>

                  {it.images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {it.images.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`تصویر ${index + 1} آیتم ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/150?text=تصویر+نامعتبر';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(it.id, index)}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
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
              </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-2 mt-6">
          <button
            type="button"
            onClick={() => addItemRow('PRODUCT')}
            className="flex items-center justify-center gap-2 px-4 py-3 text-white bg-amber-600 rounded-lg hover:bg-amber-700"
          >
            <Plus className="h-5 w-5" />
            افزودن آیتم جدید
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={submitAll}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            {submitting ? 'در حال ذخیره...' : 'ذخیره همه'}
          </button>
        </div>
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


