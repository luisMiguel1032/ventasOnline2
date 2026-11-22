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
        <h2>Inicia sesiÃ³n para ver el pedido</h2>
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
          <p className="eyebrow">Pedido</p>
          <h1>{order ? `Pedido ${order.id.slice(0, 8)}` : 'Pedido'}</h1>
        </div>
        <Link href="/orders" className="btn btn-ghost">
          â† Mis pedidos
        </Link>
      </header>

      {error && (
        <div className="alert" role="alert">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="admin-card">Cargando pedidoâ€¦</div>
      ) : order ? (
        <div className="admin-card">
          <p>
            <strong>NÃºmero:</strong> {order.orderNumber ?? order.id.slice(0, 8)}
          </p>
          <p>
            <strong>Estado:</strong> {order.status}
            {order.paymentStatus ? ` Â· Pago: ${order.paymentStatus}` : ''}
          </p>
          {order.subtotal != null && (
            <p>
              <strong>Subtotal:</strong> {formatPrice(order.subtotal)}
            </p>
          )}
          {order.discount != null && order.discount > 0 && (
            <p>
              <strong>Descuento:</strong> {formatPrice(order.discount)}
            </p>
          )}
          <p>
            <strong>Total:</strong> {formatPrice(order.totalAmount)}
          </p>
          {(order.shippingName || order.shippingAddress || order.shippingCity || order.shippingPhone) && (
            <div className="hint" style={{ marginTop: '1rem' }}>
              <strong>EnvÃ­o:</strong>
              <div>{order.shippingName ?? 'â€”'}</div>
              <div>{[order.shippingAddress, order.shippingCity].filter(Boolean).join(', ') || 'â€”'}</div>
              {order.shippingPhone ? <div>Tel: {order.shippingPhone}</div> : null}
            </div>
          )}

          <table className="admin-table" style={{ marginTop: '1rem' }}>
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
                <tr key={`${item.productId}-${idx}`}>
                  <td>
                    {item.productSlug ? (
                      <Link href={`/products/${item.productId}`} className="admin-link">
                        {item.productName}
                      </Link>
                    ) : (
                      item.productName
                    )}
                  </td>
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

