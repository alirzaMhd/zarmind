'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Gem } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (isLoading) {
      fetchProfile();
    }
  }, [fetchProfile, isLoading]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/auth/login');
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="flex flex-col items-center gap-8">
        {/* Simple animated gem */}
        <div className="relative">
          <Gem className="w-16 h-16 text-amber-500 animate-pulse" />
        </div>

        {/* Brand name */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-100 mb-2">زرمایند</h1>
          <p className="text-sm text-gray-500">در حال ورود...</p>
        </div>

        {/* Simple spinner */}
        <div className="w-8 h-8 border-2 border-gray-800 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    </div>
  );
}