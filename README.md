# Árbol de Venta (monorepo)

Sistema de venta por microservicios. Cada servicio tiene su propia carpeta,
su propia base de datos y su propio contrato en `docs/`.

## Estado actual

- [x] Monorepo Gradle con `services/` y `libs/common`
- [x] `auth-service` funcional en el puerto **8101**
  - registro de clientes
  - login de clientes y de administradores
  - JWT HS256 + endpoint `/api/auth/me`
  - Flyway creando `tenants`, `users` y `customers`
  - datos demo y CORS para el frontend
- [x] `gateway` en el puerto **8080** (proxy `/api/auth`, `/api/products`, `/api/catalog`, `/api/deals`, ...)
- [x] `catalog-service` aislado en su base propia `arbol_venta_catalog`
  - Flyway creando `categories`, `brands`, `products`, `product_images` y `product_deals`
  - `GET /api/products` y `GET /api/products/{id}` públicos, con datos de oferta cuando aplica
  - CRUD de productos y ofertas solo para ADMIN
  - ofertas `DAILY`, `LIGHTNING` y `FEATURED` con descuento automático, temporizador y stock limitado
  - seed de productos y ofertas demo para desarrollo
- [x] `web` (Next.js) en el puerto **3001**
  - home con catálogo, búsqueda, categorías, orden y paginación
  - detalle de producto con precio de oferta, cuenta regresiva y stock limitado
  - página de ofertas con filtros por tipo, categoría, descuento y orden
  - módulo de atención médica (`/medical`) con productos de salud y tema propio
  - login y registro de clientes contra el gateway
  - sesión JWT persistida en el navegador
  - panel de administración de productos y ofertas
- [ ] Fase 3: carrito, pedidos y checkout
- [ ] Demás servicios: esqueletos con health/security (semanas 3-4)

> El proyecto existente usa **Gradle + Java 25 + Spring Boot 4.1.1**, no
> Maven/Java 21/Boot 3 como decía el plan original. Se mantuvo lo que ya
> estaba creado para no romper el trabajo previo.

## Requisitos

- Java 25 (el toolchain del proyecto)
- Node 20+ (frontend Next.js)
- PostgreSQL 18 local **o** Docker Desktop
- Git

No hace falta instalar Maven: se usa el Gradle Wrapper (`gradlew`).

## Base de datos

### Opción A — PostgreSQL local (la de esta máquina)

Ya hay un PostgreSQL 18 corriendo en `localhost:5432`. Cada servicio usa una
base **exclusiva**. Para el estado actual hacen falta `arbol_venta_auth` y
`arbol_venta_catalog`:

```powershell
$env:PGPASSWORD='123'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -c "CREATE DATABASE arbol_venta_auth;"
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -c "CREATE DATABASE arbol_venta_catalog;"
```

Si una base ya existe, no ejecutes su comando otra vez. Las tablas las crea
Flyway automáticamente al arrancar cada servicio.

### Opción B — Docker

```powershell
docker compose up -d postgres
```

El compose publica PostgreSQL en el puerto **5433** para no chocar con el
PostgreSQL local. En ese caso arranca la app con:

```powershell
$env:DB_PORT='5433'; $env:DB_USERNAME='admin'; $env:DB_PASSWORD='admin123'
.\gradlew.bat :services:auth-service:bootRun
```

### ¿Por qué no usamos la base `mastec_saas`?

Porque pertenece a **otro proyecto** (el SaaS/POS) y ya tiene más de un millón
de usuarios de prueba. Mezclar las dos aplicaciones rompería:

- la regla **una carpeta = un servicio = una base propia**;
- el aislamiento entre proyectos (una migración de un lado podría romper el otro);
- la claridad de los datos (clientes del POS no son clientes del e-commerce).

Se puede usar el **mismo servidor** PostgreSQL, pero con bases separadas:
`arbol_venta_auth`, `arbol_venta_catalog`, `arbol_venta_cart`, etc.

## Arrancar `auth-service`

```powershell
.\gradlew.bat :services:auth-service:bootRun
```

O construir y ejecutar el jar:

```powershell
.\gradlew.bat :services:auth-service:build -x test
java -jar services\auth-service\build\libs\auth-service.jar
```

Comprobar salud:

```powershell
Invoke-RestMethod http://localhost:8101/actuator/health
```

Swagger UI: <http://localhost:8101/swagger-ui.html>

## Arrancar `catalog-service` y `gateway`

En dos terminales distintas (con `auth-service` ya arriba):

