# web — frontend Next.js (Fase 2)

Tienda pública del e-commerce. **No tiene base de datos ni reglas de negocio
propias**: solo consume el gateway y muestra la información que devuelven
`auth-service` y `catalog-service`.

- Carpeta: `web/`
- URL de desarrollo: <http://localhost:3000>
- API: `http://localhost:8080/api` (gateway)
- Stack: Next.js 16 (App Router), React 19, TypeScript y CSS propio.
- No usa Tailwind ni llama directamente a los puertos `8101` / `8103`.

## Arquitectura

```text
Navegador
   │
   ▼
Next.js :3000  ──►  Gateway :8080  ──►  auth-service :8101
                                   └──►  catalog-service :8103
```

El gateway es el único punto de entrada. También es quien resuelve CORS para
el navegador. El frontend nunca conoce la URL interna de un microservicio.

## Estructura

```text
web/
├── app/
│   ├── layout.tsx              # AuthProvider, Navbar, footer, metadata
│   ├── page.tsx                # home: búsqueda, filtros, orden y paginación
│   ├── products/[id]/page.tsx  # detalle de producto
│   ├── login/page.tsx          # login de cliente
│   ├── register/page.tsx       # registro de cliente
│   ├── not-found.tsx           # 404
│   └── globals.css             # estilos (Amazon-like, responsive)
├── components/
│   ├── AuthProvider.tsx        # sesión, login, registro y logout
│   ├── Navbar.tsx              # navegación y estado de sesión
│   └── ProductCard.tsx         # tarjeta de producto
├── lib/
│   ├── api.ts                  # cliente HTTP del gateway + ApiError
│   ├── types.ts                # tipos del contrato
│   ├── session.ts              # persistencia de la sesión
│   └── format.ts               # precio, estrellas y stock
├── .env.local.example          # NEXT_PUBLIC_API_URL
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Contrato que consume

| Acción | Método y ruta | Token |
|---|---|---|
| Listar productos | `GET /api/products?q=&categoryId=&sort=&page=&size=` | No |
| Ver producto | `GET /api/products/{id}` | No |
| Listar categorías | `GET /api/catalog/categories` | No |
| Listar marcas | `GET /api/catalog/brands` | No |
| Login cliente | `POST /api/auth/customer/login` | No |
| Registro cliente | `POST /api/auth/customer/register` | No |
| Datos del token | `GET /api/auth/me` | Bearer |

`lib/api.ts` centraliza todas las llamadas. Si el backend responde con un
`ApiError`, se conserva `status`, `code`, `details` y `path` para mostrar un
mensaje útil en pantalla.

## Sesión del cliente

El backend devuelve un JWT con esta forma plana:

```json
{
  "accessToken": "...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "subjectId": "uuid",
  "tenantId": "uuid",
  "accountType": "CUSTOMER",
  "login": "cliente@demo.com",
  "name": "Cliente Demo"
}
```

`AuthProvider` lo transforma en una `Session` agregando `expiresAt` y lo guarda
en `localStorage` con la clave **`arboldeventa.session`**.

- Al iniciar, se lee la sesión y se descarta si ya venció.
- `login()` y `register()` guardan la sesión y notifican a los componentes.
- `logout()` borra la sesión.
- El Navbar muestra `Hola, <nombre>` y el botón `Salir` cuando hay sesión.

> Para esta demo académica se usa `localStorage`. En producción conviene un
> esquema con cookie `httpOnly`, `Secure` y `SameSite`, más refresh token, para
> reducir el riesgo de XSS. Ese cambio se documenta como etapa futura.

## Páginas

### `/` — catálogo

- Lista los productos en tarjetas con imagen, categoría, marca, rating, precio
  y stock.
- Buscador por nombre.
- Chips de categorías obtenidos desde el catálogo.
- Orden por nombre, precio, rating y novedad.
- Paginación de 12 productos.
- Estados de carga (skeleton), error con reintento y catálogo vacío.

### `/products/[id]` — detalle

- Galería con imagen principal y miniaturas.
- Rating, precio, stock y descripción.
- Características separadas por `;`, `|` o salto de línea.
- Especificaciones: código, SKU, marca y tipo.
- El botón **Agregar al carrito** está deshabilitado a propósito: el carrito
  pertenece a la Fase 3.

### `/login` — login de cliente

- Correo y contraseña.
- Botón **Rellenar** con las credenciales demo.
- Si ya hay sesión, muestra el estado actual en lugar del formulario.
- Redirige al catálogo después de ingresar.

### `/register` — registro de cliente

- Nombre, correo, teléfono opcional, contraseña y confirmación.
- Valida que las contraseñas coincidan y que tengan al menos 8 caracteres.
- El backend devuelve `409` si el correo ya existe; el mensaje se muestra en
  pantalla.
- Al registrarse correctamente, queda logueado y vuelve al catálogo.

## Ejecutar

Requisitos: Node 20 o superior y el gateway, auth y catálogo arriba.

```powershell
cd web
npm install
npm run dev
```

Abrir <http://localhost:3000>.

Si el gateway está en otra URL:

```powershell
$env:NEXT_PUBLIC_API_URL='http://localhost:8080/api'
npm run dev
```

O copiar `.env.local.example` a `.env.local` y ajustar el valor.

### Build de producción

```powershell
npm run build
npm run start
```

### Verificación de tipos

```powershell
npm run typecheck
```

## Variables de entorno

| Variable | Valor por defecto | Para qué |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api` | URL base del gateway |

La variable debe empezar con `NEXT_PUBLIC_` porque el navegador la necesita.

## Credenciales demo

| Tipo | Usuario | Contraseña |
|---|---|---|
| Cliente | `cliente@demo.com` | `12345678` |

El formulario de login incluye un botón para rellenarlas. Son datos de
desarrollo y deben eliminarse antes de un despliegue real.

## Manejo de errores

- Gateway apagado: mensaje “No se pudo conectar con el servidor...” y botón de
  reintento en el catálogo.
- `401` / `403`: se muestra el mensaje del backend.
- `409` al registrarse: “Ya existe una cuenta con ese email”.
- `400`: errores de validación del backend.
- Producto inexistente: pantalla de “No encontramos este producto”.
- Imagen faltante: se usa una imagen de reemplazo.

## Verificación realizada

- `npm run typecheck` sin errores.
- `npm run build` correcto con Next.js 16.4.3.
- Home con 8 productos, 4 categorías y sin errores de consola.
- Filtro “Electrónica” → 3 productos.
- Búsqueda “smart” → 1 producto.
- Detalle de producto con galería, 4 características y botón de carrito
  deshabilitado.
- Login con `cliente@demo.com` y sesión persistida.
- Registro nuevo correcto y `409` visible al repetir el correo.
- El cliente de prueba creado durante la verificación fue eliminado de
  `arbol_venta_auth`.

## Pendiente para la Fase 3

- Carrito y checkout.
- Órdenes del cliente.
- Reemplazar la sesión en `localStorage` por cookies seguras.
- Panel de administración (fuera de la tienda pública).
