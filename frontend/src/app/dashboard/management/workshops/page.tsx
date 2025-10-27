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
  Factory,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Ban,
  AlertTriangle,
  Star,
  Tags as TagsIcon,
  Eye,
  Calendar,
  Cog,
  TrendingUp,
  ClipboardList,
} from 'lucide-react';

type WorkshopStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
type WorkOrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'QUALITY_CHECK'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REJECTED';
type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface Workshop {
  id: string;
  code: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  status: WorkshopStatus;
  specialization: string[];
  rating?: number | null;
  paymentTerms?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  workOrders?: Array<WorkOrder>;
}

interface WorkOrder {
  id: string;
  orderNumber: string;
  productName: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  orderDate: string;
  expectedEndDate?: string | null;
  completedDate?: string | null;
  deliveredDate?: string | null;
  costEstimate?: number | null;
  actualCost?: number | null;
  qualityRating?: number | null;
}

interface Summary {
  totalWorkshops: number;
  byStatus: Array<{ status: WorkshopStatus; count: number }>;
  bySpecialization: Array<{ specialization: string; count: number }>;
  topWorkshops?: Array<{
    workshopId: string;
    code?: string;
    name?: string;
    rating?: number | null;
    orderCount: number;
    totalCost: number;
  }>;
}

type Message = { type: 'success' | 'error'; text: string } | null;

