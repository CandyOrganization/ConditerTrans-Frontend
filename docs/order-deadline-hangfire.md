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
