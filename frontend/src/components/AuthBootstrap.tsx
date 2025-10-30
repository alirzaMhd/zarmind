'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

export default function AuthBootstrap() {
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  useEffect(() => {
    // If we've just been forcibly logged out (401/session expiry), do NOT refetch profile until the next manual login
    if (typeof window !== 'undefined' && sessionStorage.getItem('forceLoggedOut')) {
      return;
    }
    fetchProfile();
  }, [fetchProfile]);

  return null;
}


