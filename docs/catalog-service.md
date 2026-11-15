# catalog-service

Microservicio dueño del catálogo de productos. Tiene **base de datos propia**
y no consulta ni escribe datos de otros servicios.

| Dato | Valor |
|---|---|
| Puerto directo | `8103` |
| Base de datos | `arbol_venta_catalog` |
| Ruta pública vía gateway | `http://localhost:8080/api/products` |
| Ruta de ofertas | `http://localhost:8080/api/deals` |
| Ruta de compatibilidad | `http://localhost:8080/api/catalog` |
| Migraciones | `src/main/resources/db/migration` |

## Endpoints

### GET `/api/products`

Listado público y paginado.

Parámetros opcionales:

| Parámetro | Tipo | Descripción |
|---|---|---|
| `q` | texto | Busca por nombre (`ILIKE`) |
| `categoryId` | UUID | Filtra por categoría |
| `brandId` | UUID | Filtra por marca |
| `minPrice` | decimal | Precio mínimo |
| `maxPrice` | decimal | Precio máximo |
| `sort` | texto | `name_asc`, `price_asc`, `price_desc`, `rating`, `newest` |
| `page` | entero | Página, empieza en `0` (por defecto `0`) |
| `size` | entero | Tamaño, máximo `100` (por defecto `20`) |

Respuesta `200 OK`:

```json
{
  "content": [
    {
      "id": "c1000000-0000-4000-8000-000000000001",
      "name": "Audífonos Bluetooth",
      "slug": "audifonos-bluetooth",
      "image": "https://picsum.photos/seed/...",
      "price": 199.90,
      "stock": 50.0000,
      "ratingAvg": 4.50,
      "ratingCount": 120,
      "categoryName": "Electrónica",
      "brandName": "TechNova",
      "dealId": "d1000000-0000-4000-8000-000000000001",
      "dealPrice": 129.94,
      "dealDiscountPercent": 35.00,
      "dealType": "LIGHTNING",
      "dealTitle": "Relámpago: Audífonos Bluetooth",
      "dealEndsAt": "2026-11-17T15:35:36Z",
      "dealStockRemaining": 7.0000,
      "dealStockPercent": 28,
      "dealStockLimit": 25.0000
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 8,
  "totalPages": 1
}
```

### GET `/api/products/{id}`

Detalle público de un producto, incluyendo sus imágenes.

Respuesta `200 OK`: objeto `ProductDetail` con `id`, `code`, `itemCode`,
`name`, `description`, `slug`, `image`, `features`, `type`, `price`, `stock`,
`ratingAvg`, `ratingCount`, `categoryId`, `categoryName`, `brandId`,
`brandName`, `unitName` e `images`. Si el producto tiene una oferta vigente,
también incluye `dealId`, `dealPrice`, `dealDiscountPercent`, `dealType`,
`dealTitle`, `dealEndsAt`, `dealStockRemaining`, `dealStockPercent` y
`dealStockLimit`.

- `404 NO_ENCONTRADO` si el producto no existe o está inactivo.

## Ofertas

Las ofertas se calculan siempre desde el precio actual del producto:

- `DAILY`: oferta del día.
- `LIGHTNING`: oferta relámpago (pensada para poco stock y poca duración).
- `FEATURED`: oferta destacada.

El precio de oferta es `precio * (1 - discountPercent / 100)`. Una oferta solo
se considera activa si `status = 1`, `now()` está entre `startsAt` y `endsAt`
y todavía queda stock (`stockSold < stockLimit`). El stock restante también se
limita por el stock real del producto.

### GET `/api/deals`

Listado público de ofertas activas y paginado.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `type` | texto | `DAILY`, `LIGHTNING` o `FEATURED` |
| `categoryId` | UUID | Filtra por categoría |
| `brandId` | UUID | Filtra por marca |
| `minDiscount` | decimal | Descuento mínimo, por ejemplo `20` |
| `sort` | texto | `discount_desc`, `ending_soon`, `price_asc`, `price_desc`, `newest` |
| `page` | entero | Página, empieza en `0` |
| `size` | entero | Tamaño, máximo `100` (por defecto `12`) |

