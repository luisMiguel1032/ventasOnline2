const priceFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'narrowSymbol',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 0,
});

export function formatPrice(value: number | string): string {
  const number = typeof value === 'string' ? Number(value) : value;
  return priceFormatter.format(Number.isFinite(number) ? number : 0);
}

export function formatRating(value: number): string {
  return Number(value).toFixed(1);
}

export function formatStock(value: number): string {
  return numberFormatter.format(Number(value));
}

export function stockLabel(stock: number): string {
  if (stock <= 0) return 'Sin stock';
  if (stock < 5) return `Últimas ${formatStock(stock)} unidades`;
  return 'En stock';
}

export function stars(rating: number): string {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

export const PLACEHOLDER_IMAGE =
  'https://placehold.co/600x600/f3f4f6/565959?text=Sin+imagen';
