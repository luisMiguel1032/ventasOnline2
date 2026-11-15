'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { DealCountdown } from '@/components/DealCountdown';
import { ApiError, addCartItem, getProduct } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import {
  dealTypeClass,
  dealTypeLabel,
  formatDiscount,
  stockProgressLabel,
} from '@/lib/deals';
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
  const { session } = useAuth();
  const [adding, setAdding] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);

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

    document.title = `${product.name} ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Ârbol de Venta`;

    return () => {
      document.title = 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Ârbol de Venta ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â tu tienda online';
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
        <p>{error ?? 'Puede que ya no exista o estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© inactivo.'}</p>
        <Link href="/" className="btn btn-primary">
          Volver al catÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡logo
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
  const hasDeal = Boolean(product.dealId && product.dealPrice !== null);
  const effectiveStock = hasDeal
    ? Number(product.dealStockRemaining ?? product.stock)
    : Number(product.stock);
  const dealPercent = Math.max(
    0,
    Math.min(100, Number(product.dealStockPercent) || 0),
  );

  async function handleAddToCart() {
    if (!product) return;
    if (!session?.accessToken) {
      setCartMessage('Inicia sesión para comprar.');
      return;
    }
    setAdding(true);
    setCartMessage(null);
    try {
      await addCartItem(session.accessToken, product.id, 1);
      setCartMessage('Agregado al carrito.');
    } catch (err) {
      setCartMessage(err instanceof ApiError ? err.message : 'No se pudo agregar.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <nav className="breadcrumb" aria-label="Ruta de navegaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n">
        <Link href="/">Inicio</Link>
        <span>/</span>
        <span>{product.categoryName ?? 'CatÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡logo'}</span>
        <span>/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <article className="detail-card">
        <div className="detail-gallery">
          <div className="detail-main-image">
            <img src={mainImage} alt={product.name} />
          </div>

          {gallery.length > 1 && (
            <div className="thumbnails" aria-label="ImÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡genes del producto">
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

          {product.videoUrl && (
            <div className="detail-video">
              <video controls poster={mainImage} src={product.videoUrl}>
                Tu navegador no soporta video.
              </video>
            </div>
          )}
        </div>

        <div className="detail-info">
          <p className="product-meta">
            {product.categoryName ?? 'CatÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡logo'}
            {product.brandName ? ` ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${product.brandName}` : ''}
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
            <span className="rating-count">({product.ratingCount} reseÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±as)</span>
          </div>

          {hasDeal ? (
            <div className="detail-deal-box">
              <div className="detail-deal-head">
                <span className={dealTypeClass(product.dealType)}>
                  {dealTypeLabel(product.dealType)}
                </span>
                <span className="deal-discount-bubble">
                  {formatDiscount(product.dealDiscountPercent)}
                </span>
              </div>

              <div className="deal-price-row deal-price-row--large">
                <span className="detail-price">
                  {formatPrice(product.dealPrice!)}
                </span>
                <span className="price-old">{formatPrice(product.price)}</span>
              </div>

              <DealCountdown
                endsAt={product.dealEndsAt}
                className="countdown countdown-large"
              />

              <div className="stock-progress" aria-hidden="true">
                <span
                  className={
                    dealPercent <= 20
                      ? 'stock-progress-fill is-low'
                      : 'stock-progress-fill'
                  }
                  style={{ width: `${dealPercent}%` }}
                />
              </div>
              <p
                className={
                  dealPercent <= 20
                    ? 'stock-progress-label is-low'
                    : 'stock-progress-label'
                }
              >
                {stockProgressLabel(
                  Number(product.dealStockRemaining ?? 0),
                  Number(product.dealStockLimit ?? product.stock),
                )}
              </p>
            </div>
          ) : (
            <p className="detail-price">{formatPrice(product.price)}</p>
          )}

          <p
            className={
              effectiveStock > 0
                ? 'stock stock-large'
                : 'stock stock-large is-out'
            }
          >
            {stockLabel(effectiveStock)}
            {effectiveStock > 0
              ? ` ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${formatStock(effectiveStock)} disponibles`
              : ''}
          </p>

          <p className="detail-description">
            {product.description ?? 'Este producto todavÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a no tiene descripciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n.'}
          </p>

          {features.length > 0 && (
            <section className="features">
              <h2>CaracterÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­sticas</h2>
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
              onClick={() => void handleAddToCart()}
              disabled={adding || effectiveStock <= 0}
            >
              {adding
                ? 'AgregandoÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦'
                : effectiveStock <= 0
                  ? 'Sin stock'
                  : hasDeal
                    ? 'Aprovechar oferta'
                    : 'Agregar al carrito'}
            </button>
            {cartMessage && <p className="admin-muted">{cartMessage}</p>}
            <Link href="/" className="btn btn-ghost">
              Seguir comprando
            </Link>
          </div>

          <p className="hint">
            El carrito y el checkout se habilitan en la siguiente fase.
          </p>

          <dl className="specs">
            <div>
              <dt>CÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³digo</dt>
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
