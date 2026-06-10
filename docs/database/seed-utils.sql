-- Общие функции для seed-скриптов ConditerTrans (psql / DataGrip)
-- Префиксы UUID: только 0-9 и a-f (буквы g-z в префиксе дадут invalid input syntax for type uuid).
-- Выполнить один раз перед seed-companies / seed-products.

CREATE OR REPLACE FUNCTION seed_load_uuid(prefix text, n bigint)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT (prefix || lpad(to_hex(n), 12, '0'))::uuid;
$$;
