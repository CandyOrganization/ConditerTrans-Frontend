-- =============================================================================
-- 5 компаний каждого типа (всего 15) + по 1 диспетчеру на каждое производство
-- =============================================================================
-- Типы company_type (int): 0 — закупки, 1 — производство, 2 — логистика.
-- UUID: только символы 0-9 и a-f (g/h недопустимы!). f001–f003 компании; c002/d002 диспетчеры.
--
-- Пароль диспетчеров seed: Password1! (bcrypt, как в seed-load-test)
-- =============================================================================

CREATE OR REPLACE FUNCTION seed_load_uuid(prefix text, n bigint)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT (prefix || lpad(to_hex(n), 12, '0'))::uuid;
$$;

DO $seed_companies$
DECLARE
    now_utc         timestamptz := timezone('utc', now());
    dispatcher_pwd  constant text := '$2a$11$yWYIYBbqx6xzI2o.V52Oy.6gPsjHUBV8EQ1KQpheTqamoBhZXXKea';
    n               int;
    prod_id         uuid;
BEGIN
    -- ── Производство (ProductionDispatcher = 1) ─────────────────────────────
    INSERT INTO companies (id, inn, email, phone, name, address, description, created_at, company_type)
    SELECT
        seed_load_uuid('f0010001-0001-4000-8000-', g.n),
        '7701' || lpad((100000 + g.n)::text, 8, '0'),
        'seed-prod-' || g.n::text || '@load.test',
        '+74951000' || lpad(g.n::text, 3, '0'),
        'Seed производство ' || g.n::text,
        'г. Москва, пр-т Производства, ' || g.n::text,
        'Тестовая компания-производитель',
        now_utc,
        1
    FROM generate_series(1, 5) AS g(n)
    ON CONFLICT (id) DO NOTHING;

    -- ── Закупки (PurchasingCompany = 0) ─────────────────────────────────────
    INSERT INTO companies (id, inn, email, phone, name, address, description, created_at, company_type)
    SELECT
        seed_load_uuid('f0020001-0001-4000-8000-', g.n),
        '7702' || lpad((100000 + g.n)::text, 8, '0'),
        'seed-purch-' || g.n::text || '@load.test',
        '+74952000' || lpad(g.n::text, 3, '0'),
        'Seed закупки ' || g.n::text,
        'г. Москва, пр-т Закупок, ' || g.n::text,
        'Тестовая компания-закупщик',
        now_utc,
        0
    FROM generate_series(1, 5) AS g(n)
    ON CONFLICT (id) DO NOTHING;

    -- ── Логистика (LogisticCompany = 2) ─────────────────────────────────────
    INSERT INTO companies (id, inn, email, phone, name, address, description, created_at, company_type)
    SELECT
        seed_load_uuid('f0030001-0001-4000-8000-', g.n),
        '7703' || lpad((100000 + g.n)::text, 8, '0'),
        'seed-log-' || g.n::text || '@load.test',
        '+74953000' || lpad(g.n::text, 3, '0'),
        'Seed логистика ' || g.n::text,
        'г. Москва, пр-т Логистики, ' || g.n::text,
        'Тестовая логистическая компания',
        now_utc,
        2
    FROM generate_series(1, 5) AS g(n)
    ON CONFLICT (id) DO NOTHING;

    -- ── Диспетчеры (по одному на каждое производство) ───────────────────────
    FOR n IN 1..5 LOOP
        prod_id := seed_load_uuid('f0010001-0001-4000-8000-', n);

        INSERT INTO employees (id, phone, employee_number, surname, name, patronymic, created_at, company_id)
        VALUES (
            seed_load_uuid('d0020001-0001-4000-8000-', n),
            '+7495400' || lpad(n::text, 4, '0'),
            'SEED-DISP-' || lpad(n::text, 2, '0'),
            'Диспетчеров', 'Диспетчер', '№' || n::text,
            now_utc,
            prod_id
        )
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO users (id, email, is_admin, password_hash, role, employee_id)
        VALUES (
            seed_load_uuid('c0020001-0001-4000-8000-', n),
            'seed-dispatcher-' || n::text || '@load.test',
            false,
            dispatcher_pwd,
            1,
            seed_load_uuid('d0020001-0001-4000-8000-', n)
        )
        ON CONFLICT (id) DO NOTHING;
    END LOOP;

    RAISE NOTICE 'Компании: 5 производство (f001..005), 5 закупки (f002), 5 логистика (f003)';
    RAISE NOTICE 'Диспетчеры: seed-dispatcher-1..5@load.test → компании f001..005';
END
$seed_companies$;

-- Быстрая сверка
SELECT company_type, count(*) AS cnt
FROM companies
WHERE id IN (
    SELECT seed_load_uuid('f0010001-0001-4000-8000-', g.n) FROM generate_series(1, 5) g(n)
    UNION ALL
    SELECT seed_load_uuid('f0020001-0001-4000-8000-', g.n) FROM generate_series(1, 5) g(n)
    UNION ALL
    SELECT seed_load_uuid('f0030001-0001-4000-8000-', g.n) FROM generate_series(1, 5) g(n)
)
GROUP BY company_type
ORDER BY company_type;
