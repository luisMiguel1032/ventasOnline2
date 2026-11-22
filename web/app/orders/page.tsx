'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/AuthProvider';
import { ApiError, getOrders } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { formatDealDate } from '@/lib/deals';
import type { OrderResponse } from '@/lib/types';

export default function OrdersPage() {
  const { session } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = session?.accessToken;

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getOrders(token)
      .then((result) => {
        if (active) setOrders(result);
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los pedidos.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  if (!session) {
    return (
      <div className="empty-state">
        <h2>Inicia sesiÃ³n para ver tus pedidos</h2>
        <Link href="/login" className="btn btn-primary">
          Iniciar sesiÃ³n
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Mis pedidos</p>
          <h1>Pedidos</h1>
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
        <div className="admin-card">Cargando pedidosâ€¦</div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <h2>No tienes pedidos todavÃ­a</h2>
          <p>Realiza tu primera compra desde el carrito.</p>
          <Link href="/cart" className="btn btn-primary">
            Ir al carrito
          </Link>
        </div>
      ) : (
        <div className="admin-card admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.orderNumber ?? order.id.slice(0, 8)}</strong>
                  </td>
                  <td>{formatDealDate(order.createdAt)}</td>
                  <td>{order.status}{order.paymentStatus ? ` / ${order.paymentStatus}` : ''}</td>
                  <td>{formatPrice(order.totalAmount)}</td>
                  <td>
                    <Link href={`/orders/${order.id}`} className="admin-link">
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

