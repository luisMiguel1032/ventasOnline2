-- =====================================================================
-- catalog-service: extensiones inspiradas/adaptadas de Mastec
-- Mejora el modelo de catálogo para e-commerce (sin romper contratos actuales).
-- =====================================================================

-- Productos: campos adicionales útiles (POS/e-commerce)
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS barcode varchar(80),
    ADD COLUMN IF NOT EXISTS sku varchar(80),
    ADD COLUMN IF NOT EXISTS short_description varchar(500),
    ADD COLUMN IF NOT EXISTS principle_active varchar(255),
    ADD COLUMN IF NOT EXISTS cost_price numeric(12,2),
    ADD COLUMN IF NOT EXISTS compare_at_price numeric(12,2),
    ADD COLUMN IF NOT EXISTS min_stock numeric(14,4) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sold_by_weight boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS show_in_shop boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS track_inventory boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS weight numeric(12,4),
    ADD COLUMN IF NOT EXISTS width numeric(12,4),
    ADD COLUMN IF NOT EXISTS height numeric(12,4),
    ADD COLUMN IF NOT EXISTS length numeric(12,4),
    ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_products_tenant_show_in_shop
    ON products (tenant_id, show_in_shop, status);
CREATE INDEX IF NOT EXISTS idx_products_tenant_barcode
    ON products (tenant_id, barcode);

-- Categorías: descripción y estado visible
ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS description text,
    ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- Marcas: imagen/logo
ALTER TABLE brands
    ADD COLUMN IF NOT EXISTS image varchar(500),
    ADD COLUMN IF NOT EXISTS description text;

-- Precios múltiples por producto (adaptado de Mastec product_prices)
CREATE TABLE IF NOT EXISTS product_prices (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    uuid NOT NULL,
    product_id   uuid NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    name         varchar(80) NOT NULL,            -- ej: normal, mayorista, oferta especial, online
    price_type   varchar(30) NOT NULL DEFAULT 'sale',
    price        numeric(12,2) NOT NULL CHECK (price >= 0),
    currency     char(3) NOT NULL DEFAULT 'BOB',
    min_quantity numeric(14,4),
    max_quantity numeric(14,4),
    customer_type varchar(30),
    is_default   boolean NOT NULL DEFAULT false,
    status       smallint NOT NULL DEFAULT 1,
    starts_at    timestamptz,
    ends_at      timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_product_prices_tenant_product_name UNIQUE (tenant_id, product_id, name)
);

CREATE INDEX IF NOT EXISTS idx_product_prices_product
    ON product_prices (tenant_id, product_id, status);

-- Movimientos de inventario (historial básico, inspirado en Mastec inventories/adjustments)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      uuid NOT NULL,
    product_id     uuid NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    movement_type  varchar(30) NOT NULL, -- in, out, adjust, sale, return
    quantity       numeric(14,4) NOT NULL,
    previous_stock numeric(14,4),
    new_stock      numeric(14,4),
    reference_type varchar(40),          -- order, purchase, adjustment, manual
    reference_id   uuid,
    note           text,
    created_by     uuid,
    created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product
    ON inventory_movements (tenant_id, product_id, created_at DESC);

-- Actualizar vista de lectura manteniendo compatibilidad y agregando campos al final
CREATE OR REPLACE VIEW v_shop_products AS
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
      p.updated_at,
      d.id AS deal_id,
      round(p.price * (1 - d.discount_percent / 100), 2) AS deal_price,
      d.discount_percent AS deal_discount_percent,
      d.deal_type,
      d.title AS deal_title,
      d.ends_at AS deal_ends_at,
      least(greatest(d.stock_limit - d.stock_sold, 0), p.stock) AS deal_stock_remaining,
      CASE
          WHEN d.stock_limit > 0
              THEN round(((d.stock_limit - d.stock_sold) / d.stock_limit) * 100)
          ELSE 0
      END AS deal_stock_percent,
      d.stock_limit AS deal_stock_limit,
      p.video_url,
      p.short_description,
      p.principle_active,
      p.barcode,
      p.sku,
      p.cost_price,
      p.compare_at_price,
      p.min_stock,
      p.sold_by_weight,
      p.show_in_shop,
      p.track_inventory,
      p.weight
  FROM products p
  LEFT JOIN categories c
      ON c.id = p.category_id AND c.tenant_id = p.tenant_id
  LEFT JOIN brands b
      ON b.id = p.brand_id AND b.tenant_id = p.tenant_id
  LEFT JOIN product_deals d
      ON d.tenant_id = p.tenant_id
      AND d.product_id = p.id
      AND d.status = 1
      AND now() BETWEEN d.starts_at AND d.ends_at
  WHERE p.status = 1;

-- Backfill: crear precio "normal" por producto si no existe
INSERT INTO product_prices (tenant_id, product_id, name, price_type, price, is_default, status)
SELECT p.tenant_id, p.id, 'normal', 'sale', p.price, true, 1
FROM products p
WHERE NOT EXISTS (
    SELECT 1 FROM product_prices pp WHERE pp.tenant_id = p.tenant_id AND pp.product_id = p.id AND pp.name = 'normal'
);
