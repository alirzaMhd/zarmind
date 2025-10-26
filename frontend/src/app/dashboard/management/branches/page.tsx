'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Save,
  AlertCircle,
  Building2,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Ban,
  Star,
} from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
  isMainBranch: boolean;
  _count?: {
    users: number;
    employees: number;
    inventory: number;
    sales: number;
    purchases: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Summary {
  total: number;
  active: number;
  inactive: number;
  mainBranch: Branch | null;
  byCity: Array<{ city: string; count: number }>;
}

type Message = { type: 'success' | 'error'; text: string } | null;

export default function BranchesPage() {
  // Data
  const [branches, setBranches] = useState<Branch[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  // UI State
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<Message>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Selection
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    isActive: true,
    isMainBranch: false,
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, selectedCity, showActiveOnly]);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/branches/summary');
      setSummary(res.data);
    } catch (e) {
      // Silent for summary, not critical
      console.error('Failed to fetch branches summary', e);
    }
  };

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
        sortBy: 'name',
        sortOrder: 'asc',
      };
      if (selectedCity) params.city = selectedCity;
      if (showActiveOnly) params.isActive = 'true';
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get('/branches', { params });
      setBranches(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error('Failed to fetch branches', e);
      showMessage('error', 'خطا در بارگذاری شعب');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      city: '',
      phone: '',
      email: '',
      isActive: true,
      isMainBranch: false,
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name || '',
      code: branch.code || '',
      address: branch.address || '',
      city: branch.city || '',
      phone: branch.phone || '',
      email: branch.email || '',
      isActive: branch.isActive,
      isMainBranch: branch.isMainBranch,
    });
    setShowEditModal(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/branches', {
        name: formData.name,
        code: formData.code,
        address: formData.address || undefined,
        city: formData.city || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        isActive: formData.isActive,
        isMainBranch: formData.isMainBranch,
      });
      showMessage('success', 'شعبه با موفقیت اضافه شد');
      setShowAddModal(false);
      resetForm();
      fetchBranches();
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در افزودن شعبه');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;
    try {
      await api.patch(`/branches/${selectedBranch.id}`, {
        name: formData.name,
        code: formData.code,
        address: formData.address || undefined,
        city: formData.city || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        isActive: formData.isActive,
        isMainBranch: formData.isMainBranch,
      });
      showMessage('success', 'شعبه با موفقیت ویرایش شد');
      setShowEditModal(false);
      setSelectedBranch(null);
      resetForm();
      fetchBranches();
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در ویرایش شعبه');
    }
  };

  const handleToggleActive = async (branch: Branch) => {
    try {
      const endpoint = branch.isActive ? 'deactivate' : 'activate';
      await api.patch(`/branches/${branch.id}/${endpoint}`);
      showMessage('success', `شعبه با موفقیت ${branch.isActive ? 'غیرفعال' : 'فعال'} شد`);
      fetchBranches();
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در تغییر وضعیت شعبه');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این شعبه اطمینان دارید؟')) return;
    try {
      await api.delete(`/branches/${id}`);
      showMessage('success', 'شعبه با موفقیت حذف شد');
      // If current page becomes empty after deletion, go back one page if possible
      if (branches.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchBranches();
      }
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در حذف شعبه');
    }
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchBranches();
    }
  };

  const onSearchClick = () => {
    setPage(1);
    fetchBranches();
  };

  const citiesFromSummary = (summary?.byCity || []).map((c) => c.city);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">مدیریت شعب</h1>
          <p className="text-gray-600 dark:text-gray-400">مدیریت شعب و نمایندگی‌های فروشگاه</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">کل شعب</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {summary?.total ?? 0}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">شعب فعال</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {summary?.active ?? 0}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">شعب غیرفعال</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                  {summary?.inactive ?? 0}
                </p>
              </div>
              <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                <Ban className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">شعبه اصلی</p>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-2 truncate">
                  {summary?.mainBranch?.name || 'تعریف نشده'}
                </p>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-full">
                <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="جستجو بر اساس نام، کد یا آدرس..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={onSearchKeyDown}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">همه شهرها</option>
                {citiesFromSummary.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={(e) => {
                    setShowActiveOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm">فقط فعال</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={() => {
                  setPage(1);
                  fetchBranches();
                }}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <RefreshCw className="h-5 w-5" />
                <span className="hidden md:inline">بروزرسانی</span>
              </button>

              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2 text-white bg-amber-600 rounded-lg hover:bg-amber-700"
              >
                <Plus className="h-5 w-5" />
                <span>افزودن شعبه</span>
              </button>

              <button
                onClick={onSearchClick}
                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 md:hidden"
              >
                <Search className="h-5 w-5" />
                جستجو
              </button>
            </div>
          </div>
        </div>

        {/* Branches Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Building2 className="h-16 w-16 mb-4 opacity-50" />
            <p>هیچ شعبه‌ای یافت نشد</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {branches.map((b) => (
                <div key={b.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                          {b.name}
                        </h3>
                        {b.isMainBranch && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            اصلی
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            b.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {b.isActive ? 'فعال' : 'غیرفعال'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">کد: {b.code}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                    {b.address && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{b.address}</span>
                      </p>
                    )}
                    {(b.city || '').length > 0 && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{b.city}</span>
                      </p>
                    )}
                    {b.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{b.phone}</span>
                      </p>
                    )}
                    {b.email && (
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{b.email}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(b)}
                        className="px-3 py-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <span className="inline-flex items-center gap-1">
                          <Edit2 className="h-4 w-4" /> ویرایش
                        </span>
                      </button>
                      <button
                        onClick={() => handleToggleActive(b)}
                        className="px-3 py-1.5 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 text-sm font-medium rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      >
                        <span className="inline-flex items-center gap-1">
                          {b.isActive ? (
                            <>
                              <Ban className="h-4 w-4" /> غیرفعال
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" /> فعال
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="px-3 py-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Trash2 className="h-4 w-4" /> حذف
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                  page <= 1
                    ? 'text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                    : 'text-gray-700 border-gray-200 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
                }`}
              >
                قبلی
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                صفحه {page} از {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                  page >= totalPages
                    ? 'text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                    : 'text-gray-700 border-gray-200 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
                }`}
              >
                بعدی
              </button>
            </div>
          </>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">افزودن شعبه</h2>
                <button onClick={() => { setShowAddModal(false); resetForm(); }}>
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      نام شعبه *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="مثلاً: شعبه مرکزی"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      کد شعبه *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="مثلاً: MAIN-01"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      آدرس
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="آدرس کامل شعبه"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      شهر
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="مثلاً: تهران"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      تلفن
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="مثلاً: 021-12345678"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ایمیل
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      فعال
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">وضعیت شعبه</p>
                  </div>

                  <div className="md:col-span-1">
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={formData.isMainBranch}
                        onChange={(e) => setFormData({ ...formData, isMainBranch: e.target.checked })}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      تعیین به عنوان شعبه اصلی
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      در صورت انتخاب، سایر شعب اصلی به‌طور خودکار غیرفعال می‌شوند
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
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

        {/* Edit Modal */}
        {showEditModal && selectedBranch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">ویرایش شعبه</h2>
                <button onClick={() => { setShowEditModal(false); setSelectedBranch(null); resetForm(); }}>
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleEdit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      نام شعبه *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      کد شعبه *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      آدرس
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      شهر
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      تلفن
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ایمیل
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      فعال
                    </label>
                  </div>

                  <div className="md:col-span-1">
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={formData.isMainBranch}
                        onChange={(e) => setFormData({ ...formData, isMainBranch: e.target.checked })}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      شعبه اصلی
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      در صورت انتخاب، سایر شعب اصلی به‌طور خودکار غیرفعال می‌شوند
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                  >
                    <Save className="h-5 w-5" />
                    ذخیره تغییرات
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); setSelectedBranch(null); resetForm(); }}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-medium"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}