```powershell
.\gradlew.bat :services:catalog-service:bootRun
```

```powershell
.\gradlew.bat :services:gateway:bootRun
```

O con los jars:

```powershell
java -jar services\catalog-service\build\libs\catalog-service.jar
java -jar services\gateway\build\libs\gateway.jar
```

Comprobar salud:

```powershell
Invoke-RestMethod http://localhost:8103/actuator/health
Invoke-RestMethod http://localhost:8080/actuator/health
```

El frontend siempre llama al gateway. Ejemplo de listado de productos y ofertas:

```powershell
Invoke-RestMethod "http://localhost:8080/api/products?size=5"
Invoke-RestMethod "http://localhost:8080/api/deals?size=5"
```

Contrato del catálogo: [`docs/catalog-service.md`](docs/catalog-service.md).

## Arrancar el frontend

Con `gateway`, `auth-service` y `catalog-service` ya arriba:

```powershell
cd web
npm install
npm run dev
```

Abrir <http://localhost:3001>. El frontend llama siempre al gateway en
`http://localhost:8080/api`; no usa los puertos internos de los servicios.

Si el gateway está en otra URL, definir la variable antes de arrancar:

```powershell
$env:NEXT_PUBLIC_API_URL='http://localhost:8080/api'
npm run dev
```

También se puede copiar `web/.env.local.example` a `web/.env.local`.

Build de producción:

```powershell
npm run build
npm run start
```

Contrato y arquitectura del frontend:
[`docs/web-frontend.md`](docs/web-frontend.md).

## Credenciales demo (solo desarrollo)

| Tipo | Usuario | Contraseña |
|---|---|---|
| Admin | `admin` | `12345678` |
| Cliente | `cliente@demo.com` | `12345678` |

Se crean con `V2__seed_dev.sql`. **Cámbialas antes de desplegar.**

## Endpoints

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

Ejemplo rápido:

```powershell
$body = @{ email='cliente@demo.com'; password='12345678' } | ConvertTo-Json
$login = Invoke-RestMethod http://localhost:8101/api/auth/customer/login `
  -Method Post -ContentType 'application/json' -Body $body

Invoke-RestMethod http://localhost:8101/api/auth/me `
  -Headers @{ Authorization = "Bearer $($login.accessToken)" }
```

Contrato completo: [`docs/auth-service.md`](docs/auth-service.md).

Ejemplo de creación de producto (solo admin, a través del gateway):

```powershell
$login = Invoke-RestMethod http://localhost:8080/api/auth/admin/login `
  -Method Post -ContentType 'application/json' `
  -Body (@{ login='admin'; password='12345678' } | ConvertTo-Json)

Invoke-RestMethod http://localhost:8080/api/products `
  -Method Post -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $($login.accessToken)" } `
  -Body (@{
    name='Producto de prueba'; description='Creado desde PowerShell'
    price=19.99; stock=5
    categoryId='aaaaaaaa-0000-4000-8000-000000000001'
    brandId='bbbbbbbb-0000-4000-8000-000000000001'
  } | ConvertTo-Json)
```

## Estructura

```
amazon-clone/
├── docker-compose.yml
├── docs/
│   ├── auth-service.md
│   ├── catalog-service.md
│   └── web-frontend.md
├── infra/
│   └── docker/postgres/init.sql
├── libs/
│   └── common/              # errores, JWT, paginación, BaseEntity
├── services/
│   ├── auth-service/        # 8101  (listo)
│   ├── catalog-service/     # 8103  (listo, base propia arbol_venta_catalog)
│   ├── gateway/             # 8080  (proxy)
│   └── ...
└── web/                     # 3001  (Next.js, Fase 2 + ofertas)
```

## Reglas del proyecto

1. Una carpeta = un servicio = una base de datos propia.
2. Todas las tablas se crean con Flyway, nunca a mano.
3. El contrato (endpoints y eventos) se escribe en `docs/` antes de programar.
4. No subir contraseñas: usar variables de entorno (`.env` está ignorado).
5. El frontend habla con el gateway (`http://localhost:8080/api/...`), no
   directamente con cada servicio.

## Siguiente paso

Fase 3: construir el flujo de compra. Empezar por `cart-service` (carrito por
cliente autenticado) y `order-service` (crear pedido desde el carrito), con sus
bases `arbol_venta_cart` y `arbol_venta_order`, contratos en `docs/` y Flyway.
Después integrar en el frontend el carrito, el checkout y “mis pedidos”.

Pagos, inventario y panel de administración quedan para la siguiente etapa.
