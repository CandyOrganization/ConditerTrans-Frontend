# SQL-схема ConditerTrans (PostgreSQL)

Скрипты сгенерированы из EF Core миграций (`DataAccess/Migrations`).

## Файлы

| Файл | Назначение |
|------|------------|
| `conditertrans-schema-plain.sql` | Создание всех таблиц и индексов **с нуля** (линейный скрипт, удобно читать) |
| `conditertrans-schema.sql` | **Идемпотентный** вариант (безопаснее на уже существующей БД) |

## Применение на пустой БД

```bash
psql -h localhost -U postgres -d conditertrans -f docs/database/conditertrans-schema-plain.sql
```

Или через EF (рекомендуется в разработке):

```bash
cd api
dotnet ef database update --project DataAccess --startup-project DataAccess
```

## Что входит в схему

Таблицы приложения:

- `companies`, `employees`, `users`, `user_invitations`
- `categories`, `products`
- `orders`, `order_lines`, `order_change_histories`
- `cargos`, `cargo_change_histories`
- `vehicle_brands`, `vehicle_models`, `transport_vehicles`
- `__EFMigrationsHistory`

**Отдельно:** таблицы **Hangfire** (`hangfire.*`) создаёт пакет Hangfire.PostgreSql при первом запуске API — их нет в этих скриптах.

## Пересоздать скрипты после новых миграций

```bash
cd api

dotnet ef migrations script 0 \
  -o ../ConditerTrans-Frontend/docs/database/conditertrans-schema-plain.sql \
  --project DataAccess --startup-project DataAccess

dotnet ef migrations script \
  -o ../ConditerTrans-Frontend/docs/database/conditertrans-schema.sql \
  --project DataAccess --startup-project DataAccess --idempotent
```

## Индексы для больших объёмов (100k+ заказов)

Миграция `AddOrdersDispatcherListIndexes`:

- `IX_orders_creation_date`
- `IX_orders_status_creation_date`
- `IX_orders_order_number`
- `IX_order_change_histories_order_status_change_time`

Для нагрузочного теста после `database update` при необходимости добавьте `production_company_id` на `orders` (денормализация) — сейчас фильтр диспетчера идёт через `order_lines` → `products.company_id`.

## Тестовые данные (`seed-load-test.sql`)

Запуск в DataGrip на БД с уже заведёнными компаниями и пользователями.

Скрипт под ваш стенд:

| Сущность | Объём |
|----------|--------|
| Категории / продукты | по **100**, `company_id` = `22491c29-2ae3-46da-8ca0-dac3d728ac7f` |
| Водители | **100** (`seed-driver-N@load.test`, ТС `SEED00001`…) |
| Заказы | **100 100** от `manager@example.com` (`019e8473-89c2-7891-b67f-ecf4cad31f92`) |
| Статусы | 30k Delivered, 30k AwaitingShipment, 10k Shipped, 20k Rejected, 10k Confirmed, 100 PendingApproval |
| Связи | `order_lines`, `order_change_histories`, `cargos`, `cargo_change_histories` |

Номера заказов: `810000001` … `810100100`. Повторный запуск пропускается, если `810000001` уже есть (см. CLEANUP в файле).

Диспетчер: `dispatcher@example.com` (ООО Ромашка). Менеджер видит свои заказы через `manager@example.com`.

## Исправление лишних черновиков (Draft)

Если в БД накопились заказы со статусом `Draft` (0) вместо одного черновика до `submit`:

`fix-draft-orders-to-pending.sql` — переводит все `Draft` → `PendingApproval` (1), проставляет номера и запись в историю.
