'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function QrLookupScannerPage() {
	const router = useRouter();
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const rafRef = useRef<number | null>(null);
	const [error, setError] = useState<string>('');
	const [hasPermission, setHasPermission] = useState<boolean>(false);
	const [isScanning, setIsScanning] = useState<boolean>(false);

	useEffect(() => {
		let stopped = false;

		async function initCamera() {
			try {
				// Prefer back camera if available
				const constraints: MediaStreamConstraints = {
					video: {
						facingMode: { ideal: 'environment' },
						width: { ideal: 1280 },
						height: { ideal: 720 },
					},
					audio: false,
				};
				const stream = await navigator.mediaDevices.getUserMedia(constraints);
				if (stopped) return;
				streamRef.current = stream;
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
					await videoRef.current.play();
				}
				setHasPermission(true);
				startScanning();
			} catch (e: any) {
				setError(e?.message || 'Cannot access camera');
				setHasPermission(false);
			}
		}

		initCamera();

		return () => {
			stopped = true;
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((t) => t.stop());
				streamRef.current = null;
			}
		};
	}, []);

	function extractCode(rawValue: string): string {
		try {
			// If it's a URL with ?code=... use that param; else return raw value
			const url = new URL(rawValue);
			const codeParam = url.searchParams.get('code');
			if (codeParam) return codeParam;
			// Fallback: last path segment
			const parts = url.pathname.split('/').filter(Boolean);
			return parts[parts.length - 1] || rawValue;
		} catch {
			return rawValue;
		}
	}

	async function scanFrame() {
		if (!videoRef.current) return;
		const video = videoRef.current;
		const canvas = canvasRef.current || document.createElement('canvas');
		canvasRef.current = canvas;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

		// Define scan area as a centered square (same as visual cutout)
		const size = Math.floor(Math.min(canvas.width, canvas.height) * 0.6);
		const x = Math.floor((canvas.width - size) / 2);
		const y = Math.floor((canvas.height - size) / 2);
		const imageData = ctx.getImageData(x, y, size, size);

		// Draw to a temp canvas for detection
		const tmp = document.createElement('canvas');
		tmp.width = size;
		tmp.height = size;
		const tctx = tmp.getContext('2d');
		if (!tctx) return;
		tctx.putImageData(imageData, 0, 0);

		// Use native BarcodeDetector if available
		const BD: any = (globalThis as any).BarcodeDetector;
		if (!BD) {
			setError('BarcodeDetector API not supported. Please use Chrome/Safari 17+ or install a QR scanner polyfill.');
			setIsScanning(false);
			return;
		}
		try {
			const detector = new BD({ formats: ['qr_code'] });
			const barcodes = await detector.detect(tmp);
			if (barcodes && barcodes.length > 0) {
				const rawValue = barcodes[0].rawValue as string;
				const code = extractCode(rawValue);
				setIsScanning(false);
				// Stop camera
				if (streamRef.current) {
					streamRef.current.getTracks().forEach((t) => t.stop());
					streamRef.current = null;
				}
				if (rafRef.current) cancelAnimationFrame(rafRef.current);
				router.replace(`/qr-lookup/${encodeURIComponent(code)}`);
				return;
			}
		} catch (e) {
			// ignore frame errors and continue scanning
		}

		rafRef.current = requestAnimationFrame(scanFrame);
	}

	function startScanning() {
		if (isScanning) return;
		setIsScanning(true);
		rafRef.current = requestAnimationFrame(scanFrame);
	}

	return (
		<div className="relative w-screen h-[100dvh] bg-black overflow-hidden">
			{/* Header */}
			<div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
				<button
					className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
					onClick={() => router.back()}
					aria-label="Back"
				>
					<ArrowLeft className="w-6 h-6" />
				</button>
				<div className="text-white text-lg font-medium">اسکن کد QR</div>
				<div className="w-10" />
			</div>

			{/* Video */}
			<video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />

			{/* Overlay with cutout */}
			<div className="absolute inset-0 z-10 pointer-events-none">
				<div className="relative w-full h-full">
					<div className="absolute inset-0 bg-black/70" />
					{/* Cutout square */}
					<div
						className="absolute border-2 border-white/80 rounded-md shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
						style={{
							width: '60vmin',
							height: '60vmin',
							top: '50%',
							left: '50%',
							transform: 'translate(-50%, -50%)',
						}}
					/>
					<div className="absolute left-1/2 -translate-x-1/2 top-[calc(50%+34vmin)] text-center text-white/90 text-sm">
						کادر را روی کد قرار دهید
					</div>
				</div>
			</div>

			{/* Status */}
			{!hasPermission && (
				<div className="absolute bottom-0 left-0 right-0 z-20 p-4 text-center text-red-200 bg-red-900/70">
					برای دسترسی به دوربین، اجازه لازم است. {error && <span className="block text-xs mt-1 opacity-80">{error}</span>}
				</div>
			)}
		</div>
	);
}


