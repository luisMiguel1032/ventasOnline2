'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ApiError, deleteProduct, getProducts } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { formatPrice, formatStock } from '@/lib/format';
import type { PageResponse, ProductSummary } from '@/lib/types';

export default function AdminProductsPage() {
  const { session } = useAuth();
  const [data, setData] = useState<PageResponse<ProductSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getProducts({ page: 0, size: 20, sort: 'newest' });
      setData(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el catálogo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(product: ProductSummary) {
    if (!session?.accessToken) return;
    const confirmed = window.confirm(
      `¿Eliminar el producto "${product.name}"? Dejará de mostrarse en la tienda.`,
    );
    if (!confirmed) return;

    setDeletingId(product.id);
    setError(null);
    try {
      await deleteProduct(session.accessToken, product.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar el producto.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Productos</h1>
          <p className="admin-muted">Vista administrativa del catálogo.</p>
        </div>
        <div className="admin-header-actions">
          <Link href="/admin" className="btn btn-ghost">
            ← Panel
          </Link>
          <Link href="/admin/products/new" className="btn btn-primary">
            Nuevo producto
          </Link>
        </div>
      </header>

      {error && (
        <div className="alert" role="alert">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="admin-card">Cargando productos…</div>
      ) : data && data.content.length > 0 ? (
        <div className="admin-card admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Marca</th>
                <th>Precio</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>{p.categoryName ?? '—'}</td>
                  <td>{p.brandName ?? '—'}</td>
                  <td>{formatPrice(p.price)}</td>
                  <td>{formatStock(p.stock)}</td>
                  <td>
                    <div className="admin-row-actions">
                      <Link href={`/admin/products/${p.id}`} className="admin-link">
                        Editar
                      </Link>
                      <Link href={`/products/${p.id}`} className="admin-link">
                        Ver
                      </Link>
                      <button
                        type="button"
                        className="admin-link admin-link--danger"
                        onClick={() => void handleDelete(p)}
                        disabled={deletingId === p.id}
                      >
                        {deletingId === p.id ? '…' : 'Eliminar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="admin-muted admin-table-foot">
            Mostrando {data.content.length} de {data.totalElements} productos.
          </p>
        </div>
      ) : (
        <div className="empty-state">
          <h2>No hay productos</h2>
          <p>Crea el primer producto desde el panel.</p>
          <Link href="/admin/products/new" className="btn btn-primary">
            Crear producto
          </Link>
        </div>
      )}
    </div>
  );
}
