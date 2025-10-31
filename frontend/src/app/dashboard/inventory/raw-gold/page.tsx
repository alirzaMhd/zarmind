'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    RefreshCw,
    Weight,
    DollarSign,
    Package,
    X,
    Save,
    AlertCircle,
    TrendingUp,
    Sparkles,
    Upload,
    Camera,
    QrCode,
} from 'lucide-react';

interface RawGold {
    id: string;
    sku: string;
    name: string;
    goldPurity: 'K18' | 'K21' | 'K22' | 'K24';
    weight: number;
    purchasePrice: number;
    sellingPrice: number;
    status: string;
    quantity: number;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

interface Summary {
    totalWeight: number;
    totalPurchaseValue: number;
    totalSellingValue: number;
    totalItems: number;
    byPurity: Array<{
        goldPurity: string;
        count: number;
        totalWeight: number;
        purchaseValue: number;
        sellingValue: number;
    }>;
}

export default function RawGoldPage() {
    const [rawGold, setRawGold] = useState<RawGold[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [goldData, setGoldData] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPurity, setSelectedPurity] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<RawGold | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showScaleCapture, setShowScaleCapture] = useState(false);
    const [scaleImageUrl, setScaleImageUrl] = useState<string>('');
    const [qrModal, setQrModal] = useState<{ open: boolean; qrCode?: string; dataUrl?: string }>({ open: false });

