-- =============================================================================
-- Проверка: диспетчер производства видит только заказы своей компании
-- =============================================================================
-- Совпадает с OrderRepository.BuildDispatcherOrdersQuery (C#):
--   OrderLines.Count > 0
--   OrderLines.All(product.CompanyId == productionCompanyId)
--   Status != Draft
--
-- При нарушении — RAISE EXCEPTION. Иначе NOTICE «OK».
-- =============================================================================

CREATE OR REPLACE FUNCTION seed_load_uuid(prefix text, n bigint)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT (prefix || lpad(to_hex(n), 12, '0'))::uuid;
$$;

DO $verify$
DECLARE
    prod_company_id   uuid;
    n                 int;
    mixed_orders      int;
    foreign_lines     int;
    visible_count     int;
    draft_with_lines  int;
BEGIN
    -- Заказы с товарами разных производителей (f001..f005)
    SELECT count(*) INTO mixed_orders
    FROM (
        SELECT o.id
        FROM orders o
        JOIN order_lines ol ON ol.order_id = o.id
        JOIN products p ON p.id = ol.product_id
        WHERE p.company_id IN (
            SELECT seed_load_uuid('f0010001-0001-4000-8000-', g.n) FROM generate_series(1, 5) g(n)
        )
        GROUP BY o.id
        HAVING count(DISTINCT p.company_id) > 1
    ) t;

    IF mixed_orders > 0 THEN
        RAISE EXCEPTION 'Найдено % заказ(ов) с товарами разных компаний производства', mixed_orders;
    END IF;

    RAISE NOTICE 'OK: нет смешанных заказов по производителям';

    FOR n IN 1..5 LOOP
        prod_company_id := seed_load_uuid('f0010001-0001-4000-8000-', n);

        WITH visible AS (
            SELECT o.id
            FROM orders o
            WHERE o.status <> 0
              AND EXISTS (SELECT 1 FROM order_lines ol WHERE ol.order_id = o.id)
              AND NOT EXISTS (
                    SELECT 1
                    FROM order_lines ol2
                    JOIN products p2 ON p2.id = ol2.product_id
                    WHERE ol2.order_id = o.id
                      AND p2.company_id <> prod_company_id
              )
              AND EXISTS (
                    SELECT 1
                    FROM order_lines ol3
                    JOIN products p3 ON p3.id = ol3.product_id
                    WHERE ol3.order_id = o.id
                      AND p3.company_id = prod_company_id
              )
        )
        SELECT count(*) INTO visible_count FROM visible;

        SELECT count(*) INTO foreign_lines
        FROM visible v
        JOIN order_lines ol ON ol.order_id = v.id
        JOIN products p ON p.id = ol.product_id
        WHERE p.company_id <> prod_company_id;

        IF foreign_lines > 0 THEN
            RAISE EXCEPTION 'Производство #%: % строк чужой компании в «видимых» заказах',
                n, foreign_lines;
        END IF;

        RAISE NOTICE 'OK: производство #% — заказов в зоне видимости: %', n, visible_count;
    END LOOP;

    SELECT count(*) INTO draft_with_lines
    FROM orders o
    WHERE o.status = 0
      AND EXISTS (SELECT 1 FROM order_lines ol WHERE ol.order_id = o.id);

    RAISE NOTICE 'Черновики со строками (диспетчеру не показываются): %', draft_with_lines;
    RAISE NOTICE 'Проверка изоляции диспетчера завершена';
END
$verify$;

-- Сводка по компаниям производства
SELECT
    g.n AS company_index,
    seed_load_uuid('f0010001-0001-4000-8000-', g.n) AS production_company_id,
    (
        SELECT count(DISTINCT o.id)
        FROM orders o
        WHERE o.status <> 0
          AND EXISTS (SELECT 1 FROM order_lines ol WHERE ol.order_id = o.id)
          AND NOT EXISTS (
                SELECT 1 FROM order_lines ol2
                JOIN products p2 ON p2.id = ol2.product_id
                WHERE ol2.order_id = o.id
                  AND p2.company_id <> seed_load_uuid('f0010001-0001-4000-8000-', g.n)
          )
          AND EXISTS (
                SELECT 1 FROM order_lines ol3
                JOIN products p3 ON p3.id = ol3.product_id
                WHERE ol3.order_id = o.id
                  AND p3.company_id = seed_load_uuid('f0010001-0001-4000-8000-', g.n)
          )
    ) AS dispatcher_visible_orders
FROM generate_series(1, 5) AS g(n)
ORDER BY g.n;
