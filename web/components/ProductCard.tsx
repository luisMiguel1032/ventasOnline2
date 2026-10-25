import Link from 'next/link';

import { PLACEHOLDER_IMAGE, formatPrice, formatRating, stars, stockLabel } from '@/lib/format';
import type { ProductSummary } from '@/lib/types';

export function ProductCard({ product }: { product: ProductSummary }) {
  const image = product.image || PLACEHOLDER_IMAGE;
  const outOfStock = product.stock <= 0;

  return (
    <article className="product-card">
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

        <p className="product-price">{formatPrice(product.price)}</p>
        <p className={outOfStock ? 'stock is-out' : 'stock'}>
          {stockLabel(product.stock)}
        </p>
      </div>
    </article>
  );
}
