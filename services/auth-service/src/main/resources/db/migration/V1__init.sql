-- =====================================================================
-- auth-service: esquema inicial
-- Base de datos propia: arbol_venta_auth
--
-- Solo viven aquí las tablas de identidad:
--   tenants   -> tienda/empresa (tenant)
--   users     -> personal administrativo (panel admin)
--   customers -> clientes de la tienda (web pública)
--
-- Ningún otro servicio debe leer estas tablas. Si necesita saber quién
-- es el usuario, valida el JWT o pregunta al auth-service por HTTP.
-- =====================================================================

CREATE TABLE tenants (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       varchar(120) NOT NULL,
    slug       varchar(80)  NOT NULL,
    status     smallint     NOT NULL DEFAULT 1,
    created_at timestamptz  NOT NULL DEFAULT now(),
    updated_at timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_tenants_slug UNIQUE (slug)
);

CREATE TABLE users (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  uuid         NOT NULL REFERENCES tenants (id),
    login      varchar(80)  NOT NULL,
    name       varchar(160) NOT NULL,
    email      varchar(180) NOT NULL,
    password   varchar(100) NOT NULL,
    status     smallint     NOT NULL DEFAULT 1,
    deleted_at timestamptz,
    created_at timestamptz  NOT NULL DEFAULT now(),
    updated_at timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_users_tenant_login UNIQUE (tenant_id, login)
);

CREATE INDEX idx_users_tenant_email
    ON users (tenant_id, email);

CREATE TABLE customers (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  uuid         NOT NULL REFERENCES tenants (id),
    name       varchar(160) NOT NULL,
    email      varchar(180) NOT NULL,
    phone      varchar(40),
    password   varchar(100) NOT NULL,
    status     smallint     NOT NULL DEFAULT 1,
    created_at timestamptz  NOT NULL DEFAULT now(),
    updated_at timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_customers_tenant_email UNIQUE (tenant_id, email)
);

CREATE INDEX idx_customers_tenant_email
    ON customers (tenant_id, lower(email));
