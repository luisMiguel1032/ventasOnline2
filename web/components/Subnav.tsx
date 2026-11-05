'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS: Array<{ label: string; href: string; icon?: string }> = [
  { label: 'Todo', href: '/', icon: '☰' },
  { label: 'Ofertas del Día', href: '/?sort=rating' },
  { label: 'Categorías', href: '/' },
  { label: 'Servicio al Cliente', href: '#' },
  { label: 'Mis Pedidos', href: '#' },
  { label: 'Listas', href: '#' },
  { label: 'Vender', href: '#' },
];

export function Subnav() {
  const pathname = usePathname();

  return (
    <nav className="subnav" aria-label="Navegación secundaria">
      <div className="subnav-inner">
        {ITEMS.map((item) => {
          const isHash = item.href === '#';
          const className = item.icon ? 'subnav-item subnav-item--all' : 'subnav-item';

          if (isHash) {
            return (
              <a
                key={item.label}
                href="#"
                className={className}
                onClick={(e) => e.preventDefault()}
                title="Próximamente"
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
              aria-current={pathname === '/' && item.label === 'Todo' ? 'page' : undefined}
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
