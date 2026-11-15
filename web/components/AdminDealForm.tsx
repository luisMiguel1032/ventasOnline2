'use client';

import { useEffect, useState, type FormEvent } from 'react';

import {
  DEAL_TYPE_OPTIONS,
  formatDealDate,
  formatDiscount,
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from '@/lib/deals';
import { formatPrice } from '@/lib/format';
import type { DealInput, DealType, ProductSummary } from '@/lib/types';

export interface AdminDealFormProps {
  products: ProductSummary[];
  loadingProducts?: boolean;
  initial?: Partial<DealInput>;
  submitLabel: string;
  submitting: boolean;
  error: string | null;
  showStatus?: boolean;
  onSubmit: (input: DealInput) => void | Promise<void>;
}

export function AdminDealForm({
  products,
  loadingProducts = false,
  initial,
  submitLabel,
  submitting,
  error,
  showStatus = false,
  onSubmit,
}: AdminDealFormProps) {
  const [productId, setProductId] = useState(initial?.productId ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [dealType, setDealType] = useState<DealType>(
    initial?.dealType ?? 'LIGHTNING',
  );
  const [discountPercent, setDiscountPercent] = useState(
    initial?.discountPercent !== undefined
      ? String(initial.discountPercent)
      : '20',
  );
  const [startsAt, setStartsAt] = useState(
    initial?.startsAt ? toDateTimeLocalValue(initial.startsAt) : '',
  );
  const [endsAt, setEndsAt] = useState(
    initial?.endsAt ? toDateTimeLocalValue(initial.endsAt) : '',
  );
  const [stockLimit, setStockLimit] = useState(
    initial?.stockLimit !== undefined ? String(initial.stockLimit) : '',
  );
  const [stockSold, setStockSold] = useState(
    initial?.stockSold !== undefined ? String(initial.stockSold) : '0',
  );
  const [status, setStatus] = useState(String(initial?.status ?? 1));
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (initial?.startsAt) return;

    setStartsAt((current) =>
      current || toDateTimeLocalValue(new Date().toISOString()),
    );
    setEndsAt((current) =>
      current ||
      toDateTimeLocalValue(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()),
    );
    // Solo se ejecuta al montar para no pisar lo que escribe el usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedProduct = products.find((product) => product.id === productId);
  const discountNumber = Number(discountPercent);
  const previewPrice =
    selectedProduct && Number.isFinite(discountNumber)
      ? Number(selectedProduct.price) * (1 - discountNumber / 100)
      : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    if (!productId) {
      setLocalError('Selecciona el producto de la oferta.');
      return;
    }

    if (!Number.isFinite(discountNumber) || discountNumber < 1 || discountNumber > 90) {
      setLocalError('El descuento debe estar entre 1% y 90%.');
      return;
    }

    if (!startsAt || !endsAt) {
      setLocalError('Indica la fecha de inicio y la fecha de fin.');
      return;
    }

    const starts = new Date(startsAt);
    const ends = new Date(endsAt);

    if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) {
      setLocalError('Las fechas no son válidas.');
      return;
    }

    if (ends.getTime() <= starts.getTime()) {
      setLocalError('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    const limitNumber = stockLimit.trim() === '' ? undefined : Number(stockLimit);
    if (limitNumber !== undefined && (!Number.isFinite(limitNumber) || limitNumber < 0)) {
      setLocalError('El stock de la oferta debe ser un número válido.');
      return;
    }

    const soldNumber = stockSold.trim() === '' ? undefined : Number(stockSold);
    if (soldNumber !== undefined && (!Number.isFinite(soldNumber) || soldNumber < 0)) {
      setLocalError('El stock vendido debe ser un número válido.');
      return;
    }

    if (
      limitNumber !== undefined &&
      soldNumber !== undefined &&
      soldNumber > limitNumber
    ) {
      setLocalError('El stock vendido no puede superar el stock de la oferta.');
      return;
    }

    const input: DealInput = {
      productId,
      title: title.trim() || undefined,
      dealType,
      discountPercent: discountNumber,
      startsAt: fromDateTimeLocalValue(startsAt),
      endsAt: fromDateTimeLocalValue(endsAt),
      stockLimit: limitNumber,
      stockSold: soldNumber,
      status: showStatus ? Number(status) : undefined,
    };

    await onSubmit(input);
  }

  return (
    <form className="form admin-form" onSubmit={handleSubmit}>
      {(localError || error) && (
        <div className="alert alert-compact" role="alert">
          <p>{localError ?? error}</p>
        </div>
      )}

      <label className="field">
        <span>Producto *</span>
        <select
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
          disabled={loadingProducts}
          required
        >
          <option value="">
            {loadingProducts ? 'Cargando productos…' : 'Selecciona un producto'}
          </option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} — {formatPrice(product.price)}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Título de la oferta</span>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={160}
          placeholder="Ej: Relámpago: Audífonos Bluetooth"
        />
      </label>

      <div className="admin-form-row">
        <label className="field">
          <span>Tipo de oferta *</span>
          <select
            value={dealType}
            onChange={(event) => setDealType(event.target.value as DealType)}
          >
            {DEAL_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Descuento (%) *</span>
          <input
            type="number"
            value={discountPercent}
            onChange={(event) => setDiscountPercent(event.target.value)}
            min="1"
            max="90"
            step="0.5"
            required
          />
        </label>
      </div>

      <div className="admin-form-row">
        <label className="field">
          <span>Empieza *</span>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Termina *</span>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
            required
          />
        </label>
      </div>

      <div className="admin-form-row">
        <label className="field">
          <span>Stock de la oferta</span>
          <input
            type="number"
            value={stockLimit}
            onChange={(event) => setStockLimit(event.target.value)}
            min="0"
            step="1"
            placeholder="Se usa el stock del producto"
          />
        </label>

        <label className="field">
          <span>Unidades ya vendidas</span>
          <input
            type="number"
            value={stockSold}
            onChange={(event) => setStockSold(event.target.value)}
            min="0"
            step="1"
            placeholder="0"
          />
        </label>
      </div>

      {showStatus && (
        <label className="field">
          <span>Estado de la configuración</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="1">Activa (se muestra si está en fecha)</option>
            <option value="0">Desactivada (solo historial)</option>
          </select>
        </label>
      )}

      {selectedProduct && previewPrice !== null && (
        <div className="deal-preview">
          <p className="eyebrow">Vista previa</p>
          <p className="deal-preview-name">{selectedProduct.name}</p>
          <div className="deal-price-row deal-price-row--large">
            <span className="deal-price">{formatPrice(previewPrice)}</span>
            <span className="price-old">{formatPrice(selectedProduct.price)}</span>
            {Number.isFinite(discountNumber) && (
              <span className="deal-discount-bubble">
                {formatDiscount(discountNumber)}
              </span>
            )}
          </div>
          <p className="admin-muted">
            El precio de oferta se calcula automáticamente desde el precio
            actual del producto. Vigencia: {formatDealDate(startsAt)} —{' '}
            {formatDealDate(endsAt)}
          </p>
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Guardando…' : submitLabel}
      </button>
    </form>
  );
}
