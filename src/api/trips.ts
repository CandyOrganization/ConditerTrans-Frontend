import type { Application, Driver, PaginatedTrips, Trip, TripStatus, TripsFilter } from '../types';
import { mockRequest } from './client';
import { mockTrips } from './mockData';

let tripsStore: Trip[] = [...mockTrips];

function extractCity(address: string): string {
  return address.split(',')[0]?.trim() || address;
}

function formatRoute(from: string, to: string): string {
  return `${extractCity(from)} → ${extractCity(to)}`;
}

function nextTripId(): string {
  const nums = tripsStore
    .map((t) => Number(t.id.replace(/\D/g, '')))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 100) + 1;
  return `R${String(next).padStart(5, '0')}`;
}

export async function createTripFromApplication(
  application: Application,
  driver: Driver,
): Promise<Trip> {
  const trip: Trip = {
    id: nextTripId(),
    route: formatRoute(application.from, application.to),
    client: 'Новый клиент',
    driver: driver.name,
    vehicle: driver.employeeNumber ? `Таб. № ${driver.employeeNumber}` : '—',
    status: 'awaiting',
    loadingDate: application.loadingDate,
  };

  tripsStore = [trip, ...tripsStore];
  return mockRequest(trip);
}

const STATUS_LABELS: Record<TripStatus, string> = {
  in_transit: 'В пути',
  awaiting: 'Ожидает загрузки',
  problem: 'Проблема',
  delayed: 'Задерживается',
  completed: 'Завершен',
};

export function getTripStatusLabel(status: TripStatus): string {
  return STATUS_LABELS[status];
}

export async function fetchTrips(filter: TripsFilter = {}): Promise<PaginatedTrips> {
  const { search = '', status = 'all', page = 1, pageSize = 5 } = filter;

  let items = [...tripsStore];

  if (search.trim()) {
    const q = search.toLowerCase();
    items = items.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.route.toLowerCase().includes(q) ||
        t.client.toLowerCase().includes(q),
    );
  }

  if (status !== 'all') {
    items = items.filter((t) => t.status === status);
  }

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return mockRequest({
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  });
}

export function getTripById(tripId: string): Trip | undefined {
  return tripsStore.find((t) => t.id === tripId);
}

export type { Trip };
