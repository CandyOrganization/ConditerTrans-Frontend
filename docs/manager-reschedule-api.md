# Пересогласование сроков (менеджер по закупкам)

## Сценарий

1. **Диспетчер производства** фиксирует срыв сроков: `POST /api/orders/dispatcher/{id}/reschedule` с `newDeliveryDate` и `reason`.
2. Заказ переходит в статус **`Rescheduled`**. На заказе сохраняются `proposed_delivery_date` и `reschedule_reason`.
3. **Менеджер** (автор заказа, JWT `Manager`) видит заказ в очереди пересогласования и принимает решение.
4. **Согласие** → `Confirmed` (производство продолжает работу по согласованной дате).
5. **Отказ** → `Rejected` (заказ отклонён со стороны закупок).

Пока статус `Rescheduled`, диспетчер **не может** подтвердить заказ (`confirm` доступен только из `PendingApproval`). Диспетчер может лишь обновить предложение (`reschedule`).

## Эндпоинты менеджера

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/orders/rescheduled` | Заказы в статусе `Rescheduled` текущего менеджера |
| GET | `/api/orders/{id}` | Детали заказа + `reschedule` (если ожидает пересогласования) |
| GET | `/api/orders/history` | История с `orderNumber`, `amount`, `reschedule` |
| POST | `/api/orders/{id}/reschedule/accept` | `{ "comment"? }` → `Confirmed` |
| POST | `/api/orders/{id}/reschedule/reject` | `{ "reason"? }` → `Rejected` |

Клиент на фронте: `src/api/managerOrders.ts`.

## Миграция

`20260602120000_AddOrderRescheduleFields` — колонки `proposed_delivery_date`, `reschedule_reason` в `orders`.

```bash
dotnet ef database update --project DataAccess --startup-project API
```
