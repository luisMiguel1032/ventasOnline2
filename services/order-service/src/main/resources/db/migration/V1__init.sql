-- =====================================================================
-- order-service: esquema inicial mejorado (e-commerce)
-- Base de datos propia: arbol_venta_order
-- Inspirado/adaptado de Mastec (sales/sale_details) y extendido para web.
-- =====================================================================

CREATE TABLE orders (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        uuid NOT NULL,
    customer_id      uuid NOT NULL,
    order_number     varchar(40) NOT NULL,
    status           varchar(30) NOT NULL DEFAULT 'CREATED',
    subtotal         numeric(12,2) NOT NULL DEFAULT 0,
    discount         numeric(12,2) NOT NULL DEFAULT 0,
    total_amount     numeric(12,2) NOT NULL DEFAULT 0,
    payment_method   varchar(40),
    payment_status   varchar(30) NOT NULL DEFAULT 'PENDING',
    shipping_name    varchar(160),
    shipping_phone   varchar(40),
    shipping_address text,
    shipping_city    varchar(120),
    shipping_notes   text,
    notes            text,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_orders_tenant_number UNIQUE (tenant_id, order_number),
    CONSTRAINT ck_orders_subtotal_nonneg CHECK (subtotal >= 0),
    CONSTRAINT ck_orders_discount_nonneg CHECK (discount >= 0),
    CONSTRAINT ck_orders_total_nonneg CHECK (total_amount >= 0)
);

CREATE TABLE order_items (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    uuid NOT NULL,
    order_id     uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    product_id   uuid NOT NULL,
    product_name varchar(160) NOT NULL,
    product_slug varchar(160),
    image_url    varchar(500),
    unit_price   numeric(12,2) NOT NULL,
    quantity     numeric(14,4) NOT NULL,
    line_total   numeric(12,2) NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_order_items_quantity_pos CHECK (quantity > 0),
    CONSTRAINT ck_order_items_unit_price_nonneg CHECK (unit_price >= 0),
    CONSTRAINT ck_order_items_line_total_nonneg CHECK (line_total >= 0)
);

CREATE TABLE order_status_history (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL,
    order_id    uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    from_status varchar(30),
    to_status   varchar(30) NOT NULL,
    note        text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_customer ON orders (tenant_id, customer_id, created_at desc);
CREATE INDEX idx_orders_status ON orders (tenant_id, status, created_at desc);
CREATE INDEX idx_order_items_order ON order_items (tenant_id, order_id);
CREATE INDEX idx_order_status_history_order ON order_status_history (tenant_id, order_id, created_at desc);
