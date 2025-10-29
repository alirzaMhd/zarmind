// frontend/src/app/dashboard/settings/qr-code/page.tsx
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  QrCode,
  Upload,
  X,
  Eye,
  Download,
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

interface QRPreview {
  dataUrl: string;
}

// Persian labels for QR settings
const persianLabels: Record<string, string> = {
  'QR_CODE_SIZE': 'اندازه QR Code (پیکسل)',
  'QR_CODE_ERROR_CORRECTION': 'سطح تصحیح خطا',
  'QR_CODE_MARGIN': 'حاشیه (Quiet Zone)',
  'QR_CODE_COLOR': 'رنگ QR Code',
  'QR_CODE_BACKGROUND': 'رنگ پس‌زمینه',
  'QR_INCLUDE_LOGO': 'نمایش لوگو در مرکز',
  'QR_LOGO_SIZE': 'اندازه لوگو (درصد)',
};

// Persian descriptions
const persianDescriptions: Record<string, string> = {
  'QR_CODE_SIZE': 'اندازه QR Code در هنگام تولید (پیکسل)',
  'QR_CODE_ERROR_CORRECTION': 'سطح تصحیح خطا - بالاتر = مقاوم‌تر اما پیچیده‌تر',
  'QR_CODE_MARGIN': 'فاصله خالی اطراف QR Code',
  'QR_CODE_COLOR': 'رنگ نقاط و خطوط QR Code',
  'QR_CODE_BACKGROUND': 'رنگ پس‌زمینه QR Code',
  'QR_INCLUDE_LOGO': 'نمایش لوگو شرکت در مرکز QR Code',
  'QR_LOGO_SIZE': 'اندازه لوگو نسبت به QR Code (10-30 درصد)',
};

// Error correction levels
const errorCorrectionOptions = [
  { value: 'L', label: 'L - پایین (7%)', description: 'برای QR های ساده' },
  { value: 'M', label: 'M - متوسط (15%)', description: 'پیش‌فرض توصیه شده' },
  { value: 'Q', label: 'Q - بالا (25%)', description: 'برای محیط‌های پرنویز' },
  { value: 'H', label: 'H - خیلی بالا (30%)', description: 'برای QR با لوگو' },
];

// Default settings if not in database
const defaultSettings: Record<string, string> = {
  'QR_CODE_SIZE': '300',
  'QR_CODE_ERROR_CORRECTION': 'M',
  'QR_CODE_MARGIN': '2',
  'QR_CODE_COLOR': '#000000',
  'QR_CODE_BACKGROUND': '#FFFFFF',
  'QR_INCLUDE_LOGO': 'false',
  'QR_LOGO_SIZE': '20',
};

