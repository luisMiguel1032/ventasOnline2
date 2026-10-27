# auth-service — contrato (semana 1)

Servicio de identidad del e-commerce. Es el **único** que emite JWT.
Los demás servicios solo validan el token con la misma clave.

- Puerto: `8101`
- Base de datos: `arbol_venta_auth` (exclusiva de este servicio)
- Prefijo: `/api/auth`
- Formato de error: `ApiError` (ver abajo)

## Base de datos

Tablas creadas por Flyway (`src/main/resources/db/migration`):

| Tabla | Para qué |
|---|---|
| `tenants` | Tienda/empresa. Hoy hay una sola tenant demo. |
| `users` | Personal administrativo (panel admin). Login por `login`. |
| `customers` | Clientes de la tienda (web pública). Login por `email`. |

Reglas:
- `users` y `customers` pertenecen a un `tenant_id`.
- El email de `customers` es único por tenant y se guarda en minúsculas.
- Las contraseñas se guardan con BCrypt, nunca en texto plano.
- No se crean tablas a mano: todo va en migraciones Flyway.

## JWT

Claims emitidos:

```json
{
  "iss": "arboldeventa",
  "sub": "uuid-del-usuario-o-cliente",
  "tenantId": "uuid-de-la-tienda",
  "accountType": "ADMIN | CUSTOMER",
  "login": "admin | email-del-cliente",
  "name": "Nombre para mostrar",
  "iat": 0,
  "exp": 0
}
```

- Algoritmo: `HS256`.
- Expiración por defecto: 24 h (`JWT_EXPIRATION_SECONDS`).
- Header esperado en endpoints protegidos: `Authorization: Bearer <token>`.

## Endpoints

### POST `/api/auth/customer/register`

Registra un cliente y devuelve el token (queda logueado).

```json
{
  "name": "Ana Pérez",
  "email": "ana@example.com",
  "password": "Password123",
  "phone": "70000000"
}
```

- `201 Created`
- Errores: `400 DATOS_INVALIDOS`, `409 CONFLICTO` (email repetido).

### POST `/api/auth/customer/login`

```json
{
  "email": "ana@example.com",
  "password": "Password123"
}
```

- `200 OK`
- Errores: `401 CREDENCIALES_INVALIDAS`.

### POST `/api/auth/admin/login`

```json
{
  "tenantId": "11111111-1111-4111-8111-111111111111",
  "login": "admin",
  "password": "12345678"
}
```

`tenantId` es opcional; si no viene se usa `app.default-tenant-id`.

- `200 OK`
- Errores: `401 CREDENCIALES_INVALIDAS`, `403 USUARIO_DESHABILITADO`.

### GET `/api/auth/me` (protegido)

Requiere `Authorization: Bearer <token>`.

- `200 OK`

```json
{
  "subjectId": "uuid",
  "tenantId": "uuid",
  "accountType": "CUSTOMER",
  "login": "ana@example.com",
  "name": "Ana Pérez"
}
```

- Errores: `401 NO_AUTORIZADO`.

### Respuesta de login/registro

```json
{
  "accessToken": "eyJ...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "subjectId": "uuid",
  "tenantId": "uuid",
  "accountType": "CUSTOMER",
  "login": "ana@example.com",
  "name": "Ana Pérez"
}
```

## Formato de error

Todos los errores usan el mismo JSON:

```json
{
  "timestamp": "2026-10-25T15:00:00Z",
  "status": 401,
  "error": "Unauthorized",
  "code": "CREDENCIALES_INVALIDAS",
  "message": "Credenciales incorrectas",
  "path": "/api/auth/customer/login",
  "details": {}
}
```

Códigos estables para el frontend: `DATOS_INVALIDOS`, `NO_AUTORIZADO`,
`PROHIBIDO`, `NO_ENCONTRADO`, `CONFLICTO`, `CREDENCIALES_INVALIDAS`,
`USUARIO_DESHABILITADO`, `ARCHIVO_DEMASIADO_GRANDE`, `ERROR_INTERNO`.

## Variables de entorno

| Variable | Default (solo dev) |
|---|---|
| `DB_HOST` | `localhost` |
| `DB_PORT` | `5432` |
| `DB_NAME` | `arbol_venta_auth` |
| `DB_USERNAME` | `postgres` |
| `DB_PASSWORD` | `123` |
| `JWT_SECRET` | valor de ejemplo (cámbialo) |
| `JWT_EXPIRATION_SECONDS` | `86400` |
| `DEFAULT_TENANT_ID` | `11111111-1111-4111-8111-111111111111` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:5173` |

## Decisiones

- **No** se reutiliza la base `mastec_saas` del otro proyecto. Compartir esa
  base mezclaría dos aplicaciones y rompería la regla de una base por servicio.
  Se usa el mismo servidor PostgreSQL local, pero con la base `arbol_venta_auth`.
- `auth-service` no conoce productos, carrito ni órdenes. Si otro servicio
  necesita identidad, valida el JWT o llama a `/api/auth/me`.
