'use client';

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

export default function HomePage() {
  const [products, setProducts] = useState<PageResponse<ProductSummary> | null>(
    null,
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sort, setSort] = useState('name_asc');
  const [page, setPage] = useState(0);

  useEffect(() => {
    let active = true;

    getCategories()
      .then((result) => {
        if (active) setCategories(result);
      })
      .catch(() => {
        // Si falla, el catálogo sigue funcionando sin los filtros.
      });

    return () => {
      active = false;
    };
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getProducts({
        q: query || undefined,
        categoryId: categoryId || undefined,
        sort,
        page,
        size: PAGE_SIZE,
      });
      setProducts(result);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo cargar el catálogo. Intenta de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  }, [query, categoryId, sort, page]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setQuery(searchInput.trim());
  }

  function handleCategory(nextCategory: string) {
    setCategoryId(nextCategory);
    setPage(0);
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
      <section className="hero">
        <p className="eyebrow">Bienvenido a Amazonka</p>
        <h1>Todo lo que buscas, en un solo lugar.</h1>
        <p className="hero-copy">
          Explora nuestro catálogo, revisa el detalle de cada producto y crea tu
          cuenta para empezar a comprar.
        </p>

        <form className="search-form" onSubmit={handleSearch} role="search">
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre de producto..."
            aria-label="Buscar productos"
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

      <section className="toolbar" aria-label="Filtros del catálogo">
        <div className="chips">
          <button
            type="button"
            className={!categoryId ? 'chip is-active' : 'chip'}
            onClick={() => handleCategory('')}
          >
            Todas
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              className={categoryId === category.id ? 'chip is-active' : 'chip'}
              onClick={() => handleCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

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
            <strong>No pudimos cargar los productos.</strong>
            <p>{error}</p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={loadProducts}>
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div className="product-grid" aria-label="Cargando productos">
          {Array.from({ length: 8 }).map((_, index) => (
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
              {totalElements} producto{totalElements === 1 ? '' : 's'}
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

          <nav className="pagination" aria-label="Paginación del catálogo">
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
          <h2>No encontramos productos con esos filtros.</h2>
          <p>Prueba con otra búsqueda o vuelve a ver todo el catálogo.</p>
          <button type="button" className="btn btn-primary" onClick={clearSearch}>
            Ver todos los productos
          </button>
        </div>
      )}
    </>
  );
}