export default function WorkshopsPage() {
  // Data
  const [rows, setRows] = useState<Workshop[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  // UI State
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<Message>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<WorkshopStatus | ''>('');
  const [city, setCity] = useState<string>('');
  const [specialization, setSpecialization] = useState<string>('');
  const [minRating, setMinRating] = useState<string>('');
  const [maxRating, setMaxRating] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'name' | 'rating' | 'code'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);

  // Selection
  const [selected, setSelected] = useState<Workshop | null>(null);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);

  // Forms
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    status: 'ACTIVE' as WorkshopStatus,
    specialization: '' as string,
    rating: '',
    paymentTerms: '',
    notes: '',
  });

  const [ratingValue, setRatingValue] = useState<string>('');
  const [ratingNotes, setRatingNotes] = useState<string>('');

  // Work Order form
  const [workOrderForm, setWorkOrderForm] = useState({
    orderNumber: '',
    productName: '',
    description: '',
    quantity: '1',
    status: 'PENDING' as WorkOrderStatus,
    priority: 'MEDIUM' as WorkOrderPriority,
    orderDate: new Date().toISOString().split('T')[0],
    expectedEndDate: '',
    costEstimate: '',
    goldProvided: '',
    stonesProvided: '',
    images: '',
    notes: '',
  });

  // Work orders and performance in details modal
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [workOrdersLoading, setWorkOrdersLoading] = useState(false);
  const [woFilterStatus, setWoFilterStatus] = useState<WorkOrderStatus | ''>('');
  const [woFrom, setWoFrom] = useState<string>('');
  const [woTo, setWoTo] = useState<string>('');

  const [performance, setPerformance] = useState<any | null>(null);
  const [perfFrom, setPerfFrom] = useState<string>('');
  const [perfTo, setPerfTo] = useState<string>('');
  const [detailsTab, setDetailsTab] = useState<'info' | 'workOrders' | 'performance'>('info');

  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);
  const [performanceForm, setPerformanceForm] = useState({
    qualityRating: '',
    timelinessRating: '',
    costRating: '',
    communicationRating: '',
    notes: '',
    reviewDate: new Date().toISOString().split('T')[0],
  });

  const [editingPerformanceIndex, setEditingPerformanceIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchWorkshops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, city, specialization, minRating, maxRating, sortBy, sortOrder]);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/workshops/summary');
      setSummary(res.data);
    } catch (e) {
      console.error('Failed to fetch workshops summary', e);
    }
  };

  const fetchWorkshops = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
        sortBy,
        sortOrder,
      };
      if (status) params.status = status;
      if (city) params.city = city;
      if (specialization) params.specialization = specialization;
      if (minRating) params.minRating = minRating;
      if (maxRating) params.maxRating = maxRating;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get('/workshops', { params });
      setRows(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error('Failed to fetch workshops', e);
      showMessage('error', 'خطا در بارگذاری کارگاه‌ها');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkOrders = async () => {
    if (!selected) return;
    try {
      setWorkOrdersLoading(true);
      const params: any = {};
      if (woFilterStatus) params.status = woFilterStatus;
      if (woFrom) params.from = woFrom;
      if (woTo) params.to = woTo;

      const res = await api.get(`/workshops/${selected.id}/work-orders`, { params });
      setWorkOrders(res.data.workOrders || []);
    } catch (e) {
      console.error('Failed to fetch work orders', e);
      setWorkOrders([]);
    } finally {
      setWorkOrdersLoading(false);
    }
  };

  const fetchPerformance = async () => {
    if (!selected) return;
    try {
      const params: any = {};
      if (perfFrom) params.from = perfFrom;
      if (perfTo) params.to = perfTo;
      const res = await api.get(`/workshops/${selected.id}/performance`, { params });
      setPerformance(res.data);
    } catch (e) {
      console.error('Failed to fetch performance', e);
      setPerformance(null);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      status: 'ACTIVE',
      specialization: '',
      rating: '',
      paymentTerms: '',
      notes: '',
    });
  };

  const openAddModal = () => {
    resetForm();
    setSelected(null);
    setShowAddModal(true);
  };


  const openEditModal = (w: Workshop) => {
    setSelected(w);
    setFormData({
      code: w.code || '',
      name: w.name || '',
      contactPerson: w.contactPerson || '',
      phone: w.phone || '',
      email: w.email || '',
      address: w.address || '',
      city: w.city || '',
      status: w.status || 'ACTIVE',
      specialization: (w.specialization || []).join(','),
      rating: w.rating != null ? String(w.rating) : '',
      paymentTerms: w.paymentTerms || '',
      notes: w.notes || '',
    });
    setShowEditModal(true);
  };

  const openRatingModal = (w: Workshop) => {
    setSelected(w);
    setRatingValue(w.rating != null ? String(w.rating) : '');
    setRatingNotes('');
    setShowRatingModal(true);
  };

  const openDetailsModal = async (w: Workshop) => {
    try {
      setSelected(null);
      setShowDetailsModal(true);
      setDetailsTab('info');

      const res = await api.get(`/workshops/${w.id}`);
      setSelected(res.data);

      // Initialize defaults
      setWoFilterStatus('');
      setWoFrom('');
      setWoTo('');
      setPerfFrom('');
      setPerfTo('');

      // Load lists
      await fetchWorkOrders();
      await fetchPerformance();
      await fetchPerformanceHistory(); // ADD THIS LINE
    } catch (e) {
      console.error(e);
      showMessage('error', 'خطا در بارگذاری جزئیات کارگاه');
      setShowDetailsModal(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        code: formData.code || undefined,
        name: formData.name,
        contactPerson: formData.contactPerson || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        status: formData.status,
        specialization: formData.specialization
          ? formData.specialization.split(',').map((c) => c.trim()).filter(Boolean)
          : undefined,
        rating: formData.rating ? parseInt(formData.rating, 10) : undefined,
        paymentTerms: formData.paymentTerms || undefined,
        notes: formData.notes || undefined,
      };

      await api.post('/workshops', payload);
      showMessage('success', 'کارگاه با موفقیت اضافه شد');
      setShowAddModal(false);
      resetForm();
      setPage(1);
      fetchWorkshops();
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در افزودن کارگاه');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    try {
      const payload: any = {
        code: formData.code || undefined,
        name: formData.name || undefined,
        contactPerson: formData.contactPerson || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        status: formData.status || undefined,
        specialization: formData.specialization
          ? formData.specialization.split(',').map((c) => c.trim()).filter(Boolean)
          : undefined,
        rating: formData.rating ? parseInt(formData.rating, 10) : undefined,
        paymentTerms: formData.paymentTerms || undefined,
        notes: formData.notes || undefined,
      };

      await api.patch(`/workshops/${selected.id}`, payload);
      showMessage('success', 'کارگاه با موفقیت ویرایش شد');
      setShowEditModal(false);
      setSelected(null);
      resetForm();
      fetchWorkshops();
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در ویرایش کارگاه');
    }
  };

  const handleUpdateRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    const parsed = parseInt(ratingValue, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 5) {
      showMessage('error', 'امتیاز باید بین 1 و 5 باشد');
      return;
    }

    try {
      await api.patch(`/workshops/${selected.id}/rating`, { rating: parsed, notes: ratingNotes || undefined });
      showMessage('success', 'امتیاز کارگاه به‌روزرسانی شد');
      setShowRatingModal(false);
      setSelected(null);
      fetchWorkshops();
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در به‌روزرسانی امتیاز');
    }
  };

  const handleChangeStatus = async (w: Workshop, newStatus: WorkshopStatus) => {
    try {
      await api.patch(`/workshops/${w.id}`, { status: newStatus });
      showMessage('success', 'وضعیت کارگاه به‌روزرسانی شد');
      fetchWorkshops();
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در تغییر وضعیت کارگاه');
    }
  };

  const fetchPerformanceHistory = async () => {
    if (!selected) return;
    try {
      const res = await api.get(`/workshops/${selected.id}/performance-history`);
      setPerformanceHistory(res.data.reviews || []);
    } catch (e) {
      console.error('Failed to fetch performance history', e);
      setPerformanceHistory([]);
    }
  };

  const openPerformanceModal = () => {
    setEditingPerformanceIndex(null);
    setPerformanceForm({
      qualityRating: '',
      timelinessRating: '',
      costRating: '',
      communicationRating: '',
      notes: '',
      reviewDate: new Date().toISOString().split('T')[0],
    });
    setShowPerformanceModal(true);
  };

  const openEditPerformance = (review: any, index: number) => {
    setEditingPerformanceIndex(index);
    setPerformanceForm({
      qualityRating: review.qualityRating ? String(review.qualityRating) : '',
      timelinessRating: review.timelinessRating ? String(review.timelinessRating) : '',
      costRating: review.costRating ? String(review.costRating) : '',
      communicationRating: review.communicationRating ? String(review.communicationRating) : '',
      notes: review.notes || '',
      reviewDate: review.date ? new Date(review.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setShowPerformanceModal(true);
  };

  const handleDeletePerformance = async (index: number) => {
    if (!selected) return;
    if (!confirm('آیا از حذف این ارزیابی اطمینان دارید؟')) return;

    try {
      await api.delete(`/workshops/${selected.id}/performance/${index}`);

      // Immediately update local state
      setPerformanceHistory(prev => prev.filter((_, i) => i !== index));

      showMessage('success', 'ارزیابی حذف شد');

      // Refresh data in background
      fetchPerformanceHistory();
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در حذف ارزیابی');
    }
  };

  const handleAddPerformanceReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    try {
      const payload: any = {
        qualityRating: performanceForm.qualityRating ? parseInt(performanceForm.qualityRating, 10) : undefined,
        timelinessRating: performanceForm.timelinessRating ? parseInt(performanceForm.timelinessRating, 10) : undefined,
        costRating: performanceForm.costRating ? parseInt(performanceForm.costRating, 10) : undefined,
        communicationRating: performanceForm.communicationRating ? parseInt(performanceForm.communicationRating, 10) : undefined,
        notes: performanceForm.notes || undefined,
        reviewDate: performanceForm.reviewDate || undefined,
      };

      if (editingPerformanceIndex !== null) {
        // Update existing review
        await api.patch(`/workshops/${selected.id}/performance/${editingPerformanceIndex}`, payload);
        showMessage('success', 'ارزیابی عملکرد به‌روزرسانی شد');
      } else {
        // Add new review
        await api.post(`/workshops/${selected.id}/performance`, payload);
        showMessage('success', 'ارزیابی عملکرد ثبت شد');
      }

      setShowPerformanceModal(false);
      setEditingPerformanceIndex(null);
      await fetchPerformanceHistory();
      await fetchPerformance();
      await fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در ثبت ارزیابی عملکرد');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف/غیرفعال کردن این کارگاه اطمینان دارید؟')) return;

    try {
      await api.delete(`/workshops/${id}`); // Soft delete -> INACTIVE
      showMessage('success', 'کارگاه غیرفعال شد');
      if (rows.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchWorkshops();
      }
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در حذف کارگاه');
    }
  };

  const onSearchClick = () => {
    setPage(1);
    fetchWorkshops();
  };

  const formatCurrency = (amount: number) => `${new Intl.NumberFormat('fa-IR').format(amount)} ریال`;

  const getStatusBadge = (s: WorkshopStatus) => {
    switch (s) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'SUSPENDED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const activeCount = summary?.byStatus?.find((s) => s.status === 'ACTIVE')?.count ?? 0;
  const inactiveCount = summary?.byStatus?.find((s) => s.status === 'INACTIVE')?.count ?? 0;
  const suspendedCount = summary?.byStatus?.find((s) => s.status === 'SUSPENDED')?.count ?? 0;

  // Work Order handlers
  const openAddWorkOrder = () => {
    setEditingWorkOrder(null);
    setWorkOrderForm({
      orderNumber: '',
      productName: '',
      description: '',
      quantity: '1',
      status: 'PENDING',
      priority: 'MEDIUM',
      orderDate: new Date().toISOString().split('T')[0],
      expectedEndDate: '',
      costEstimate: '',
      goldProvided: '',
      stonesProvided: '',
      images: '',
      notes: '',
    });
    setShowWorkOrderModal(true);
  };

  const openEditWorkOrder = (wo: WorkOrder) => {
    setEditingWorkOrder(wo);
    setWorkOrderForm({
      orderNumber: wo.orderNumber || '',
      productName: wo.productName || '',
      description: '',
      quantity: '1',
      status: wo.status || 'PENDING',
      priority: wo.priority || 'MEDIUM',
      orderDate: wo.orderDate ? new Date(wo.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expectedEndDate: wo.expectedEndDate ? new Date(wo.expectedEndDate).toISOString().split('T')[0] : '',
      costEstimate: wo.costEstimate != null ? String(wo.costEstimate) : '',
      goldProvided: '',
      stonesProvided: '',
      images: '',
      notes: '',
    });
    setShowWorkOrderModal(true);
  };

  const handleSaveWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    try {
      const payload: any = {
        orderNumber: workOrderForm.orderNumber || undefined,
        workshopId: selected.id,
        productName: workOrderForm.productName,
        description: workOrderForm.description || undefined,
        quantity: workOrderForm.quantity ? parseInt(workOrderForm.quantity, 10) : 1,
        status: workOrderForm.status || undefined,
        priority: workOrderForm.priority || undefined,
        orderDate: workOrderForm.orderDate || undefined,
        expectedEndDate: workOrderForm.expectedEndDate || undefined,
        costEstimate: workOrderForm.costEstimate ? parseFloat(workOrderForm.costEstimate) : undefined,
        goldProvided: workOrderForm.goldProvided ? parseFloat(workOrderForm.goldProvided) : undefined,
        stonesProvided: workOrderForm.stonesProvided || undefined,
        images: workOrderForm.images
          ? workOrderForm.images
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)
          : undefined,
        notes: workOrderForm.notes || undefined,
      };

      if (editingWorkOrder) {
        await api.patch(`/workshops/work-orders/${editingWorkOrder.id}`, payload);
        showMessage('success', 'سفارش کار به‌روزرسانی شد');
      } else {
        await api.post('/workshops/work-orders', payload);
        showMessage('success', 'سفارش کار اضافه شد');
      }

      setShowWorkOrderModal(false);
      setEditingWorkOrder(null);
      await fetchWorkOrders();
      await fetchSummary();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        showMessage('error', 'خطا: ' + errorMessage.join(', '));
      } else {
        showMessage('error', errorMessage || 'خطا در ثبت سفارش کار');
      }
    }
  };

  const handleDeleteWorkOrder = async (id: string) => {
    if (!confirm('حذف این سفارش کار؟')) return;
    try {
      await api.delete(`/workshops/work-orders/${id}`);

      // Immediately update local state by filtering out the deleted item
      setWorkOrders(prev => prev.filter(wo => wo.id !== id));

      showMessage('success', 'سفارش کار حذف/لغو شد');

      // Then fetch fresh data in the background
      fetchWorkOrders();
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در حذف سفارش کار');
    }
  };

  const handleUpdateWorkOrderStatus = async (id: string, newStatus: WorkOrderStatus) => {
    try {
      await api.patch(`/workshops/work-orders/${id}/status`, { status: newStatus });
      showMessage('success', 'وضعیت سفارش کار به‌روزرسانی شد');
      await fetchWorkOrders();
      await fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در تغییر وضعیت سفارش کار');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">مدیریت کارگاه‌ها</h1>
          <p className="text-gray-600 dark:text-gray-400">افزودن، ویرایش و مدیریت کارگاه‌ها و سفارشات کار</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">کل کارگاه‌ها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {summary?.totalWorkshops ?? 0}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <Factory className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">فعال</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {activeCount}
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
                <p className="text-sm text-gray-600 dark:text-gray-400">غیرفعال</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {inactiveCount}
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
                <Ban className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">تعلیق</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                  {suspendedCount}
                </p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full md:w-auto md:min-w-[400px]">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 h-6 w-6" />
              <input
                type="text"
                placeholder="جستجو بر اساس کد، نام، تلفن، ایمیل یا مسئول..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearchClick()}
                className="w-full pr-12 pl-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as WorkshopStatus | '');
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">همه وضعیت‌ها</option>
                <option value="ACTIVE">فعال</option>
                <option value="INACTIVE">غیرفعال</option>
                <option value="SUSPENDED">تعلیق</option>
              </select>

              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setPage(1);
                }}
                placeholder="شهر"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />

              <select
                value={specialization}
                onChange={(e) => {
                  setSpecialization(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">همه تخصص‌ها</option>
                {summary?.bySpecialization?.map((c) => (
                  <option key={c.specialization} value={c.specialization}>
                    {c.specialization} ({c.count})
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={minRating}
                onChange={(e) => {
                  setMinRating(e.target.value);
                  setPage(1);
                }}
                placeholder="حداقل امتیاز"
                min={1}
                max={5}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />

              <input
                type="number"
                value={maxRating}
                onChange={(e) => {
                  setMaxRating(e.target.value);
                  setPage(1);
                }}
                placeholder="حداکثر امتیاز"
                min={1}
                max={5}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="createdAt">جدیدترین</option>
                <option value="updatedAt">آخرین ویرایش</option>
                <option value="name">نام</option>
                <option value="rating">امتیاز</option>
                <option value="code">کد</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="desc">نزولی</option>
                <option value="asc">صعودی</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={() => {
                  setPage(1);
                  fetchWorkshops();
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
                <span>افزودن کارگاه</span>
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

        {/* Top workshops (optional) */}
        {summary?.topWorkshops && summary.topWorkshops.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">برترین کارگاه‌ها (براساس هزینه سفارشات)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {summary.topWorkshops.slice(0, 6).map((t) => (
                <div key={t.workshopId} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{t.name || 'نامشخص'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">کد: {t.code || '-'}</p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-4 w-4" />
                      <span className="text-sm">{t.rating ?? '-'}</span>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                    <p>تعداد سفارش: {t.orderCount}</p>
                    <p className="mt-1">مجموع هزینه: {formatCurrency(t.totalCost)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Factory className="h-16 w-16 mb-4 opacity-50" />
              <p>هیچ کارگاهی یافت نشد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">نام/کد</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">تماس</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">مکان/تخصص</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">امتیاز/شرایط</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">وضعیت</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">عملیات</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {rows.map((w) => (
                    <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{w.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">کد: {w.code}</div>
                      </td>
                      <td className="px-6 py-4">
                        {w.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="ltr:font-mono">{w.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 mt-1">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="truncate max-w-[200px]">{w.email || '-'}</span>
                        </div>
                        {w.contactPerson && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">مسئول: {w.contactPerson}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="truncate max-w-[200px]">{w.city || '-'}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(w.specialization || []).slice(0, 3).map((c, i) => (
                            <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                              {c}
                            </span>
                          ))}
                          {(w.specialization || []).length > 3 && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-50 text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                              +{(w.specialization || []).length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Star className={`h-4 w-4 ${w.rating ? 'text-amber-500' : 'text-gray-400'}`} />
                          <span className="text-sm text-gray-900 dark:text-white">{w.rating ?? '-'}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[240px]">
                          {w.paymentTerms || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(w.status)}`}>
                          {w.status === 'ACTIVE' ? 'فعال' : w.status === 'INACTIVE' ? 'غیرفعال' : 'تعلیق'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openDetailsModal(w)}
                            className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                            title="جزئیات"
                          >
                            <Eye className="h-5 w-5" />
                          </button>

                          <button
                            onClick={() => openRatingModal(w)}
                            className="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
                            title="امتیاز"
                          >
                            <Star className="h-5 w-5" />
                          </button>

                          <button
                            onClick={() => openEditModal(w)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="ویرایش"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>

                          {w.status !== 'ACTIVE' && (
                            <button
                              onClick={() => handleChangeStatus(w, 'ACTIVE')}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="فعال‌سازی"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                          )}
                          {w.status !== 'INACTIVE' && (
                            <button
                              onClick={() => handleChangeStatus(w, 'INACTIVE')}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                              title="غیرفعال"
                            >
                              <Ban className="h-5 w-5" />
                            </button>
                          )}
                          {w.status !== 'SUSPENDED' && (
                            <button
                              onClick={() => handleChangeStatus(w, 'SUSPENDED')}
                              className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                              title="تعلیق"
                            >
                              <AlertTriangle className="h-5 w-5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(w.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="حذف (غیرفعال)"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${page <= 1
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
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${page >= totalPages
                    ? 'text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                    : 'text-gray-700 border-gray-200 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
                    }`}
                >
                  بعدی
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">افزودن کارگاه</h2>
                <button onClick={() => { setShowAddModal(false); resetForm(); }}>
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="p-6 space-y-4">
                {/* Identity */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="مثلاً: زرگری برلیان"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">کد</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="در صورت خالی سیستم تولید می‌کند"
                    />
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام مسئول</label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تلفن</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="مثلاً: 021-xxxxxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ایمیل</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">آدرس</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="آدرس کامل"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شهر</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تخصص‌ها (با کاما جدا شود)</label>
                    <div className="flex items-center gap-2">
                      <TagsIcon className="h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="طلاسازی، مخراج‌کاری، قلم‌زنی، ..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">امتیاز (1-5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شرایط پرداخت</label>
                    <input
                      type="text"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="NET 30, COD, ..."
                    />
                  </div>
                </div>

                {/* Notes & Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">یادداشت</label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="یادداشت‌های مربوط به کارگاه..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وضعیت *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as WorkshopStatus })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="ACTIVE">فعال</option>
                      <option value="INACTIVE">غیرفعال</option>
                      <option value="SUSPENDED">تعلیق</option>
                    </select>
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
        {showEditModal && selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">ویرایش کارگاه</h2>
                <button onClick={() => { setShowEditModal(false); setSelected(null); resetForm(); }}>
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleEdit} className="p-6 space-y-4">
                {/* Reuse fields as Add Modal */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">کد</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام مسئول</label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تلفن</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ایمیل</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">آدرس</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شهر</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تخصص‌ها (با کاما جدا شود)</label>
                    <div className="flex items-center gap-2">
                      <TagsIcon className="h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">امتیاز (1-5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شرایط پرداخت</label>
                    <input
                      type="text"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">یادداشت</label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وضعیت *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as WorkshopStatus })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="ACTIVE">فعال</option>
                      <option value="INACTIVE">غیرفعال</option>
                      <option value="SUSPENDED">تعلیق</option>
                    </select>
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
                    onClick={() => { setShowEditModal(false); setSelected(null); resetForm(); }}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-medium"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rating Modal */}
        {showRatingModal && selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  امتیازدهی: {selected.name}
                </h2>
                <button onClick={() => { setShowRatingModal(false); setSelected(null); }}>
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleUpdateRating} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    امتیاز (1-5) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={ratingValue}
                    onChange={(e) => setRatingValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="مثلاً: 4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    یادداشت
                  </label>
                  <textarea
                    rows={3}
                    value={ratingNotes}
                    onChange={(e) => setRatingNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="توضیح در مورد امتیاز..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    ذخیره
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowRatingModal(false); setSelected(null); }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selected.name}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">کد: {selected.code}</p>
                </div>
                <button onClick={() => { setShowDetailsModal(false); setSelected(null); }}>
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              {/* Tabs - horizontally scrollable only for tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  <div className="flex gap-2 md:gap-4 px-4 md:px-6 min-w-max">
                    <button
                      onClick={() => setDetailsTab('info')}
                      className={`py-3 px-3 md:px-4 border-b-2 font-medium text-sm whitespace-nowrap ${detailsTab === 'info'
                        ? 'border-amber-600 text-amber-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                    >
                      اطلاعات
                    </button>
                    <button
                      onClick={() => setDetailsTab('workOrders')}
                      className={`py-3 px-3 md:px-4 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${detailsTab === 'workOrders'
                        ? 'border-amber-600 text-amber-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                    >
                      <ClipboardList className="h-4 w-4 flex-shrink-0" />
                      سفارشات کار
                    </button>
                    <button
                      onClick={() => setDetailsTab('performance')}
                      className={`py-3 px-3 md:px-4 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${detailsTab === 'performance'
                        ? 'border-amber-600 text-amber-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                    >
                      <TrendingUp className="h-4 w-4 flex-shrink-0" />
                      عملکرد
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 gap-6">
                {/* Info Tab */}
                {detailsTab === 'info' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-4">
                      <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <Cog className="h-4 w-4" />
                        اطلاعات کارگاه
                      </h3>
                      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <p>نام: {selected.name}</p>
                        <p>کد: {selected.code}</p>
                        <p>وضعیت: <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusBadge(selected.status)}`}>{selected.status}</span></p>
                        <p>شهر: {selected.city || '-'}</p>
                        <p>آدرس: {selected.address || '-'}</p>
                        <p>مسئول: {selected.contactPerson || '-'}</p>
                        <p>تلفن: {selected.phone || '-'}</p>
                        <p>ایمیل: {selected.email || '-'}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-4">
                      <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        امتیاز و تخصص‌ها
                      </h3>
                      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                        <p className="flex items-center gap-1">
                          <Star className={`h-4 w-4 ${selected.rating ? 'text-amber-500' : 'text-gray-400'}`} />
                          امتیاز: {selected.rating ?? '-'}
                        </p>
                        <p>شرایط پرداخت: {selected.paymentTerms || '-'}</p>
                        <div className="flex flex-wrap gap-1">
                          {(selected.specialization || []).map((c, i) => (
                            <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {selected.notes && (
                      <div className="md:col-span-2 bg-gray-50 dark:bg-gray-700/40 rounded-lg p-4">
                        <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2">یادداشت</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {selected.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Work Orders Tab */}
                {detailsTab === 'workOrders' && (
                  <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        سفارشات کار
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={openAddWorkOrder}
                          className="px-3 py-1.5 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                        >
                          افزودن سفارش
                        </button>
                        <button
                          onClick={fetchWorkOrders}
                          className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200"
                          title="بروزرسانی"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
                      <select
                        value={woFilterStatus}
                        onChange={(e) => setWoFilterStatus(e.target.value as WorkOrderStatus | '')}
                        className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">همه وضعیت‌ها</option>
                        <option value="PENDING">در انتظار</option>
                        <option value="ACCEPTED">پذیرفته شده</option>
                        <option value="IN_PROGRESS">در حال انجام</option>
                        <option value="QUALITY_CHECK">کنترل کیفیت</option>
                        <option value="COMPLETED">تکمیل شده</option>
                        <option value="DELIVERED">تحویل شده</option>
                        <option value="CANCELLED">لغو شده</option>
                        <option value="REJECTED">رد شده</option>
                      </select>
                      <input
                        type="date"
                        value={woFrom}
                        onChange={(e) => setWoFrom(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      <input
                        type="date"
                        value={woTo}
                        onChange={(e) => setWoTo(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      <button
                        onClick={fetchWorkOrders}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        اعمال
                      </button>
                    </div>

                    {/* List */}
                    {workOrdersLoading ? (
                      <div className="py-10 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                      </div>
                    ) : workOrders.length === 0 ? (
                      <p className="text-sm text-gray-500">موردی یافت نشد</p>
                    ) : (
                      <div className="space-y-2">
                        {workOrders.map((wo) => (
                          <div
                            key={wo.id}
                            className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {wo.orderNumber} — {wo.productName}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                تاریخ: {wo.orderDate ? new Date(wo.orderDate).toLocaleDateString('fa-IR') : '-'}
                              </div>
                            </div>
                            <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600 dark:text-gray-300">
                              <div>وضعیت: {wo.status}</div>
                              <div>اولویت: {wo.priority}</div>
                              <div>پایان مورد انتظار: {wo.expectedEndDate ? new Date(wo.expectedEndDate).toLocaleDateString('fa-IR') : '-'}</div>
                              <div>هزینه: {wo.actualCost != null ? formatCurrency(wo.actualCost) : wo.costEstimate != null ? formatCurrency(wo.costEstimate) : '-'}</div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-3">
                              <button
                                onClick={() => openEditWorkOrder(wo)}
                                className="text-blue-600 hover:text-blue-800 text-xs"
                              >
                                ویرایش
                              </button>
                              <button
                                onClick={() => handleUpdateWorkOrderStatus(wo.id, 'IN_PROGRESS')}
                                className="text-amber-600 hover:text-amber-800 text-xs"
                              >
                                شروع
                              </button>
                              <button
                                onClick={() => handleUpdateWorkOrderStatus(wo.id, 'COMPLETED')}
                                className="text-green-600 hover:text-green-800 text-xs"
                              >
                                تکمیل
                              </button>
                              <button
                                onClick={() => handleUpdateWorkOrderStatus(wo.id, 'DELIVERED')}
                                className="text-purple-600 hover:text-purple-800 text-xs"
                              >
                                تحویل
                              </button>
                              <button
                                onClick={() => handleDeleteWorkOrder(wo.id)}
                                className="text-red-600 hover:text-red-900 text-xs"
                              >
                                حذف/لغو
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Performance Tab */}
                {detailsTab === 'performance' && (
                  <div className="space-y-4">
                    {/* Performance Statistics */}
                    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          آمار عملکرد
                        </h3>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={perfFrom}
                            onChange={(e) => setPerfFrom(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          <input
                            type="date"
                            value={perfTo}
                            onChange={(e) => setPerfTo(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          <button
                            onClick={fetchPerformance}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            اعمال
                          </button>
                        </div>
                      </div>

                      {!performance ? (
                        <p className="text-sm text-gray-500">اطلاعاتی موجود نیست</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                              <p>تعداد کل سفارشات: <span className="font-semibold">{performance.totalOrders}</span></p>
                              <p>تعداد تکمیل شده: <span className="font-semibold">{performance.completedOrders}</span></p>
                              <p>نرخ تکمیل: <span className="font-semibold">{performance.completionRate}%</span></p>
                            </div>
                          </div>
                          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                              <p>مجموع هزینه: <span className="font-semibold">{formatCurrency(performance.totalCost || 0)}</span></p>
                              <p>میانگین کیفیت: <span className="font-semibold">{performance.averageQualityRating ?? '-'}</span></p>
                              <p>امتیاز کارگاه: <span className="font-semibold">{performance.rating ?? '-'}</span></p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Performance Reviews */}
                    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          ارزیابی‌های عملکرد ({performanceHistory.length})
                        </h3>
                        <button
                          onClick={openPerformanceModal}
                          className="px-3 py-1.5 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          افزودن ارزیابی
                        </button>
                      </div>

                      {performanceHistory.length === 0 ? (
                        <p className="text-sm text-gray-500">هیچ ارزیابی ثبت نشده است</p>
                      ) : (
                        <div className="space-y-3">
                          {performanceHistory.map((review, idx) => (
                            <div
                              key={idx}
                              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(review.date).toLocaleDateString('fa-IR')}
                                </span>
                                <div className="flex items-center gap-3">
                                  {review.averageRating && (
                                    <div className="flex items-center gap-1">
                                      <Star className="h-4 w-4 text-amber-500" />
                                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {review.averageRating}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => openEditPerformance(review, idx)}
                                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                      title="ویرایش"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeletePerformance(idx)}
                                      className="text-red-600 hover:text-red-800 dark:text-red-400"
                                      title="حذف"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-700 dark:text-gray-300 mb-2">
                                {review.qualityRating && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-500">کیفیت:</span>
                                    <span className="font-semibold">{review.qualityRating}/5</span>
                                  </div>
                                )}
                                {review.timelinessRating && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-500">به‌موقع بودن:</span>
                                    <span className="font-semibold">{review.timelinessRating}/5</span>
                                  </div>
                                )}
                                {review.costRating && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-500">هزینه:</span>
                                    <span className="font-semibold">{review.costRating}/5</span>
                                  </div>
                                )}
                                {review.communicationRating && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-500">ارتباطات:</span>
                                    <span className="font-semibold">{review.communicationRating}/5</span>
                                  </div>
                                )}
                              </div>

                              {review.notes && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 p-2 bg-gray-50 dark:bg-gray-700/40 rounded">
                                  {review.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => { setShowDetailsModal(false); setSelected(null); }}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Work Order Modal */}
        {showWorkOrderModal && selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingWorkOrder ? 'ویرایش سفارش کار' : 'افزودن سفارش کار'}
                </h2>
                <button onClick={() => { setShowWorkOrderModal(false); setEditingWorkOrder(null); }}>
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSaveWorkOrder} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      شماره سفارش
                    </label>
                    <input
                      type="text"
                      value={workOrderForm.orderNumber}
                      onChange={(e) => setWorkOrderForm({ ...workOrderForm, orderNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="WO-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      نام محصول/کار *
                    </label>
                    <input
                      type="text"
                      required
                      value={workOrderForm.productName}
                      onChange={(e) => setWorkOrderForm({ ...workOrderForm, productName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="مثلاً: انگشتر طلا"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      تعداد *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={workOrderForm.quantity}
                      onChange={(e) => setWorkOrderForm({ ...workOrderForm, quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        وضعیت
                      </label>
                      <select
                        value={workOrderForm.status}
                        onChange={(e) => setWorkOrderForm({ ...workOrderForm, status: e.target.value as WorkOrderStatus })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="PENDING">در انتظار</option>
                        <option value="ACCEPTED">پذیرفته شده</option>
                        <option value="IN_PROGRESS">در حال انجام</option>
                        <option value="QUALITY_CHECK">کنترل کیفیت</option>
                        <option value="COMPLETED">تکمیل شده</option>
                        <option value="DELIVERED">تحویل شده</option>
                        <option value="CANCELLED">لغو شده</option>
                        <option value="REJECTED">رد شده</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        اولویت
                      </label>
                      <select
                        value={workOrderForm.priority}
                        onChange={(e) => setWorkOrderForm({ ...workOrderForm, priority: e.target.value as WorkOrderPriority })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="LOW">پایین</option>
                        <option value="MEDIUM">متوسط</option>
                        <option value="HIGH">بالا</option>
                        <option value="URGENT">فوری</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      تاریخ سفارش *
                    </label>
                    <input
                      type="date"
                      required
                      value={workOrderForm.orderDate}
                      onChange={(e) => setWorkOrderForm({ ...workOrderForm, orderDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      تاریخ پایان مورد انتظار
                    </label>
                    <input
                      type="date"
                      value={workOrderForm.expectedEndDate}
                      onChange={(e) => setWorkOrderForm({ ...workOrderForm, expectedEndDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      برآورد هزینه
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={workOrderForm.costEstimate}
                      onChange={(e) => setWorkOrderForm({ ...workOrderForm, costEstimate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      طلای تحویلی (گرم)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={workOrderForm.goldProvided}
                      onChange={(e) => setWorkOrderForm({ ...workOrderForm, goldProvided: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="0"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      سنگ‌های تحویلی
                    </label>
                    <input
                      type="text"
                      value={workOrderForm.stonesProvided}
                      onChange={(e) => setWorkOrderForm({ ...workOrderForm, stonesProvided: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="توضید مختصر"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      تصاویر (با کاما جدا شود)
                    </label>
                    <input
                      type="text"
                      value={workOrderForm.images}
                      onChange={(e) => setWorkOrderForm({ ...workOrderForm, images: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="https://..., https://..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      توضیحات
                    </label>
                    <textarea
                      rows={3}
                      value={workOrderForm.description}
                      onChange={(e) => setWorkOrderForm({ ...workOrderForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="توضیحات سفارش..."
                    />
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
                    onClick={() => { setShowWorkOrderModal(false); setEditingWorkOrder(null); }}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-medium"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Performance Review Modal */}
        {showPerformanceModal && selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingPerformanceIndex !== null ? 'ویرایش ارزیابی عملکرد' : 'ارزیابی عملکرد'}: {selected.name}
                </h2>
                <button
                  onClick={() => {
                    setShowPerformanceModal(false);
                    setEditingPerformanceIndex(null);
                  }}
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleAddPerformanceReview} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        امتیاز کیفیت (1-5)
                      </div>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={performanceForm.qualityRating}
                      onChange={(e) => setPerformanceForm({ ...performanceForm, qualityRating: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="1-5"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      کیفیت محصولات و خدمات ارائه شده
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        امتیاز به‌موقع بودن (1-5)
                      </div>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={performanceForm.timelinessRating}
                      onChange={(e) => setPerformanceForm({ ...performanceForm, timelinessRating: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="1-5"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      رعایت زمان‌بندی و تحویل به موقع
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        امتیاز هزینه (1-5)
                      </div>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={performanceForm.costRating}
                      onChange={(e) => setPerformanceForm({ ...performanceForm, costRating: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="1-5"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      تناسب هزینه با کیفیت و بازار
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-purple-500" />
                        امتیاز ارتباطات (1-5)
                      </div>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={performanceForm.communicationRating}
                      onChange={(e) => setPerformanceForm({ ...performanceForm, communicationRating: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="1-5"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      پاسخگویی و همکاری مناسب
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تاریخ ارزیابی *
                  </label>
                  <input
                    type="date"
                    required
                    value={performanceForm.reviewDate}
                    onChange={(e) => setPerformanceForm({ ...performanceForm, reviewDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    یادداشت ارزیابی
                  </label>
                  <textarea
                    rows={4}
                    value={performanceForm.notes}
                    onChange={(e) => setPerformanceForm({ ...performanceForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="توضیحات تکمیلی در مورد عملکرد کارگاه، نقاط قوت، نقاط ضعف و پیشنهادات..."
                  />
                </div>

                {/* Rating Preview */}
                {(performanceForm.qualityRating ||
                  performanceForm.timelinessRating ||
                  performanceForm.costRating ||
                  performanceForm.communicationRating) && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-5 w-5 text-amber-500" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          پیش‌نمایش میانگین امتیاز
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const ratings = [
                            performanceForm.qualityRating,
                            performanceForm.timelinessRating,
                            performanceForm.costRating,
                            performanceForm.communicationRating,
                          ].filter(r => r && r !== '').map(r => parseFloat(r as string));

                          const avg = ratings.length > 0
                            ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
                            : '0';

                          return (
                            <>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star
                                    key={star}
                                    className={`h-5 w-5 ${star <= parseFloat(avg)
                                        ? 'text-amber-500 fill-amber-500'
                                        : 'text-gray-300 dark:text-gray-600'
                                      }`}
                                  />
                                ))}
                              </div>
                              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {avg}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                از 5 (بر اساس {ratings.length} معیار)
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                <div className="flex gap-4 pt-2">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium transition-colors"
                  >
                    <Save className="h-5 w-5" />
                    {editingPerformanceIndex !== null ? 'به‌روزرسانی ارزیابی' : 'ثبت ارزیابی'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPerformanceModal(false);
                      setEditingPerformanceIndex(null);
                    }}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
                  >
                    انصراف
                  </button>
                </div>

                {editingPerformanceIndex !== null && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPerformanceModal(false);
                        setEditingPerformanceIndex(null);
                        handleDeletePerformance(editingPerformanceIndex);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                    >
                      <Trash2 className="h-5 w-5" />
                      حذف این ارزیابی
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}