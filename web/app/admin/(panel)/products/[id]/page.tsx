'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { useAuth } from '@/components/AuthProvider';
import {
  ApiError,
  deleteProduct,
  getBrands,
  getCategories,
  getProduct,
  updateProduct,
} from '@/lib/api';
import type { Brand, Category, ProductDetail, ProductInput } from '@/lib/types';

export default function AdminEditProductPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { session } = useAuth();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [image, setImage] = useState('');
  const [features, setFeatures] = useState('');
  const [type, setType] = useState('physical');
  const [unitName, setUnitName] = useState('unidad');
  const [code, setCode] = useState('');
  const [itemCode, setItemCode] = useState('');

  useEffect(() => {
    if (!id) return;

    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([getProduct(id), getCategories(), getBrands()])
      .then(([prod, cats, brs]) => {
        if (!active) return;
        setProduct(prod);
        setCategories(cats);
        setBrands(brs);

        setName(prod.name);
        setDescription(prod.description ?? '');
        setPrice(String(prod.price));
        setStock(String(prod.stock));
        setCategoryId(prod.categoryId ?? '');
        setBrandId(prod.brandId ?? '');
        setImage(prod.image ?? '');
        setFeatures(prod.features ?? '');
        setType(prod.type ?? 'physical');
        setUnitName(prod.unitName ?? 'unidad');
        setCode(prod.code ?? '');
        setItemCode(prod.itemCode ?? '');
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : 'No se pudo cargar el producto.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!session?.accessToken || !id) {
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
      type: type.trim() || undefined,
      unitName: unitName.trim() || undefined,
      code: code.trim() || undefined,
      itemCode: itemCode.trim() || undefined,
    };

    setSubmitting(true);
    try {
      await updateProduct(session.accessToken, id, input);
      router.push('/admin/products');
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setError('No autorizado. Inicia sesión con una cuenta ADMIN.');
      } else {
        setError(err instanceof ApiError ? err.message : 'No se pudo actualizar el producto.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!session?.accessToken || !id || !product) return;

    const confirmed = window.confirm(
      `¿Eliminar el producto "${product.name}"? Dejará de mostrarse en la tienda.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      await deleteProduct(session.accessToken, id);
      router.push('/admin/products');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo eliminar el producto.',
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>{product ? `Editar: ${product.name}` : 'Editar producto'}</h1>
          <p className="admin-muted">Actualiza los datos del producto.</p>
        </div>
        <div className="admin-header-actions">
          <Link href="/admin/products" className="btn btn-ghost">
            ← Productos
          </Link>
          {product && (
            <Link href={`/products/${product.id}`} className="btn btn-ghost">
              Ver en tienda
            </Link>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-danger-ghost"
            onClick={() => void handleDelete()}
            disabled={deleting || !product}
          >
            {deleting ? 'Eliminando…' : 'Eliminar producto'}
          </button>
        </div>
      </header>

      {loading ? (
        <div className="admin-card">Cargando producto…</div>
      ) : error && !product ? (
        <div className="empty-state">
          <h2>No pudimos cargar el producto</h2>
          <p>{error}</p>
          <Link href="/admin/products" className="btn btn-primary">
            Volver a productos
          </Link>
        </div>
      ) : product ? (
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
              />
            </label>

            <label className="field">
              <span>Descripción</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={5000}
                rows={4}
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
                />
              </label>
            </div>

            <div className="admin-form-row">
              <label className="field">
                <span>Categoría</span>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
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
              />
            </label>

            <label className="field">
              <span>Características (separadas por ; o |)</span>
              <input
                type="text"
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
              />
            </label>

            <div className="admin-form-row">
              <label className="field">
                <span>Tipo</span>
                <input
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  maxLength={40}
                />
              </label>
              <label className="field">
                <span>Unidad</span>
                <input
                  type="text"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  maxLength={40}
                />
              </label>
            </div>

            <div className="admin-form-row">
              <label className="field">
                <span>Código</span>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={50}
                />
              </label>
              <label className="field">
                <span>Item code</span>
                <input
                  type="text"
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value)}
                  maxLength={50}
                />
              </label>
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
