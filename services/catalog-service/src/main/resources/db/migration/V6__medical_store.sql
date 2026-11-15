-- =====================================================================
-- catalog-service: módulo de tienda médica (desarrollo local).
-- Agrega la categoría "Salud" y productos médicos de demo.
-- =====================================================================

INSERT INTO categories (id, tenant_id, name, slug, image, sort_order)
VALUES (
    'aaaaaaaa-0000-4000-8000-000000000005',
    '11111111-1111-4111-8111-111111111111',
    'Salud', 'salud',
    'https://picsum.photos/seed/salud/600/400', 5
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO brands (id, tenant_id, name, slug)
VALUES (
    'bbbbbbbb-0000-4000-8000-000000000004',
    '11111111-1111-4111-8111-111111111111',
    'MediCare', 'medicare'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (
    id, tenant_id, category_id, brand_id,
    code, item_code, name, description, slug, image, features,
    type, price, stock, rating_avg, rating_count, unit_name, status
)
VALUES
    ('c1000000-0000-4000-8000-000000000009',
     '11111111-1111-4111-8111-111111111111',
     'aaaaaaaa-0000-4000-8000-000000000005',
     'bbbbbbbb-0000-4000-8000-000000000004',
     'M-001', 'MD-001', 'Termómetro digital',
     'Termómetro digital de lectura rápida con punta flexible y memoria de última medición.',
     'termometro-digital',
     'https://picsum.photos/seed/termometro/800/800',
     'Lectura en 10 s; Punta flexible; Memoria; Pantalla LCD',
     'physical', 49.90, 60, 4.70, 92, 'unidad', 1),

    ('c1000000-0000-4000-8000-000000000010',
     '11111111-1111-4111-8111-111111111111',
     'aaaaaaaa-0000-4000-8000-000000000005',
     'bbbbbbbb-0000-4000-8000-000000000004',
     'M-002', 'MD-002', 'Mascarillas KN95 (pack x10)',
     'Pack de 10 mascarillas KN95 con 5 capas de filtración y ajuste cómodo.',
     'mascarillas-kn95',
     'https://picsum.photos/seed/mascarillas/800/800',
     '5 capas; Filtración 95%; Ajuste cómodo; Pack x10',
     'physical', 29.90, 120, 4.50, 150, 'pack', 1),

    ('c1000000-0000-4000-8000-000000000011',
     '11111111-1111-4111-8111-111111111111',
     'aaaaaaaa-0000-4000-8000-000000000005',
     'bbbbbbbb-0000-4000-8000-000000000004',
     'M-003', 'MD-003', 'Alcohol en gel 500 ml',
     'Gel antibacterial con 70% de alcohol, aloe vera y secado rápido.',
     'alcohol-gel',
     'https://picsum.photos/seed/alcoholgel/800/800',
     '70% alcohol; Aloe vera; Secado rápido; 500 ml',
     'physical', 14.50, 200, 4.60, 210, 'frasco', 1),

    ('c1000000-0000-4000-8000-000000000012',
     '11111111-1111-4111-8111-111111111111',
     'aaaaaaaa-0000-4000-8000-000000000005',
     'bbbbbbbb-0000-4000-8000-000000000004',
     'M-004', 'MD-004', 'Tensiómetro digital',
     'Tensiómetro de brazo con detección de arritmia y memoria para dos usuarios.',
     'tensiometro-digital',
     'https://picsum.photos/seed/tensiometro/800/800',
     'Detección de arritmia; Memoria 2 usuarios; Manguito ajustable; Pantalla grande',
     'physical', 129.00, 25, 4.80, 58, 'unidad', 1),

    ('c1000000-0000-4000-8000-000000000013',
     '11111111-1111-4111-8111-111111111111',
     'aaaaaaaa-0000-4000-8000-000000000005',
     'bbbbbbbb-0000-4000-8000-000000000004',
     'M-005', 'MD-005', 'Vitaminas C 1000 mg',
     'Suplemento de vitamina C con zinc para apoyo inmunológico, 60 cápsulas.',
     'vitaminas-c',
     'https://picsum.photos/seed/vitaminasc/800/800',
     '1000 mg; Zinc; 60 cápsulas; Apoyo inmunológico',
     'physical', 39.90, 80, 4.40, 77, 'frasco', 1),

    ('c1000000-0000-4000-8000-000000000014',
     '11111111-1111-4111-8111-111111111111',
     'aaaaaaaa-0000-4000-8000-000000000005',
     'bbbbbbbb-0000-4000-8000-000000000004',
     'M-006', 'MD-006', 'Botiquín de primeros auxilios',
     'Botiquín completo con gasas, vendas, antiséptico y tijeras para el hogar.',
     'botiquin-primeros-auxilios',
     'https://picsum.photos/seed/botiquin/800/800',
     'Gasas; Vendas; Antiséptico; Tijeras; Estuche rígido',
     'physical', 59.90, 35, 4.70, 44, 'kit', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_images (tenant_id, product_id, image_path, is_primary, sort_order)
VALUES
    ('11111111-1111-4111-8111-111111111111', 'c1000000-0000-4000-8000-000000000009', 'https://picsum.photos/seed/termometro/800/800', true, 0),
    ('11111111-1111-4111-8111-111111111111', 'c1000000-0000-4000-8000-000000000010', 'https://picsum.photos/seed/mascarillas/800/800', true, 0),
    ('11111111-1111-4111-8111-111111111111', 'c1000000-0000-4000-8000-000000000011', 'https://picsum.photos/seed/alcoholgel/800/800', true, 0),
    ('11111111-1111-4111-8111-111111111111', 'c1000000-0000-4000-8000-000000000012', 'https://picsum.photos/seed/tensiometro/800/800', true, 0),
    ('11111111-1111-4111-8111-111111111111', 'c1000000-0000-4000-8000-000000000013', 'https://picsum.photos/seed/vitaminasc/800/800', true, 0),
    ('11111111-1111-4111-8111-111111111111', 'c1000000-0000-4000-8000-000000000014', 'https://picsum.photos/seed/botiquin/800/800', true, 0)
ON CONFLICT DO NOTHING;