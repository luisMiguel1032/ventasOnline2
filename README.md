# Amazonka — clon de Amazon (monorepo)

Sistema de venta por microservicios. Cada servicio tiene su propia carpeta,
su propia base de datos y su propio contrato en `docs/`.

## Estado actual (semana 1)

- [x] Monorepo Gradle con `services/` y `libs/common`
- [x] `auth-service` funcional en el puerto **8101**
  - registro de clientes
  - login de clientes y de administradores
  - JWT HS256 + endpoint `/api/auth/me`
  - Flyway creando `tenants`, `users` y `customers`
  - datos demo y CORS para el frontend
- [x] `gateway` en el puerto **8080** (proxy `/api/auth`, `/api/catalog`, ...)
- [ ] `catalog-service` con base propia: los `GET /api/catalog/...` ya
  funcionan, pero **todavía leen de `mastec_saas`**; falta aislarlo en
  `amazonka_catalog`
- [ ] `web` (Next.js)
- [ ] Demás servicios: esqueletos con health/security (semanas 3-4)

> El proyecto existente usa **Gradle + Java 25 + Spring Boot 4.1.1**, no
> Maven/Java 21/Boot 3 como decía el plan original. Se mantuvo lo que ya
> estaba creado para no romper el trabajo previo.

## Requisitos

- Java 25 (el toolchain del proyecto)
- Node 20+ (para el frontend, más adelante)
- PostgreSQL 18 local **o** Docker Desktop
- Git

No hace falta instalar Maven: se usa el Gradle Wrapper (`gradlew`).

## Base de datos

### Opción A — PostgreSQL local (la de esta máquina)

Ya hay un PostgreSQL 18 corriendo en `localhost:5432`. El `auth-service`
usa una base **exclusiva** llamada `amazonka_auth`:

```powershell
$env:PGPASSWORD='123'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -c "CREATE DATABASE amazonka_auth;"
```

Si la base ya existe, no ejecutes el comando otra vez. Las tablas las crea
Flyway automáticamente al arrancar el servicio.

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
`amazonka_auth`, `amazonka_catalog`, `amazonka_cart`, etc.

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

Ejemplo rápido:

```powershell
$body = @{ email='cliente@demo.com'; password='12345678' } | ConvertTo-Json
$login = Invoke-RestMethod http://localhost:8101/api/auth/customer/login `
  -Method Post -ContentType 'application/json' -Body $body

Invoke-RestMethod http://localhost:8101/api/auth/me `
  -Headers @{ Authorization = "Bearer $($login.accessToken)" }
```

Contrato completo: [`docs/auth-service.md`](docs/auth-service.md).

## Estructura

```
amazon-clone/
├── docker-compose.yml
├── docs/
│   └── auth-service.md
├── infra/
│   └── docker/postgres/init.sql
├── libs/
│   └── common/              # errores, JWT, paginación, BaseEntity
├── services/
│   ├── auth-service/        # 8101  (listo)
│   ├── catalog-service/    # 8103  (lee mastec_saas; falta aislar)
│   ├── gateway/            # 8080  (proxy)
│   └── ...
└── web/                     # frontend (pendiente)
```

## Reglas del proyecto

1. Una carpeta = un servicio = una base de datos propia.
2. Todas las tablas se crean con Flyway, nunca a mano.
3. El contrato (endpoints y eventos) se escribe en `docs/` antes de programar.
4. No subir contraseñas: usar variables de entorno (`.env` está ignorado).
5. El frontend habla con el gateway (`http://localhost:8080/api/...`), no
   directamente con cada servicio.

## Siguiente paso

Aislar `catalog-service` en su propia base `amazonka_catalog`:
migraciones Flyway para `categories`, `brands`, `products` y
`product_images`, copiar los productos demo que hoy están en `mastec_saas`
y agregar `POST /api/catalog/products` (solo ADMIN). Después, el frontend
`web` con login, registro, home y detalle de producto.
