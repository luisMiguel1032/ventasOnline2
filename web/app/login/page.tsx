'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';

import { useAuth } from '@/components/AuthProvider';
import { ApiError } from '@/lib/api';

function LoginForm() {
  const { login, session, ready } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedNext = searchParams.get('next') ?? '/';
  const next =
    requestedNext.startsWith('/') && !requestedNext.startsWith('//')
      ? requestedNext
      : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email.trim(), password);
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
    setEmail('cliente@demo.com');
    setPassword('12345678');
    setError(null);
  }

  if (ready && session) {
    return (
      <div className="auth-card">
        <p className="eyebrow">Mi cuenta</p>
        <h1>Ya tienes una sesión activa</h1>
        <p>
          Estás conectado como <strong>{session.name}</strong>.
        </p>
        <div className="auth-actions">
          <Link href="/" className="btn btn-primary">
            Ir al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <p className="eyebrow">Mi cuenta</p>
      <h1>Iniciar sesión</h1>
      <p className="auth-lead">
        Ingresa con el correo y la contraseña de tu cuenta de cliente.
      </p>

      {error && (
        <div className="alert alert-compact" role="alert">
          <p>{error}</p>
        </div>
      )}

      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Correo electrónico</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@correo.com"
            autoComplete="email"
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
          {submitting ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <p className="auth-alt">
        ¿No tienes cuenta? <Link href="/register">Crear cuenta</Link>
      </p>

      <div className="demo-note">
        <div>
          <strong>Credenciales demo</strong>
          <p>cliente@demo.com · 12345678</p>
        </div>
        <button type="button" className="btn btn-ghost btn-small" onClick={fillDemo}>
          Rellenar
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-card">
          <p>Cargando...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
