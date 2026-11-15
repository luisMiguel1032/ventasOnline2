'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AdminDealForm } from '@/components/AdminDealForm';
import { useAuth } from '@/components/AuthProvider';
import { ApiError, deleteDeal, getDeal, getProducts, updateDeal } from '@/lib/api';
import type { DealInput, DealSummary, ProductSummary } from '@/lib/types';

function dealAsProduct(deal: DealSummary): ProductSummary {
  return {
    id: deal.productId,
    name: deal.productName,
    slug: deal.productSlug,
    image: deal.image,
    price: Number(deal.originalPrice),
    stock: Number(deal.productStock),
    ratingAvg: Number(deal.ratingAvg),
    ratingCount: Number(deal.ratingCount),
    categoryName: deal.categoryName,
    brandName: deal.brandName,
    dealId: deal.id,
    dealPrice: Number(deal.dealPrice),
    dealDiscountPercent: Number(deal.discountPercent),
    dealType: deal.dealType,
    dealTitle: deal.title,
    dealEndsAt: deal.endsAt,
    dealStockRemaining: Number(deal.stockRemaining),
    dealStockPercent: Number(deal.stockPercent),
    dealStockLimit: Number(deal.stockLimit),
    videoUrl: null,
  };
}

export default function AdminEditDealPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { session } = useAuth();

  const [deal, setDeal] = useState<DealSummary | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;

    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([getDeal(id), getProducts({ size: 100, sort: 'name_asc' })])
      .then(([dealResult, productsResult]) => {
        if (!active) return;

        const list = productsResult.content.some(
          (product) => product.id === dealResult.productId,
        )
          ? productsResult.content
          : [dealAsProduct(dealResult), ...productsResult.content];

        setDeal(dealResult);
        setProducts(list);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof ApiError
            ? err.message
            : 'No se pudo cargar la oferta.',
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  async function handleSubmit(input: DealInput) {
    if (!session?.accessToken || !id) {
      setError('Sesión no disponible. Vuelve a iniciar sesión como administrador.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await updateDeal(session.accessToken, id, input);
      router.push('/admin/deals');
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setError('No autorizado. Inicia sesión con una cuenta ADMIN.');
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : 'No se pudo actualizar la oferta.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!session?.accessToken || !id || !deal) return;

    const confirmed = window.confirm(
      `¿Desactivar la oferta de "${deal.productName}"? Dejará de mostrarse en la tienda.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      await deleteDeal(session.accessToken, id);
      router.push('/admin/deals');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo desactivar la oferta.',
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>{deal ? `Editar: ${deal.productName}` : 'Editar oferta'}</h1>
          <p className="admin-muted">
            Cambia el descuento, la vigencia o el stock limitado. Los cambios se
            ven al instante en la tienda.
          </p>
        </div>
        <div className="admin-header-actions">
          <Link href="/admin/deals" className="btn btn-ghost">
            ← Ofertas
          </Link>
          {deal && (
            <Link
              href={`/products/${deal.productId}`}
              className="btn btn-ghost"
            >
              Ver en tienda
            </Link>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-danger-ghost"
            onClick={() => void handleDelete()}
            disabled={deleting || !deal}
          >
            {deleting ? 'Desactivando…' : 'Desactivar oferta'}
          </button>
        </div>
      </header>

      {loading ? (
        <div className="admin-card">Cargando oferta…</div>
      ) : error && !deal ? (
        <div className="empty-state">
          <h2>No pudimos cargar la oferta</h2>
          <p>{error}</p>
          <Link href="/admin/deals" className="btn btn-primary">
            Volver a ofertas
          </Link>
        </div>
      ) : deal ? (
        <div className="admin-card">
          <AdminDealForm
            products={products}
            initial={{
              productId: deal.productId,
              title: deal.title ?? '',
              dealType: deal.dealType,
              discountPercent: Number(deal.discountPercent),
              startsAt: deal.startsAt,
              endsAt: deal.endsAt,
              stockLimit: Number(deal.stockLimit),
              stockSold: Number(deal.stockSold),
              status: deal.status,
            }}
            submitLabel="Guardar cambios"
            submitting={submitting}
            error={error}
            showStatus
            onSubmit={handleSubmit}
          />
        </div>
      ) : null}
    </div>
  );
}
