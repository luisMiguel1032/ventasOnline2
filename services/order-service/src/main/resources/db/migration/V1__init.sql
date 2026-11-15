CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    status varchar(30) NOT NULL DEFAULT 'CREATED',
    total_amount numeric(12,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    order_id uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    product_id uuid NOT NULL,
    product_name varchar(160) NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    quantity numeric(14,4) NOT NULL,
    line_total numeric(12,2) NOT NULL
);

CREATE INDEX idx_orders_customer ON orders (tenant_id, customer_id, created_at desc);
CREATE INDEX idx_order_items_order ON order_items (tenant_id, order_id);
