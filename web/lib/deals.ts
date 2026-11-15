import type { DealType } from './types';

export const DEAL_TYPE_LABELS: Record<DealType, string> = {
  LIGHTNING: 'Relámpago',
  FEATURED: 'Destacada',
  DAILY: 'Del día',
};

export const DEAL_TYPE_OPTIONS: { value: DealType; label: string }[] = [
  { value: 'LIGHTNING', label: 'Oferta relámpago' },
  { value: 'FEATURED', label: 'Oferta destacada' },
  { value: 'DAILY', label: 'Oferta del día' },
];

export function dealTypeLabel(type: string | null | undefined): string {
  if (!type) return 'Oferta';
  return DEAL_TYPE_LABELS[type as DealType] ?? 'Oferta';
}

export function dealTypeClass(type: string | null | undefined): string {
  switch (type) {
    case 'LIGHTNING':
      return 'deal-badge deal-badge--lightning';
    case 'FEATURED':
      return 'deal-badge deal-badge--featured';
    default:
      return 'deal-badge deal-badge--daily';
  }
}

export function formatDiscount(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const number = Number(value);
  if (!Number.isFinite(number)) return '';
  return number % 1 === 0 ? `-${number}%` : `-${number.toFixed(1)}%`;
}

export function remainingMs(endsAt: string | null | undefined): number {
  if (!endsAt) return 0;
  return new Date(endsAt).getTime() - Date.now();
}

export function formatRemaining(endsAt: string | null | undefined): string {
  if (!endsAt) return '';

  const ms = remainingMs(endsAt);
  if (ms <= 0) return 'Oferta terminada';

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const clock = [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');

  return days > 0 ? `${days}d ${clock}` : clock;
}

export function formatDealDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Valor compatible con <input type="datetime-local"> en hora local. */
export function toDateTimeLocalValue(value: string | null | undefined): string {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);

  return local.toISOString().slice(0, 16);
}

/** Convierte el valor local del formulario a un Instant ISO-8601. */
export function fromDateTimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

export function stockProgressLabel(remaining: number, limit: number): string {
  const safeRemaining = Math.max(0, Number(remaining) || 0);
  const safeLimit = Math.max(0, Number(limit) || 0);

  if (safeLimit <= 0) return `${safeRemaining} disponibles`;
  return `Quedan ${safeRemaining} de ${safeLimit}`;
}
