-- =============================================================================
-- Исправление: лишние заказы Draft (0) → PendingApproval (1)
-- =============================================================================
-- У менеджера в приложении один черновик до submit; «зависшие» Draft в БД
-- переводим в очередь на согласование диспетчеру.
--
-- Выполнить в DataGrip на копии/бэкапе. Для пробы: BEGIN; ... ROLLBACK;
-- =============================================================================

BEGIN;

CREATE TEMP TABLE orders_was_draft AS
SELECT id, creation_date
FROM orders
WHERE status = 0;

SELECT count(*) AS will_fix FROM orders_was_draft;

WITH to_number AS (
    SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY creation_date, id) AS row_num
    FROM orders_was_draft owd
    JOIN orders o ON o.id = owd.id
    WHERE o.order_number <= 0
),
max_num AS (
    SELECT COALESCE(MAX(order_number), 0) AS value FROM orders WHERE order_number > 0
)
UPDATE orders o
SET order_number = max_num.value + to_number.row_num
FROM to_number, max_num
WHERE o.id = to_number.id;

UPDATE orders o
SET status = 1
FROM orders_was_draft d
WHERE o.id = d.id;

INSERT INTO order_change_histories (id, change_time, order_status, order_id, comment)
SELECT
    gen_random_uuid(),
    timezone('utc', now()),
    1,
    d.id,
    'Миграция: черновик переведён в PendingApproval'
FROM orders_was_draft d
WHERE NOT EXISTS (
    SELECT 1 FROM order_change_histories h
    WHERE h.order_id = d.id AND h.order_status = 1
);

COMMIT;

SELECT status, count(*)::text FROM orders GROUP BY status ORDER BY status;
