-- =============================================================================
-- ConditerTrans — seed под вашу БД (DataGrip / psql)
-- =============================================================================
-- ВАЖНО перед запуском:
--   1. Закройте лишние вкладки с таблицами orders/cargos в DataGrip.
--   2. Выполняйте по частям: «ЧАСТЬ 1» → дождаться конца → «ЧАСТЬ 2».
--   3. Если FATAL: remaining connection slots — перезапустите PostgreSQL
--      или выполните (от superuser):
--        SELECT pg_terminate_backend(pid) FROM pg_stat_activity
--        WHERE datname = current_database() AND pid <> pg_backend_pid();
--
-- UUID seed: только hex (0-9, a-f). Префиксы a001/b001/c001/d001/e001.
-- =============================================================================

-- Детерминированный UUID для seed (32 hex-символа)
CREATE OR REPLACE FUNCTION seed_load_uuid(prefix text, n bigint)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT (prefix || lpad(to_hex(n), 12, '0'))::uuid;
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- ЧАСТЬ 1 — справочники и 100 водителей (выполнить первой)
-- ═════════════════════════════════════════════════════════════════════════════

INSERT INTO vehicle_brands (id, name) VALUES
    ('11111111-1111-1111-1111-111111111101', 'КАМАЗ'),
    ('11111111-1111-1111-1111-111111111102', 'МАЗ'),
    ('11111111-1111-1111-1111-111111111103', 'Scania'),
    ('8be62666-acc7-4996-8bfa-c66c3a9e02de', 'Mercedes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vehicle_models (id, name, brand_id) VALUES
    ('22222222-2222-2222-2222-222222222201', '65115',    '11111111-1111-1111-1111-111111111101'),
    ('22222222-2222-2222-2222-222222222202', '5337',     '11111111-1111-1111-1111-111111111102'),
    ('22222222-2222-2222-2222-222222222203', 'R450',     '11111111-1111-1111-1111-111111111103'),
    ('57e3b5b3-7b83-4ceb-96e4-ad7e6d7b31d2', 'Sprinter', '8be62666-acc7-4996-8bfa-c66c3a9e02de')
ON CONFLICT (id) DO NOTHING;

DO $seed_part1$
DECLARE
    prod_company_id     constant uuid := '22491c29-2ae3-46da-8ca0-dac3d728ac7f';
    logistic_company_id constant uuid := 'ece000d1-be36-48b3-8e9a-b2c6b86ec58f';
    manager_user_id     constant uuid := '019e8473-89c2-7891-b67f-ecf4cad31f92';
    driver_pwd_hash     constant text := '$2a$11$yWYIYBbqx6xzI2o.V52Oy.6gPsjHUBV8EQ1KQpheTqamoBhZXXKea';
    model_ids           uuid[] := ARRAY[
        '22222222-2222-2222-2222-222222222201'::uuid,
        '22222222-2222-2222-2222-222222222202'::uuid,
        '22222222-2222-2222-2222-222222222203'::uuid,
        '57e3b5b3-7b83-4ceb-96e4-ad7e6d7b31d2'::uuid
    ];
    now_utc             timestamptz := timezone('utc', now());
    n                   int;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM companies WHERE id = prod_company_id) THEN
        RAISE EXCEPTION 'Нет компании %', prod_company_id;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = manager_user_id) THEN
        RAISE EXCEPTION 'Нет менеджера %', manager_user_id;
    END IF;

    INSERT INTO categories (id, name)
    SELECT seed_load_uuid('a0010001-0001-4000-8000-', g.n), 'Категория seed ' || g.n::text
    FROM generate_series(1, 100) AS g(n)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO products (
        id, name, description, price, quantity, expiry,
        units_of_measure, category_id, company_id, file_id
    )
    SELECT
        seed_load_uuid('b0010001-0001-4000-8000-', g.n),
        'Продукт seed ' || g.n::text,
        'Тестовый продукт для нагрузки',
        (50 + (g.n % 500))::numeric,
        1000::real,
        72::real,
        0,
        seed_load_uuid('a0010001-0001-4000-8000-', g.n),
        prod_company_id,
        NULL
    FROM generate_series(1, 100) AS g(n)
    ON CONFLICT (id) DO NOTHING;

    FOR n IN 1..100 LOOP
        INSERT INTO employees (id, phone, employee_number, surname, name, patronymic, created_at, company_id)
        VALUES (
            seed_load_uuid('d0010001-0001-4000-8000-', n),
            '+7901' || lpad((9000000 + n)::text, 7, '0'),
            'SEED-DRV-' || lpad(n::text, 4, '0'),
            'Водителев', 'Водитель', '№' || n::text,
            now_utc, logistic_company_id
        )
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO users (id, email, is_admin, password_hash, role, employee_id)
        VALUES (
            seed_load_uuid('c0010001-0001-4000-8000-', n),
            'seed-driver-' || n::text || '@load.test',
            false, driver_pwd_hash, 3,
            seed_load_uuid('d0010001-0001-4000-8000-', n)
        )
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO transport_vehicles (id, registration_number, capacity, employee_id, model_id, company_id)
        VALUES (
            seed_load_uuid('e0010001-0001-4000-8000-', n),
            'SEED' || lpad(n::text, 5, '0'),
            15.00 + (n % 10),
            seed_load_uuid('d0010001-0001-4000-8000-', n),
            model_ids[1 + ((n - 1) % array_length(model_ids, 1))],
            logistic_company_id
        )
        ON CONFLICT (id) DO NOTHING;
    END LOOP;

    RAISE NOTICE 'ЧАСТЬ 1 готова: категории, продукты, 100 водителей';
