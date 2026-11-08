'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from './AuthProvider';

export function AdminGuard({ children }: { children: ReactNode }) {
  const { session, ready, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname || '/admin')}`);
    }
  }, [ready, session, router, pathname]);

  if (!ready) {
    return <div className="admin-loading">Verificando sesión…</div>;
  }

  if (!session) {
    return <div className="admin-loading">Redirigiendo al acceso de administrador…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="empty-state">
        <p className="eyebrow">Acceso denegado</p>
        <h1>Este módulo es solo para administradores</h1>
        <p>
          Estás conectado como <strong>{session.name}</strong> ({session.accountType}). No tienes
          permisos para acceder al panel de administración.
        </p>
        <div className="auth-actions">
          <Link href="/" className="btn btn-primary">
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
