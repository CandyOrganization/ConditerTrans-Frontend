# Аналитика «Надёжность партнёра» (менеджер)

## API

`GET /api/orders/manager/reports/partner-reliability?companyId={partner}&dateFrom=&dateTo=&partnerType=production|transport`

- `companyId` — **партнёр** (производство или логистика), не ваша компания.
- Менеджер из JWT: заказы только где `manager.employee.company_id = CompanyId` из токена (компания закупок).

## Какие заказы попадают

| Условие | Значение |
|---------|----------|
| Статус | только `Delivered` (7) |
| Производство | все строки заказа — товары `companyId = partner` |
| Транспорт | `cargo.logistic_company_id = partner` |
| Период | по дате перехода в `Delivered` в `order_change_histories` (не по `creation_date`) |

Заказы **без** записи в истории со статусом `Delivered` в выборку **не попадают** (отбрасываются в репозитории).

## Метрики

### `completedOrdersCount` (у вас 30000)

Число фактов после фильтра = все подходящие **доставленные** заказы. Совпадает с 30k из `seed-load-test` (блок `order_status = 7`).

### «В срок X из Y» (`deadlineCompliance`)

- **Y** = `ordersWithAgreedDate` — только заказы с заполненным `requested_delivery_date`.
- **X** = `onTimeCount`, где `actualDelivery.date <= requested_delivery_date.date`.
- **actualDelivery** = время последнего `order_change_histories` со статусом `Delivered`; для транспорта берётся `min(deliveredAt, cargo.unloading_date)` по логике репозитория.

Заказы **без** `requested_delivery_date` увеличивают только `completedOrdersCount`, **не** попадают в «в срок».

### «Качество поставок» (`supplyQuality`)

- `rescheduledOrdersCount` — был ли в истории статус `Rescheduled` (3).
- `qualityPercent` = `(completed - rescheduled) / completed * 100`.

## Почему было 1579 / 1579 и 30000

В `seed-load-test.sql`:

```sql
requested_delivery_date = CASE WHEN seq % 19 = 0 THEN now() + 5 days ELSE NULL END
```

У первых 30000 заказов (все `Delivered`) дата согласования только у ~**1/19** → **1579**.

Доставка в истории: `change_time = now()` при статусе 7 → факт **раньше** срока `now()+5d` → **100% в срок**.

## Как изменить цифры в БД

1. Прогнать [`seed-partner-reliability-patch.sql`](./database/seed-partner-reliability-patch.sql) — просрочки, больше дат, переносы.
2. Или вручную для одного заказа:
   - `requested_delivery_date` = вчера (UTC date);
   - в `order_change_histories` для `Delivered` — `change_time` = сегодня.
3. Для переноса: `INSERT` в `order_change_histories` с `order_status = 3` (Rescheduled).

После правок: `ANALYZE orders;` и повторить запрос API с `companyId` производителя и `partnerType=production`.

## Пример вызова

```http
GET /api/orders/manager/reports/partner-reliability
  ?companyId=22491c29-2ae3-46da-8ca0-dac3d728ac7f
  &partnerType=production
  &dateFrom=2025-01-01
  &dateTo=2026-12-31
```

Фронт: `fetchManagerPartnerReliabilityReport` в `src/api/managerReports.ts`.
