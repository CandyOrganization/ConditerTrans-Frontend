# API диспетчера производства

Реализовано на бэкенде в `OrderController` / `OrderService` (маршруты `api/orders/dispatcher/...`).

## Фильтрация заказов

Диспетчер видит заказы, у которых **все позиции** относятся к продуктам с `Product.CompanyId == CompanyId` из JWT (производство из токена). Черновики (`Draft`) не показываются.

## Эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/orders/dispatcher?search=&status=` | Список |
| GET | `/api/orders/dispatcher/{id}` | Детали + строки |
| POST | `/api/orders/dispatcher/{id}/confirm` | → `Confirmed`, `DispatcherId`, адрес производства |
| POST | `/api/orders/dispatcher/{id}/reject` | `{ "reason" }` → `Rejected` |
| POST | `/api/orders/dispatcher/{id}/reschedule` | `{ "newDeliveryDate", "reason" }` → `Rescheduled` (менеджер пересогласовывает — см. [manager-reschedule-api.md](./manager-reschedule-api.md)) |
| POST | `/api/orders/dispatcher/{id}/ready-for-shipment` | `{ "shipmentDate" }` → `AwaitingShipment` |
| POST | `/api/orders/dispatcher/{id}/handover` | `{ "documentsHandedOver" }` → `Shipped` |

Доступ: роль `Dispatcher` в JWT.

## Миграция

`20260601172045_AddOrderChangeHistoryComment` — поле `comment` в истории статусов (причина отказа, перенос и т.д.).

```bash
dotnet ef database update --project DataAccess --startup-project API
```
