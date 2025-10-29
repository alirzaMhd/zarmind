'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { 
  Save, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle,
  Globe,
  DollarSign,
  Clock,
  Languages,
  User,
  Mail,
  Phone,
  Lock,
  Camera,
  Eye,
  EyeOff,
} from 'lucide-react';

interface Setting {
  id: string;
  category: string;
  key: string;
  value: string;
  parsedValue: any;
  valueType: string;
  description: string | null;
  isPublic: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  status: string;
  branchId?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Persian labels for settings
const persianLabels: Record<string, string> = {
  // General settings
  'date_format': 'فرمت تاریخ',
  'time_format': 'فرمت زمان',
  'language': 'زبان پیش‌فرض',
  'timezone': 'منطقه زمانی',
};

// Persian descriptions
const persianDescriptions: Record<string, string> = {
  'date_format': 'نحوه نمایش تاریخ در سراسر سیستم',
  'time_format': 'نحوه نمایش ساعت (۱۲ یا ۲۴ ساعته)',
  'language': 'زبان پیش‌فرض رابط کاربری',
  'timezone': 'منطقه زمانی برای نمایش تاریخ و ساعت',
};

// Date format options
const dateFormatOptions = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (سال-ماه-روز)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (روز/ماه/سال)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (ماه/روز/سال)' },
  { value: 'JALALI', label: 'شمسی (۱۴۰۳/۰۸/۰۴)' },
];

// Time format options
const timeFormatOptions = [
  { value: '24h', label: '۲۴ ساعته (۱۴:۳۰)' },
  { value: '12h', label: '۱۲ ساعته (۲:۳۰ PM)' },
];

// Language options
const languageOptions = [
  { value: 'fa', label: 'فارسی (Persian)' },
  { value: 'en', label: 'انگلیسی (English)' },
];