    const ScaleCapturePanel = dynamic(() => import('@/components/ScaleCapturePanel'), { ssr: false });
    const searchParams = useSearchParams();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        goldPurity: 'K24' as 'K18' | 'K21' | 'K22' | 'K24',
        weight: '',
        purchasePrice: '',
        sellingPrice: '',
        quantity: '1',
        description: '',
        images: [] as string[],
    });

    useEffect(() => {
        fetchRawGold();
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

    const fetchRawGold = async () => {
        try {
            setLoading(true);
            const params: any = {
                limit: 100,
            };
            if (selectedStatus) {
                params.status = selectedStatus;
            }
            if (selectedPurity) params.goldPurity = selectedPurity;
            if (searchTerm) params.search = searchTerm;
            const response = await api.get('/inventory/raw-gold', { params });
            setRawGold(response.data.items || []);
        } catch (error: any) {
            console.error('Failed to fetch raw gold:', error);
            showMessage('error', 'خطا در بارگذاری اطلاعات');
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const response = await api.get('/inventory/raw-gold/summary');
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
        // Auto-calc prices when inputs change
        const weight = parseFloat(formData.weight || '0');
        const qty = Math.max(1, parseInt(formData.quantity || '1'));
        const perGram = pricePerGramFromApi(formData.goldPurity);
        if (perGram && weight > 0) {
            const base = Math.round(perGram * weight * qty);
            setFormData((prev) => ({ ...prev, purchasePrice: String(base), sellingPrice: String(base) }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.goldPurity, formData.weight, formData.quantity, goldData]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/inventory/raw-gold', {
                name: formData.name,
                goldPurity: formData.goldPurity,
                weight: parseFloat(formData.weight),
                purchasePrice: parseFloat(formData.purchasePrice),
                sellingPrice: parseFloat(formData.sellingPrice),
                quantity: parseInt(formData.quantity),
                description: formData.description || undefined,
            });

            showMessage('success', 'طلا خام با موفقیت اضافه شد');
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
            fetchRawGold();
            fetchSummary();
        } catch (error: any) {
            showMessage('error', error.response?.data?.message || 'خطا در افزودن طلا خام');
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;

        try {
            await api.patch(`/inventory/raw-gold/${selectedItem.id}`, {
                name: formData.name,
                goldPurity: formData.goldPurity,
                weight: parseFloat(formData.weight),
                purchasePrice: parseFloat(formData.purchasePrice),
                sellingPrice: parseFloat(formData.sellingPrice),
                quantity: parseInt(formData.quantity),
                description: formData.description || undefined,
            });

            showMessage('success', 'طلا خام با موفقیت ویرایش شد');
            setShowEditModal(false);
            setSelectedItem(null);
            resetForm();
            fetchRawGold();
            fetchSummary();
        } catch (error: any) {
            showMessage('error', error.response?.data?.message || 'خطا در ویرایش طلا خام');
        }
    };

    const handleDelete = async (id: string, status: string) => {
        const isReturned = status === 'RETURNED';
        const message = isReturned 
            ? 'آیا از حذف دائمی این طلا خام اطمینان دارید؟ این عمل قابل بازگشت نیست.'
            : 'آیا از حذف این طلا خام اطمینان دارید؟ وضعیت آن به "برگشت شده" تغییر خواهد کرد.';

        if (!confirm(message)) return;

        try {
            const response = await api.delete(`/inventory/raw-gold/${id}`);
            showMessage('success', response.data?.message || (isReturned ? 'طلا خام با موفقیت حذف شد' : 'طلا خام به وضعیت برگشت شده تغییر یافت'));
            fetchRawGold();
            fetchSummary();
        } catch (error: any) {
            showMessage('error', error.response?.data?.message || 'خطا در حذف طلا خام');
        }
    };

    const openEditModal = (item: RawGold) => {
        setSelectedItem(item);
        setFormData({
            name: item.name,
            goldPurity: item.goldPurity,
            weight: item.weight.toString(),
            purchasePrice: item.purchasePrice.toString(),
            sellingPrice: item.sellingPrice.toString(),
            quantity: item.quantity.toString(),
            description: item.description || '',
            images: [],
        });
        setShowEditModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            goldPurity: 'K24',
            weight: '',
            purchasePrice: '',
            sellingPrice: '',
            quantity: '1',
            description: '',
            images: [],
        });
    };

    const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
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

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
    };

    const formatWeight = (weight: number) => {
        return new Intl.NumberFormat('fa-IR', { minimumFractionDigits: 3 }).format(weight) + ' گرم';
    };

    const getPurityBadgeColor = (purity: string) => {
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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">مدیریت طلا خام</h1>
                    <p className="text-gray-600 dark:text-gray-400">مدیریت موجودی طلا خام به تفکیک عیار</p>
                </div>

                {/* Message */}
                {message && (
                    <div
                        className={`mb-6 p-4 rounded-lg flex items-center justify-between ${message.type === 'success'
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
                                <p className="text-sm text-gray-600 dark:text-gray-400">کل وزن</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                    {formatWeight(summary?.totalWeight || 0)}
                                </p>
                            </div>
                            <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-full">
                                <Weight className="h-6 w-6 text-amber-600 dark:text-amber-400" />
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
                                <p className="text-sm text-gray-600 dark:text-gray-400">تعداد کل</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                    {summary?.totalItems || 0}
                                </p>
                            </div>
                            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                                <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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
                                placeholder="جستجو بر اساس نام یا SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && fetchRawGold()}
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
                                <option value="DAMAGED">آسیب دیده</option>
                                <option value="RETURNED">برگشت شده</option>
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 w-full md:w-auto">
                            <button
                                onClick={fetchRawGold}
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
                                <span>افزودن طلا خام</span>
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
                    ) : rawGold.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <Package className="h-16 w-16 mb-4 opacity-50" />
                            <p>هیچ طلا خامی یافت نشد</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            SKU
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            نام
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            عیار
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            وزن
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            قیمت خرید
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            قیمت فروش
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            تعداد
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            عملیات
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {rawGold.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                {item.sku}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {item.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPurityBadgeColor(item.goldPurity)}`}>
                                                    {item.goldPurity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {formatWeight(item.weight)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {formatCurrency(item.purchasePrice)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {formatCurrency(item.sellingPrice)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-sm font-semibold rounded-full ${
                                                    item.quantity === 0
                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                        : item.quantity < 5
                                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                }`}>
                                                    {item.quantity} عدد
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const q = await api.get(`/utilities/qr-code/product/${item.id}`);
                                                                if (q?.data?.dataUrl) setQrModal({ open: true, qrCode: q.data.qrCode, dataUrl: q.data.dataUrl });
                                                            } catch {}
                                                        }}
                                                        className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                                                        title="QR"
                                                    >
                                                        <QrCode className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        <Edit2 className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id, item.status)}
                                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                        title={item.status === 'RETURNED' ? 'حذف دائمی' : 'حذف (تغییر به برگشت شده)'}
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
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">افزودن طلا خام</h2>
                            <button onClick={() => { setShowAddModal(false); resetForm(); }}>
                                <X className="h-6 w-6 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleAdd} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        نام *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        عیار *
                                    </label>
                                    <select
                                        value={formData.goldPurity}
                                        onChange={(e) => setFormData({ ...formData, goldPurity: e.target.value as any })}
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
                                        step="0.001"
                                        required
                                        value={formData.weight}
                                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        تعداد *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
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
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
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

            {/* Edit Modal - Same structure as Add Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">ویرایش طلا خام</h2>
                            <button onClick={() => { setShowEditModal(false); setSelectedItem(null); resetForm(); }}>
                                <X className="h-6 w-6 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleEdit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        نام *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        عیار *
                                    </label>
                                    <select
                                        value={formData.goldPurity}
                                        onChange={(e) => setFormData({ ...formData, goldPurity: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="K24">24 عیار</option>
                                        <option value="K22">22 عیار</option>
                                        <option value="K21">21 عیار</option>
                                        <option value="K18">18 عیار</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        وزن (گرم) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        required
                                        value={formData.weight}
                                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        تعداد *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
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
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                                >
                                    <Save className="h-5 w-5" />
                                    ذخیره تغییرات
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setSelectedItem(null); resetForm(); }}
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
                    itemId={'raw-gold-form'}
                    onClose={() => setShowScaleCapture(false)}
                    onCaptured={handleCaptured}
                />
            )}

            {/* QR Modal */}
            {qrModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کد QR طلا خام</h3>
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