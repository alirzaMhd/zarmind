'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { ArrowLeft, QrCode, Package } from 'lucide-react';

interface Product {
	id: string;
	sku: string;
	qrCode: string;
	name: string;
	description?: string;
	weight?: number;
	sellingPrice?: number;
}

export default function QrLookupResultPage() {
	const router = useRouter();
	const params = useParams();
	const code = (params?.code as string) || '';
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>('');
	const [product, setProduct] = useState<Product | null>(null);

	useEffect(() => {
		async function fetchByQr() {
			if (!code) return;
			try {
				setLoading(true);
				const res = await api.get(`/inventory/products/by-qr/${encodeURIComponent(code)}`);
				setProduct(res.data);
			} catch (e: any) {
				setError(e?.response?.data?.message || 'محصولی با این QR یافت نشد');
			} finally {
				setLoading(false);
			}
		}
		fetchByQr();
	}, [code]);

	return (
		<div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-900">
			<div className="max-w-2xl mx-auto p-4">
				<div className="flex items-center justify-between mb-4">
					<button
						className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
						onClick={() => router.push('/qr-lookup')}
					>
						<ArrowLeft className="w-5 h-5" />
					</button>
					<div className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
						<QrCode className="w-5 h-5" />
						<span className="font-medium">نتیجه اسکن</span>
					</div>
					<div className="w-10" />
				</div>

				<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
					{loading && <div className="text-center text-gray-500">در حال بارگذاری...</div>}
					{!loading && error && (
						<div className="text-center text-red-600 dark:text-red-400">{error}</div>
					)}
					{!loading && product && (
						<div className="space-y-4">
							<div className="flex items-center gap-3">
								<Package className="w-6 h-6 text-gray-600 dark:text-gray-300" />
								<div>
									<div className="text-xl font-bold text-gray-900 dark:text-white">{product.name}</div>
									<div className="text-sm text-gray-500 dark:text-gray-400">SKU: {product.sku} • QR: {product.qrCode}</div>
								</div>
							</div>
							{product.description && (
								<p className="text-gray-700 dark:text-gray-300 text-sm leading-6">{product.description}</p>
							)}
							<div className="pt-2">
								<Link
									href={`/dashboard/inventory/products/${product.id}`}
									className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
								>
									مشاهده جزئیات محصول
								</Link>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}


