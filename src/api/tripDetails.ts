import type { TripDetails } from '../types';
import { mockRequest } from './client';
import { getTripById } from './trips';

const detailsById: Record<string, TripDetails> = {
  R00101: {
    id: 'R00101',
    status: 'in_transit',
    routeShort: 'Москва → Тверь',
    routeFull: 'Москва, ул. Ленина, 1 → Тверь, пр. Победы, 50',
    order: {
      client: 'ООО «СтройМаш»',
      contactName: 'Иванов Иван',
      contactPhone: '+7 (900) 123-45-67',
      weight: '5 000 кг',
      dimensions: '3x2x2 м',
      cost: '25 000 руб.',
      requestDate: '30.05.2025',
      plannedLoadingDate: '01.06.2025',
      eta: '03.06.2025',
      specialConditions:
        'Хрупкий груз, требуется осторожное обращение.',
    },
    transport: {
      employeeId: 'emp-driver-001',
      driver: 'Иванов Петр Сергеевич',
      driverPhone: '+7 (910) 765-43-21',
      vehicle: 'КАМАЗ 5490',
      licensePlate: 'А 123 БВ 77',
      bodyType: 'Тентованный',
      payloadCapacity: '20 тонн',
    },
    history: [
      {
        id: 'h4',
        date: '02.06.2025, 10:00',
        description: 'В пути. Груз покинул пункт загрузки.',
        variant: 'success',
      },
      {
        id: 'h3',
        date: '01.06.2025, 15:00',
        description: 'Загрузка завершена. ТС готово к отправлению.',
        variant: 'default',
      },
      {
        id: 'h2',
        date: '01.06.2025, 09:00',
        description: 'Назначен водитель. Иванов П.С., КАМАЗ А123БВ.',
        variant: 'default',
      },
      {
        id: 'h1',
        date: '30.05.2025, 11:30',
        description: "Заявка принята. Заказ от ООО «СтройМаш».",
        variant: 'default',
      },
    ],
    documents: [
      { id: 'd1', name: 'TTH_R00101.pdf', type: 'pdf' },
      { id: 'd2', name: 'Счет_R00101.docx', type: 'docx' },
      { id: 'd3', name: 'Договор_перевозки.pdf', type: 'contract' },
    ],
  },
};

function buildDefaultDetails(tripId: string): TripDetails | null {
  const trip = getTripById(tripId);
  if (!trip) return null;

  const [from = '', to = ''] = trip.route.split('→').map((s) => s.trim());

  return {
    id: trip.id,
    status: trip.status,
    routeShort: trip.route,
    routeFull: `${from} → ${to}`,
    order: {
      client: trip.client,
      contactName: 'Контакт не указан',
      contactPhone: '+7 (900) 000-00-00',
      weight: '—',
      dimensions: '—',
      cost: '—',
      requestDate: trip.loadingDate,
      plannedLoadingDate: trip.loadingDate,
      eta: '—',
    },
    transport: {
      employeeId: 'emp-driver-mock',
      driver: trip.driver,
      driverPhone: '+7 (900) 000-00-00',
      vehicle: trip.vehicle,
      licensePlate: '—',
      bodyType: '—',
      payloadCapacity: '—',
    },
    history: [
      {
        id: 'h1',
        date: trip.loadingDate,
        description: `Рейс ${trip.id} создан.`,
        variant: 'default',
      },
    ],
    documents: [],
  };
}

export async function fetchTripDetails(tripId: string): Promise<TripDetails | null> {
  const details = detailsById[tripId] ?? buildDefaultDetails(tripId);
  return mockRequest(details);
}
