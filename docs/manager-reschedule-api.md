# Пересогласование сроков (менеджер)

Минимальный сценарий:

1. Диспетчер: `POST /api/orders/dispatcher/{id}/reschedule` → статус `Rescheduled`.
2. Менеджер в карточке заказа из истории (`status === Rescheduled`):
   - **Принять** — `POST /api/orders/{id}/reschedule/accept` → `Confirmed`
   - **Отменить** — `POST /api/orders/{id}/reschedule/reject` → `Rejected`

Тело запросов необязательно (`{}`).

## Новый заказ при согласовании

Пока у менеджера есть заказ в `PendingApproval` или `Rescheduled`, `POST /api/orders` (добавление товара) **всегда создаёт новый черновик**, а не дописывает строки в старый заказ. Текущий черновик — последний по дате (`GET /api/orders/current`).

## Миграция БД

Ошибка `column o.proposed_delivery_date does not exist` — не применена миграция:

```bash
dotnet ef database update --project DataAccess --startup-project API
```

Миграция: `20260602120000_AddOrderRescheduleFields`.