### GET `/api/deals/{id}`

Detalle público de una oferta.

### GET `/api/deals/admin`

Listado completo para el panel, incluyendo ofertas programadas, terminadas y
desactivadas. Requiere `Authorization: Bearer <accessToken>` de administrador.

### POST `/api/deals`

Crea una oferta. Solo administradores.

```json
{
  "productId": "c1000000-0000-4000-8000-000000000001",
  "title": "Relámpago: Audífonos Bluetooth",
  "dealType": "LIGHTNING",
  "discountPercent": 35,
  "startsAt": "2026-11-15T12:00:00Z",
  "endsAt": "2026-11-17T12:00:00Z",
  "stockLimit": 25,
  "stockSold": 0
}
```

`discountPercent` debe estar entre `1` y `90`. `endsAt` debe ser posterior a
`startsAt`. Si `stockLimit` no se envía se usa el stock del producto. Un
producto no puede tener dos configuraciones de oferta activas a la vez
(`409 CONFLICTO`).

### PUT `/api/deals/{id}`

Actualiza una oferta. Mismo cuerpo que `POST`. `status` opcional (`1` activa,
`0` desactivada).

### DELETE `/api/deals/{id}`

Desactiva la oferta (borrado lógico, `status = 0`). No borra el historial.

### POST `/api/products`

Crea un producto. **Solo administradores** (`accountType = ADMIN` en el JWT).

Cabecera obligatoria:

```http
Authorization: Bearer <accessToken>
```

Cuerpo:

```json
{
  "name": "Producto de ejemplo",
  "description": "Descripción opcional",
  "price": 19.99,
  "stock": 10,
  "categoryId": "aaaaaaaa-0000-4000-8000-000000000001",
  "brandId": "bbbbbbbb-0000-4000-8000-000000000001",
  "image": "https://picsum.photos/seed/ejemplo/600/600",
  "features": "Característica 1 | Característica 2",
  "type": "physical",
  "unitName": "unidad",
  "code": "P-1000",
  "itemCode": "SKU-1000"
}
```

Campos obligatorios: `name` y `price`.

Opcionales: todos los demás. Si no se envían `code`/`itemCode`, el servicio
los genera. Si no se envía `stock`, queda en `0`. El `slug` se genera desde
el nombre y, si ya existe, se le agrega un sufijo numérico.

Respuesta `201 Created`: el `ProductDetail` recién creado.

Errores:

| HTTP | Código | Motivo |
|---|---|---|
| `400` | `DATOS_INVALIDOS` | Validación del cuerpo o categoría/marca inexistente |
| `401` | `NO_AUTORIZADO` | Falta el token o es inválido |
| `403` | `PROHIBIDO` | El token es de un cliente, no de un administrador |
| `409` | `CONFLICTO` | Ya existe un producto con ese `code`, `itemCode` o `slug` |

### Rutas de compatibilidad

Se mantienen para no romper el trabajo previo:

- `GET /api/catalog/products` — igual que `GET /api/products`
- `GET /api/catalog/products/{id}` — igual que el detalle
- `GET /api/catalog/categories` — categorías activas
- `GET /api/catalog/brands` — marcas activas

## Ejemplos con curl

Listar:

```bash
curl "http://localhost:8080/api/products?size=5"
```

Ver detalle:

```bash
curl "http://localhost:8080/api/products/c1000000-0000-4000-8000-000000000001"
```

Crear con token de administrador:

```bash
TOKEN=$(curl -s -X POST "http://localhost:8080/api/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"12345678"}' | jq -r '.accessToken')

curl -X POST "http://localhost:8080/api/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Producto de prueba",
    "description": "Creado desde curl",
    "price": 19.99,
    "stock": 5,
    "categoryId": "aaaaaaaa-0000-4000-8000-000000000001",
    "brandId": "bbbbbbbb-0000-4000-8000-000000000001"
  }'
```