END
$seed_part1$;

-- ═════════════════════════════════════════════════════════════════════════════
-- ЧАСТЬ 2 — 100 100 заказов (выполнить после успешной части 1)
-- ═════════════════════════════════════════════════════════════════════════════

SET synchronous_commit = off;
SET work_mem = '128MB';
SET maintenance_work_mem = '512MB';

DO $seed_part2$
DECLARE
    prod_company_id      constant uuid := '22491c29-2ae3-46da-8ca0-dac3d728ac7f';
    logistic_company_id  constant uuid := 'ece000d1-be36-48b3-8e9a-b2c6b86ec58f';
    manager_user_id      constant uuid := '019e8473-89c2-7891-b67f-ecf4cad31f92';
    dispatcher_user_id   constant uuid := '019e8414-71b6-7636-8b4a-ad046a47b031';
    default_driver_id    constant uuid := '019e801c-a12f-7da3-a03d-ccb6243e541f';
    default_vehicle_id   constant uuid := '019e8845-0879-70b5-aaad-ad8120767096';
    order_num_base       constant int := 810000000;
    now_utc              timestamptz := timezone('utc', now());
    seed_exists          boolean;
BEGIN
    SELECT EXISTS (SELECT 1 FROM orders WHERE order_number = order_num_base + 1) INTO seed_exists;
    IF seed_exists THEN
        RAISE NOTICE 'Заказы 810000001+ уже есть — часть 2 пропущена';
        RETURN;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM products WHERE company_id = prod_company_id LIMIT 1) THEN
        RAISE EXCEPTION 'Сначала выполните ЧАСТЬ 1 (нет продуктов производства)';
    END IF;

    CREATE TEMP TABLE seed_plan ON COMMIT DROP AS
    WITH parts AS (
        SELECT 7 AS order_status, 30000 AS cnt, 3 AS cargo_status, true AS with_cargo
        UNION ALL SELECT 5, 30000, 1, true
        UNION ALL SELECT 6, 10000, 2, true
        UNION ALL SELECT 4, 20000, NULL::int, false
        UNION ALL SELECT 2, 10000, NULL::int, false
        UNION ALL SELECT 1, 100,   NULL::int, false
    ),
    expanded AS (
        SELECT p.order_status, p.cargo_status, p.with_cargo
        FROM parts p
        CROSS JOIN LATERAL generate_series(1, p.cnt) AS g(i)
    )
    SELECT
        row_number() OVER (ORDER BY order_status, with_cargo DESC) AS seq,
        gen_random_uuid() AS order_id,
        gen_random_uuid() AS cargo_id,
        order_status,
        cargo_status,
        with_cargo
    FROM expanded;

    INSERT INTO cargos (
        id, loading_date, unloading_date, delivery_address,
        volume, weight, status, logistic_company_id, driver_id,
        dimensions, transport_vehicle_id
    )
    SELECT
        p.cargo_id,
        now_utc - interval '2 days' + (p.seq % 48) * interval '1 hour',
        now_utc + interval '1 day' + (p.seq % 72) * interval '1 hour',
        'г. Москва, склад, корп. ' || (p.seq % 50)::text,
        round((5 + (p.seq % 20) * 0.5)::numeric, 3),
        round((200 + (p.seq % 80) * 10)::numeric, 3),
        p.cargo_status,
        logistic_company_id,
        CASE
            WHEN EXISTS (SELECT 1 FROM users u WHERE u.id = seed_load_uuid('c0010001-0001-4000-8000-', 1 + ((p.seq - 1) % 100)))
            THEN seed_load_uuid('c0010001-0001-4000-8000-', 1 + ((p.seq - 1) % 100))
            ELSE default_driver_id
        END,
        '2.4x1.2x2.0',
        CASE
            WHEN EXISTS (SELECT 1 FROM transport_vehicles tv WHERE tv.id = seed_load_uuid('e0010001-0001-4000-8000-', 1 + ((p.seq - 1) % 100)))
            THEN seed_load_uuid('e0010001-0001-4000-8000-', 1 + ((p.seq - 1) % 100))
            ELSE default_vehicle_id
        END
    FROM seed_plan p
    WHERE p.with_cargo;

    INSERT INTO cargo_change_histories (id, change_time, cargo_status, cargo_id)
    SELECT gen_random_uuid(), now_utc - interval '3 days', 0, p.cargo_id
    FROM seed_plan p WHERE p.with_cargo;

    INSERT INTO cargo_change_histories (id, change_time, cargo_status, cargo_id)
    SELECT gen_random_uuid(), now_utc - interval '1 day', 1, p.cargo_id
    FROM seed_plan p WHERE p.with_cargo AND p.cargo_status >= 1;

    INSERT INTO cargo_change_histories (id, change_time, cargo_status, cargo_id)
    SELECT gen_random_uuid(), now_utc, p.cargo_status, p.cargo_id
    FROM seed_plan p WHERE p.with_cargo AND p.cargo_status >= 2;

    INSERT INTO orders (
        id, order_number, creation_date, manager_id, dispatcher_id, cargo_id,
        status, production_address, delivery_address, payment_type,
        proposed_delivery_date, reschedule_reason,
        shipment_height_m, shipment_length_m, shipment_weight_kg, shipment_width_m,
        deadline_confirmation_expires_at, deadline_confirmation_phase,
        deadline_confirmation_requested_at, requested_delivery_date
    )
    SELECT
        p.order_id,
        order_num_base + p.seq::int,
        now_utc - ((p.seq % 400) || ' days')::interval,
        manager_user_id,
        CASE WHEN p.order_status IN (2, 5, 6) AND p.seq % 5 = 0 THEN dispatcher_user_id ELSE NULL END,
        CASE WHEN p.with_cargo THEN p.cargo_id ELSE NULL END,
        p.order_status,
        'г. Москва, ООО Ромашка, цех ' || (1 + (p.seq % 10))::text,
        'г. Москва, доставка ' || (p.seq % 300)::text,
        CASE WHEN p.seq % 3 = 0 THEN 'cash' WHEN p.seq % 3 = 1 THEN 'card' ELSE 'invoice' END,
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL,
        CASE WHEN p.seq % 19 = 0 THEN now_utc + interval '5 days' ELSE NULL END
    FROM seed_plan p;

    INSERT INTO order_lines (id, quantity_of_units, product_id, order_id)
    SELECT
        gen_random_uuid(),
        1 + (p.seq % 8),
        seed_load_uuid('b0010001-0001-4000-8000-', 1 + ((p.seq - 1) % 100)),
        p.order_id
    FROM seed_plan p;

    INSERT INTO order_lines (id, quantity_of_units, product_id, order_id)
    SELECT
        gen_random_uuid(),
        1 + ((p.seq + 3) % 5),
        seed_load_uuid('b0010001-0001-4000-8000-', 1 + (p.seq % 100)),
        p.order_id
    FROM seed_plan p
    WHERE p.seq % 4 = 0;

    INSERT INTO order_change_histories (id, change_time, order_status, order_id, comment)
    SELECT gen_random_uuid(), now_utc - interval '10 days', 1, p.order_id, 'Создан'
    FROM seed_plan p;

    INSERT INTO order_change_histories (id, change_time, order_status, order_id, comment)
    SELECT gen_random_uuid(), now_utc - interval '8 days', 2, p.order_id, NULL
    FROM seed_plan p WHERE p.order_status IN (2, 4, 5, 6, 7);

    INSERT INTO order_change_histories (id, change_time, order_status, order_id, comment)
    SELECT gen_random_uuid(), now_utc - interval '6 days', 5, p.order_id, NULL
    FROM seed_plan p WHERE p.order_status IN (5, 6, 7);

    INSERT INTO order_change_histories (id, change_time, order_status, order_id, comment)
    SELECT gen_random_uuid(), now_utc - interval '4 days', 6, p.order_id, NULL
    FROM seed_plan p WHERE p.order_status IN (6, 7);

    INSERT INTO order_change_histories (id, change_time, order_status, order_id, comment)
    SELECT gen_random_uuid(), now_utc - interval '1 day', 4, p.order_id, 'Отказ производства'
    FROM seed_plan p WHERE p.order_status = 4;

    INSERT INTO order_change_histories (id, change_time, order_status, order_id, comment)
    SELECT gen_random_uuid(), now_utc, p.order_status, p.order_id, NULL
    FROM seed_plan p WHERE p.order_status IN (1, 2, 5, 6, 7);

    RAISE NOTICE 'ЧАСТЬ 2 готова: % заказов, % с грузом',
        (SELECT count(*) FROM seed_plan),
        (SELECT count(*) FROM seed_plan WHERE with_cargo);
