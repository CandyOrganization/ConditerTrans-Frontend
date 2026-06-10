import type { FreeTransportRow, ReportDateFilter } from '../types';
import { apiRequest } from './client';

interface ApiFreeTransportRow {
  driver: string;
  vehicle: string;
  licensePlate: string;
  city: string;
  availableSince: string;
}

export async function fetchFreeTransportReport(
  _filter: ReportDateFilter,
): Promise<FreeTransportRow[]> {
  const rows = await apiRequest<ApiFreeTransportRow[]>('/reports/coordinator/free-transport');
  return (rows ?? []).map((row) => ({
    driver: row.driver,
    vehicle: row.vehicle,
    licensePlate: row.licensePlate,
    city: row.city,
    availableSince: row.availableSince,
  }));
}
