'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { useAuth } from '@/components/AuthProvider';
import { ApiError, createProduct, getBrands, getCategories } from '@/lib/api';
import type { Brand, Category, ProductInput } from '@/lib/types';

export default function AdminNewProductPage() {
  const { session } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [image, setImage] = useState('');
  const [features, setFeatures] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getCategories(), getBrands()])
      .then(([cats, brs]) => {
        if (!active) return;
        setCategories(cats);
        setBrands(brs);
      })
      .catch(() => {
        // el formulario sigue usable sin listas
      })
      .finally(() => {
        if (active) setLoadingMeta(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!session?.accessToken) {
      setError('Sesión no disponible. Vuelve a iniciar sesión como administrador.');
      return;
    }

    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError('El precio debe ser un número válido.');
      return;
    }

    const stockNum = stock.trim() === '' ? 0 : Number(stock);
    if (!Number.isFinite(stockNum) || stockNum < 0) {
      setError('El stock debe ser un número válido.');
      return;
    }

    const input: ProductInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: priceNum,
      stock: stockNum,
      categoryId: categoryId || undefined,
      brandId: brandId || undefined,
      image: image.trim() || undefined,
      features: features.trim() || undefined,
    };

    setSubmitting(true);
    try {
      const created = await createProduct(session.accessToken, input);
      router.push(`/products/${created.id}`);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setError('No autorizado. Inicia sesión con una cuenta ADMIN.');
      } else {
        setError(err instanceof ApiError ? err.message : 'No se pudo crear el producto.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Nuevo producto</h1>
          <p className="admin-muted">Solo administradores pueden crear productos.</p>
        </div>
        <div className="admin-header-actions">
          <Link href="/admin/products" className="btn btn-ghost">
            ← Productos
          </Link>
        </div>
      </header>

      <div className="admin-card">
        {error && (
          <div className="alert alert-compact" role="alert">
            <p>{error}</p>
          </div>
        )}

        <form className="form admin-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Nombre *</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={160}
              placeholder="Ej: Teclado mecánico"
            />
          </label>

          <label className="field">
            <span>Descripción</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
              rows={4}
              placeholder="Descripción del producto"
            />
          </label>

          <div className="admin-form-row">
            <label className="field">
              <span>Precio *</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </label>
            <label className="field">
              <span>Stock</span>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                min="0"
                step="1"
                placeholder="0"
              />
            </label>
          </div>

          <div className="admin-form-row">
            <label className="field">
              <span>Categoría</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loadingMeta}
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Marca</span>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                disabled={loadingMeta}
              >
                <option value="">Sin marca</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span>URL de imagen</span>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              maxLength={500}
              placeholder="https://..."
            />
          </label>

          <label className="field">
            <span>Características (separadas por ; o |)</span>
            <input
              type="text"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="Bluetooth 5.3; Batería 30 h"
            />
          </label>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creando...' : 'Crear producto'}
          </button>
        </form>
      </div>
    </div>
  );
}
