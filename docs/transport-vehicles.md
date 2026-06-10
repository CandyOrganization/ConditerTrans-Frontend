# Транспортные средства (логист)

## БД

- `vehicle_brands` — id, name
- `vehicle_models` — id, name, brand_id
- `transport_vehicles` — registration_number, capacity, employee_id, model_id, company_id
- `cargos.transport_vehicle_id` — при назначении рейса

Миграция: `20260602113141_AddTransportVehicles` (справочник марок/моделей: КАМАЗ, МАЗ, Scania).

```bash
dotnet ef database update --project DataAccess --startup-project DataAccess
```

## API (роль Coordinator)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/transport-vehicles/brands` | Марки |
| GET | `/api/transport-vehicles/models?brandId=` | Модели |
| GET | `/api/transport-vehicles/available?driverId=` | Свободные ТС (опционально по водителю) |
| POST | `/api/transport-vehicles` | Добавить ТС в компанию |
| GET | `/api/reports/coordinator/free-transport` | Отчёт «свободный транспорт» |
| POST | `/api/cargo/{id}/assign-driver` | `{ driverId, transportVehicleId, comment? }` |

## Регистрация ТС

После миграции создайте ТС через Swagger, пример:

```json
POST /api/transport-vehicles
{
  "registrationNumber": "А123БВ777",
  "capacity": 20,
  "employeeId": "<employee_id водителя>",
  "modelId": "22222222-2222-2222-2222-222222222201"
}
```

`employeeId` — сотрудник, у которого есть учётка с ролью Driver.

## Фронт

- Назначение груза: водитель + ТС (`ProcessApplicationModal`)
- Отчёт «Анализ свободного транспорта» — данные с API, не мок

## Исправление 500 при «готов к отправке»

Даты груза сохраняются как **UTC** (`DateTimeUtc.FromDate`), иначе PostgreSQL отклоняет `timestamp with time zone` с `Kind=Unspecified`.
