'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { DealCard } from '@/components/DealCard';
import { ApiError, getCategories, getDeals } from '@/lib/api';
import { DEAL_TYPE_LABELS } from '@/lib/deals';
import type {
  Category,
  DealSummary,
  DealType,
  PageResponse,
} from '@/lib/types';

const PAGE_SIZE = 12;

const TYPE_FILTERS: { value: DealType | ''; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'LIGHTNING', label: '⚡ Relámpago' },
  { value: 'FEATURED', label: 'Destacadas' },
  { value: 'DAILY', label: 'Del día' },
];

const SORT_OPTIONS = [
  { value: 'discount_desc', label: 'Mayor descuento' },
  { value: 'ending_soon', label: 'Terminan pronto' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
  { value: 'newest', label: 'Más recientes' },
];

const MIN_DISCOUNT_OPTIONS = [
  { value: '', label: 'Cualquier descuento' },
  { value: '10', label: '10% o más' },
  { value: '20', label: '20% o más' },
  { value: '30', label: '30% o más' },
  { value: '40', label: '40% o más' },
];

export default function DealsPage() {
  const [data, setData] = useState<PageResponse<DealSummary> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<DealType | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [minDiscount, setMinDiscount] = useState('');
  const [sort, setSort] = useState('discount_desc');
  const [page, setPage] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('type');

    if (requested === 'LIGHTNING' || requested === 'FEATURED' || requested === 'DAILY') {
      setType(requested);
    }
  }, []);

  useEffect(() => {
    let active = true;

    getCategories()
      .then((result) => {
        if (active) setCategories(result);
      })
      .catch(() => {
        // Los filtros de categoría son opcionales.
      });

    return () => {
      active = false;
    };
  }, []);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getDeals({
        type: type || undefined,
        categoryId: categoryId || undefined,
        minDiscount: minDiscount ? Number(minDiscount) : undefined,
        sort,
        page,
        size: PAGE_SIZE,
      });
      setData(result);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudieron cargar las ofertas. Intenta de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  }, [type, categoryId, minDiscount, sort, page]);

  useEffect(() => {
    void loadDeals();
  }, [loadDeals]);

  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;

  function resetPage() {
    setPage(0);
  }

  return (
    <>
      <section className="deals-hero">
        <div>
          <p className="eyebrow">⚡ Ofertas del Día</p>
          <h1>Descuentos reales, por tiempo limitado.</h1>
          <p className="hero-copy">
            Ofertas relámpago con stock limitado, ofertas destacadas y descuentos
            del día. El temporizador corre: cuando se acaba, vuelve el precio
            normal.
          </p>
        </div>
        <div className="deals-hero-badges" aria-hidden="true">
          <span className="deal-badge deal-badge--lightning">Relámpago</span>
          <span className="deal-badge deal-badge--featured">Destacada</span>
          <span className="deal-badge deal-badge--daily">Del día</span>
        </div>
      </section>

      <section className="toolbar deals-filters" aria-label="Filtros de ofertas">
        <div className="chips">
          {TYPE_FILTERS.map((filter) => (
            <button
              type="button"
              key={filter.value || 'all'}
              className={type === filter.value ? 'chip is-active' : 'chip'}
              onClick={() => {
                setType(filter.value);
                resetPage();
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="deals-selects">
          <label className="sort-control">
            <span>Ordenar por</span>
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                resetPage();
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="sort-control">
            <span>Descuento</span>
            <select
              value={minDiscount}
              onChange={(event) => {
                setMinDiscount(event.target.value);
                resetPage();
              }}
            >
              {MIN_DISCOUNT_OPTIONS.map((option) => (
                <option key={option.value || 'any'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="chips chips-secondary" aria-label="Categorías con ofertas">
          <button
            type="button"
            className={!categoryId ? 'chip is-active' : 'chip'}
            onClick={() => {
              setCategoryId('');
              resetPage();
            }}
          >
            Todas las categorías
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              className={categoryId === category.id ? 'chip is-active' : 'chip'}
              onClick={() => {
                setCategoryId(category.id);
                resetPage();
              }}
            >
              {category.name}
            </button>
          ))}
        </section>
      )}

      {error && (
        <div className="alert" role="alert">
          <div>
            <strong>No pudimos cargar las ofertas.</strong>
            <p>{error}</p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={loadDeals}>
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div className="deal-grid" aria-label="Cargando ofertas">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="deal-card skeleton-deal" key={index}>
              <div className="skeleton skeleton-image" />
              <div className="deal-card-body">
                <div className="skeleton skeleton-line short" />
                <div className="skeleton skeleton-line" />
                <div className="skeleton skeleton-line medium" />
              </div>
            </div>
          ))}
        </div>
      ) : data && data.content.length > 0 ? (
        <>
          <div className="results-line">
            <span>
              {totalElements} oferta{totalElements === 1 ? '' : 's'}
              {type ? ` · ${DEAL_TYPE_LABELS[type]}` : ''}
            </span>
            <span>
              Página {Math.min(page + 1, totalPages)} de {totalPages}
            </span>
          </div>

          <div className="deal-grid">
            {data.content.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>

          <nav className="pagination" aria-label="Paginación de ofertas">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={page <= 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              ← Anterior
            </button>
            <span>
              Página {Math.min(page + 1, totalPages)} de {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente →
            </button>
          </nav>
        </>
      ) : (
        <div className="empty-state">
          <p className="eyebrow">Sin ofertas</p>
          <h2>No hay ofertas activas con esos filtros.</h2>
          <p>
            Prueba con otro tipo de oferta o vuelve al catálogo para ver todos
            los productos.
          </p>
          <div className="empty-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setType('');
                setCategoryId('');
                setMinDiscount('');
                setPage(0);
              }}
            >
              Ver todas las ofertas
            </button>
            <Link href="/" className="btn btn-ghost">
              Ir al catálogo
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
