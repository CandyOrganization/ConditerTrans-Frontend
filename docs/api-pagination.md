# Пагинация API

Все **списки** с большим объёмом данных отдаются постранично (`page` с 1, `pageSize` 1–100, по умолчанию 20).

## Продукты

`GET /api/products?companyIds=&categoryIds=&page=1&pageSize=20`

Ответ: `{ result, totalCount, page, pageSize, totalPages }`. Без `page` больше не отдаётся весь каталог.

## Заказы

| Роль | Endpoint |
|------|----------|
| Менеджер, история | `GET /api/orders/history?page=&pageSize=` |
| Диспетчер | `GET /api/orders/dispatcher?page=&pageSize=&search=&status=` |

## Грузы

| Endpoint | Назначение |
|----------|------------|
| `GET /api/cargo/coordinator/pending?page=&pageSize=` | Ожидают логистики |
| `GET /api/cargo/coordinator/active?page=&pageSize=` | Активные рейсы координатора |
| `GET /api/cargo/coordinator?page=&pageSize=&status=` | Все грузы координатора |
| `GET /api/cargo/driver/active?page=&pageSize=` | Активные рейсы водителя |

Ответ: `{ result, totalCount, page, pageSize, totalPages }`.

## Справочники без пагинации

`GET /api/categories`, `GET /api/companies` — малые объёмы, полный список.
