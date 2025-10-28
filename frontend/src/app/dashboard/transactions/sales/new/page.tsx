// frontend/src/app/dashboard/transactions/sales/new/page.tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Save,
  User,
  Package,
  DollarSign,
  Tag,
  Calculator,
  ShoppingCart,
} from 'lucide-react';

type Customer = {
  id: string;
  code?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  businessName?: string | null;
  phone?: string | null;
  email?: string | null;
  currentBalance: number;
};

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  sellingPrice?: number;
  weight?: number;
  goldPurity?: string;
  quantity?: number;
  status: string;
};

type SaleItem = {
  productId: string;
  productName?: string;
  productSku?: string;
  category?: string;
  quantity: string;
  weight: string;
  unitPrice: string;
  goldPrice: string;
  stonePrice: string;
  craftsmanshipFee: string;
  discount: string;
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

const PRODUCT_CATEGORIES = [
  { value: '', label: 'همه دسته‌بندی‌ها' },
  { value: 'RAW_GOLD', label: 'طلای خام', endpoint: '/inventory/raw-gold' },
  { value: 'MANUFACTURED_PRODUCT', label: 'محصول ساخته‌شده', endpoint: '/inventory/products' },
  { value: 'STONE', label: 'سنگ', endpoint: '/inventory/stones' },
  { value: 'COIN', label: 'سکه', endpoint: '/inventory/coins' },
  { value: 'CURRENCY', label: 'ارز', endpoint: '/inventory/currency' },
  { value: 'GENERAL_GOODS', label: 'کالای عمومی', endpoint: '/inventory/general-goods' },
];

export default function NewSalePage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Form state
  const [customerId, setCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<SaleItem[]>([
    {
      productId: '',
      quantity: '1',
      weight: '',
      unitPrice: '',
      goldPrice: '',
      stonePrice: '',
      craftsmanshipFee: '',
      discount: '',
    },
  ]);
  const [taxAmount, setTaxAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');

  // Search states
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);

  // Product search per item
  const [itemCategories, setItemCategories] = useState<Record<number, string>>({});
  const [itemSearchTerms, setItemSearchTerms] = useState<Record<number, string>>({});
  const [productSuggestions, setProductSuggestions] = useState<Record<number, Product[]>>({});
  const [searchingProducts, setSearchingProducts] = useState<Record<number, boolean>>({});

  // UI state
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Search customers
  const searchCustomers = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setCustomerSuggestions([]);
      return;
    }

    try {
      setSearchingCustomers(true);
      const res = await api.get('/crm/customers', {
        params: {
          search: searchTerm,
          limit: 10,
          status: 'ACTIVE',
        },
      });
      const items = res.data?.items || res.data || [];
      setCustomerSuggestions(items);
    } catch (err) {
      console.error('Customer search error:', err);
      setCustomerSuggestions([]);
    } finally {
      setSearchingCustomers(false);
    }
  };

  // Search products
  const searchProducts = async (searchTerm: string, category: string, itemIndex: number) => {
    if (!searchTerm || searchTerm.length < 2) {
      setProductSuggestions((prev) => ({ ...prev, [itemIndex]: [] }));
      return;
    }

    try {
      setSearchingProducts((prev) => ({ ...prev, [itemIndex]: true }));

      let allProducts: Product[] = [];

      if (category) {
        // Search specific category
        const cat = PRODUCT_CATEGORIES.find((c) => c.value === category);
        const endpoint = cat?.endpoint || '/inventory/products';

        const res = await api.get(endpoint, {
          params: {
            search: searchTerm,
            limit: 10,
            status: 'IN_STOCK',
          },
        });

        allProducts = res.data?.items || res.data || [];
      } else {
        // Search ALL categories
        const searchPromises = PRODUCT_CATEGORIES
          .filter((cat) => cat.value && cat.endpoint) // Skip empty option
          .map(async (cat) => {
            try {
              const res = await api.get(cat.endpoint!, {
                params: {
                  search: searchTerm,
                  limit: 5, // Limit per category to avoid too many results
                  status: 'IN_STOCK',
                },
              });
              return res.data?.items || res.data || [];
            } catch (err) {
              console.error(`Search error for ${cat.label}:`, err);
              return [];
            }
          });

        const results = await Promise.all(searchPromises);

        // Flatten and deduplicate by product ID
        const productMap = new Map<string, Product>();
        results.flat().forEach((product: Product) => {
          if (!productMap.has(product.id)) {
            productMap.set(product.id, product);
          }
        });

        allProducts = Array.from(productMap.values());

        // Sort by relevance (name match first, then SKU match)
        allProducts.sort((a, b) => {
          const searchLower = searchTerm.toLowerCase();
          const aNameMatch = a.name.toLowerCase().includes(searchLower);
          const bNameMatch = b.name.toLowerCase().includes(searchLower);

          if (aNameMatch && !bNameMatch) return -1;
          if (!aNameMatch && bNameMatch) return 1;

          return a.name.localeCompare(b.name, 'fa');
        });

        // Limit total results
        allProducts = allProducts.slice(0, 10);
      }

      setProductSuggestions((prev) => ({ ...prev, [itemIndex]: allProducts }));
    } catch (err) {
      console.error('Product search error:', err);
      setProductSuggestions((prev) => ({ ...prev, [itemIndex]: [] }));
    } finally {
      setSearchingProducts((prev) => ({ ...prev, [itemIndex]: false }));
    }
  };

  // Debounced customer search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCustomers(customerSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [customerSearchTerm]);

  // Debounced product search
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

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';

  const getCustomerName = (c: Customer) => {
    return c.businessName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.code || c.id;
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: '',
        quantity: '1',
        weight: '',
        unitPrice: '',
        goldPrice: '',
        stonePrice: '',
        craftsmanshipFee: '',
        discount: '',
      },
    ]);
    const newIndex = items.length;
    setItemCategories((prev) => ({ ...prev, [newIndex]: '' }));
    setItemSearchTerms((prev) => ({ ...prev, [newIndex]: '' }));
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    // Clean up states
    const newCategories = { ...itemCategories };
    const newSearchTerms = { ...itemSearchTerms };
    const newSuggestions = { ...productSuggestions };
    const newSearching = { ...searchingProducts };
    delete newCategories[index];
    delete newSearchTerms[index];
    delete newSuggestions[index];
    delete newSearching[index];
    setItemCategories(newCategories);
    setItemSearchTerms(newSearchTerms);
    setProductSuggestions(newSuggestions);
    setSearchingProducts(newSearching);
  };

  const updateItem = (index: number, field: keyof SaleItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const selectProduct = (index: number, product: Product) => {
    // Batch all updates into a single state change
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      category: product.category,
      unitPrice: product.sellingPrice?.toString() || '',
      weight: product.weight?.toString() || newItems[index].weight,
    };
    setItems(newItems);

    // Update search term to show selected product
    setItemSearchTerms((prev) => ({
      ...prev,
      [index]: `${product.name} (${product.sku})`,
    }));

    // Clear suggestions
    setProductSuggestions((prev) => ({ ...prev, [index]: [] }));
  };

  const calculateItemSubtotal = (item: SaleItem): number => {
    const qty = parseFloat(item.quantity) || 0;
    const gold = parseFloat(item.goldPrice) || 0;
    const stone = parseFloat(item.stonePrice) || 0;
    const craft = parseFloat(item.craftsmanshipFee) || 0;
    const discount = parseFloat(item.discount) || 0;

    // If breakdown prices are provided, use them
    if (gold > 0 || stone > 0 || craft > 0) {
      return (gold + stone + craft - discount) * qty;
    }

    // Otherwise use unit price
    const unitPrice = parseFloat(item.unitPrice) || 0;
    return (unitPrice - discount) * qty;
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0);
    const tax = parseFloat(taxAmount) || 0;
    const discount = parseFloat(discountAmount) || 0;
    const total = subtotal + tax - discount;

    return { subtotal, tax, discount, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.branchId && !user?.id) {
      return showMessage('error', 'اطلاعات کاربر یافت نشد');
    }

    // Validate items
    const validItems = items.filter((item) => item.productId && parseFloat(item.quantity) > 0);

    if (validItems.length === 0) {
      return showMessage('error', 'حداقل یک محصول با مقدار معتبر وارد کنید');
    }

    try {
      setSaving(true);

      const payload = {
        customerId: customerId || undefined,
        branchId: user.branchId || undefined,
        saleDate,
        items: validItems.map((item) => ({
          productId: item.productId,
          quantity: parseInt(item.quantity, 10),
          weight: item.weight ? parseFloat(item.weight) : undefined,
          unitPrice: parseFloat(item.unitPrice) || 0,
          goldPrice: item.goldPrice ? parseFloat(item.goldPrice) : undefined,
          stonePrice: item.stonePrice ? parseFloat(item.stonePrice) : undefined,
          craftsmanshipFee: item.craftsmanshipFee ? parseFloat(item.craftsmanshipFee) : undefined,
          discount: item.discount ? parseFloat(item.discount) : undefined,
        })),
        taxAmount: taxAmount ? parseFloat(taxAmount) : undefined,
        discountAmount: discountAmount ? parseFloat(discountAmount) : undefined,
        paidAmount: paidAmount ? parseFloat(paidAmount) : undefined,
        paymentMethod,
        notes: notes || undefined,
      };

      await api.post('/transactions/sales', payload);

      showMessage('success', 'فروش با موفقیت ثبت شد');
      setTimeout(() => {
        router.push('/dashboard/transactions/sales');
      }, 1500);
    } catch (err: any) {
      console.error('Create sale error:', err);
      showMessage('error', err.response?.data?.message || 'خطا در ثبت فروش');
      setSaving(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>بازگشت</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">فروش جدید</h1>
          <p className="text-gray-600 dark:text-gray-400">ثبت فاکتور فروش جدید</p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              مشتری (اختیاری)
            </h2>

            <div className="relative">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={customerSearchTerm}
                  onChange={(e) => {
                    setCustomerSearchTerm(e.target.value);
                    if (selectedCustomer) {
                      setSelectedCustomer(null);
                      setCustomerId('');
                    }
                  }}
                  placeholder="جستجوی مشتری (نام، تلفن، کد)..."
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {searchingCustomers && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
                  </div>
                )}
              </div>

              {/* Customer Suggestions */}
              {customerSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {customerSuggestions.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setCustomerId(customer.id);
                        setCustomerSearchTerm(getCustomerName(customer));
                        setCustomerSuggestions([]);
                      }}
                      className="w-full px-4 py-3 text-right hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getCustomerName(customer)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                            <span>{customer.phone}</span>
                            {customer.code && (
                              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                                {customer.code}
                              </span>
                            )}
                          </div>
                        </div>
                        {customer.currentBalance > 0 && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            بدهی: {formatCurrency(customer.currentBalance)}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Customer Info */}
              {selectedCustomer && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                        {getCustomerName(selectedCustomer)}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {selectedCustomer.phone} {selectedCustomer.email && `• ${selectedCustomer.email}`}
                      </p>
                    </div>
                    {selectedCustomer.currentBalance > 0 && (
                      <div className="text-sm text-red-600 dark:text-red-400">
                        بدهی فعلی: {formatCurrency(selectedCustomer.currentBalance)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sale Date */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              تاریخ فروش
            </h2>
            <input
              type="date"
              required
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Items */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="h-5 w-5" />
                اقلام فروش
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                <Plus className="h-4 w-4" />
                افزودن قلم
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                >
                  {/* Category and Search */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        دسته‌بندی
                      </label>
                      <select
                        value={itemCategories[idx] || ''}
                        onChange={(e) => {
                          setItemCategories((prev) => ({ ...prev, [idx]: e.target.value }));
                          setItemSearchTerms((prev) => ({ ...prev, [idx]: '' }));
                          setProductSuggestions((prev) => ({ ...prev, [idx]: [] }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="relative">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        جستجوی محصول {item.productId && '✓'}
                      </label>
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          value={itemSearchTerms[idx] || ''}
                          onChange={(e) => {
                            setItemSearchTerms((prev) => ({ ...prev, [idx]: e.target.value }));
                            if (item.productId) {
                              updateItem(idx, 'productId', '');
                              updateItem(idx, 'productName', '');
                              updateItem(idx, 'productSku', '');
                            }
                          }}
                          placeholder={
                            item.productId
                              ? 'محصول انتخاب شده - برای تغییر تایپ کنید'
                              : 'جستجو برای انتخاب محصول...'
                          }
                          className={`w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white ${item.productId
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

                      {/* Product Suggestions */}
                      {productSuggestions[idx] && productSuggestions[idx].length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {productSuggestions[idx].map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => selectProduct(idx, product)}
                              className="w-full px-4 py-2 text-right hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
                            >
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {product.name || product.sku}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <span>SKU: {product.sku}</span>
                                {product.category && (
                                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                    {product.category}
                                  </span>
                                )}
                                {product.sellingPrice && (
                                  <span>قیمت: {formatCurrency(product.sellingPrice)}</span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        شناسه محصول *
                      </label>
                      <input
                        type="text"
                        value={item.productId}
                        readOnly
                        placeholder="از جستجو انتخاب شود"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">تعداد *</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">وزن (گرم)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={item.weight}
                        onChange={(e) => updateItem(idx, 'weight', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        قیمت واحد
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="w-full px-3 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-600 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4 mx-auto" />
                      </button>
                    </div>
                  </div>

                  {/* Price Breakdown (for manufactured products) */}
                  {item.category === 'MANUFACTURED_PRODUCT' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          قیمت طلا
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.goldPrice}
                          onChange={(e) => updateItem(idx, 'goldPrice', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          قیمت سنگ
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.stonePrice}
                          onChange={(e) => updateItem(idx, 'stonePrice', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          اجرت
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.craftsmanshipFee}
                          onChange={(e) => updateItem(idx, 'craftsmanshipFee', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          تخفیف قلم
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.discount}
                          onChange={(e) => updateItem(idx, 'discount', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Item Subtotal */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">جمع قلم:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(calculateItemSubtotal(item))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Payment */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              جمع و پرداخت
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    مالیات (ارزش افزوده)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    تخفیف کل فاکتور
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    روش پرداخت *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
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
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    مبلغ پرداختی
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder={totals.total.toString()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Right: Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">جمع جزء:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(totals.subtotal)}
                  </span>
                </div>

                {totals.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">مالیات:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(totals.tax)}
                    </span>
                  </div>
                )}

                {totals.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">تخفیف:</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      -{formatCurrency(totals.discount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-lg border-t border-gray-300 dark:border-gray-600 pt-3">
                  <span className="font-bold text-gray-900 dark:text-white">جمع کل:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {formatCurrency(totals.total)}
                  </span>
                </div>

                {paidAmount && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">پرداخت شده:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(parseFloat(paidAmount))}
                      </span>
                    </div>
                    {parseFloat(paidAmount) < totals.total && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">مانده:</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {formatCurrency(totals.total - parseFloat(paidAmount))}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              توضیحات
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="توضیحات اضافی..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>در حال ثبت...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>ثبت فروش</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}