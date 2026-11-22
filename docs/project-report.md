# Documento de proyecto — Árbol de Venta

## Datos generales

- **Nombre del proyecto:** Árbol de Venta (Amazon Clone)
- **Empresa / negocio:** Proyecto académico de e-commerce (tienda en línea)
- **Integrantes del grupo:**
  - [Nombre completo] — Rol: [ej. Backend / Frontend / Base de datos / Documentación]
  - [Nombre completo] — Rol: [...]
- **Materia:** [Nombre de la materia]
- **Docente:** [Nombre del docente]
- **Carrera:** [Nombre de la carrera]
- **Universidad:** [Nombre de la universidad]
- **Fecha de entrega:** [DD/MM/AAAA]
- **Guía / plantilla APA:** [Indicar si el docente entregó plantilla, márgenes, fuente, portada, etc.]

---

## 1. Planificación

### 1.1 Problema que resuelve el sistema

Antes del sistema, la tienda no contaba con una plataforma unificada para:
- publicar y administrar productos,
- gestionar ofertas con descuento automático y temporizador,
- controlar stock limitado en ofertas,
- permitir que clientes naveguen, busquen y filtren productos,
- separar roles de administrador y cliente.

El sistema resuelve esto con una aplicación web conectada a microservicios que
centraliza catálogo, ofertas, autenticación y administración.

### 1.2 Objetivo general

Desarrollar un sistema de e-commerce (clon de Amazon) con microservicios que
permita a clientes consultar productos y ofertas, y a administradores gestionar
el catálogo y las promociones.

### 1.3 Objetivos específicos

- Implementar autenticación JWT para clientes y administradores.
- Crear un catálogo de productos con búsqueda, filtros y paginación.
- Implementar ofertas (diarias, destacadas, relámpago) con descuento automático,
  temporizador y stock limitado.
- Desarrollar un panel de administración para productos y ofertas.
- Agregar módulo de atención médica y videos de productos.
- Exponer todo a través de un gateway con control de CORS.

### 1.4 Alcance

**Incluye:**
- Catálogo de productos, categorías y marcas.
- Ofertas con descuento automático y stock limitado.
- Panel de administración de productos y ofertas.
- Login unificado y modo cliente para admin.
- Módulo médico y videos de productos.
- Documentación de contratos y despliegue local.

**No incluye (pendiente):**
- Carrito y checkout.
- Pedidos y pagos.
- Inventario avanzado.
- Despliegue en nube (solo local/Docker).

### 1.5 Cronograma (referencial)

| Semana | Actividad | Responsable |
|---|---|---|
| 1 | Monorepo, auth-service, base de datos | [Integrante] |
| 2 | catalog-service, productos y categorías | [Integrante] |
| 3 | Frontend base (home, detalle, login) | [Integrante] |
| 4 | Ofertas del Día (backend + frontend + admin) | [Integrante] |
| 5 | Módulo médico y videos de productos | [Integrante] |
| 6 | Modo cliente, cache y documentación | [Integrante] |

### 1.6 Metodología

Se utilizó un enfoque **iterativo e incremental**, desarrollando por módulos
(auth, catálogo, ofertas, médico, videos) y validando cada uno antes de pasar al
siguiente.

### 1.7 Recursos

- **Herramientas:** Gradle, Java 25, Spring Boot 4.1.1, Next.js 16, React 19,
  TypeScript, PostgreSQL 18, Flyway, Docker (opcional).
- **Equipos:** PC de desarrollo local.
- **Costo estimado:** [Si se calculó, indicar aquí; si no, escribir “No aplica”].

---

## 2. Análisis

### 2.1 Funcionalidades del sistema

- Registro y login de clientes.
- Login de administradores.
- Catálogo con búsqueda, filtros, orden y paginación.
- Detalle de producto con galería, rating, precio y stock.
- Ofertas del día con descuento, temporizador y stock limitado.
- Panel admin de productos (CRUD).
- Panel admin de ofertas (CRUD y desactivación).
- Módulo de atención médica.
- Videos de productos en home y detalle.
- Modo cliente para admin.

### 2.2 Tipos de usuario

| Rol | Descripción | Acciones principales |
|---|---|---|
| Cliente | Usuario final de la tienda | Navegar catálogo, ver ofertas, login/registro |
| Administrador | Gestor del negocio | CRUD de productos y ofertas, modo cliente |

### 2.3 Requisitos funcionales

- RF1: El sistema debe permitir registrar e iniciar sesión como cliente.
- RF2: El sistema debe permitir iniciar sesión como administrador.
- RF3: El sistema debe mostrar productos con búsqueda y filtros.
- RF4: El sistema debe mostrar ofertas con descuento y temporizador.
- RF5: El sistema debe permitir al admin crear/editar/desactivar productos.
- RF6: El sistema debe permitir al admin crear/editar/desactivar ofertas.
- RF7: El sistema debe mostrar videos de productos.

### 2.4 Requisitos no funcionales

- RNF1: Uso de JWT para autenticación.
- RNF2: Base de datos por servicio (aislamiento).
- RNF3: Migraciones con Flyway.
- RNF4: Frontend consume solo el gateway.
- RNF5: CORS habilitado para el frontend.

### 2.5 Misión, visión y organigrama

- **Misión:** [Completar si la empresa la tiene]
- **Visión:** [Completar si la empresa la tiene]
- **Organigrama:** [Adjuntar imagen o describir roles]

---

## 3. Diseño

