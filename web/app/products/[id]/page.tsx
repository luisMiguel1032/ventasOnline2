'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ApiError, getProduct } from '@/lib/api';
import {
  PLACEHOLDER_IMAGE,
  formatPrice,
  formatRating,
  formatStock,
  stars,
  stockLabel,
} from '@/lib/format';
import type { ProductDetail } from '@/lib/types';

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let active = true;
    setLoading(true);
    setError(null);

    getProduct(id)
      .then((result) => {
        if (!active) return;
        setProduct(result);
        setSelectedImage(result.image ?? result.images?.[0] ?? null);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof ApiError
            ? err.message
            : 'No se pudo cargar el producto.',
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!product) return;

    document.title = `${product.name} — Árbol de Venta`;

    return () => {
      document.title = 'Árbol de Venta — tu tienda online';
    };
  }, [product]);

  if (loading) {
    return (
      <div className="detail-card detail-loading" aria-live="polite">
        <div className="skeleton detail-skeleton-image" />
        <div className="detail-skeleton-info">
          <div className="skeleton skeleton-line short" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line medium" />
          <div className="skeleton skeleton-line" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="empty-state">
        <p className="eyebrow">Producto no disponible</p>
        <h1>No encontramos este producto.</h1>
        <p>{error ?? 'Puede que ya no exista o esté inactivo.'}</p>
        <Link href="/" className="btn btn-primary">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const images = product.images ?? [];
  const gallery =
    images.length > 0
      ? images
      : product.image
        ? [product.image]
        : [];
  const mainImage = selectedImage || product.image || PLACEHOLDER_IMAGE;
  const features = (product.features ?? '')
    .split(/[|;\n]+/)
    .map((feature) => feature.trim())
    .filter(Boolean);

  return (
    <>
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link>
        <span>/</span>
        <span>{product.categoryName ?? 'Catálogo'}</span>
        <span>/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <article className="detail-card">
        <div className="detail-gallery">
          <div className="detail-main-image">
            <img src={mainImage} alt={product.name} />
          </div>

          {gallery.length > 1 && (
            <div className="thumbnails" aria-label="Imágenes del producto">
              {gallery.map((image) => (
                <button
                  type="button"
                  key={image}
                  className={
                    image === mainImage ? 'thumbnail is-active' : 'thumbnail'
                  }
                  onClick={() => setSelectedImage(image)}
                  aria-label="Ver imagen"
                  aria-pressed={image === mainImage}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-info">
          <p className="product-meta">
            {product.categoryName ?? 'Catálogo'}
            {product.brandName ? ` · ${product.brandName}` : ''}
          </p>

          <h1>{product.name}</h1>

          <div
            className="rating rating-large"
            aria-label={`${formatRating(product.ratingAvg)} de 5 estrellas`}
          >
            <span aria-hidden="true" className="rating-stars">
              {stars(product.ratingAvg)}
            </span>
            <span>{formatRating(product.ratingAvg)}</span>
            <span className="rating-count">({product.ratingCount} reseñas)</span>
          </div>

          <p className="detail-price">{formatPrice(product.price)}</p>

          <p className={product.stock > 0 ? 'stock stock-large' : 'stock stock-large is-out'}>
            {stockLabel(product.stock)}
            {product.stock > 0
              ? ` · ${formatStock(product.stock)} disponibles`
              : ''}
          </p>

          <p className="detail-description">
            {product.description ?? 'Este producto todavía no tiene descripción.'}
          </p>

          {features.length > 0 && (
            <section className="features">
              <h2>Características</h2>
              <ul>
                {features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </section>
          )}

          <div className="detail-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled
              title="El carrito se habilita en la Fase 3"
            >
              Agregar al carrito
            </button>
            <Link href="/" className="btn btn-ghost">
              Seguir comprando
            </Link>
          </div>

          <p className="hint">
            El carrito y el checkout se habilitan en la siguiente fase.
          </p>

          <dl className="specs">
            <div>
              <dt>Código</dt>
              <dd>{product.code}</dd>
            </div>
            <div>
              <dt>SKU</dt>
              <dd>{product.itemCode}</dd>
            </div>
            <div>
              <dt>Marca</dt>
              <dd>{product.brandName ?? 'Sin marca'}</dd>
            </div>
            <div>
              <dt>Tipo</dt>
              <dd>{product.type}</dd>
            </div>
          </dl>
        </div>
      </article>
    </>
  );
}
