# Пересогласование сроков (менеджер)

Минимальный сценарий:

1. Диспетчер: `POST /api/orders/dispatcher/{id}/reschedule` → статус `Rescheduled`.
2. Менеджер в карточке заказа из истории (`status === Rescheduled`):
   - **Принять** — `POST /api/orders/{id}/reschedule/accept` → `Confirmed`
   - **Отменить** — `POST /api/orders/{id}/reschedule/reject` → `Rejected`

Тело запросов необязательно (`{}`).

## Черновик заказа

У менеджера **один** заказ в статусе `Draft`. Добавление товара (`POST /api/orders`) дописывает строки в этот черновик; если черновика нет — создаётся один новый.

Заказы в `PendingApproval` / `Rescheduled` не меняются — в них нельзя добавить товар, только в черновик.

`GET /api/orders/current` — текущий черновик (лишние Draft при запросе автоматически схлопываются).

## Миграция БД

Ошибка `column o.proposed_delivery_date does not exist` — не применена миграция:

```bash
dotnet ef database update --project DataAccess --startup-project API
```

Миграция: `20260602120000_AddOrderRescheduleFields`.
