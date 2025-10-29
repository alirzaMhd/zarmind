'use client';

import { useState } from 'react';
import api from '@/lib/api';
import {
  Plus,
  Trash2,
  Save,
  Upload,
  Image as ImageIcon,
  AlertCircle,
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
  const [items, setItems] = useState<DraftItem[]>([createDefaultItem('PRODUCT')]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});

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
  };

  const updateItem = (id: string, partial: Partial<DraftItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...partial } as DraftItem : it)));
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

  const toggleCollapsed = (id: string) => {
    setCollapsedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const submitAll = async () => {
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      for (const it of items) {
        if (!it.name || !it.quantity || !it.purchasePrice || !it.sellingPrice) continue;
        if (it.category === 'PRODUCT') {
          const p = it as ProductItem;
          await api.post('/inventory/products', {
            name: p.name,
            goldPurity: p.goldPurity,
            weight: parseFloat(p.weight || '0') || 0,
            purchasePrice: parseFloat(p.purchasePrice),
            sellingPrice: parseFloat(p.sellingPrice),
            craftsmanshipFee: parseFloat(p.craftsmanshipFee || '0') || 0,
            quantity: parseInt(p.quantity || '1'),
            description: p.description || undefined,
            images: p.images.length > 0 ? p.images : undefined,
          });
        } else if (it.category === 'COIN') {
          const c = it as CoinItem;
          await api.post('/inventory/coins', {
            name: c.name,
            coinType: c.coinType,
            coinYear: parseInt(c.coinYear || new Date().getFullYear().toString()),
            weight: parseFloat(c.weight || '0') || 0,
            purchasePrice: parseFloat(c.purchasePrice),
            sellingPrice: parseFloat(c.sellingPrice),
            quantity: parseInt(c.quantity || '1'),
            description: c.description || undefined,
            images: c.images.length > 0 ? c.images : undefined,
          });
        } else if (it.category === 'STONE') {
          const s = it as StoneItem;
          await api.post('/inventory/stones', {
            name: s.name,
            stoneType: s.stoneType,
            caratWeight: parseFloat(s.caratWeight || '0') || 0,
            stoneQuality: s.stoneQuality || undefined,
            certificateNumber: s.certificateNumber || undefined,
            purchasePrice: parseFloat(s.purchasePrice),
            sellingPrice: parseFloat(s.sellingPrice),
            quantity: parseInt(s.quantity || '1'),
            description: s.description || undefined,
            images: s.images.length > 0 ? s.images : undefined,
          });
        } else if (it.category === 'RAW_GOLD') {
          const r = it as RawGoldItem;
          await api.post('/inventory/raw-gold', {
            name: r.name,
            goldPurity: r.goldPurity,
            weight: parseFloat(r.weight || '0') || 0,
            purchasePrice: parseFloat(r.purchasePrice),
            sellingPrice: parseFloat(r.sellingPrice),
            quantity: parseInt(r.quantity || '1'),
            description: r.description || undefined,
          });
        } else if (it.category === 'GENERAL_GOODS') {
          const g = it as GeneralGoodsItem;
          await api.post('/inventory/general-goods', {
            name: g.name,
            brand: g.brand || undefined,
            model: g.model || undefined,
            weight: g.weight ? parseFloat(g.weight) : undefined,
            purchasePrice: parseFloat(g.purchasePrice),
            sellingPrice: parseFloat(g.sellingPrice),
            quantity: parseInt(g.quantity || '1'),
            description: g.description || undefined,
            images: g.images.length > 0 ? g.images : undefined,
          });
        }
      }
      showMessage('success', 'اقلام با موفقیت اضافه شدند');
      setItems([createDefaultItem('PRODUCT')]);
    } catch (error: any) {
      showMessage('error', error?.response?.data?.message || 'خطا در ذخیره اقلام');
    } finally {
      setSubmitting(false);
    }
  };

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
                    {collapsedIds[it.id] ? 'نمایش' : 'جمع کردن'}
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
                        <div className="flex items-center gap-1">
                          <label className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer text-xs">
                            <Upload className="h-3 w-3" />
                            <span>تصویر ترازو</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => addScaleImageFile(it.id, e)} />
                          </label>
                          <button type="button" onClick={() => addScaleImageUrl(it.id)} className="px-2 py-1 text-xs rounded-md bg-green-600 text-white hover:bg-green-700">URL</button>
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
                        <div className="flex items-center gap-1">
                          <label className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer text-xs">
                            <Upload className="h-3 w-3" />
                            <span>تصویر ترازو</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => addScaleImageFile(it.id, e)} />
                          </label>
                          <button type="button" onClick={() => addScaleImageUrl(it.id)} className="px-2 py-1 text-xs rounded-md bg-green-600 text-white hover:bg-green-700">URL</button>
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
                        <div className="flex items-center gap-1">
                          <label className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer text-xs">
                            <Upload className="h-3 w-3" />
                            <span>تصویر ترازو</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => addScaleImageFile(it.id, e)} />
                          </label>
                          <button type="button" onClick={() => addScaleImageUrl(it.id)} className="px-2 py-1 text-xs rounded-md bg-green-600 text-white hover:bg-green-700">URL</button>
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
                        <div className="flex items-center gap-1">
                          <label className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer text-xs">
                            <Upload className="h-3 w-3" />
                            <span>تصویر ترازو</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => addScaleImageFile(it.id, e)} />
                          </label>
                          <button type="button" onClick={() => addScaleImageUrl(it.id)} className="px-2 py-1 text-xs rounded-md bg-green-600 text-white hover:bg-green-700">URL</button>
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تصاویر (اسکیل)</label>
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
                            alt={`item-${idx}-img-${index}`}
                            className="w-full h-24 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Invalid+Image';
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
    </div>
  );
}


