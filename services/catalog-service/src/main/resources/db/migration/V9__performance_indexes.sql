-- =====================================================================
-- catalog-service: índices para listados frecuentes
-- =====================================================================

-- Filtros por rango de precio y orden por precio dentro del tenant.
CREATE INDEX IF NOT EXISTS idx_products_tenant_status_price
    ON products (tenant_id, status, price);

-- Orden por "más recientes" en el catálogo y en el panel admin.
CREATE INDEX IF NOT EXISTS idx_products_tenant_status_updated
    ON products (tenant_id, status, updated_at DESC);

-- Ofertas vigentes por fecha de fin (cuentas regresivas y filtros).
CREATE INDEX IF NOT EXISTS idx_product_deals_tenant_status_ends
    ON product_deals (tenant_id, status, ends_at);
