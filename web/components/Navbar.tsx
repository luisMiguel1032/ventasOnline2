'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from './AuthProvider';

export function Navbar() {
  const { session, ready, logout, isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    router.push('/');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="brand" onClick={closeMenu}>
          Árbol<span className="brand-dot"> de Venta</span>
        </Link>

        <button
          type="button"
          className="menu-toggle"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <nav className={`nav-links${menuOpen ? ' is-open' : ''}`}>
          <Link
            href="/"
            onClick={closeMenu}
            className={pathname === '/' ? 'nav-link active' : 'nav-link'}
          >
            Productos
          </Link>

          {!ready ? null : isAdmin ? (
            <Link
              href="/admin"
              onClick={closeMenu}
              className={pathname.startsWith('/admin') ? 'nav-link active' : 'nav-link'}
            >
              Panel
            </Link>
          ) : null}

          {!ready ? null : session ? (
            <div className="nav-session">
              <span className="nav-user">
                Hola, {session.name.split(' ')[0] || session.name}
                {isAdmin ? ' (Admin)' : ''}
              </span>
              <button type="button" className="nav-button" onClick={handleLogout}>
                Salir
              </button>
            </div>
          ) : (
            <div className="nav-session">
              <Link
                href="/login"
                onClick={closeMenu}
                className={
                  pathname === '/login' ? 'nav-link active' : 'nav-link'
                }
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                onClick={closeMenu}
                className="nav-cta"
              >
                Crear cuenta
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
