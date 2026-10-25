import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="empty-state">
      <p className="eyebrow">Error 404</p>
      <h1>Esta página no existe.</h1>
      <p>Revisa la dirección o vuelve al catálogo para seguir explorando.</p>
      <Link href="/" className="btn btn-primary">
        Volver al catálogo
      </Link>
    </div>
  );
}