export default function QRCodeSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [changes, setChanges] = useState<Record<string, string>>({});

  // Preview state
  const [qrPreview, setQrPreview] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchCurrentLogo();
  }, []);

  useEffect(() => {
    // Debounce preview generation
    const timer = setTimeout(() => {
      generatePreview();
    }, 500);

    return () => clearTimeout(timer);
  }, [changes, settings, currentLogo]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings', {
        params: { includePrivate: 'true' },
      });

      let qrSettings = response.data.filter((s: Setting) => s.key.startsWith('QR_'));

      // If no settings exist, create them with defaults
      if (qrSettings.length === 0) {
        console.log('No QR settings found - using defaults');
        // Create mock settings from defaults
        qrSettings = Object.entries(defaultSettings).map(([key, value]) => ({
          id: key,
          category: 'QR_CODE',
          key,
          value,
          parsedValue: value,
          valueType: key.includes('SIZE') || key.includes('MARGIN') || key.includes('LOGO_SIZE') ? 'NUMBER' : key.includes('COLOR') || key.includes('BACKGROUND') ? 'STRING' : 'BOOLEAN',
          description: persianDescriptions[key],
          isPublic: false,
        }));
      }

      setSettings(qrSettings);
    } catch (error: any) {
      console.error('Failed to fetch settings:', error);
      setMessage({ type: 'error', text: 'خطا در بارگذاری تنظیمات' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentLogo = async () => {
    try {
      const response = await api.get('/utilities/qr-code/logo');
      if (response.data?.logoUrl) {
        // Prepend API base URL if needed
        const logoUrl = response.data.logoUrl.startsWith('http') 
          ? response.data.logoUrl 
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${response.data.logoUrl}`;
        setCurrentLogo(logoUrl);
      }
    } catch (error) {
      console.error('Failed to fetch logo:', error);
    }
  };

  const generatePreview = async () => {
    try {
      setPreviewLoading(true);

      const previewSettings: Record<string, any> = {};
      
      // Merge default settings with current settings and changes
      Object.keys(defaultSettings).forEach((key) => {
        const setting = settings.find(s => s.key === key);
        previewSettings[key] = changes[key] ?? setting?.value ?? defaultSettings[key];
      });

      const response = await api.post<QRPreview>('/utilities/qr-code/preview', {
        settings: previewSettings,
      });

      setQrPreview(response.data.dataUrl);
    } catch (error: any) {
      console.error('Failed to generate preview:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setChanges((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'فقط فایل‌های تصویری مجاز هستند' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'حجم فایل نباید بیشتر از 2 مگابایت باشد' });
      return;
    }

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('logo', file);

      const response = await api.post('/utilities/qr-code/upload-logo', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.logoUrl) {
        const logoUrl = response.data.logoUrl.startsWith('http') 
          ? response.data.logoUrl 
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${response.data.logoUrl}`;
        setCurrentLogo(logoUrl);
        setLogoFile(file);
        setMessage({ type: 'success', text: 'لوگو با موفقیت آپلود شد' });
        setTimeout(() => setMessage(null), 3000);
        
        // Regenerate preview after a short delay
        setTimeout(() => {
          generatePreview();
        }, 500);
      }
    } catch (error: any) {
      console.error('Failed to upload logo:', error);
      const errorMessage = error.response?.data?.message || 'خطا در آپلود لوگو';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm('آیا از حذف لوگو اطمینان دارید؟')) return;

    try {
      await api.delete('/utilities/qr-code/logo');
      setCurrentLogo('');
      setLogoFile(null);
      setMessage({ type: 'success', text: 'لوگو حذف شد' });
      setTimeout(() => setMessage(null), 3000);
      
      // Regenerate preview
      setTimeout(() => {
        generatePreview();
      }, 500);
    } catch (error: any) {
      console.error('Failed to remove logo:', error);
      setMessage({ type: 'error', text: 'خطا در حذف لوگو' });
    }
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

      if (response.data.success || response.status === 200) {
        setMessage({ type: 'success', text: 'تنظیمات با موفقیت ذخیره شد و تمام QR Code های قدیمی مجدداً تولید می‌شوند' });
        setChanges({});
        fetchSettings();

        // Trigger regeneration of all QR codes in background
        api.post('/utilities/qr-code/regenerate-all').catch((err) => {
          console.error('Failed to regenerate QR codes:', err);
        });

        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ type: 'error', text: response.data.message || 'خطا در ذخیره تنظیمات' });
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

  const handleDownloadPreview = () => {
    if (!qrPreview) return;

    const link = document.createElement('a');
    link.href = qrPreview;
    link.download = `qr-preview-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const renderInput = (setting: Setting) => {
    const value = getValue(setting);
    const commonClasses =
      'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white';

    // Boolean settings
    if (setting.valueType === 'BOOLEAN' || ['true', 'false'].includes(value.toLowerCase())) {
      return (
        <select
          value={value}
          onChange={(e) => handleChange(setting.key, e.target.value)}
          className={commonClasses}
        >
          <option value="true">فعال</option>
          <option value="false">غیرفعال</option>
        </select>
      );
    }

    // Error Correction
    if (setting.key === 'QR_CODE_ERROR_CORRECTION') {
      return (
        <div className="space-y-2">
          <select
            value={value}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            className={commonClasses}
          >
            {errorCorrectionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {errorCorrectionOptions.find((o) => o.value === value)?.description}
          </p>
        </div>
      );
    }

    // Color inputs
    if (setting.key === 'QR_CODE_COLOR' || setting.key === 'QR_CODE_BACKGROUND') {
      return (
        <div className="flex gap-3">
          <input
            type="color"
            value={value}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            className="h-11 w-20 border border-gray-300 rounded-lg cursor-pointer dark:border-gray-600"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            placeholder="#000000"
            className={commonClasses}
          />
        </div>
      );
    }

    // Number fields with range
    if (setting.valueType === 'NUMBER') {
      const min = setting.key === 'QR_CODE_SIZE' ? 100 : setting.key === 'QR_LOGO_SIZE' ? 10 : 0;
      const max = setting.key === 'QR_CODE_SIZE' ? 1000 : setting.key === 'QR_LOGO_SIZE' ? 30 : 10;
      const step = setting.key === 'QR_CODE_SIZE' ? 50 : 1;

      return (
        <div className="space-y-2">
          <div className="flex gap-3 items-center">
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => handleChange(setting.key, e.target.value)}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider-reverse"
              style={{
                background: `linear-gradient(to left, #f59e0b 0%, #f59e0b ${((Number(value) - min) / (max - min)) * 100}%, #d1d5db ${((Number(value) - min) / (max - min)) * 100}%, #d1d5db 100%)`
              }}
            />
            <input
              type="number"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => handleChange(setting.key, e.target.value)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </div>
      );
    }

    // Default text input
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(setting.key, e.target.value)}
        className={commonClasses}
      />
    );
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">طراحی QR Code</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            سفارشی‌سازی ظاهر و تنظیمات QR Code های سیستم
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings Panel */}
          <div className="space-y-6">
            {/* QR Appearance Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-amber-500" />
                  تنظیمات ظاهری
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {settings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>در حال بارگذاری تنظیمات...</p>
                  </div>
                ) : (
                  settings.map((setting) => (
                    <div key={setting.id}>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {getLabel(setting)}
                      </label>
                      {getDescription(setting) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                          {getDescription(setting)}
                        </p>
                      )}

                      {renderInput(setting)}

                      {changes[setting.key] && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                          <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse"></div>
                          <span>تغییر یافته - ذخیره نشده</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Logo Upload */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Upload className="h-5 w-5 text-amber-500" />
                  لوگو مرکزی
                </h2>
              </div>
              <div className="p-6">
                {currentLogo ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <img
                        src={currentLogo}
                        alt="Logo"
                        className="max-h-32 object-contain"
                      />
                    </div>
                    <button
                      onClick={handleRemoveLogo}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:border-red-600 dark:hover:bg-red-900/20"
                    >
                      <X className="h-5 w-5" />
                      حذف لوگو
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="block w-full cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-amber-500 dark:hover:border-amber-500 transition-colors">
                        <Upload className="h-12 w-12 text-gray-400 mb-3" />
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {uploadingLogo ? 'در حال آپلود...' : 'کلیک کنید یا فایل را بکشید'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          PNG, JPG, SVG تا 2MB
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    💡 برای بهترین نتیجه از لوگوی مربعی با پس‌زمینه شفاف استفاده کنید.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:sticky lg:top-6 h-fit">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Eye className="h-5 w-5 text-amber-500" />
                  پیش‌نمایش زنده
                </h2>
              </div>
              <div className="p-6">
                {previewLoading ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
                      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                        در حال تولید پیش‌نمایش...
                      </p>
                    </div>
                  </div>
                ) : qrPreview ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <img
                        src={qrPreview}
                        alt="QR Preview"
                        className="max-w-full h-auto"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>

                    <button
                      onClick={handleDownloadPreview}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 dark:border-blue-600 dark:hover:bg-blue-900/20"
                    >
                      <Download className="h-5 w-5" />
                      دانلود پیش‌نمایش
                    </button>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">محتوای نمونه:</span>
                        <span className="font-mono text-gray-900 dark:text-white text-xs">
                          {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/qr-lookup?code=SAMPLE
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">سطح خطا:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {getValue(settings.find((s) => s.key === 'QR_CODE_ERROR_CORRECTION') || {} as Setting)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96 text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <QrCode className="h-16 w-16 mx-auto mb-3 opacity-50" />
                      <p>پیش‌نمایش QR Code</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleSave}
            disabled={saving || Object.keys(changes).length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Save className="h-5 w-5" />
            {saving
              ? 'در حال ذخیره...'
              : `ذخیره تنظیمات${Object.keys(changes).length > 0 ? ` (${Object.keys(changes).length})` : ''}`}
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
              ⚠️ شما <strong>{Object.keys(changes).length}</strong> تغییر ذخیره نشده دارید. برای اعمال
              تغییرات دکمه "ذخیره تنظیمات" را بزنید.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}