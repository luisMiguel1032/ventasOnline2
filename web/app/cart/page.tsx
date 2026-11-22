'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/AuthProvider';
import {
  ApiError,
  checkout,
  clearCart,
  getCart,
  getProducts,
  removeCartItem,
  updateCartItem,
} from '@/lib/api';
import { PLACEHOLDER_IMAGE, formatPrice } from '@/lib/format';
import type { CartItem, ProductSummary } from '@/lib/types';

export default function CartPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const token = session?.accessToken;

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const cart = await getCart(token);
      setItems(cart.items);

      const needsLookup = cart.items.some((i) => !i.productName || i.unitPrice == null);
      if (needsLookup) {
        const prods = await getProducts({ size: 100 });
        setProducts(prods.content);
      } else {
        setProducts([]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el carrito.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  function productOf(productId: string) {
    return products.find((p) => p.id === productId);
  }

  function displayInfo(item: CartItem) {
    const p = productOf(item.productId);
    const name = item.productName ?? p?.name ?? item.productId.slice(0, 8);
    const unitPrice = item.unitPrice != null ? Number(item.unitPrice) : (p ? Number(p.price) : null);
    const image = item.imageUrl ?? p?.image ?? PLACEHOLDER_IMAGE;
    const slug = item.productSlug ?? p?.slug ?? null;
    return { name, unitPrice, image, slug };
  }

  async function handleQuantity(productId: string, quantity: number) {
    if (!token) return;
    if (quantity <= 0) {
      await handleRemove(productId);
      return;
    }
    try {
      const cart = await updateCartItem(token, productId, quantity);
      setItems(cart.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar.');
    }
  }

  async function handleRemove(productId: string) {
    if (!token) return;
    try {
      const cart = await removeCartItem(token, productId);
      setItems(cart.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar.');
    }
  }

  async function handleCheckout() {
    if (!token || items.length === 0) return;
    setCheckingOut(true);
    setError(null);
    try {
      const order = await checkout(token, {
        items: items.map((i) => ({ productId: i.productId, quantity: Number(i.quantity) })),
      });
      await clearCart(token);
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo procesar la compra.');
    } finally {
      setCheckingOut(false);
    }
  }

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const { unitPrice } = displayInfo(item);
      if (unitPrice == null) return sum;
      return sum + unitPrice * Number(item.quantity);
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, products]);

  if (!session) {
    return (
      <div className="empty-state">
        <h2>Inicia sesión para ver tu carrito</h2>
        <p>Necesitas una cuenta de cliente para agregar productos y comprar.</p>
        <Link href="/login" className="btn btn-primary">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Tu carrito</p>
          <h1>Carrito de compras</h1>
        </div>
        <Link href="/" className="btn btn-ghost">
          Seguir comprando
        </Link>
      </header>

      {error && (
        <div className="alert" role="alert">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="admin-card">Cargando carrito…</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <h2>Tu carrito está vacío</h2>
          <p>Agrega productos desde el catálogo.</p>
          <Link href="/" className="btn btn-primary">
            Ir al catálogo
          </Link>
        </div>
      ) : (
        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const info = displayInfo(item);
                const subtotal = info.unitPrice != null ? info.unitPrice * Number(item.quantity) : null;
                return (
                  <tr key={item.productId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={info.image}
                          alt={info.name}
                          width={48}
                          height={48}
                          style={{ objectFit: 'cover', borderRadius: 6 }}
                        />
                        <Link href={`/products/${item.productId}`} className="admin-link">
                          {info.name}
                        </Link>
                      </div>
                    </td>
                    <td>{info.unitPrice != null ? formatPrice(info.unitPrice) : '—'}</td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={Number(item.quantity)}
                        onChange={(e) => void handleQuantity(item.productId, Number(e.target.value))}
                        style={{ width: 80 }}
                      />
                    </td>
                    <td>{subtotal != null ? formatPrice(subtotal) : '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-link admin-link--danger"
                        onClick={() => void handleRemove(item.productId)}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="admin-header-actions" style={{ marginTop: '1rem', justifyContent: 'space-between' }}>
            <strong>Total estimado: {formatPrice(total)}</strong>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void handleCheckout()}
              disabled={checkingOut || items.length === 0}
            >
              {checkingOut ? 'Procesando…' : 'Finalizar compra'}
            </button>
          </div>
          <p className="hint" style={{ marginTop: '0.75rem' }}>
            Al finalizar se creará tu pedido con los precios vigentes. El pago y envío se coordinan según disponibilidad.
          </p>
        </div>
      )}
    </div>
  );
}
