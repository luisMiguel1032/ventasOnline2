# Árbol de Venta - frontend

Aplicación Next.js de la tienda. Consume únicamente el gateway en
`http://localhost:8080/api`.

## Arrancar

Con el gateway, auth y catálogo arriba:

```powershell
npm install
npm run dev
```

Abrir <http://localhost:3000>.

## Scripts

| Comando | Para qué |
|---|---|
| `npm run dev` | Desarrollo con recarga |
| `npm run build` | Build de producción |
| `npm run start` | Servir el build |
| `npm run typecheck` | Verificar TypeScript |

## Configuración

Copiar `.env.local.example` a `.env.local` si el gateway no está en la URL por
defecto:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Documentación

Arquitectura, contrato, sesión y páginas:
[`../docs/web-frontend.md`](../docs/web-frontend.md).

## Fase actual

- Catálogo, búsqueda, filtros, detalle de producto.
- Login y registro de clientes.
- El carrito y el checkout llegan en la Fase 3.
