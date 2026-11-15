import Link from 'next/link';

import { DealCountdown } from './DealCountdown';
import { dealTypeClass, dealTypeLabel, formatDiscount } from '@/lib/deals';
import { PLACEHOLDER_IMAGE, formatPrice, formatRating, formatStock, stars, stockLabel } from '@/lib/format';
import type { ProductSummary } from '@/lib/types';

export function ProductCard({ product }: { product: ProductSummary }) {
  const image = product.image || PLACEHOLDER_IMAGE;
  const hasDeal = Boolean(product.dealId && product.dealPrice !== null);
  const effectiveStock = hasDeal
    ? Number(product.dealStockRemaining ?? product.stock)
    : Number(product.stock);
  const outOfStock = effectiveStock <= 0;

  return (
    <article className={hasDeal ? 'product-card has-deal' : 'product-card'}>
      <Link
        href={`/products/${product.id}`}
        className="product-image-link"
        aria-label={`Ver ${product.name}`}
      >
        <img
          src={image}
          alt={product.name}
          className="product-image"
          loading="lazy"
        />
        {hasDeal && (
          <span className={dealTypeClass(product.dealType)}>
            {dealTypeLabel(product.dealType)}
          </span>
        )}
        {hasDeal && (
          <span className="deal-discount-bubble">
            {formatDiscount(product.dealDiscountPercent)}
          </span>
        )}
      </Link>

      <div className="product-body">
        <p className="product-meta">
          {product.categoryName ?? 'Catálogo'}
          {product.brandName ? ` · ${product.brandName}` : ''}
        </p>

        <Link href={`/products/${product.id}`} className="product-name">
          {product.name}
        </Link>

        <div
          className="rating"
          aria-label={`${formatRating(product.ratingAvg)} de 5 estrellas`}
        >
          <span aria-hidden="true" className="rating-stars">
            {stars(product.ratingAvg)}
          </span>
          <span className="rating-count">({product.ratingCount})</span>
        </div>

        {hasDeal ? (
          <div className="deal-price-row">
            <span className="deal-price">{formatPrice(product.dealPrice!)}</span>
            <span className="price-old">{formatPrice(product.price)}</span>
          </div>
        ) : (
          <p className="product-price">{formatPrice(product.price)}</p>
        )}

        {hasDeal && (
          <DealCountdown
            endsAt={product.dealEndsAt}
            className="countdown countdown-card"
          />
        )}

        <p className={outOfStock ? 'stock is-out' : 'stock'}>
          {outOfStock
            ? 'Sin stock'
            : hasDeal
              ? `Quedan ${formatStock(effectiveStock)} unidades`
              : stockLabel(effectiveStock)}
        </p>
      </div>
    </article>
  );
}
