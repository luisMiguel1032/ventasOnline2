import Link from 'next/link';

import { DealCountdown } from './DealCountdown';
import {
  dealTypeClass,
  dealTypeLabel,
  formatDiscount,
  stockProgressLabel,
} from '@/lib/deals';
import { PLACEHOLDER_IMAGE, formatPrice, formatRating, stars } from '@/lib/format';
import type { DealSummary } from '@/lib/types';

export function DealCard({ deal }: { deal: DealSummary }) {
  const image = deal.image || PLACEHOLDER_IMAGE;
  const percent = Math.max(0, Math.min(100, Number(deal.stockPercent) || 0));
  const lowStock = percent <= 20;
  const savings = Number(deal.originalPrice) - Number(deal.dealPrice);

  return (
    <article className="deal-card">
      <div className="deal-card-media">
        <Link
          href={`/products/${deal.productId}`}
          aria-label={`Ver ${deal.productName}`}
        >
          <img src={image} alt={deal.productName} loading="lazy" />
        </Link>
        <span className={dealTypeClass(deal.dealType)}>
          {dealTypeLabel(deal.dealType)}
        </span>
        <span className="deal-discount-bubble">
          {formatDiscount(deal.discountPercent)}
        </span>
      </div>

      <div className="deal-card-body">
        <p className="product-meta">
          {deal.categoryName ?? 'Catálogo'}
          {deal.brandName ? ` · ${deal.brandName}` : ''}
        </p>

        <Link href={`/products/${deal.productId}`} className="product-name">
          {deal.productName}
        </Link>

        <div
          className="rating"
          aria-label={`${formatRating(deal.ratingAvg)} de 5 estrellas`}
        >
          <span aria-hidden="true" className="rating-stars">
            {stars(deal.ratingAvg)}
          </span>
          <span className="rating-count">({deal.ratingCount})</span>
        </div>

        <div className="deal-price-row">
          <span className="deal-price">{formatPrice(deal.dealPrice)}</span>
          <span className="price-old">{formatPrice(deal.originalPrice)}</span>
        </div>

        {savings > 0 && (
          <p className="deal-saving">
            Ahorras {formatPrice(savings)} ({dealTypeLabel(deal.dealType)})
          </p>
        )}

        <DealCountdown endsAt={deal.endsAt} className="countdown countdown-card" />

        <div className="stock-progress" aria-hidden="true">
          <span
            className={lowStock ? 'stock-progress-fill is-low' : 'stock-progress-fill'}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className={lowStock ? 'stock-progress-label is-low' : 'stock-progress-label'}>
          {stockProgressLabel(deal.stockRemaining, deal.stockLimit)}
        </p>

        <Link
          href={`/products/${deal.productId}`}
          className="btn btn-primary btn-block"
        >
          Ver oferta
        </Link>
      </div>
    </article>
  );
}
