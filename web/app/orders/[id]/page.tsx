'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/AuthProvider';
import { ApiError, getOrder } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import type { OrderResponse } from '@/lib/types';

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { session } = useAuth();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = session?.accessToken;

  useEffect(() => {
    if (!token || !id) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getOrder(token, id)
      .then((result) => {
        if (active) setOrder(result);
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError ? err.message : 'No se pudo cargar el pedido.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, id]);

  if (!session) {
    return (
      <div className="empty-state">
        <h2>Inicia sesión para ver el pedido</h2>
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
          <p className="eyebrow">Pedido</p>
          <h1>{order ? `Pedido ${order.id.slice(0, 8)}` : 'Pedido'}</h1>
        </div>
        <Link href="/orders" className="btn btn-ghost">
          ← Mis pedidos
        </Link>
      </header>

      {error && (
        <div className="alert" role="alert">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="admin-card">Cargando pedido…</div>
      ) : order ? (
        <div className="admin-card">
          <p>
            <strong>Estado:</strong> {order.status}
          </p>
          <p>
            <strong>Total:</strong> {formatPrice(order.totalAmount)}
          </p>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio unitario</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.productName}</td>
                  <td>{formatPrice(item.unitPrice)}</td>
                  <td>{item.quantity}</td>
                  <td>{formatPrice(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