### 3.1 Arquitectura

Microservicios con gateway:

```
Navegador → Next.js :3001 → Gateway :8080 → auth-service :8101
                                        └→ catalog-service :8103
```

### 3.2 Diagramas

- Casos de uso: [Adjuntar imagen]
- Clases: [Adjuntar imagen]
- Entidad-relación: [Adjuntar imagen]
- Secuencia: [Adjuntar imagen]

### 3.3 Base de datos

Tablas principales (catalog-service):
- `categories(id, tenant_id, name, slug, image, sort_order)`
- `brands(id, tenant_id, name, slug)`
- `products(id, tenant_id, category_id, brand_id, code, item_code, name,
  description, slug, image, video_url, features, type, price, stock,
  rating_avg, rating_count, unit_name, status)`
- `product_images(tenant_id, product_id, image_path, is_primary, sort_order)`
- `product_deals(id, tenant_id, product_id, title, deal_type, discount_percent,
  stock_limit, stock_sold, starts_at, ends_at, status)`

Tablas auth-service:
- `tenants`
- `users`
- `customers`

### 3.4 Capturas de pantalla

- Home: [Adjuntar imagen]
- Detalle de producto: [Adjuntar imagen]
- Ofertas: [Adjuntar imagen]
- Panel admin: [Adjuntar imagen]

### 3.5 Paleta de colores / diseño

- Brand: `#131921`
- Brand soft: `#232f3e`
- Accent: `#febd69`
- Accent strong: `#f3a847`
- Link: `#007185`
- Success: `#067d62`
- Danger: `#b12704`
- Módulo médico: acentos en verde/teal (`#34d399`, `#0f3d3e`).

Diseño en Figma: [Enlace si existe]

---

## 4. Desarrollo

### 4.1 Tecnologías y versiones

- Java: 25
- Spring Boot: 4.1.1
- Gradle Wrapper
- PostgreSQL: 18
- Flyway: 12.4.0
- Next.js: 16.4.3
- React: 19
- TypeScript: 5.x
- Node.js: 20+

### 4.2 Estructura de carpetas

```
amazon-clone/
├── docs/
├── libs/common/
├── services/
│   ├── auth-service/
│   ├── catalog-service/
│   ├── gateway/
│   ├── cart-service/
│   └── order-service/
└── web/
    ├── app/
    ├── components/
    └── lib/
```

### 4.3 Fragmentos de código importantes

**Login unificado (frontend):**
```ts
try {
  await login(value, password);
  router.push(next);
} catch {
  const adminSession = await loginAsAdmin({ login: value, password });
  router.push(adminSession.accountType === 'ADMIN' ? '/admin' : next);
}
```

**Creación de oferta (backend):**
```java
return ResponseEntity.status(HttpStatus.CREATED)
    .body(catalogService.createDeal(tenant(jwt), request));
```

### 4.4 Módulos o servicios

- auth-service
- catalog-service
- gateway
- web (Next.js)

---

## 5. Prueba

### 5.1 Pruebas realizadas

- `npm run typecheck` sin errores.
- `npm run build` exitoso.
- Smoke tests en navegador (home, ofertas, detalle, admin).
- Verificación de API vía gateway (productos, ofertas, admin).
- Prueba de login unificado (cliente y admin).

### 5.2 Errores encontrados y correcciones

- Error de CORS: se agregaron orígenes `http://localhost:3001`.
- Error de `Instant` en PostgreSQL: se usó `OffsetDateTime` con `TIMESTAMP_WITH_TIMEZONE`.
- Vista `v_shop_products`: se agregó `deal_stock_limit` y `video_url` al final para no romper `CREATE OR REPLACE VIEW`.
- Next.js security nudge: documentado; requiere actualización de versión.

### 5.3 Casos de prueba formales

Si se requieren casos formales, se pueden armar con los flujos ya verificados:
- Login cliente/admin.
- Listado y filtro de productos.
- Creación/edición de producto por admin.
- Creación/edición/desactivación de oferta.
- Visualización de video en detalle.

---

## 6. Implementación

### 6.1 Despliegue

- Entorno: local.
- Backend: Gradle `bootRun` o jars.
- Frontend: `npm run dev` en puerto 3001.

### 6.2 Requisitos de instalación

- Java 25
- Node 20+
- PostgreSQL 18
- Git
- Variables de entorno: `NEXT_PUBLIC_API_URL`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` (opcional)

### 6.3 Manual de usuario

- Cliente: navegar catálogo, ver ofertas, iniciar sesión.
- Admin: acceder a `/admin`, gestionar productos y ofertas.
- Modo cliente: botón “Ver como cliente” en navbar.

---

## 7. Mantenimiento

### 7.1 Copias de seguridad

- Respaldar bases `arbol_venta_auth` y `arbol_venta_catalog` con `pg_dump`.
- El código está en GitHub: `luisMiguel1032/ventasOnline2`.

### 7.2 Actualizaciones

- Nuevas migraciones Flyway para cambios de esquema.
- Actualizar dependencias (Next.js, Spring Boot) periódicamente.

### 7.3 Mejoras futuras

- Carrito, checkout y pedidos.
- Gestión avanzada de fotos (múltiples imágenes, portada).
- Panel de permisos y usuarios.
- Despliegue en nube.
- Mejoras de navegación instantánea (prefetch, transiciones).

### 7.4 Soporte

- Responsable técnico: [Integrante / equipo]
- Contacto: [correo o canal]