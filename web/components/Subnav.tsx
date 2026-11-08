'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from './AuthProvider';

type SubnavItem = { label: string; href: string; icon?: string; soon?: boolean };

export function Subnav() {
  const pathname = usePathname();
  const { isAdmin, session } = useAuth();

  const items: SubnavItem[] = [
    { label: 'Todo', href: '/', icon: '☰' },
    { label: 'Ofertas del Día', href: '/?sort=rating' },
    { label: 'Categorías', href: '/' },
    { label: 'Servicio al Cliente', href: '#', soon: true },
    { label: 'Mis Pedidos', href: '#', soon: true },
    { label: 'Listas', href: '#', soon: true },
    isAdmin
      ? { label: 'Vender', href: '/admin/products/new' }
      : { label: 'Vender', href: '#', soon: true },
  ];

  return (
    <nav className="subnav" aria-label="Navegación secundaria">
      <div className="subnav-inner">
        {items.map((item) => {
          const className = item.icon ? 'subnav-item subnav-item--all' : 'subnav-item';

          if (item.soon || item.href === '#') {
            return (
              <a
                key={item.label}
                href="#"
                className={className}
                onClick={(e) => e.preventDefault()}
                title={item.label === 'Vender' && !session ? 'Inicia sesión como administrador' : 'Próximamente'}
              >
                {item.icon ? <span aria-hidden="true">{item.icon} </span> : null}
                {item.label}
              </a>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={className}
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              {item.icon ? <span aria-hidden="true">{item.icon} </span> : null}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

