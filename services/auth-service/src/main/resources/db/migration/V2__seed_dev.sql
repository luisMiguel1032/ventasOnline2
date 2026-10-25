-- =====================================================================
-- Datos SOLO para desarrollo local.
--
-- Tenant por defecto: 11111111-1111-4111-8111-111111111111
-- (el mismo valor de app.default-tenant-id en application.yml)
--
-- Credenciales de prueba:
--   Admin    -> login: admin            password: 12345678
--   Cliente  -> email: cliente@demo.com password: 12345678
--
-- El hash es BCrypt cost 10 generado con BCryptPasswordEncoder.
-- No reutilizar en producción: cambia estas contraseñas al desplegar.
-- =====================================================================

INSERT INTO tenants (id, name, slug, status)
VALUES (
    '11111111-1111-4111-8111-111111111111',
    'Amazonka Demo',
    'amazonka-demo',
    1
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (
    id,
    tenant_id,
    login,
    name,
    email,
    password,
    status
)
VALUES (
    '55555555-5555-4555-8555-555555555551',
    '11111111-1111-4111-8111-111111111111',
    'admin',
    'Administrador',
    'admin@amazonka.local',
    '$2a$10$oAlYLvioeNW3c8OibqQh7uhUqYFVvw.CgTL1RJCqOkU4yAmF7eNly',
    1
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO customers (
    id,
    tenant_id,
    name,
    email,
    phone,
    password,
    status
)
VALUES (
    '66666666-6666-4666-8666-666666666661',
    '11111111-1111-4111-8111-111111111111',
    'Cliente Demo',
    'cliente@demo.com',
    '70000000',
    '$2a$10$oAlYLvioeNW3c8OibqQh7uhUqYFVvw.CgTL1RJCqOkU4yAmF7eNly',
    1
)
ON CONFLICT (id) DO NOTHING;
