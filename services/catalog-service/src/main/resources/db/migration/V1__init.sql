-- =====================================================================
-- catalog-service: esquema inicial
-- Base de datos propia: arbol_venta_catalog
-- Ningún otro servicio debe leer ni escribir estas tablas.
-- =====================================================================

CREATE TABLE categories (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL,
    name        varchar(120) NOT NULL,
    slug        varchar(140) NOT NULL,
    image       varchar(500),
    sort_order  integer NOT NULL DEFAULT 0,
    status      smallint NOT NULL DEFAULT 1,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_categories_tenant_slug UNIQUE (tenant_id, slug)
);

CREATE TABLE brands (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL,
    name        varchar(120) NOT NULL,
    slug        varchar(140) NOT NULL,
    status      smallint NOT NULL DEFAULT 1,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_brands_tenant_slug UNIQUE (tenant_id, slug)
);

CREATE TABLE products (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     uuid NOT NULL,
    category_id   uuid REFERENCES categories (id) ON DELETE SET NULL,
    brand_id      uuid REFERENCES brands (id) ON DELETE SET NULL,
    code          varchar(50) NOT NULL,
    item_code     varchar(50) NOT NULL,
    name          varchar(160) NOT NULL,
    description   text,
    slug          varchar(160) NOT NULL,
    image         varchar(500),
    features      text,
    type          varchar(40) NOT NULL DEFAULT 'physical',
    price         numeric(12, 2) NOT NULL CHECK (price >= 0),
    stock         numeric(14, 4) NOT NULL DEFAULT 0 CHECK (stock >= 0),
    rating_avg    numeric(3, 2) NOT NULL DEFAULT 0 CHECK (rating_avg >= 0 AND rating_avg <= 5),
    rating_count  integer NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
    unit_name     varchar(40) NOT NULL DEFAULT 'unidad',
    status        smallint NOT NULL DEFAULT 1,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_products_tenant_slug UNIQUE (tenant_id, slug),
    CONSTRAINT uq_products_tenant_code UNIQUE (tenant_id, code),
    CONSTRAINT uq_products_tenant_item_code UNIQUE (tenant_id, item_code)
);

CREATE INDEX idx_products_tenant_category ON products (tenant_id, category_id);
CREATE INDEX idx_products_tenant_brand ON products (tenant_id, brand_id);
CREATE INDEX idx_products_tenant_name ON products (tenant_id, name);

CREATE TABLE product_images (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL,
    product_id  uuid NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    image_path  varchar(500) NOT NULL,
    is_primary  boolean NOT NULL DEFAULT false,
    sort_order  integer NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_images_product
    ON product_images (tenant_id, product_id, is_primary DESC, sort_order);

-- Vista de lectura que usa CatalogRepository. Se mantiene el alias
-- "categorie_id" para no romper los contratos ya escritos.
CREATE VIEW v_shop_products AS
SELECT
    p.id,
    p.tenant_id,
    p.code,
    p.item_code,
    p.name,
    p.description,
    p.slug,
    p.image,
    p.features,
    p.type,
    p.price,
    p.stock,
    p.rating_avg,
    p.rating_count,
    p.category_id AS categorie_id,
    c.name AS category_name,
    p.brand_id,
    b.name AS brand_name,
    p.unit_name,
    p.created_at,
    p.updated_at
FROM products p
LEFT JOIN categories c
    ON c.id = p.category_id AND c.tenant_id = p.tenant_id
LEFT JOIN brands b
    ON b.id = p.brand_id AND b.tenant_id = p.tenant_id
WHERE p.status = 1;
