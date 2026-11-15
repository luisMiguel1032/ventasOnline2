'use client';

import Link from 'next/link';

import { useAuth } from '@/components/AuthProvider';

export default function AdminDashboardPage() {
  const { session } = useAuth();

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Panel de administración</p>
          <h1>Hola, {session?.name ?? 'Administrador'}</h1>
          <p className="admin-muted">
            Rol: <strong>{session?.accountType}</strong> · Este módulo solo es visible para
            administradores.
          </p>
        </div>
        <Link href="/" className="btn btn-ghost">
          Ver tienda
        </Link>
      </header>

      <div className="admin-grid">
        <article className="admin-card">
          <h2>Productos</h2>
          <p>Revisa el catálogo y crea nuevos productos.</p>
          <div className="admin-card-actions">
            <Link href="/admin/products" className="btn btn-primary">
              Ver productos
            </Link>
            <Link href="/admin/products/new" className="btn btn-ghost">
              Crear producto
            </Link>
          </div>
        </article>

        <article className="admin-card">
          <h2>Ofertas</h2>
          <p>
            Crea ofertas relámpago, destacadas y del día con descuento
            automático, temporizador y stock limitado.
          </p>
          <div className="admin-card-actions">
            <Link href="/admin/deals" className="btn btn-primary">
              Ver ofertas
            </Link>
            <Link href="/admin/deals/new" className="btn btn-ghost">
              Crear oferta
            </Link>
          </div>
        </article>

        <article className="admin-card">
          <h2>Pedidos y usuarios</h2>
          <p>Módulos planificados para la siguiente fase (carrito, órdenes, gestión de usuarios).</p>
          <span className="admin-badge">Próximamente</span>
        </article>

        <article className="admin-card">
          <h2>Roles y permisos</h2>
          <p>
            Actualmente el sistema maneja <strong>ADMIN</strong> y <strong>CUSTOMER</strong>. Las
            rutas <code>/admin/*</code> están protegidas por rol en el frontend y las acciones
            sensibles (como crear productos) requieren token ADMIN en el backend.
          </p>
        </article>
      </div>
    </div>
  );
}
