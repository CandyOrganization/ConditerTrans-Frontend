import type { Driver } from '../types';
import { apiRequest } from './client';

interface DriverListItemResponse {
  id: string;
  employeeId: string;
  fullName: string;
  phone: string;
  employeeNumber: string;
  isAvailable: boolean;
}

type DriverListItemRaw = DriverListItemResponse & {
  Id?: string;
  EmployeeId?: string;
  FullName?: string;
  Phone?: string;
  EmployeeNumber?: string;
  IsAvailable?: boolean;
};

function mapDriver(item: DriverListItemRaw): Driver {
  const rawAvailable = item.isAvailable ?? item.IsAvailable;
  const isAvailable = rawAvailable !== undefined ? rawAvailable : true;

  return {
    id: item.id ?? item.Id ?? '',
    employeeId: item.employeeId ?? item.EmployeeId ?? '',
    name: item.fullName ?? item.FullName ?? '—',
    phone: item.phone ?? item.Phone ?? '',
    employeeNumber: item.employeeNumber ?? item.EmployeeNumber,
    status: isAvailable ? 'free' : 'busy',
  };
}

export function formatDriverLabel(driver: Driver): string {
  const statusLabel = driver.status === 'free' ? 'свободен' : 'занят на рейсе';
  const number = driver.employeeNumber ? ` · ${driver.employeeNumber}` : '';
  return `${driver.name}${number} — ${statusLabel}`;
}

export async function fetchCompanyDrivers(): Promise<Driver[]> {
  const items = await apiRequest<DriverListItemRaw[]>('/users/drivers');
  return (items ?? []).map(mapDriver).filter((driver) => driver.id);
}

export async function fetchAvailableDrivers(): Promise<Driver[]> {
  const drivers = await fetchCompanyDrivers();
  return drivers.filter((driver) => driver.status === 'free');
}

export async function getDriverById(id: string): Promise<Driver | undefined> {
  const drivers = await fetchCompanyDrivers();
  return drivers.find((driver) => driver.id === id);
}
