# Подтверждение готовности к сроку (Hangfire)

## Логика

1. У заказа есть `requested_delivery_date` (дата доставки при отправке менеджером).
2. Заказ в статусе `Confirmed`, груз ещё не создан (`cargo_id` пуст).
3. **За 2 календарных дня до даты доставки** Hangfire (каждые 5 мин) открывает окно диспетчеру (`deadline_confirmation_phase = FirstRequest`, срок ответа **8 часов**).
4. Диспетчер:
   - **Подтверждает готовность** + габариты → `POST .../ready-for-shipment` → cargo у логистов;
   - **Переносит срок** → `POST .../reschedule` → менеджер пересогласовывает.
5. Если за 8 часов нет ответа — **повторный запрос** (`Reminder`, ещё 8 часов).
6. Если снова нет ответа — заказ `Rejected`, причина: «Диспетчер не подтвердил готовность заказа к сроку».

Если диспетчер раньше подтвердил готовность (создан cargo) — напоминание не нужно.

## Hangfire

- Dashboard: `/api/hangfire`
- Job: `order-deadline-confirmation` (каждые 5 мин)
- Миграция: `20260602160000_AddOrderDeadlineConfirmation`

```bash
dotnet ef database update --project DataAccess --startup-project DataAccess
```

## API

В ответах диспетчера: `requestedDeliveryDate`, `requiresDeadlineConfirmation`, `deadlineConfirmationExpiresAt`.

При отправке заказа менеджером: `requested_delivery_date` в `POST .../submit`.

Ручной запуск (как Hangfire «Trigger now»), ответ со счётчиками:

`POST /api/orders/dispatcher/run-deadline-check` (роль Dispatcher)

```json
{ "openedCount": 1, "reminderCount": 0, "rejectedCount": 0, "skippedAlreadyHandledCount": 0 }
```

Если все нули — ни один заказ не подошёл под правила (см. ниже).

## Почему «Trigger now» не меняет UI

1. **Hangfire не пушит во фронт** — данные обновляются только после запроса к API. Список диспетчера опрашивает API каждые 30 с; иначе нажмите «Обновить список».
2. **Даты в UTC** — окно открывается, когда `UTC today >= requested_delivery_date − 2 дня`. Пример: при `requested_delivery_date = 2026-06-04` окно откроется **2 июня по UTC** (ночью 3 июня по Москве).
3. **Условия заказа:** `status = Confirmed`, `cargo_id IS NULL`, `requested_delivery_date` задан, `deadline_confirmation_phase = 0 (None)`.

Проверка в БД:

```sql
SELECT id, status, requested_delivery_date, cargo_id, deadline_confirmation_phase
FROM orders
WHERE status = 1; -- Confirmed
```

Логи API после job: `Deadline confirmation job (UTC ...): opened=...`.
