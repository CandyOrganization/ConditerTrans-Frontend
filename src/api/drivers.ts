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

function mapDriver(item: DriverListItemResponse): Driver {
  return {
    id: item.id,
    employeeId: item.employeeId,
    name: item.fullName,
    phone: item.phone,
    employeeNumber: item.employeeNumber,
    status: item.isAvailable ? 'free' : 'busy',
  };
}

export function formatDriverLabel(driver: Driver): string {
  const statusLabel = driver.status === 'free' ? 'свободен' : 'занят';
  const number = driver.employeeNumber ? ` · ${driver.employeeNumber}` : '';
  return `${driver.name}${number} — ${statusLabel}`;
}

export async function fetchCompanyDrivers(): Promise<Driver[]> {
  const items = await apiRequest<DriverListItemResponse[]>('/users/drivers');
  return items.map(mapDriver);
}

export async function fetchAvailableDrivers(): Promise<Driver[]> {
  const drivers = await fetchCompanyDrivers();
  return drivers.filter((driver) => driver.status === 'free');
}

export async function getDriverById(id: string): Promise<Driver | undefined> {
  const drivers = await fetchCompanyDrivers();
  return drivers.find((driver) => driver.id === id);
}
