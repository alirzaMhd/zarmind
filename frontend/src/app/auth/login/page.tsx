'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { User, Lock, LoaderCircle, AlertTriangle, Gem } from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const { login, isLoading, error, user } = useAuthStore();

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const success = await login(identifier, password);
    if (success) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Left Form Panel */}
      <div className="flex items-center justify-center bg-slate-50 p-6 sm:p-12 dark:bg-slate-900">
        <div className="w-full max-w-md">
          <div className="text-right">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              خوش آمدید
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              برای ورود به داشبورد، اطلاعات خود را وارد کنید.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-x-3 rounded-md border border-red-400 bg-red-50 p-3 text-sm text-red-700 dark:border-red-600 dark:bg-red-900/20 dark:text-red-400">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Email/Username Input */}
              <div>
                <label
                  htmlFor="identifier"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 text-right"
                >
                  ایمیل یا نام کاربری
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    autoComplete="email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="block w-full rounded-md border-slate-300 bg-white py-2 pr-10 pl-3 text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 sm:text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:ring-amber-400 text-right"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 text-right"
                >
                  رمز عبور
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border-slate-300 bg-white py-2 pr-10 pl-3 text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 sm:text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:ring-amber-400 text-right"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-slate-900 dark:text-slate-300"
                >
                  مرا به خاطر بسپار
                </label>
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-700 dark:ring-offset-slate-800"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md border border-transparent bg-amber-600 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-amber-400 dark:focus:ring-offset-slate-800"
              >
                {isLoading && (
                  <LoaderCircle className="ml-2 h-5 w-5 animate-spin" />
                )}
                {isLoading ? 'در حال ورود...' : 'ورود'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Branding Panel */}
      <div className="hidden bg-slate-950 lg:flex lg:flex-col lg:items-center lg:justify-center p-12 text-white bg-gem-pattern">
        <div className="text-center">
          <Gem className="mx-auto h-12 w-auto text-amber-400" />
          <h1 className="mt-6 text-4xl font-bold tracking-tight">
            سیستم جامع زرمایند
          </h1>
          <p className="mt-3 text-lg text-slate-300">
            هنر دقت، علم ارزش
          </p>
        </div>
        <footer className="absolute bottom-6 text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Zarmind. All rights reserved.
        </footer>
      </div>
    </div>
  );
}