// Timezone options
const timezoneOptions = [
  { value: 'Asia/Tehran', label: 'تهران (GMT+3:30)' },
  { value: 'Asia/Dubai', label: 'دبی (GMT+4)' },
  { value: 'Asia/Istanbul', label: 'استانبول (GMT+3)' },
  { value: 'Europe/London', label: 'لندن (GMT)' },
  { value: 'America/New_York', label: 'نیویورک (GMT-5)' },
  { value: 'Asia/Tokyo', label: 'توکیو (GMT+9)' },
];

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [changes, setChanges] = useState<Record<string, string>>({});
  
  // Profile editing states
  const [profileChanges, setProfileChanges] = useState<Partial<UserProfile>>({});
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchUserProfile();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings', {
        params: { category: 'GENERAL', includePrivate: 'true' },
      });
      setSettings(response.data);
    } catch (error: any) {
      console.error('Failed to fetch settings:', error);
      setMessage({ type: 'error', text: 'خطا در بارگذاری تنظیمات' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      setUserProfile(response.data);
    } catch (error: any) {
      console.error('Failed to fetch user profile:', error);
      setMessage({ type: 'error', text: 'خطا در بارگذاری اطلاعات پروفایل' });
    }
  };

  const handleChange = (key: string, value: string) => {
    setChanges((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (Object.keys(changes).length === 0) {
      setMessage({ type: 'error', text: 'هیچ تغییری ایجاد نشده است' });
      return;
    }

    try {
      setSaving(true);
      const updates = Object.entries(changes).map(([key, value]) => ({ key, value }));
      
      const response = await api.patch('/settings/bulk', updates);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'تنظیمات با موفقیت ذخیره شد' });
        setChanges({});
        fetchSettings();
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: 'خطا در ذخیره تنظیمات' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setChanges({});
    setMessage({ type: 'success', text: 'تغییرات لغو شد' });
    setTimeout(() => setMessage(null), 2000);
  };

  // Profile handlers
  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    setProfileChanges((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: keyof PasswordChangeData, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleProfileSave = async () => {
    if (Object.keys(profileChanges).length === 0) {
      setMessage({ type: 'error', text: 'هیچ تغییری در پروفایل ایجاد نشده است' });
      return;
    }

    try {
      setSaving(true);
      const response = await api.patch('/users/profile', profileChanges);
      
      if (response.data) {
        setMessage({ type: 'success', text: 'پروفایل با موفقیت به‌روزرسانی شد' });
        setProfileChanges({});
        fetchUserProfile();
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      setMessage({ type: 'error', text: 'خطا در به‌روزرسانی پروفایل' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'رمز عبور جدید و تأیید آن مطابقت ندارند' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد' });
      return;
    }

    try {
      setSaving(true);
      const response = await api.post('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'رمز عبور با موفقیت تغییر کرد' });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error: any) {
      console.error('Failed to change password:', error);
      setMessage({ type: 'error', text: 'خطا در تغییر رمز عبور' });
    } finally {
      setSaving(false);
    }
  };

  const handleProfileReset = () => {
    setProfileChanges({});
    setMessage({ type: 'success', text: 'تغییرات پروفایل لغو شد' });
    setTimeout(() => setMessage(null), 2000);
  };

  const handlePasswordReset = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setMessage({ type: 'success', text: 'تغییرات رمز عبور لغو شد' });
    setTimeout(() => setMessage(null), 2000);
  };

  const getValue = (setting: Setting) => {
    return changes[setting.key] ?? setting.value;
  };

  const getLabel = (setting: Setting) => {
    return persianLabels[setting.key] || setting.description || setting.key;
  };

  const getDescription = (setting: Setting) => {
    return persianDescriptions[setting.key] || setting.description;
  };

  const getProfileValue = (field: keyof UserProfile) => {
    return profileChanges[field] ?? userProfile?.[field] ?? '';
  };

  const hasProfileChanges = Object.keys(profileChanges).length > 0;
  const hasPasswordChanges = passwordData.currentPassword || passwordData.newPassword || passwordData.confirmPassword;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">در حال بارگذاری تنظیمات...</p>
        </div>
      </div>
    );
  }

  const settingsByGroup = {
    display: settings.filter(s => ['date_format', 'time_format', 'language', 'timezone'].includes(s.key)),
    other: settings.filter(s => !['date_format', 'time_format', 'language', 'timezone'].includes(s.key)),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">تنظیمات عمومی</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            مدیریت پروفایل کاربری، تغییر رمز عبور و پیکربندی تنظیمات کلی سیستم
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <p>{message.text}</p>
          </div>
        )}

        {/* Profile Information Section */}
        {userProfile && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="h-5 w-5 text-amber-500" />
                اطلاعات پروفایل
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Profile Image */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {profileImagePreview ? (
                      <img
                        src={profileImagePreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 bg-amber-600 text-white rounded-full p-1.5 cursor-pointer hover:bg-amber-700 transition-colors">
                    <Camera className="h-3 w-3" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {getProfileValue('firstName')} {getProfileValue('lastName')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getProfileValue('email')}
                  </p>
                </div>
              </div>

              {/* Profile Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    نام
                  </label>
                  <input
                    type="text"
                    value={getProfileValue('firstName')}
                    onChange={(e) => handleProfileChange('firstName', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    نام خانوادگی
                  </label>
                  <input
                    type="text"
                    value={getProfileValue('lastName')}
                    onChange={(e) => handleProfileChange('lastName', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    ایمیل
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={getProfileValue('email')}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    نام کاربری
                  </label>
                  <input
                    type="text"
                    value={getProfileValue('username')}
                    onChange={(e) => handleProfileChange('username', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    شماره تلفن
                  </label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      value={getProfileValue('phone')}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    نقش
                  </label>
                  <input
                    type="text"
                    value={userProfile.role}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Profile Action Buttons */}
              {hasProfileChanges && (
                <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleProfileSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات پروفایل'}
                  </button>
                  
                  <button
                    onClick={handleProfileReset}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-medium"
                  >
                    <RotateCcw className="h-4 w-4" />
                    لغو تغییرات
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Password Change Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              تغییر رمز عبور
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  رمز عبور فعلی
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  رمز عبور جدید
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  تأیید رمز عبور جدید
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                الزامات رمز عبور:
              </h4>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• حداقل ۸ کاراکتر</li>
                <li>• شامل حداقل یک حرف بزرگ</li>
                <li>• شامل حداقل یک حرف کوچک</li>
                <li>• شامل حداقل یک عدد</li>
              </ul>
            </div>

            {/* Password Action Buttons */}
            {hasPasswordChanges && (
              <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handlePasswordSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'در حال ذخیره...' : 'تغییر رمز عبور'}
                </button>
                
                <button
                  onClick={handlePasswordReset}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-medium"
                >
                  <RotateCcw className="h-4 w-4" />
                  لغو تغییرات
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Display Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-amber-500" />
              نمایش و زبان
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {settingsByGroup.display.map((setting) => (
              <div key={setting.id} className="border-b border-gray-100 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {getLabel(setting)}
                </label>
                {getDescription(setting) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {getDescription(setting)}
                  </p>
                )}
                
                {setting.key === 'language' ? (
                  <select
                    value={getValue(setting)}
                    onChange={(e) => handleChange(setting.key, e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {languageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : setting.key === 'date_format' ? (
                  <select
                    value={getValue(setting)}
                    onChange={(e) => handleChange(setting.key, e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {dateFormatOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : setting.key === 'time_format' ? (
                  <select
                    value={getValue(setting)}
                    onChange={(e) => handleChange(setting.key, e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {timeFormatOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : setting.key === 'timezone' ? (
                  <select
                    value={getValue(setting)}
                    onChange={(e) => handleChange(setting.key, e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {timezoneOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={getValue(setting)}
                    onChange={(e) => handleChange(setting.key, e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                )}
                
                {changes[setting.key] && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                    <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse"></div>
                    <span>تغییر یافته - ذخیره نشده</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Other Settings */}
        {settingsByGroup.other.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">سایر تنظیمات</h2>
            </div>
            <div className="p-6 space-y-6">
              {settingsByGroup.other.map((setting) => (
                <div key={setting.id} className="border-b border-gray-100 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {getLabel(setting)}
                  </label>
                  {getDescription(setting) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {getDescription(setting)}
                    </p>
                  )}
                  <input
                    type={setting.valueType === 'NUMBER' ? 'number' : 'text'}
                    value={getValue(setting)}
                    onChange={(e) => handleChange(setting.key, e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  {changes[setting.key] && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                      <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse"></div>
                      <span>تغییر یافته - ذخیره نشده</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving || Object.keys(changes).length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Save className="h-5 w-5" />
            {saving ? 'در حال ذخیره...' : `ذخیره تغییرات${Object.keys(changes).length > 0 ? ` (${Object.keys(changes).length})` : ''}`}
          </button>
          
          <button
            onClick={handleReset}
            disabled={Object.keys(changes).length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-medium"
          >
            <RotateCcw className="h-5 w-5" />
            لغو تغییرات
          </button>
        </div>

        {/* Changes Counter */}
        {Object.keys(changes).length > 0 && (
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              ⚠️ شما <strong>{Object.keys(changes).length}</strong> تغییر ذخیره نشده دارید. برای اعمال تغییرات دکمه "ذخیره تغییرات" را بزنید.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}