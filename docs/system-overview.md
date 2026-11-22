# Árbol de Venta — Revisión del sistema

Documento de referencia del proyecto **Árbol de Venta**, un clon de e-commerce
con microservicios, ofertas del día, módulo médico y videos de compra.

## 1. Visión general

Árbol de Venta es un monorepo que implementa una tienda en línea con
arquitectura de microservicios. Cada servicio tiene su propia carpeta, base de
datos y contrato documentado. El frontend (Next.js) consume únicamente el
gateway, que enruta a los microservicios internos.

Objetivos principales:
- Catálogo de productos con búsqueda, filtros, orden y paginación.
- Sistema de ofertas (diarias, destacadas, relámpago) con descuento automático,
  temporizador y stock limitado.
- Módulo de atención médica con productos de salud y tema visual propio.
- Videos de productos con detalles en home y página de detalle.
- Panel de administración para productos y ofertas.
- Modo cliente para que el administrador navegue como usuario.

## 2. Arquitectura

```
Navegador
   │
   ▼
Next.js :3001  ──►  Gateway :8080  ──►  auth-service :8101
                                   └──►  catalog-service :8103
```

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, CSS propio.
- **Gateway**: Spring Cloud Gateway, proxy de `/api/auth`, `/api/products`,
  `/api/catalog`, `/api/deals`.
- **Auth service**: autenticación JWT HS256, registro/login de clientes y admin.
- **Catalog service**: productos, categorías, marcas, imágenes, ofertas.
- **Base de datos**: PostgreSQL 18, una base por servicio:
  - `arbol_venta_auth`
  - `arbol_venta_catalog`

## 3. Servicios y puertos

| Servicio | Puerto | Estado |
|---|---|---|
| auth-service | 8101 | Funcional |
| catalog-service | 8103 | Funcional |
| gateway | 8080 | Funcional |
| web (Next.js) | 3001 | Funcional |
| cart-service | — | Esqueleto |
| order-service | — | Esqueleto |

## 4. Funcionalidades implementadas

### 4.1 Autenticación y usuarios
- Registro de clientes.
- Login de clientes y administradores.
- JWT HS256 + endpoint `/api/auth/me`.
- Flyway crea `tenants`, `users`, `customers`.
- Login unificado en `/login`: detecta si es cliente o admin y redirige.
- Modo cliente para admin (oculta panel y muestra vista de cliente).

### 4.2 Catálogo
- Listado público de productos con búsqueda, categoría, marca, precio, orden y
  paginación.
- Detalle de producto con galería, características, especificaciones y rating.
- CRUD de productos solo para ADMIN.
- Categorías y marcas públicas.

### 4.3 Ofertas del Día
- Tipos: `DAILY`, `LIGHTNING`, `FEATURED`.
- Descuento automático calculado desde el precio actual del producto.
- Temporizador (cuenta regresiva) por oferta.
- Stock limitado con barra de progreso y etiqueta “Quedan X de Y”.
- Filtros por tipo, categoría, descuento mínimo y orden.
- Panel admin con listado, creación, edición y desactivación lógica.
- Una configuración activa por producto (`status = 1`), histórico con `status = 0`.

### 4.4 Módulo de atención médica
- Ruta `/medical` con productos de la categoría “Salud”.
- Búsqueda, orden y paginación.
- Tema visual propio (verde/teal) aplicado al cambiar de módulo.

### 4.5 Videos de compra
- Columna `video_url` en productos.
- Badge “▶ Video” en tarjetas de producto.
- Reproductor de video en el detalle del producto.
- Sección “Videos de productos” en el home.
- Campo de URL de video en el formulario admin de producto.

### 4.6 Panel de administración
- Gestión de productos (crear, editar, eliminar).
- Gestión de ofertas (crear, editar, desactivar).
- Modo cliente para navegar la tienda como usuario.

## 5. Modelo de datos principal

