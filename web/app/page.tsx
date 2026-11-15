'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { DealCard } from '@/components/DealCard';
import { ProductCard } from '@/components/ProductCard';
import { ApiError, getCategories, getDeals, getProducts } from '@/lib/api';
import type {
  Category,
  DealSummary,
  PageResponse,
  ProductSummary,
} from '@/lib/types';

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
  const [featuredDeals, setFeaturedDeals] = useState<DealSummary[]>([]);
  const [lightningDeals, setLightningDeals] = useState<DealSummary[]>([]);
  const [videoProducts, setVideoProducts] = useState<ProductSummary[]>([]);
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

    getDeals({ type: 'FEATURED', sort: 'discount_desc', size: 4 })
      .then((result) => {
        if (active) setFeaturedDeals(result.content);
      })
      .catch(() => {
        // Las ofertas son un extra: el catálogo no depende de ellas.
      });

    getDeals({ type: 'LIGHTNING', sort: 'ending_soon', size: 4 })
      .then((result) => {
        if (active) setLightningDeals(result.content);
      })
      .catch(() => {
        // Idem: si falla, simplemente no se muestra la franja.
      });

    getProducts({ sort: 'newest', size: 24 })
      .then((result) => {
        if (active) {
          setVideoProducts(
            result.content.filter((product) => Boolean(product.videoUrl)).slice(0, 4),
          );
        }
      })
      .catch(() => {
        // Los videos son un extra: el catálogo no depende de ellos.
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
        <p className="eyebrow">Bienvenido a Árbol de Venta</p>
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

      {featuredDeals.length > 0 && (
        <section className="deal-section" aria-labelledby="featured-deals-title">
          <header className="deal-section-head">
            <div>
              <p className="eyebrow">Ahorra más</p>
              <h2 id="featured-deals-title">Ofertas destacadas</h2>
            </div>
            <Link href="/deals?type=FEATURED" className="text-link">
              Ver destacadas →
            </Link>
          </header>

          <div className="deal-grid">
            {featuredDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </section>
      )}

      {lightningDeals.length > 0 && (
        <section
          className="deal-section deal-section--lightning"
          aria-labelledby="lightning-deals-title"
        >
          <header className="deal-section-head">
            <div>
              <p className="eyebrow">⚡ Por tiempo limitado</p>
              <h2 id="lightning-deals-title">Ofertas relámpago</h2>
            </div>
            <Link href="/deals?type=LIGHTNING" className="text-link">
              Ver relámpagos →
            </Link>
          </header>

          <div className="deal-grid">
            {lightningDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </section>
      )}

      {videoProducts.length > 0 && (
        <section className="deal-section deal-section--video" aria-labelledby="video-products-title">
          <header className="deal-section-head">
            <div>
              <p className="eyebrow">▶ Compra en video</p>
              <h2 id="video-products-title">Videos de productos</h2>
            </div>
            <Link href="/products" className="text-link">
              Ver catálogo →
            </Link>
          </header>

          <div className="product-grid">
            {videoProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <section
        className="toolbar"
        id="categorias"
        aria-label="Filtros del catálogo"
      >
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
