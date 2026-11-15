'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { ProductCard } from '@/components/ProductCard';
import { ApiError, getCategories, getProducts } from '@/lib/api';
import type { Category, PageResponse, ProductSummary } from '@/lib/types';

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Nombre A-Z' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
  { value: 'rating', label: 'Mejor valorados' },
  { value: 'newest', label: 'Más nuevos' },
];

export default function MedicalPage() {
  const [products, setProducts] = useState<PageResponse<ProductSummary> | null>(
    null,
  );
  const [medicalCategoryId, setMedicalCategoryId] = useState<string | null>(null);
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('name_asc');
  const [page, setPage] = useState(0);

  useEffect(() => {
    let active = true;

    getCategories()
      .then((result) => {
        if (!active) return;
        const medical = result.find(
          (category) => category.name.toLowerCase() === 'salud',
        );
        setMedicalCategoryId(medical?.id ?? null);
      })
      .catch(() => {
        if (active) setMedicalCategoryId(null);
      })
      .finally(() => {
        if (active) setLoadingCategory(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const loadProducts = useCallback(async () => {
    if (!medicalCategoryId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getProducts({
        q: query || undefined,
        categoryId: medicalCategoryId,
        sort,
        page,
        size: PAGE_SIZE,
      });
      setProducts(result);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudieron cargar los productos médicos. Intenta de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  }, [medicalCategoryId, query, sort, page]);

  useEffect(() => {
    if (loadingCategory) return;
    void loadProducts();
  }, [loadingCategory, loadProducts]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setQuery(searchInput.trim());
  }

  function handleSort(nextSort: string) {
    setSort(nextSort);
    setPage(0);
  }

  function clearSearch() {
    setSearchInput('');
    setQuery('');
    setPage(0);
  }

  const totalPages = products?.totalPages ?? 1;
  const totalElements = products?.totalElements ?? 0;

  return (
    <>
      <section className="hero medical-hero">
        <p className="eyebrow">Atención médica</p>
        <h1>Productos para tu salud y bienestar.</h1>
        <p className="hero-copy">
          Termómetros, mascarillas, vitaminas y más. Compra con la misma
          experiencia de tienda, en un espacio pensado para salud.
        </p>

        <form className="search-form" onSubmit={handleSearch} role="search">
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar productos médicos..."
            aria-label="Buscar productos médicos"
            className="search-input"
          />
          <button type="submit" className="btn btn-primary search-button">
            Buscar
          </button>
          {(query || searchInput) && (
            <button
              type="button"
              className="search-clear"
              onClick={clearSearch}
            >
              Limpiar
            </button>
          )}
        </form>
      </section>

      {loadingCategory ? (
        <div className="admin-card">Cargando módulo médico…</div>
      ) : !medicalCategoryId ? (
        <div className="empty-state">
          <p className="eyebrow">Módulo no disponible</p>
          <h2>No hay productos médicos configurados.</h2>
          <p>
            Agrega la categoría “Salud” y productos médicos para habilitar este
            módulo.
          </p>
          <Link href="/" className="btn btn-primary">
            Volver a la tienda
          </Link>
        </div>
      ) : (
        <>
          <section className="toolbar" aria-label="Filtros del módulo médico">
            <label className="sort-control">
              <span>Ordenar por</span>
              <select
                value={sort}
                onChange={(event) => handleSort(event.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </section>

          {error && (
            <div className="alert" role="alert">
              <div>
                <strong>No pudimos cargar los productos médicos.</strong>
                <p>{error}</p>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={loadProducts}
              >
                Reintentar
              </button>
            </div>
          )}

          {loading ? (
            <div className="product-grid" aria-label="Cargando productos médicos">
              {Array.from({ length: 6 }).map((_, index) => (
                <div className="product-card skeleton-card" key={index}>
                  <div className="skeleton skeleton-image" />
                  <div className="product-body">
                    <div className="skeleton skeleton-line short" />
                    <div className="skeleton skeleton-line" />
                    <div className="skeleton skeleton-line medium" />
                  </div>
                </div>
              ))}
            </div>
          ) : products && products.content.length > 0 ? (
            <>
              <div className="results-line">
                <span>
                  {totalElements} producto{totalElements === 1 ? '' : 's'} médico
                  {totalElements === 1 ? '' : 's'}
                </span>
                <span>
                  Página {Math.min(page + 1, totalPages)} de {totalPages}
                </span>
              </div>

              <div className="product-grid">
                {products.content.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <nav className="pagination" aria-label="Paginación de productos médicos">
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
              <p className="eyebrow">Sin resultados</p>
              <h2>No encontramos productos médicos con esos filtros.</h2>
              <p>Prueba con otra búsqueda.</p>
              <button type="button" className="btn btn-primary" onClick={clearSearch}>
                Ver todos
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}