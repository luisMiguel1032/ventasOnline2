'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { useAuth } from '@/components/AuthProvider';
import { ApiError } from '@/lib/api';

export default function RegisterPage() {
  const { register, session, ready } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      router.push('/');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo crear la cuenta. Intenta de nuevo.',
      );
    } finally {
      setSubmitting(false);
    }
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
      <h1>Crear cuenta</h1>
      <p className="auth-lead">
        Regístrate para guardar tu sesión y, más adelante, comprar en la tienda.
      </p>

      {error && (
        <div className="alert alert-compact" role="alert">
          <p>{error}</p>
        </div>
      )}

      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Nombre completo</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ana Pérez"
            autoComplete="name"
            minLength={2}
            maxLength={120}
            required
          />
        </label>

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
          <span>Teléfono (opcional)</span>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="70000000"
            autoComplete="tel"
            maxLength={30}
          />
        </label>

        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        <label className="field">
          <span>Repetir contraseña</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repite tu contraseña"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>

      <p className="auth-alt">
        ¿Ya tienes cuenta? <Link href="/login">Iniciar sesión</Link>
      </p>
    </div>
  );
}
