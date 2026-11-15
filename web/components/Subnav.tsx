'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { MouseEvent as ReactMouseEvent } from 'react';

import { useAuth } from './AuthProvider';

type SubnavItem = {
  label: string;
  href: string;
  icon?: string;
  soon?: boolean;
  onClick?: (event: ReactMouseEvent<HTMLAnchorElement>) => void;
};

export function Subnav() {
  const pathname = usePathname();
  const { adminMode, session } = useAuth();

  const items: SubnavItem[] = [
    { label: 'Todo', href: '/', icon: '☰' },
    { label: 'Ofertas del Día', href: '/deals' },
    {
      label: 'Categorías',
      href: '/#categorias',
      onClick: (event) => {
        if (pathname === '/') {
          event.preventDefault();
          document
            .getElementById('categorias')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      },
    },
    { label: 'Atención médica', href: '/medical' },
    { label: 'Servicio al Cliente', href: '#', soon: true },
    { label: 'Mis Pedidos', href: '#', soon: true },
    { label: 'Listas', href: '#', soon: true },
    adminMode
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
              onClick={item.onClick}
              aria-current={
                pathname === item.href ||
                (item.label === 'Categorías' && pathname === '/')
                  ? 'page'
                  : undefined
              }
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

