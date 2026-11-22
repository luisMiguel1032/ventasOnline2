-- =====================================================================
-- cart-service: enriquecer ítems del carrito (snapshot de producto)
-- Facilita mostrar el carrito sin depender de múltiples lecturas externas.
-- =====================================================================

ALTER TABLE cart_items
    ADD COLUMN IF NOT EXISTS product_name varchar(160),
    ADD COLUMN IF NOT EXISTS product_slug varchar(160),
    ADD COLUMN IF NOT EXISTS image_url varchar(500),
    ADD COLUMN IF NOT EXISTS unit_price numeric(12,2);

CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items (tenant_id, product_id);
