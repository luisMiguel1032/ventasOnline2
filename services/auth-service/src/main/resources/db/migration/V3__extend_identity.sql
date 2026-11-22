-- =====================================================================
-- auth-service: extensión de identidad (inspirado/adaptado de Mastec)
-- Agrega campos de perfil/dirección para e-commerce y tabla de direcciones.
-- =====================================================================

ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS legal_name varchar(220),
    ADD COLUMN IF NOT EXISTS tax_id varchar(50),
    ADD COLUMN IF NOT EXISTS email varchar(180),
    ADD COLUMN IF NOT EXISTS phone varchar(40),
    ADD COLUMN IF NOT EXISTS address text,
    ADD COLUMN IF NOT EXISTS city varchar(120),
    ADD COLUMN IF NOT EXISTS country varchar(80) DEFAULT 'Bolivia',
    ADD COLUMN IF NOT EXISTS timezone varchar(80) NOT NULL DEFAULT 'America/La_Paz',
    ADD COLUMN IF NOT EXISTS currency_code char(3) NOT NULL DEFAULT 'BOB';

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS lastname varchar(160),
    ADD COLUMN IF NOT EXISTS document_type varchar(30),
    ADD COLUMN IF NOT EXISTS document varchar(40),
    ADD COLUMN IF NOT EXISTS phone varchar(40),
    ADD COLUMN IF NOT EXISTS address text,
    ADD COLUMN IF NOT EXISTS branch_name varchar(120),
    ADD COLUMN IF NOT EXISTS role_name varchar(60) DEFAULT 'ADMIN',
    ADD COLUMN IF NOT EXISTS max_sessions integer NOT NULL DEFAULT 2,
    ADD COLUMN IF NOT EXISTS failed_login_attempts smallint NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS locked_until timestamptz,
    ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS document_type varchar(30),
    ADD COLUMN IF NOT EXISTS document_number varchar(40),
    ADD COLUMN IF NOT EXISTS document_complement varchar(10),
    ADD COLUMN IF NOT EXISTS address text,
    ADD COLUMN IF NOT EXISTS city varchar(120),
    ADD COLUMN IF NOT EXISTS state varchar(120),
    ADD COLUMN IF NOT EXISTS country varchar(80) DEFAULT 'Bolivia',
    ADD COLUMN IF NOT EXISTS postal_code varchar(20),
    ADD COLUMN IF NOT EXISTS reference text,
    ADD COLUMN IF NOT EXISTS latitude numeric(10,7),
    ADD COLUMN IF NOT EXISTS longitude numeric(10,7),
    ADD COLUMN IF NOT EXISTS birth_date date,
    ADD COLUMN IF NOT EXISTS customer_type varchar(30) NOT NULL DEFAULT 'retail',
    ADD COLUMN IF NOT EXISTS business_name varchar(180),
    ADD COLUMN IF NOT EXISTS tax_id varchar(50),
    ADD COLUMN IF NOT EXISTS notes text,
    ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_customers_tenant_document
    ON customers (tenant_id, document_number);

CREATE TABLE IF NOT EXISTS customer_addresses (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    customer_id  uuid NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
    label        varchar(60) NOT NULL DEFAULT 'Casa',
    recipient    varchar(160),
    phone        varchar(40),
    address      text NOT NULL,
    city         varchar(120),
    state        varchar(120),
    country      varchar(80) DEFAULT 'Bolivia',
    postal_code  varchar(20),
    reference    text,
    latitude     numeric(10,7),
    longitude    numeric(10,7),
    is_default   boolean NOT NULL DEFAULT false,
    status       smallint NOT NULL DEFAULT 1,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer
    ON customer_addresses (tenant_id, customer_id, is_default DESC, created_at DESC);

-- Backfill básico: nombre de destinatario desde cliente
UPDATE customer_addresses ca
SET recipient = c.name
FROM customers c
WHERE ca.customer_id = c.id AND ca.recipient IS NULL;
