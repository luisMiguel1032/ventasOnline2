# Escalabilidad — Fase 1 (sin Docker)

Mejoras aplicadas sin instalar nada nuevo y sin tocar los cambios pendientes
del proyecto. Todo se activa con el perfil de Spring `scale`.

## Qué cambió

| Archivo | Mejora |
|---|---|
| `services/gateway/.../HttpResilienceConfig.java` | WebClient con timeout de conexión/respuesta/lectura/escritura y pool acotado (`ConnectionProvider`). |
| `services/gateway/.../RouteCircuitBreaker.java` | Circuit breaker por ruta: tras 5 fallos seguidos responde 503 durante 10 s y luego permite una prueba. |
| `services/gateway/.../RateLimitWebFilter.java` | Límite por IP con bucket de tokens (300 req/min). Solo activo con el perfil `scale`. |
| `services/gateway/.../ProxyWebFilter.java` | Usa el WebClient configurado y cuenta fallos/éxitos para el circuit breaker. |
| `services/catalog-service/.../CacheConfig.java` | Caché Caffeine (30 s TTL, máx. 2000 entradas) solo con el perfil `scale`. |
| `services/catalog-service/.../CatalogService.java` | Lecturas cacheadas; escrituras del admin invalidan la caché. |
| `services/catalog-service/.../V9__performance_indexes.sql` | Índices para filtros por precio, orden por fecha y ofertas por fecha de fin. |
| `services/*/src/main/resources/application-scale.yml` | Virtual threads en los servicios MVC + Hikari de 12 conexiones. |
| `services/gateway/src/main/resources/application-scale.yml` | Timeouts, circuit breaker y rate limit del gateway. |
| `web/package.json` | Script `npm run prod` (`next build` + `next start`). |
| `start-scale.ps1` | Arranca todos los backends con el perfil `scale`. |
| `loadtest/smoke.js` | Prueba de carga mínima con k6. |

## Cómo arrancar

```powershell
cd C:\Users\fja57\Desktop\proyecto3ciclobe\amazon-clone

# Detiene los PID que ocupan 8080/8101/8103/8105/8106/3001 y arranca backends
.\start-scale.ps1

# Espera ~1 minuto. Comprueba:
Invoke-RestMethod http://localhost:8080/actuator/health

# Frontend en modo producción (otra terminal):
cd web
npm run prod
```

La migración `V9__performance_indexes.sql` se aplica sola la primera vez que
arranca `catalog-service` con el perfil `scale`.

## Ojo con el rate limit en pruebas locales

Si haces la prueba de carga desde la misma máquina, todo el tráfico sale de
la misma IP y el límite de 300 req/min dará `429`. Desactívalo para medir:

```powershell
$env:GATEWAY_HTTP_RATE_LIMIT_ENABLED = 'false'
.\start-scale.ps1
```

(O cambia `rate-limit-enabled: false` en `services/gateway/src/main/resources/application-scale.yml`).

## Qué NO resuelve todavía

Esto es una sola instancia de cada servicio. Para "miles de usuarios" faltan
las siguientes fases:

1. **Réplicas + balanceador** (Docker Compose o several JVMs con puertos distintos).
2. **Redis** para compartir caché, rate limit y circuit breaker entre réplicas.
3. **PgBouncer** y ajuste de `max_connections` de PostgreSQL.
4. **MinIO/S3** para las imágenes (ahora están en disco local).
5. **Colas** (RabbitMQ/Kafka) para el checkout y control de stock.
6. **CDN** delante del frontend.

El circuit breaker, el rate limit y la caché son **por instancia**: con varias
réplicas cada una tendrá su propio estado. Es correcto para Fase 1, pero no
sustituye a Redis en producción.

## Verificación rápida

```powershell
# Health
Invoke-RestMethod http://localhost:8080/actuator/health
Invoke-RestMethod http://localhost:8103/actuator/health

# Catálogo (la primera petición va a la BD, las siguientes a caché)
Invoke-RestMethod "http://localhost:8080/api/products?size=5"

# Índices creados
$env:PGPASSWORD='123'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres `
  -d arbol_venta_catalog -c "\di idx_products_tenant_status*"
```
