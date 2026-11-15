'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/AuthProvider';
import { ApiError, deleteDeal, getAdminDeals } from '@/lib/api';
import { dealTypeLabel, formatDealDate, formatDiscount } from '@/lib/deals';
import { formatPrice, formatStock } from '@/lib/format';
import type { DealSummary, PageResponse } from '@/lib/types';

function dealStatus(deal: DealSummary): { label: string; className: string } {
  if (deal.status !== 1) {
    return { label: 'Desactivada', className: 'status-pill status-pill--muted' };
  }

  const now = Date.now();
  const starts = new Date(deal.startsAt).getTime();
  const ends = new Date(deal.endsAt).getTime();

  if (now < starts) {
    return { label: 'Programada', className: 'status-pill status-pill--info' };
  }
  if (now >= ends) {
    return { label: 'Terminada', className: 'status-pill status-pill--muted' };
  }
  if (Number(deal.stockRemaining) <= 0) {
    return { label: 'Agotada', className: 'status-pill status-pill--danger' };
  }

  return { label: 'Activa', className: 'status-pill status-pill--success' };
}

export default function AdminDealsPage() {
  const { session } = useAuth();
  const [data, setData] = useState<PageResponse<DealSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const token = session?.accessToken;

  const load = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getAdminDeals(token, 0, 100);
      setData(result);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudieron cargar las ofertas.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(deal: DealSummary) {
    if (!token) return;

    const confirmed = window.confirm(
      `¿Desactivar la oferta de "${deal.productName}"? Dejará de mostrarse en la tienda.`,
    );
    if (!confirmed) return;

    setDeletingId(deal.id);
    setError(null);

    try {
      await deleteDeal(token, deal.id);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo desactivar la oferta.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Ofertas</h1>
          <p className="admin-muted">
            Descuentos automáticos con temporizador y stock limitado.
          </p>
        </div>
        <div className="admin-header-actions">
          <Link href="/admin" className="btn btn-ghost">
            ← Panel
          </Link>
          <Link href="/deals" className="btn btn-ghost">
            Ver tienda
          </Link>
          <Link href="/admin/deals/new" className="btn btn-primary">
            Nueva oferta
          </Link>
        </div>
      </header>

      {error && (
        <div className="alert" role="alert">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="admin-card">Cargando ofertas…</div>
      ) : data && data.content.length > 0 ? (
        <div className="admin-card admin-table-wrap">
          <table className="admin-table admin-table--deals">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Descuento</th>
                <th>Precio oferta</th>
                <th>Vigencia</th>
                <th>Stock</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((deal) => {
                const status = dealStatus(deal);

                return (
                  <tr key={deal.id}>
                    <td>
                      <strong>{deal.productName}</strong>
                      <span className="admin-subline">
                        {deal.categoryName ?? 'Sin categoría'}
                      </span>
                    </td>
                    <td>{dealTypeLabel(deal.dealType)}</td>
                    <td className="admin-strong">
                      {formatDiscount(deal.discountPercent)}
                    </td>
                    <td>
                      <strong>{formatPrice(deal.dealPrice)}</strong>
                      <span className="admin-subline price-old">
                        {formatPrice(deal.originalPrice)}
                      </span>
                    </td>
                    <td className="admin-dates">
                      <span>{formatDealDate(deal.startsAt)}</span>
                      <span>{formatDealDate(deal.endsAt)}</span>
                    </td>
                    <td>
                      {formatStock(Number(deal.stockRemaining))}
                      <span className="admin-subline">
                        de {formatStock(Number(deal.stockLimit))}
                      </span>
                    </td>
                    <td>
                      <span className={status.className}>{status.label}</span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <Link
                          href={`/admin/deals/${deal.id}`}
                          className="admin-link"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          className="admin-link admin-link--danger"
                          onClick={() => void handleDelete(deal)}
                          disabled={deletingId === deal.id}
                        >
                          {deletingId === deal.id ? '…' : 'Desactivar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="admin-muted admin-table-foot">
            Mostrando {data.content.length} de {data.totalElements} ofertas. Las
            ofertas desactivadas se conservan como historial.
          </p>
        </div>
      ) : (
        <div className="empty-state">
          <h2>No hay ofertas todavía</h2>
          <p>
            Crea la primera oferta relámpago, destacada o del día para que
            aparezca en la tienda.
          </p>
          <Link href="/admin/deals/new" className="btn btn-primary">
            Crear oferta
          </Link>
        </div>
      )}
    </div>
  );
}
