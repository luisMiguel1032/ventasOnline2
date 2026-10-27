import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AuthProvider } from '@/components/AuthProvider';
import { Navbar } from '@/components/Navbar';

import './globals.css';

export const metadata: Metadata = {
  title: 'Árbol de Venta — tu tienda online',
  description:
    'Catálogo de productos, login de clientes y detalle de producto. Proyecto académico de microservicios.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="page">{children}</main>
          <footer className="footer">
            <strong>Árbol de Venta</strong>
            <span>Proyecto académico de microservicios</span>
            <span className="footer-muted">
              Productos y precios de demostración.
            </span>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
