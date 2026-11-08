'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';

import { useAuth } from '@/components/AuthProvider';
import { ApiError } from '@/lib/api';

function AdminLoginForm() {
  const { loginAsAdmin, session, ready, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedNext = searchParams.get('next') ?? '/admin';
  const next =
    requestedNext.startsWith('/') && !requestedNext.startsWith('//')
      ? requestedNext
      : '/admin';

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const s = await loginAsAdmin({ login: login.trim(), password });
      if (s.accountType !== 'ADMIN') {
        setError('La cuenta no tiene rol de administrador.');
        return;
      }
      router.push(next);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo iniciar sesión. Intenta de nuevo.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo() {
    setLogin('admin');
    setPassword('12345678');
    setError(null);
  }

  if (ready && session && isAdmin) {
    return (
      <div className="auth-card">
        <p className="eyebrow">Administración</p>
        <h1>Sesión de administrador activa</h1>
        <p>
          Estás conectado como <strong>{session.name}</strong>.
        </p>
        <div className="auth-actions">
          <Link href="/admin" className="btn btn-primary">
            Ir al panel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <p className="eyebrow">Administración</p>
      <h1>Acceso de administrador</h1>
      <p className="auth-lead">
        Ingresa con tu usuario administrativo. Este acceso es independiente del login de clientes.
      </p>

      {error && (
        <div className="alert alert-compact" role="alert">
          <p>{error}</p>
        </div>
      )}

      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Usuario</span>
          <input
            type="text"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            placeholder="admin"
            autoComplete="username"
            required
          />
        </label>

        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Tu contraseña"
            autoComplete="current-password"
            minLength={8}
            required
          />
        </label>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Ingresando...' : 'Ingresar al panel'}
        </button>
      </form>

      <p className="auth-alt">
        <Link href="/">← Volver a la tienda</Link>
      </p>

      <div className="demo-note">
        <div>
          <strong>Credenciales demo (admin)</strong>
          <p>admin · 12345678</p>
        </div>
        <button type="button" className="btn btn-ghost btn-small" onClick={fillDemo}>
          Rellenar
        </button>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="auth-card"><p>Cargando...</p></div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