En PowerShell:

```powershell
$login = Invoke-RestMethod http://localhost:8080/api/auth/admin/login `
  -Method Post -ContentType 'application/json' `
  -Body (@{ login='admin'; password='12345678' } | ConvertTo-Json)

Invoke-RestMethod http://localhost:8080/api/products `
  -Method Post -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $($login.accessToken)" } `
  -Body (@{
    name='Producto de prueba'; price=19.99; stock=5
    categoryId='aaaaaaaa-0000-4000-8000-000000000001'
    brandId='bbbbbbbb-0000-4000-8000-000000000001'
  } | ConvertTo-Json)
```

## Base de datos

Base exclusiva: `arbol_venta_catalog`. Se crea una sola vez:

```powershell
$env:PGPASSWORD='123'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres `
  -c "CREATE DATABASE arbol_venta_catalog;"
```

Las tablas y datos demo se aplican automáticamente con Flyway al arrancar.

### Tablas

| Tabla | Contenido |
|---|---|
| `categories` | Categorías por tenant (`name`, `slug`, `image`, `sort_order`) |
| `brands` | Marcas por tenant (`name`, `slug`) |
| `products` | Producto, precio, stock, rating, categoría y marca |
| `product_images` | Imágenes adicionales, con `is_primary` y orden |
| `product_deals` | Ofertas: tipo, descuento, ventana de tiempo y stock limitado |
| `v_shop_products` | Vista de lectura que une producto + categoría + marca + oferta vigente |
| `v_shop_deals` | Vista de lectura de ofertas con precio calculado y stock restante |

Todas las tablas llevan `tenant_id` para soportar varios tenants en el futuro.
Los precios usan `numeric(12,2)` y el stock `numeric(14,4)`.

### Migraciones

| Versión | Archivo | Contenido |
|---|---|---|
| `V1` | `V1__init.sql` | Tablas, índices y vista |
| `V2` | `V2__seed_dev.sql` | Categorías, marcas y productos demo |
| `V3` | `V3__deals.sql` | Tabla `product_deals`, vistas `v_shop_deals` y `v_shop_products` con oferta |
| `V4` | `V4__seed_deals_dev.sql` | Ofertas demo (relámpago, destacadas y del día) |
| `V5` | `V5__deal_stock_limit.sql` | Expone `deal_stock_limit` en `v_shop_products` |

> **No editar una migración ya aplicada.** Si hay que cambiar el esquema o
> los datos, crear `V3__...sql`. El seed `V2` es solo para desarrollo y debe
> quitarse antes de un despliegue real.

## Variables de entorno

| Variable | Valor por defecto | Uso |
|---|---|---|
| `DB_HOST` | `localhost` | Host PostgreSQL |
| `DB_PORT` | `5432` | Puerto PostgreSQL |
| `DB_NAME` | `arbol_venta_catalog` | Base exclusiva del catálogo |
| `DB_USERNAME` | `postgres` | Usuario |
| `DB_PASSWORD` | `123` | Contraseña (no subir a Git) |
| `JWT_SECRET` | valor de desarrollo | Debe coincidir con `auth-service` |
| `DEFAULT_TENANT_ID` | `11111111-1111-4111-8111-111111111111` | Tenant cuando la petición es anónima |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:3001,http://localhost:5173` | Orígenes permitidos para el frontend |

## Arrancar

```powershell
.\gradlew.bat :services:catalog-service:bootRun
```

O con jar:

```powershell
.\gradlew.bat :services:catalog-service:build -x test
java -jar services\catalog-service\build\libs\catalog-service.jar
```

Comprobar salud:

```powershell
Invoke-RestMethod http://localhost:8103/actuator/health
```

Swagger UI: <http://localhost:8103/swagger-ui.html>