END
$seed_part2$;

ANALYZE categories;
ANALYZE products;
ANALYZE orders;
ANALYZE order_lines;
ANALYZE order_change_histories;
ANALYZE cargos;
ANALYZE cargo_change_histories;

RESET synchronous_commit;

SELECT 'categories seed' AS metric, count(*)::text AS cnt FROM categories WHERE name LIKE 'Категория seed%'
UNION ALL SELECT 'products seed', count(*)::text FROM products WHERE name LIKE 'Продукт seed%'
UNION ALL SELECT 'drivers seed', count(*)::text FROM users WHERE email LIKE 'seed-driver-%@load.test'
UNION ALL SELECT 'orders 810M+', count(*)::text FROM orders WHERE order_number > 810000000 AND order_number <= 810100200;

-- DROP FUNCTION seed_load_uuid(text, bigint);  -- по желанию

-- =============================================================================
-- CLEANUP
-- =============================================================================
/*
DELETE FROM cargo_change_histories h
USING cargos c, orders o
WHERE h.cargo_id = c.id AND o.cargo_id = c.id
  AND o.order_number > 810000000 AND o.order_number <= 810100200;

DELETE FROM order_change_histories h
USING orders o
WHERE h.order_id = o.id AND o.order_number > 810000000 AND o.order_number <= 810100200;

DELETE FROM order_lines l USING orders o
WHERE l.order_id = o.id AND o.order_number > 810000000 AND o.order_number <= 810100200;

DELETE FROM orders WHERE order_number > 810000000 AND order_number <= 810100200;

DELETE FROM cargos c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.cargo_id = c.id);

DELETE FROM transport_vehicles WHERE registration_number LIKE 'SEED%';
DELETE FROM users WHERE email LIKE 'seed-driver-%@load.test';
DELETE FROM employees WHERE employee_number LIKE 'SEED-DRV-%';
DELETE FROM products WHERE name LIKE 'Продукт seed%';
DELETE FROM categories WHERE name LIKE 'Категория seed%';
*/
