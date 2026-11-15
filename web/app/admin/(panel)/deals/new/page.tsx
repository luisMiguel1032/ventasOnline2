'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AdminDealForm } from '@/components/AdminDealForm';
import { useAuth } from '@/components/AuthProvider';
import { ApiError, createDeal, getProducts } from '@/lib/api';
import type { DealInput, ProductSummary } from '@/lib/types';

export default function AdminNewDealPage() {
  const { session } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    getProducts({ size: 100, sort: 'name_asc' })
      .then((result) => {
        if (active) setProducts(result.content);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'No se pudo cargar la lista de productos.',
          );
        }
      })
      .finally(() => {
        if (active) setLoadingProducts(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(input: DealInput) {
    if (!session?.accessToken) {
      setError('Sesión no disponible. Vuelve a iniciar sesión como administrador.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createDeal(session.accessToken, input);
      router.push('/admin/deals');
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setError('No autorizado. Inicia sesión con una cuenta ADMIN.');
      } else {
        setError(
          err instanceof ApiError ? err.message : 'No se pudo crear la oferta.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Nueva oferta</h1>
          <p className="admin-muted">
            El descuento se aplica automáticamente y el temporizador empieza en
            la fecha indicada.
          </p>
        </div>
        <div className="admin-header-actions">
          <Link href="/admin/deals" className="btn btn-ghost">
            ← Ofertas
          </Link>
        </div>
      </header>

      <div className="admin-card">
        <AdminDealForm
          products={products.filter((product) => !product.dealId)}
          loadingProducts={loadingProducts}
          submitLabel="Crear oferta"
          submitting={submitting}
          error={error}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
