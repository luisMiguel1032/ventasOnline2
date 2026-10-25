-- =====================================================================
-- catalog-service: datos SOLO para desarrollo local.
--
-- Mismo tenant demo que auth-service:
--   11111111-1111-4111-8111-111111111111
--
-- Estos productos cubren el POST /products mientras el panel admin
-- no existe. No reutilizar estas URLs ni precios en producción.
-- =====================================================================

INSERT INTO categories (id, tenant_id, name, slug, image, sort_order)
VALUES
    ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
     'Electrónica', 'electronica',
     'https://picsum.photos/seed/electronica/600/400', 1),
    ('aaaaaaaa-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
     'Hogar', 'hogar',
     'https://picsum.photos/seed/hogar/600/400', 2),
    ('aaaaaaaa-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111',
     'Moda', 'moda',
     'https://picsum.photos/seed/moda/600/400', 3),
    ('aaaaaaaa-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111',
     'Deportes', 'deportes',
     'https://picsum.photos/seed/deportes/600/400', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO brands (id, tenant_id, name, slug)
VALUES
    ('bbbbbbbb-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
     'TechNova', 'technova'),
    ('bbbbbbbb-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
     'CasaViva', 'casaviva'),
    ('bbbbbbbb-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111',
     'UrbanStyle', 'urbanstyle')
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (
    id, tenant_id, category_id, brand_id,
    code, item_code, name, description, slug, image, features,
    type, price, stock, rating_avg, rating_count, unit_name, status
)
VALUES
    ('c1000000-0000-4000-8000-000000000001',
     '11111111-1111-4111-8111-111111111111',
     'aaaaaaaa-0000-4000-8000-000000000001',
     'bbbbbbbb-0000-4000-8000-000000000001',
     'P-001', 'IT-001', 'Audífonos Bluetooth',
     'Audífonos inalámbricos con cancelación activa de ruido y hasta 30 horas de batería.',
     'audifonos-bluetooth',
     'https://picsum.photos/seed/audifonos/800/800',
     'Bluetooth 5.3; Cancelación activa de ruido; 30 h de batería; Estuche de carga',
     'physical', 199.90, 50, 4.60, 128, 'unidad', 1),

    ('c1000000-0000-4000-8000-000000000002',
     '11111111-1111-4111-8111-111111111111',
     'aaaaaaaa-0000-4000-8000-000000000001',
     'bbbbbbbb-0000-4000-8000-000000000001',
     'P-002', 'IT-002', 'Teclado mecánico',
     'Teclado mecánico con switches rojos, retroiluminación RGB y reposamuñecas.',
     'teclado-mecanico',
     'https://picsum.photos/seed/teclado/800/800',
     'Switches rojos; RGB; Reposamuñecas; Cable USB-C desmontable',
     'physical', 349.00, 30, 4.80, 64, 'unidad', 1),

    ('c1000000-0000-4000-8000-000000000003',
     '11111111-1111-4111-8111-111111111111',
     'aaaaaaaa-0000-4000-8000-000000000001',
     'bbbbbbbb-0000-4000-8000-000000000001',
     'P-003', 'IT-003', 'Smartwatch',
     'Reloj inteligente con GPS, monitor de ritmo cardíaco y resistencia al agua.',
     'smartwatch',
     'https://picsum.photos/seed/smartwatch/800/800',
     'GPS integrado; Ritmo cardíaco; Resistente al agua; 7 días de batería',
     'physical', 459.00, 20, 4.40, 41, 'unidad', 1),

    ('c1000000-0000-4000-8000-000000000004',
     '11111111-1111-4111-8111-111111111111',
     'aaaaaaaa-0000-4000-8000-000000000002',
     'bbbbbbbb-0000-4000-8000-000000000002',
     'P-004', 'IT-004', 'Lámpara LED',
     'Lámpara de escritorio con brazo articulado, luz cálida y tres niveles de brillo.',
     'lampara-led',
     'https://picsum.photos/seed/lampara/800/800',
     'Brazo articulado; 3 niveles de brillo; Puerto USB; Luz cálida',
     'physical', 89.50, 100, 4.30, 87, 'unidad', 1),

    ('c1000000-0000-4000-8000-000000000005',
     '11111111-1111-4111-8111-111111111111',
     'aaaaaaaa-0000-4000-8000-000000000002',
     'bbbbbbbb-0000-4000-8000-000000000002',
     'P-005', 'IT-005', 'Cafetera de goteo',
     'Cafetera de goteo para 12 tazas con jarra térmica y filtro reutilizable.',
     'cafetera-goteo',
     'https://picsum.photos/seed/cafetera/800/800',
     '12 tazas; Jarra térmica; Filtro reutilizable; Apagado automático',
     'physical', 249.00, 15, 4.50, 33, 'unidad', 1),

    ('c1000000-0000-4000-8000-000000000006',
     '11111111-1111-4111-8111-111111111111',
     'aaaaaaaa-0000-4000-8000-000000000002',
     'bbbbbbbb-0000-4000-8000-000000000002',
     'P-006', 'IT-006', 'Juego de sábanas',
     'Juego de sábanas de algodón 100% para cama de dos plazas, tono beige.',
     'juego-sabanas',
     'https://picsum.photos/seed/sabanas/800/800',
     'Algodón 100%; 4 piezas; Cama de 2 plazas; Lavable a máquina',
     'physical', 129.00, 40, 4.20, 52, 'unidad', 1),

    ('c1000000-0000-4000-8000-000000000007',
     '11111111-1111-4111-8111-111111111111',
     'aaaaaaaa-0000-4000-8000-000000000004',
     'bbbbbbbb-0000-4000-8000-000000000003',
     'P-007', 'IT-007', 'Zapatillas running',
     'Zapatillas ligeras para entrenamiento diario con suela amortiguada.',
     'zapatillas-running',
     'https://picsum.photos/seed/zapatillas/800/800',
     'Suela amortiguada; Tejido transpirable; Peso ligero; Uso diario',
     'physical', 289.00, 25, 4.70, 95, 'unidad', 1),

    ('c1000000-0000-4000-8000-000000000008',
     '11111111-1111-4111-8111-111111111111',
     'aaaaaaaa-0000-4000-8000-000000000003',
     'bbbbbbbb-0000-4000-8000-000000000003',
     'P-008', 'IT-008', 'Mochila urbana',
     'Mochila impermeable con compartimento para portátil de hasta 15 pulgadas.',
     'mochila-urbana',
     'https://picsum.photos/seed/mochila/800/800',
     'Impermeable; Portátil 15"; Compartimento antirrobo; Correas acolchadas',
     'physical', 159.00, 35, 4.50, 70, 'unidad', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_images (tenant_id, product_id, image_path, is_primary, sort_order)
VALUES
    ('11111111-1111-4111-8111-111111111111', 'c1000000-0000-4000-8000-000000000001',
     'https://picsum.photos/seed/audifonos/800/800', true, 0),
    ('11111111-1111-4111-8111-111111111111', 'c1000000-0000-4000-8000-000000000001',
     'https://picsum.photos/seed/audifonos-2/800/800', false, 1),
    ('11111111-1111-4111-8111-111111111111', 'c1000000-0000-4000-8000-000000000002',
     'https://picsum.photos/seed/teclado/800/800', true, 0),
    ('11111111-1111-4111-8111-111111111111', 'c1000000-0000-4000-8000-000000000003',
     'https://picsum.photos/seed/smartwatch/800/800', true, 0),
    ('11111111-1111-4111-8111-111111111111', 'c1000000-0000-4000-8000-000000000004',
     'https://picsum.photos/seed/lampara/800/800', true, 0),
    ('11111111-1111-4111-8111-111111111111', 'c1000000-0000-4000-8000-000000000005',
     'https://picsum.photos/seed/cafetera/800/800', true, 0),
    ('11111111-1111-4111-8111-111111111111', 'c1000000-0000-4000-8000-000000000006',
     'https://picsum.photos/seed/sabanas/800/800', true, 0),
    ('11111111-1111-4111-8111-111111111111', 'c1000000-0000-4000-8000-000000000007',
     'https://picsum.photos/seed/zapatillas/800/800', true, 0),
    ('11111111-1111-4111-8111-111111111111', 'c1000000-0000-4000-8000-000000000008',
     'https://picsum.photos/seed/mochila/800/800', true, 0)
ON CONFLICT DO NOTHING;
