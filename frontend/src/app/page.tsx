'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading, fetchProfile } = useAuthStore();

  useEffect(() => {
    // On initial load, if the user state isn't determined yet,
    // try to fetch the profile to check for an existing session cookie.
    if (isLoading) {
      fetchProfile();
    }
  }, [fetchProfile, isLoading]);

  useEffect(() => {
    // Only redirect once the loading (profile fetching) is complete.
    if (isLoading) {
      return;
    }

    if (user) {
      // If a user is found, go to the dashboard.
      router.replace('/dashboard');
    } else {
      // If no user is found, go to the login page.
      router.replace('/auth/login');
    }
  }, [user, isLoading, router]);

  // Render a simple loading state while checking auth and redirecting.
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex flex-col items-center">
        <p className="text-lg text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    </div>
  );
}