### catalog-service
- `categories`
- `brands`
- `products`
- `product_images`
- `product_deals`

### auth-service
- `tenants`
- `users`
- `customers`

Migraciones Flyway:
- `V1__init.sql`
- `V2__seed_dev.sql`
- `V3__deals.sql`
- `V4__seed_deals_dev.sql`
- `V5__deal_stock_limit.sql`
- `V6__medical_store.sql`
- `V7__product_videos.sql`

## 6. Seguridad

- Autenticación JWT HS256.
- Roles: `ADMIN` y `CUSTOMER`.
- Lecturas públicas de productos, categorías, marcas, ofertas.
- Escrituras (productos y ofertas) requieren Bearer JWT de ADMIN.
- Validación de entrada con Jakarta Validation.
- CORS configurado para `http://localhost:3000` y `http://localhost:3001`.

## 7. Endpoints principales

| Método | Ruta | Auth |
|---|---|---|
| POST | `/api/auth/customer/register` | pública |
| POST | `/api/auth/customer/login` | pública |
| POST | `/api/auth/admin/login` | pública |
| GET | `/api/auth/me` | Bearer JWT |
| GET | `/api/products` | pública |
| GET | `/api/products/{id}` | pública |
| POST | `/api/products` | Bearer JWT de ADMIN |
| PUT | `/api/products/{id}` | Bearer JWT de ADMIN |
| DELETE | `/api/products/{id}` | Bearer JWT de ADMIN |
| GET | `/api/deals` | pública |
| GET | `/api/deals/{id}` | pública |
| GET | `/api/deals/admin` | Bearer JWT de ADMIN |
| POST | `/api/deals` | Bearer JWT de ADMIN |
| PUT | `/api/deals/{id}` | Bearer JWT de ADMIN |
| DELETE | `/api/deals/{id}` | Bearer JWT de ADMIN |
| GET | `/api/catalog/categories` | pública |
| GET | `/api/catalog/brands` | pública |

## 8. Rutas del frontend

- `/` — Home: catálogo, búsqueda, categorías, ofertas destacadas/relámpago, videos.
- `/deals` — Ofertas con filtros y paginación.
- `/products/{id}` — Detalle de producto (oferta, video, stock).
- `/medical` — Módulo de atención médica.
- `/login` — Inicio de sesión unificado (cliente/admin).
- `/register` — Registro de cliente.
- `/admin` — Panel de administración.
- `/admin/products` — Gestión de productos.
- `/admin/products/new` — Crear producto.
- `/admin/products/{id}` — Editar producto.
- `/admin/deals` — Gestión de ofertas.
- `/admin/deals/new` — Crear oferta.
- `/admin/deals/{id}` — Editar oferta.

## 9. Credenciales demo (solo desarrollo)

| Tipo | Usuario | Contraseña |
|---|---|---|
| Admin | `admin` | `12345678` |
| Cliente | `cliente@demo.com` | `12345678` |

Se crean con `V2__seed_dev.sql`. Cambiarlas antes de desplegar.

## 10. Cómo ejecutar

### Backend
```powershell
.\gradlew.bat :services:auth-service:bootRun
.\gradlew.bat :services:catalog-service:bootRun
.\gradlew.bat :services:gateway:bootRun
```

### Frontend
```powershell
cd web
npm install
npm run dev
```

Abrir: `http://localhost:3001`

## 11. Reglas del proyecto

1. Una carpeta = un servicio = una base de datos propia.
2. Todas las tablas se crean con Flyway.
3. El contrato se documenta en `docs/` antes de programar.
4. No subir contraseñas: usar variables de entorno.
5. El frontend habla con el gateway, no directamente con los servicios.

## 12. Próximos pasos

- Fase 3: carrito, checkout y pedidos.
- Mejora de gestión de fotos (múltiples imágenes, portada).
- Panel de permisos y usuarios.
- Mejoras de navegación instantánea (prefetch, transiciones).
- Actualización de seguridad de Next.js.