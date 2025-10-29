'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ScaleCapturePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const itemId = searchParams?.get('itemId') || '';
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [captured, setCaptured] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s as any;
          await videoRef.current.play();
        }
      } catch (e) {
        setError('عدم دسترسی به دوربین. لطفاً دسترسی را بررسی کنید.');
      }
    };
    init();
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCaptured(dataUrl);
  };

  const saveAndBack = () => {
    if (!captured || !itemId) {
      router.push('/dashboard/inventory');
      return;
    }
    try {
      const key = `scale_img_${itemId}_${Date.now()}`;
      localStorage.setItem(key, captured);
    } catch {}
    router.push('/dashboard/inventory');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ثبت تصویر ترازو</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">آیتم: {itemId || '-'}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-sm">{error}</div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="aspect-video w-full bg-black rounded overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-contain" playsInline muted />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={capture} className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700">عکس گرفتن</button>
            <button onClick={saveAndBack} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">ذخیره و بازگشت</button>
          </div>
          <canvas ref={canvasRef} className="hidden" />

          {captured && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">پیش‌نمایش:</p>
              <img src={captured} alt="preview" className="w-full rounded border border-gray-300 dark:border-gray-600" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


