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
    <div className="relative w-screen h-[100dvh] bg-black overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
        <button
          className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm"
          onClick={() => router.back()}
        >
          بازگشت
        </button>
        <div className="text-white text-lg font-medium">ثبت تصویر ترازو</div>
        <div className="text-white/80 text-sm">{itemId || '-'}</div>
      </div>

      {/* Video */}
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />

      {/* Overlay with cutout rectangle (scale monitor area) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="relative w-full h-full">
          {/* Dark overlay via massive shadow on the cutout */}
          <div
            className="absolute border-2 border-white/80 rounded-sm shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
            style={{
              width: '80vmin',
              height: '28vmin',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
          <div className="absolute left-1/2 -translate-x-1/2 top-[calc(50%+20vmin)] text-center text-white/90 text-sm">
            نمایشگر ترازو را داخل کادر قرار دهید
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 flex items-center justify-center gap-3 bg-gradient-to-t from-black/70 to-transparent">
        <button
          onClick={capture}
          className="px-6 py-3 rounded-full bg-amber-600 text-white text-base font-medium shadow-lg active:scale-95 hover:bg-amber-700"
        >
          عکس گرفتن
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 text-center text-red-200 bg-red-900/70">
          {error}
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Small floating preview after capture */}
      {captured && (
        <div className="absolute right-4 bottom-24 z-20 p-1 bg-white/10 backdrop-blur rounded border border-white/20">
          <img src={captured} alt="preview" className="w-32 h-24 object-cover rounded" />
        </div>
      )}
    </div>
  );
}


