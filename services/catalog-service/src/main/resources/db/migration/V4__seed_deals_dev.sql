-- =====================================================================
-- catalog-service: ofertas SOLO para desarrollo local.
--
-- Se apoyan en los productos demo de V2__seed_dev.sql. Las ventanas de
-- tiempo son relativas al momento en que se aplica la migración para que
-- el temporizador tenga algo que mostrar al abrir la tienda.
-- =====================================================================

INSERT INTO product_deals (
    id, tenant_id, product_id, title, deal_type, discount_percent,
    stock_limit, stock_sold, starts_at, ends_at, status
)
VALUES
    -- Oferta relámpago: queda poco stock y termina pronto.
    ('d1000000-0000-4000-8000-000000000001',
     '11111111-1111-4111-8111-111111111111',
     'c1000000-0000-4000-8000-000000000001',
     'Relámpago: Audífonos Bluetooth', 'LIGHTNING', 35.00,
     25, 18, now() - interval '2 hours', now() + interval '2 days', 1),

    ('d1000000-0000-4000-8000-000000000002',
     '11111111-1111-4111-8111-111111111111',
     'c1000000-0000-4000-8000-000000000002',
     'Relámpago: Teclado mecánico', 'LIGHTNING', 25.00,
     30, 27, now() - interval '1 hour', now() + interval '1 day', 1),

    -- Ofertas destacadas.
    ('d1000000-0000-4000-8000-000000000003',
     '11111111-1111-4111-8111-111111111111',
     'c1000000-0000-4000-8000-000000000003',
     'Destacada: Smartwatch', 'FEATURED', 20.00,
     15, 4, now() - interval '6 hours', now() + interval '14 days', 1),

    ('d1000000-0000-4000-8000-000000000004',
     '11111111-1111-4111-8111-111111111111',
     'c1000000-0000-4000-8000-000000000007',
     'Destacada: Zapatillas running', 'FEATURED', 18.00,
     40, 12, now() - interval '3 hours', now() + interval '10 days', 1),

    -- Ofertas del día.
    ('d1000000-0000-4000-8000-000000000005',
     '11111111-1111-4111-8111-111111111111',
     'c1000000-0000-4000-8000-000000000005',
     'Oferta del día: Cafetera de goteo', 'DAILY', 15.00,
     20, 7, now() - interval '4 hours', now() + interval '7 days', 1),

    ('d1000000-0000-4000-8000-000000000006',
     '11111111-1111-4111-8111-111111111111',
     'c1000000-0000-4000-8000-000000000004',
     'Oferta del día: Lámpara LED', 'DAILY', 10.00,
     50, 20, now() - interval '5 hours', now() + interval '5 days', 1)
ON CONFLICT DO NOTHING;
