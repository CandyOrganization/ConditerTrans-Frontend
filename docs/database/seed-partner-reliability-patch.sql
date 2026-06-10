-- =============================================================================
-- Патч метрик «Надёжность партнёра» для менеджера (после seed-load-test)
-- =============================================================================
-- Почему было 30000 / 1579 / 1579 в срок:
--   • completedOrdersCount = все Delivered (status 7) по партнёру
--   • «В срок» считается только где requested_delivery_date IS NOT NULL (~1/19 в seed)
--   • В seed: requested = now()+5d, доставка = now() → всегда «в срок»
--
-- Запуск: DataGrip, на копии БД. Подстройте manager_company_id / prod_company_id.
-- =============================================================================

-- Менеджер закупок и производство из seed-load-test (замените при необходимости)
DO $patch$
DECLARE
    manager_company_id  constant uuid := (
        SELECT e.company_id FROM users u
        JOIN employees e ON e.id = u.employee_id
        WHERE u.id = '019e8473-89c2-7891-b67f-ecf4cad31f92'::uuid  -- менеджер seed
    );
    prod_company_id     constant uuid := '22491c29-2ae3-46da-8ca0-dac3d728ac7f';  -- или f001…001
    logistic_company_id constant uuid := 'ece000d1-be36-48b3-8e9a-b2c6b86ec58f';
    now_utc             timestamptz := timezone('utc', now());
BEGIN
    IF manager_company_id IS NULL THEN
        RAISE EXCEPTION 'Не найден company_id менеджера — укажите id пользователя в скрипте';
    END IF;

    -- 1) Больше заказов с согласованной датой (не только seq %% 19)
    UPDATE orders o
    SET requested_delivery_date = (o.creation_date AT TIME ZONE 'UTC')::date + 14
    WHERE o.status = 7
      AND o.manager_id IN (
          SELECT u.id FROM users u
          JOIN employees e ON e.id = u.employee_id
          WHERE e.company_id = manager_company_id
      )
      AND o.requested_delivery_date IS NULL
      AND o.order_number BETWEEN 810000001 AND 810100200
      AND o.id IN (
          SELECT ol.order_id FROM order_lines ol
          JOIN products p ON p.id = ol.product_id
          WHERE p.company_id = prod_company_id
          GROUP BY ol.order_id
          HAVING count(DISTINCT p.company_id) = 1
      );

    -- 2) Просрочка: согласованная дата в прошлом, доставка «сейчас» (факт > срок)
    UPDATE orders o
    SET requested_delivery_date = ((now_utc - interval '10 days') AT TIME ZONE 'UTC')::date
    WHERE o.status = 7
      AND o.order_number BETWEEN 810000001 AND 810100200
      AND o.id IN (
          SELECT ol.order_id FROM order_lines ol
          JOIN products p ON p.id = ol.product_id
          WHERE p.company_id = prod_company_id
          GROUP BY ol.order_id
      )
      AND (o.order_number % 3) = 0;  -- ~⅓ с датой → часть будет late

    -- 3) В срок явно: срок в будущем относительно даты доставки в истории
    UPDATE orders o
    SET requested_delivery_date = ((now_utc + interval '30 days') AT TIME ZONE 'UTC')::date
    WHERE o.status = 7
      AND o.order_number BETWEEN 810000001 AND 810100200
      AND (o.order_number % 3) = 1;

    -- 4) Перенос сроков (Rescheduled) — для supplyQuality
    INSERT INTO order_change_histories (id, change_time, order_status, order_id, comment)
    SELECT
        gen_random_uuid(),
        now_utc - interval '5 days',
        3,  -- Rescheduled
        o.id,
        'Перенос срока (seed patch)'
    FROM orders o
    WHERE o.status = 7
      AND o.order_number BETWEEN 810000001 AND 810100200
      AND (o.order_number % 7) = 0
      AND NOT EXISTS (
          SELECT 1 FROM order_change_histories h
          WHERE h.order_id = o.id AND h.order_status = 3
      )
    LIMIT 2000;

    RAISE NOTICE 'Патч применён. manager_company=%, production=%', manager_company_id, prod_company_id;
END
$patch$;

-- Проверка (производство, как в API)
-- companyId в запросе = prod_company_id, менеджер = ваша компания закупок
/*
WITH delivered AS (
    SELECT o.id, o.requested_delivery_date,
           (SELECT max(h.change_time) FROM order_change_histories h
            WHERE h.order_id = o.id AND h.order_status = 7) AS delivered_at
    FROM orders o
    JOIN users m ON m.id = o.manager_id
    JOIN employees e ON e.id = m.employee_id
    WHERE o.status = 7
      AND e.company_id = (SELECT company_id FROM employees ex
          JOIN users ux ON ux.employee_id = ex.id
          WHERE ux.id = '019e8473-89c2-7891-b67f-ecf4cad31f92')
      AND EXISTS (
          SELECT 1 FROM order_lines ol
          JOIN products p ON p.id = ol.product_id
          WHERE ol.order_id = o.id AND p.company_id = '22491c29-2ae3-46da-8ca0-dac3d728ac7f'
      )
)
SELECT
    count(*) AS completed,
    count(*) FILTER (WHERE requested_delivery_date IS NOT NULL) AS with_agreed_date,
    count(*) FILTER (
        WHERE requested_delivery_date IS NOT NULL
          AND delivered_at::date <= requested_delivery_date
    ) AS on_time,
    count(*) FILTER (
        WHERE requested_delivery_date IS NOT NULL
          AND delivered_at::date > requested_delivery_date
    ) AS late
FROM delivered;
*/
