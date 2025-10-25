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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [changes, setChanges] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
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

  const getValue = (setting: Setting) => {
    return changes[setting.key] ?? setting.value;
  };

  const getLabel = (setting: Setting) => {
    return persianLabels[setting.key] || setting.description || setting.key;
  };

  const getDescription = (setting: Setting) => {
    return persianDescriptions[setting.key] || setting.description;
  };

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
            پیکربندی تنظیمات کلی سیستم شامل زبان، تاریخ، زمان و منطقه زمانی
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