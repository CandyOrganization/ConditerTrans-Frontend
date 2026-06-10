-- =============================================================================
-- 64 категории + 100 000 продуктов (20 000 на каждую из 5 компаний производства)
-- =============================================================================
-- Категории: a0010001-0001-4000-8000-000000000001 … 000000000040 (1..64 hex)
-- Продукты:   b0010001-0001-4000-8000-000000000001 … 000000000186a0 (1..100000)
-- Компании:   f0010001-0001-4000-8000-000000000001 … 005 (см. seed-companies-5x3.sql)
--
-- Перед запуском: seed-companies-5x3.sql
-- В DataGrip: один DO-блок (~10 батчей по 10k, смотрите NOTICE в логе).
-- =============================================================================

CREATE OR REPLACE FUNCTION seed_load_uuid(prefix text, n bigint)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT (prefix || lpad(to_hex(n), 12, '0'))::uuid;
$$;

SET synchronous_commit = off;
SET work_mem = '256MB';

-- ── 64 категории ────────────────────────────────────────────────────────────
INSERT INTO categories (id, name)
SELECT
    seed_load_uuid('a0010001-0001-4000-8000-', g.n),
    'Категория seed ' || g.n::text
FROM generate_series(1, 64) AS g(n)
ON CONFLICT (id) DO NOTHING;

DO $seed_products$
DECLARE
    products_total   constant int := 100000;
    per_company      constant int := 20000;
    batch_size       constant int := 10000;
    batch_from       int;
    batch_to         int;
    inserted_before  bigint;
    inserted_after   bigint;
BEGIN
    IF (SELECT count(*) FROM companies WHERE company_type = 1
        AND id IN (SELECT seed_load_uuid('f0010001-0001-4000-8000-', g.n) FROM generate_series(1, 5) g(n))) < 5 THEN
        RAISE EXCEPTION 'Сначала выполните seed-companies-5x3.sql (нет 5 компаний производства f001)';
    END IF;

    SELECT count(*) INTO inserted_before
    FROM products
    WHERE id >= seed_load_uuid('b0010001-0001-4000-8000-', 1)
      AND id <= seed_load_uuid('b0010001-0001-4000-8000-', products_total);

    FOR batch_from IN 1..products_total BY batch_size LOOP
        batch_to := least(batch_from + batch_size - 1, products_total);

        INSERT INTO products (
            id, name, description, price, quantity, expiry,
            units_of_measure, category_id, company_id, file_id
        )
        SELECT
            seed_load_uuid('b0010001-0001-4000-8000-', g.n),
            'Продукт seed ' || g.n::text,
            'Нагрузочный продукт',
            (10 + (g.n % 990))::numeric,
            500::real,
            48::real,
            0,
            seed_load_uuid('a0010001-0001-4000-8000-', 1 + ((g.n - 1) % 64)),
            seed_load_uuid('f0010001-0001-4000-8000-', 1 + ((g.n - 1) / per_company)),
            NULL
        FROM generate_series(batch_from, batch_to) AS g(n)
        ON CONFLICT (id) DO NOTHING;

        RAISE NOTICE 'Продукты %–% вставлены', batch_from, batch_to;
    END LOOP;

    SELECT count(*) INTO inserted_after
    FROM products
    WHERE id >= seed_load_uuid('b0010001-0001-4000-8000-', 1)
      AND id <= seed_load_uuid('b0010001-0001-4000-8000-', products_total);

    RAISE NOTICE 'Продуктов в диапазоне b001: % (добавлено примерно %)',
        inserted_after, inserted_after - inserted_before;
END
$seed_products$;

-- Сверка распределения
SELECT
    c.name,
    count(p.id) AS product_cnt
FROM companies c
JOIN products p ON p.company_id = c.id
WHERE c.id IN (SELECT seed_load_uuid('f0010001-0001-4000-8000-', g.n) FROM generate_series(1, 5) g(n))
GROUP BY c.id, c.name
ORDER BY c.name;

SELECT count(*) AS categories_64 FROM categories
WHERE id IN (SELECT seed_load_uuid('a0010001-0001-4000-8000-', g.n) FROM generate_series(1, 64) g(n));
