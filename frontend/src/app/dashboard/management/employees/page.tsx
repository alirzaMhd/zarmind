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
  Users,
  UserCheck,
  UserX,
  Clock,
  DollarSign,
  TrendingUp,
  Eye,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Briefcase,
} from 'lucide-react';

type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED' | 'RESIGNED';
type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY';
type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE' | 'HOLIDAY' | 'SICK';

interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  nationalId?: string | null;
  position: string;
  department?: string | null;
  employmentType: EmploymentType;
  hireDate: string;
  terminationDate?: string | null;
  status: EmploymentStatus;
  branchId?: string | null;
  branch?: {
    id: string;
    code: string;
    name: string;
  };
  baseSalary?: number | null;
  commissionRate?: number | null;
  address?: string | null;
  city?: string | null;
  birthDate?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Summary {
  totalEmployees: number;
  byStatus: Array<{ status: EmploymentStatus; count: number }>;
  byDepartment: Array<{ department: string; count: number }>;
  byEmploymentType: Array<{ type: EmploymentType; count: number }>;
}

type Message = { type: 'success' | 'error'; text: string } | null;

export default function EmployeesPage() {
  // Data
  const [rows, setRows] = useState<Employee[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [branches, setBranches] = useState<any[]>([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<Message>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<EmploymentStatus | ''>('');
  const [department, setDepartment] = useState<string>('');
  const [branchId, setBranchId] = useState<string>('');
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'hireDate' | 'firstName' | 'employeeCode'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'info' | 'attendance' | 'payroll' | 'performance'>('info');

  // Selection
  const [selected, setSelected] = useState<Employee | null>(null);

  // Details data
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [performanceRecords, setPerformanceRecords] = useState<any[]>([]);

  // Form
  const [formData, setFormData] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    nationalId: '',
    position: '',
    department: '',
    employmentType: 'FULL_TIME' as EmploymentType,
    hireDate: new Date().toISOString().split('T')[0],
    terminationDate: '',
    status: 'ACTIVE' as EmploymentStatus,
    branchId: '',
    baseSalary: '',
    commissionRate: '',
    address: '',
    city: '',
    birthDate: '',
    emergencyContact: '',
    emergencyPhone: '',
    notes: '',
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  useEffect(() => {
    fetchBranches();
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, department, branchId, employmentType, sortBy, sortOrder]);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches', { params: { limit: 100 } });
      setBranches(res.data.items || []);
    } catch (e) {
      console.error('Failed to fetch branches', e);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get('/employees/summary');
      setSummary(res.data);
    } catch (e) {
      console.error('Failed to fetch employees summary', e);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
        sortBy,
        sortOrder,
      };
      if (status) params.status = status;
      if (department) params.department = department;
      if (branchId) params.branchId = branchId;
      if (employmentType) params.employmentType = employmentType;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get('/employees', { params });
      setRows(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error('Failed to fetch employees', e);
      showMessage('error', 'خطا در بارگذاری کارمندان');
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
      employeeCode: '',
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      nationalId: '',
      position: '',
      department: '',
      employmentType: 'FULL_TIME',
      hireDate: new Date().toISOString().split('T')[0],
      terminationDate: '',
      status: 'ACTIVE',
      branchId: '',
      baseSalary: '',
      commissionRate: '',
      address: '',
      city: '',
      birthDate: '',
      emergencyContact: '',
      emergencyPhone: '',
      notes: '',
    });
  };

  const openAddModal = () => {
    resetForm();
    setSelected(null);
    setShowAddModal(true);
  };

  const openEditModal = (e: Employee) => {
    setSelected(e);
    setFormData({
      employeeCode: e.employeeCode || '',
      firstName: e.firstName || '',
      lastName: e.lastName || '',
      phone: e.phone || '',
      email: e.email || '',
      nationalId: e.nationalId || '',
      position: e.position || '',
      department: e.department || '',
      employmentType: e.employmentType || 'FULL_TIME',
      hireDate: e.hireDate ? new Date(e.hireDate).toISOString().split('T')[0] : '',
      terminationDate: e.terminationDate ? new Date(e.terminationDate).toISOString().split('T')[0] : '',
      status: e.status || 'ACTIVE',
      branchId: e.branchId || '',
      baseSalary: e.baseSalary != null ? String(e.baseSalary) : '',
      commissionRate: e.commissionRate != null ? String(e.commissionRate) : '',
      address: e.address || '',
      city: e.city || '',
      birthDate: e.birthDate ? new Date(e.birthDate).toISOString().split('T')[0] : '',
      emergencyContact: e.emergencyContact || '',
      emergencyPhone: e.emergencyPhone || '',
      notes: e.notes || '',
    });
    setShowEditModal(true);
  };

  const openDetailsModal = async (e: Employee) => {
    try {
      setSelected(null);
      setShowDetailsModal(true);
      setDetailsTab('info');
      
      const res = await api.get(`/employees/${e.id}`);
      setSelected(res.data);
      
      // Fetch related data
      fetchAttendance(e.id);
      fetchPayroll(e.id);
      fetchPerformance(e.id);
    } catch (err) {
      console.error(err);
      showMessage('error', 'خطا در بارگذاری جزئیات کارمند');
      setShowDetailsModal(false);
    }
  };

  const fetchAttendance = async (employeeId: string) => {
    try {
      const res = await api.get('/employees/attendance', {
        params: { employeeId, limit: 10 }
      });
      setAttendanceRecords(res.data.items || []);
    } catch (e) {
      console.error('Failed to fetch attendance', e);
    }
  };

  const fetchPayroll = async (employeeId: string) => {
    try {
      const res = await api.get('/employees/payroll', {
        params: { employeeId, limit: 10 }
      });
      setPayrollRecords(res.data.items || []);
    } catch (e) {
      console.error('Failed to fetch payroll', e);
    }
  };

  const fetchPerformance = async (employeeId: string) => {
    try {
      const res = await api.get('/employees/performance', {
        params: { employeeId, limit: 10 }
      });
      setPerformanceRecords(res.data.items || []);
    } catch (e) {
      console.error('Failed to fetch performance', e);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        employeeCode: formData.employeeCode || undefined,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email || undefined,
        nationalId: formData.nationalId || undefined,
        position: formData.position,
        department: formData.department || undefined,
        employmentType: formData.employmentType,
        hireDate: formData.hireDate,
        terminationDate: formData.terminationDate || undefined,
        status: formData.status,
        branchId: formData.branchId || undefined,
        baseSalary: formData.baseSalary ? parseFloat(formData.baseSalary) : undefined,
        commissionRate: formData.commissionRate ? parseFloat(formData.commissionRate) : undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        birthDate: formData.birthDate || undefined,
        emergencyContact: formData.emergencyContact || undefined,
        emergencyPhone: formData.emergencyPhone || undefined,
        notes: formData.notes || undefined,
      };

      await api.post('/employees', payload);
      showMessage('success', 'کارمند با موفقیت اضافه شد');
      setShowAddModal(false);
      resetForm();
      setPage(1);
      fetchEmployees();
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در افزودن کارمند');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    try {
      const payload: any = {
        employeeCode: formData.employeeCode || undefined,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        nationalId: formData.nationalId || undefined,
        position: formData.position || undefined,
        department: formData.department || undefined,
        employmentType: formData.employmentType || undefined,
        hireDate: formData.hireDate || undefined,
        terminationDate: formData.terminationDate || undefined,
        status: formData.status || undefined,
        branchId: formData.branchId || undefined,
        baseSalary: formData.baseSalary ? parseFloat(formData.baseSalary) : undefined,
        commissionRate: formData.commissionRate ? parseFloat(formData.commissionRate) : undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        birthDate: formData.birthDate || undefined,
        emergencyContact: formData.emergencyContact || undefined,
        emergencyPhone: formData.emergencyPhone || undefined,
        notes: formData.notes || undefined,
      };

      await api.patch(`/employees/${selected.id}`, payload);
      showMessage('success', 'کارمند با موفقیت ویرایش شد');
      setShowEditModal(false);
      setSelected(null);
      resetForm();
      fetchEmployees();
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در ویرایش کارمند');
    }
  };

  const handleChangeStatus = async (e: Employee, newStatus: EmploymentStatus) => {
    try {
      await api.patch(`/employees/${e.id}`, { status: newStatus });
      showMessage('success', 'وضعیت کارمند به‌روزرسانی شد');
      fetchEmployees();
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در تغییر وضعیت کارمند');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این کارمند اطمینان دارید؟')) return;

    try {
      await api.delete(`/employees/${id}`);
      showMessage('success', 'کارمند حذف شد');
      if (rows.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchEmployees();
      }
      fetchSummary();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'خطا در حذف کارمند');
    }
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchEmployees();
    }
  };

  const onSearchClick = () => {
    setPage(1);
    fetchEmployees();
  };

  const formatCurrency = (amount: number) => `${new Intl.NumberFormat('fa-IR').format(amount)} ریال`;

  const getStatusBadge = (s: EmploymentStatus) => {
    switch (s) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'ON_LEAVE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'SUSPENDED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'TERMINATED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'RESIGNED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (s: EmploymentStatus) => {
    switch (s) {
      case 'ACTIVE': return 'فعال';
      case 'ON_LEAVE': return 'مرخصی';
      case 'SUSPENDED': return 'تعلیق';
      case 'TERMINATED': return 'اخراج';
      case 'RESIGNED': return 'استعفا';
      default: return s;
    }
  };

  const getEmploymentTypeLabel = (t: EmploymentType) => {
    switch (t) {
      case 'FULL_TIME': return 'تمام وقت';
      case 'PART_TIME': return 'پاره وقت';
      case 'CONTRACT': return 'قراردادی';
      case 'TEMPORARY': return 'موقت';
      default: return t;
    }
  };

  const getAttendanceStatusBadge = (s: AttendanceStatus) => {
    switch (s) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'ABSENT':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'LATE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'HALF_DAY':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'LEAVE':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'HOLIDAY':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'SICK':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const activeCount = summary?.byStatus?.find((s) => s.status === 'ACTIVE')?.count ?? 0;
  const onLeaveCount = summary?.byStatus?.find((s) => s.status === 'ON_LEAVE')?.count ?? 0;
  const suspendedCount = summary?.byStatus?.find((s) => s.status === 'SUSPENDED')?.count ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">مدیریت کارمندان</h1>
          <p className="text-gray-600 dark:text-gray-400">افزودن، ویرایش و مدیریت کارمندان</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">کل کارمندان</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {summary?.totalEmployees ?? 0}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
                <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">مرخصی</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  {onLeaveCount}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
                <UserX className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
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
                placeholder="جستجو بر اساس نام، کد کارمندی، تلفن..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={onSearchKeyDown}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as EmploymentStatus | '');
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">همه وضعیت‌ها</option>
                <option value="ACTIVE">فعال</option>
                <option value="ON_LEAVE">مرخصی</option>
                <option value="SUSPENDED">تعلیق</option>
                <option value="TERMINATED">اخراج</option>
                <option value="RESIGNED">استعفا</option>
              </select>

              <select
                value={employmentType}
                onChange={(e) => {
                  setEmploymentType(e.target.value as EmploymentType | '');
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">همه انواع اشتغال</option>
                <option value="FULL_TIME">تمام وقت</option>
                <option value="PART_TIME">پاره وقت</option>
                <option value="CONTRACT">قراردادی</option>
                <option value="TEMPORARY">موقت</option>
              </select>

              <select
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">همه شعبات</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setPage(1);
                }}
                placeholder="دپارتمان"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="createdAt">جدیدترین</option>
                <option value="hireDate">تاریخ استخدام</option>
                <option value="firstName">نام</option>
                <option value="employeeCode">کد کارمندی</option>
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
                  fetchEmployees();
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
                <span>افزودن کارمند</span>
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

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Users className="h-16 w-16 mb-4 opacity-50" />
              <p>هیچ کارمندی یافت نشد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">کارمند</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">تماس</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">سمت/دپارتمان</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">نوع اشتغال</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">وضعیت</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">عملیات</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {rows.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {e.firstName} {e.lastName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">کد: {e.employeeCode}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{e.phone}</span>
                        </div>
                        {e.email && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 mt-1">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="truncate max-w-[200px]">{e.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                          <Briefcase className="h-4 w-4 text-gray-400" />
                          <span>{e.position}</span>
                        </div>
                        {e.department && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {e.department}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {getEmploymentTypeLabel(e.employmentType)}
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          استخدام: {new Date(e.hireDate).toLocaleDateString('fa-IR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(e.status)}`}>
                          {getStatusLabel(e.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openDetailsModal(e)}
                            className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                            title="جزئیات"
                          >
                            <Eye className="h-5 w-5" />
                          </button>

                          <button
                            onClick={() => openEditModal(e)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="ویرایش"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>

                          {e.status !== 'ACTIVE' && (
                            <button
                              onClick={() => handleChangeStatus(e, 'ACTIVE')}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="فعال‌سازی"
                            >
                              <UserCheck className="h-5 w-5" />
                            </button>
                          )}

                          {e.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleChangeStatus(e, 'SUSPENDED')}
                              className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                              title="تعلیق"
                            >
                              <UserX className="h-5 w-5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(e.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="حذف"
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
            </div>
          )}
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">افزودن کارمند</h2>
                <button onClick={() => { setShowAddModal(false); resetForm(); }}>
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="p-6 space-y-4">
                {/* Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام خانوادگی *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">کد کارمندی</label>
                    <input
                      type="text"
                      value={formData.employeeCode}
                      onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="در صورت خالی سیستم تولید می‌کند"
                    />
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تلفن *</label>
                    <input
                      type="text"
                      required
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">کد ملی</label>
                    <input
                      type="text"
                      value={formData.nationalId}
                      onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                {/* Employment Details */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">سمت *</label>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">دپارتمان</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع اشتغال *</label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as EmploymentType })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="FULL_TIME">تمام وقت</option>
                      <option value="PART_TIME">پاره وقت</option>
                      <option value="CONTRACT">قراردادی</option>
                      <option value="TEMPORARY">موقت</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شعبه</label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">انتخاب کنید</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dates & Status */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ استخدام *</label>
                    <input
                      type="date"
                      required
                      value={formData.hireDate}
                      onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ تولد</label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وضعیت *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as EmploymentStatus })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="ACTIVE">فعال</option>
                      <option value="ON_LEAVE">مرخصی</option>
                      <option value="SUSPENDED">تعلیق</option>
                      <option value="TERMINATED">اخراج</option>
                      <option value="RESIGNED">استعفا</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ خاتمه</label>
                    <input
                      type="date"
                      value={formData.terminationDate}
                      onChange={(e) => setFormData({ ...formData, terminationDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                {/* Salary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">حقوق پایه (ریال)</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نرخ کمیسیون (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.commissionRate}
                      onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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

                {/* Emergency Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام تماس اضطراری</label>
                    <input
                      type="text"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تلفن تماس اضطراری</label>
                    <input
                      type="text"
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">یادداشت</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
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

        {/* Edit Modal - Same structure as Add Modal */}
        {showEditModal && selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">ویرایش کارمند</h2>
                <button onClick={() => { setShowEditModal(false); setSelected(null); resetForm(); }}>
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleEdit} className="p-6 space-y-4">
                {/* Reuse same form fields as Add Modal */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام خانوادگی *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">کد کارمندی</label>
                    <input
                      type="text"
                      value={formData.employeeCode}
                      onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تلفن *</label>
                    <input
                      type="text"
                      required
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">کد ملی</label>
                    <input
                      type="text"
                      value={formData.nationalId}
                      onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">سمت *</label>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">دپارتمان</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع اشتغال *</label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as EmploymentType })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="FULL_TIME">تمام وقت</option>
                      <option value="PART_TIME">پاره وقت</option>
                      <option value="CONTRACT">قراردادی</option>
                      <option value="TEMPORARY">موقت</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شعبه</label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">انتخاب کنید</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ استخدام *</label>
                    <input
                      type="date"
                      required
                      value={formData.hireDate}
                      onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ تولد</label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وضعیت *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as EmploymentStatus })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="ACTIVE">فعال</option>
                      <option value="ON_LEAVE">مرخصی</option>
                      <option value="SUSPENDED">تعلیق</option>
                      <option value="TERMINATED">اخراج</option>
                      <option value="RESIGNED">استعفا</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ خاتمه</label>
                    <input
                      type="date"
                      value={formData.terminationDate}
                      onChange={(e) => setFormData({ ...formData, terminationDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">حقوق پایه (ریال)</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نرخ کمیسیون (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.commissionRate}
                      onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام تماس اضطراری</label>
                    <input
                      type="text"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تلفن تماس اضطراری</label>
                    <input
                      type="text"
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">یادداشت</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
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

        {/* Details Modal */}
        {showDetailsModal && selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selected.firstName} {selected.lastName}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">کد: {selected.employeeCode}</p>
                </div>
                <button onClick={() => { setShowDetailsModal(false); setSelected(null); }}>
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-4 px-6">
                  <button
                    onClick={() => setDetailsTab('info')}
                    className={`py-3 px-4 border-b-2 font-medium text-sm ${
                      detailsTab === 'info'
                        ? 'border-amber-600 text-amber-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    اطلاعات
                  </button>
                  <button
                    onClick={() => setDetailsTab('attendance')}
                    className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      detailsTab === 'attendance'
                        ? 'border-amber-600 text-amber-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    حضور و غیاب
                  </button>
                  <button
                    onClick={() => setDetailsTab('payroll')}
                    className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      detailsTab === 'payroll'
                        ? 'border-amber-600 text-amber-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                    حقوق
                  </button>
                  <button
                    onClick={() => setDetailsTab('performance')}
                    className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      detailsTab === 'performance'
                        ? 'border-amber-600 text-amber-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    عملکرد
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {detailsTab === 'info' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">اطلاعات شخصی</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">نام و نام خانوادگی:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {selected.firstName} {selected.lastName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">کد ملی:</span>
                          <span className="text-gray-900 dark:text-white">{selected.nationalId || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">تاریخ تولد:</span>
                          <span className="text-gray-900 dark:text-white">
                            {selected.birthDate ? new Date(selected.birthDate).toLocaleDateString('fa-IR') : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">تلفن:</span>
                          <span className="text-gray-900 dark:text-white">{selected.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">ایمیل:</span>
                          <span className="text-gray-900 dark:text-white">{selected.email || '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">اطلاعات شغلی</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">سمت:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{selected.position}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">دپارتمان:</span>
                          <span className="text-gray-900 dark:text-white">{selected.department || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">نوع اشتغال:</span>
                          <span className="text-gray-900 dark:text-white">{getEmploymentTypeLabel(selected.employmentType)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">تاریخ استخدام:</span>
                          <span className="text-gray-900 dark:text-white">
                            {new Date(selected.hireDate).toLocaleDateString('fa-IR')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">وضعیت:</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusBadge(selected.status)}`}>
                            {getStatusLabel(selected.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">اطلاعات مالی</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">حقوق پایه:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {selected.baseSalary ? formatCurrency(selected.baseSalary) : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">نرخ کمیسیون:</span>
                          <span className="text-gray-900 dark:text-white">
                            {selected.commissionRate != null ? `${selected.commissionRate}%` : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">تماس اضطراری</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">نام:</span>
                          <span className="text-gray-900 dark:text-white">{selected.emergencyContact || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">تلفن:</span>
                          <span className="text-gray-900 dark:text-white">{selected.emergencyPhone || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {selected.notes && (
                      <div className="md:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">یادداشت</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {selected.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {detailsTab === 'attendance' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">سوابق حضور و غیاب</h3>
                    {attendanceRecords.length === 0 ? (
                      <p className="text-sm text-gray-500">موردی یافت نشد</p>
                    ) : (
                      <div className="space-y-3">
                        {attendanceRecords.map((a: any) => (
                          <div key={a.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {new Date(a.date).toLocaleDateString('fa-IR')}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs ${getAttendanceStatusBadge(a.status)}`}>
                                {a.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                              <div>ورود: {a.checkIn ? new Date(a.checkIn).toLocaleTimeString('fa-IR') : '-'}</div>
                              <div>خروج: {a.checkOut ? new Date(a.checkOut).toLocaleTimeString('fa-IR') : '-'}</div>
                              <div>ساعت کار: {a.hoursWorked || 0} ساعت</div>
                              <div>اضافه کاری: {a.overtime || 0} ساعت</div>
                            </div>
                            {a.notes && (
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {a.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {detailsTab === 'payroll' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">سوابق حقوق</h3>
                    {payrollRecords.length === 0 ? (
                      <p className="text-sm text-gray-500">موردی یافت نشد</p>
                    ) : (
                      <div className="space-y-3">
                        {payrollRecords.map((p: any) => (
                          <div key={p.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {new Date(p.payDate).toLocaleDateString('fa-IR')}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                p.paid
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}>
                                {p.paid ? 'پرداخت شده' : 'در انتظار'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                              <div>حقوق پایه: {formatCurrency(p.baseSalary || 0)}</div>
                              <div>کمیسیون: {formatCurrency(p.commission || 0)}</div>
                              <div>پاداش: {formatCurrency(p.bonus || 0)}</div>
                              <div>کسورات: {formatCurrency(p.totalDeductions || 0)}</div>
                              <div className="col-span-2 font-semibold text-amber-600 dark:text-amber-400">
                                خالص: {formatCurrency(p.netSalary || 0)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {detailsTab === 'performance' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">سوابق عملکرد</h3>
                    {performanceRecords.length === 0 ? (
                      <p className="text-sm text-gray-500">موردی یافت نشد</p>
                    ) : (
                      <div className="space-y-3">
                        {performanceRecords.map((p: any) => (
                          <div key={p.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                دوره: {p.reviewPeriod}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(p.reviewDate).toLocaleDateString('fa-IR')}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                              <div>کیفیت: {p.qualityScore || '-'}/10</div>
                              <div>دقت: {p.punctualityScore || '-'}/10</div>
                              <div>کار تیمی: {p.teamworkScore || '-'}/10</div>
                              <div>امتیاز کلی: {p.overallRating || '-'}/5</div>
                            </div>
                            {p.feedback && (
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-2">
                                <strong>بازخورد:</strong> {p.feedback}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
      </div>
    </div>
  );
}