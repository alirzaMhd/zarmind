'use client';

import { useRouter } from 'next/navigation';

type QuickAddModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="hidden sm:block absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl p-6 mb-20 sm:mb-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">افزودن محصول - انتخاب دسته</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">افزودن محصول</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/dashboard/inventory/products?add=1')}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-right"
          >
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">محصول ساخته‌شده</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">جواهرات و زیورآلات</div>
          </button>
          <button
            onClick={() => router.push('/dashboard/inventory/raw-gold?add=1')}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-right"
          >
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">طلا خام</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">به تفکیک عیار</div>
          </button>
          <button
            onClick={() => router.push('/dashboard/inventory/coins?add=1')}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-right"
          >
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">سکه</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">انواع سکه</div>
          </button>
          <button
            onClick={() => router.push('/dashboard/inventory/stones?add=1')}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-right"
          >
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">سنگ</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">سنگ‌های قیمتی</div>
          </button>
          <button
            onClick={() => router.push('/dashboard/inventory/general-goods?add=1')}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-right"
          >
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">کالای عمومی</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">سایر کالاها</div>
          </button>
          <button
            onClick={() => router.push('/dashboard/inventory/currency?add=1')}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-right"
          >
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">ارز</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">خرید/افزودن ارز</div>
          </button>
        </div>

        {/* Quick Actions (same as before) */}
        <div className="mt-6 hidden sm:flex gap-3">
          <button
            onClick={() => router.push('/dashboard/transactions/sales/new')}
            className="flex-1 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            شروع فروش
          </button>
          <button
            onClick={() => router.push('/qr-lookup')}
            className="flex-1 py-3 rounded-lg bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            جستجوی QR
          </button>
        </div>
      </div>
    </div>
  );
}


