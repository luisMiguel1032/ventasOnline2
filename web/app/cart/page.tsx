'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

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
import { formatPrice } from '@/lib/format';
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
      const [cart, prods] = await Promise.all([
        getCart(token),
        getProducts({ size: 100 }),
      ]);
      setItems(cart.items);
      setProducts(prods.content);
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
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      await clearCart(token);
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo procesar la compra.');
    } finally {
      setCheckingOut(false);
    }
  }

  if (!session) {
    return (
      <div className="empty-state">
        <h2>Inicia sesión para ver tu carrito</h2>
        <Link href="/login" className="btn btn-primary">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const total = items.reduce((sum, item) => {
    const p = productOf(item.productId);
    return sum + (p ? Number(p.price) * Number(item.quantity) : 0);
  }, 0);

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
                const p = productOf(item.productId);
                const subtotal = p ? Number(p.price) * Number(item.quantity) : 0;
                return (
                  <tr key={item.productId}>
                    <td>
                      <strong>{p?.name ?? item.productId}</strong>
                    </td>
                    <td>{p ? formatPrice(p.price) : '—'}</td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          void handleQuantity(item.productId, Number(e.target.value))
                        }
                        style={{ width: '70px' }}
                      />
                    </td>
                    <td>{formatPrice(subtotal)}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-link admin-link--danger"
                        onClick={() => void handleRemove(item.productId)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="admin-header-actions" style={{ marginTop: '1rem' }}>
            <strong>Total: {formatPrice(total)}</strong>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void handleCheckout()}
              disabled={checkingOut}
            >
              {checkingOut ? 'Procesando…' : 'Finalizar compra'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
