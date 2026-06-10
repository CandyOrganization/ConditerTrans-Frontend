import { apiRequest } from './client';

export interface TransportVehicleListItem {
  id: string;
  registrationNumber: string;
  capacity: number;
  employeeId: string;
  driverName: string;
  brandName: string;
  modelName: string;
  displayName: string;
  isAvailable: boolean;
}

interface ApiTransportVehicle {
  id: string;
  registrationNumber: string;
  capacity: number;
  employeeId: string;
  driverName: string;
  brandName: string;
  modelName: string;
  displayName: string;
  isAvailable: boolean;
}

function mapVehicle(item: ApiTransportVehicle): TransportVehicleListItem {
  return {
    id: item.id,
    registrationNumber: item.registrationNumber,
    capacity: item.capacity,
    employeeId: item.employeeId,
    driverName: item.driverName,
    brandName: item.brandName,
    modelName: item.modelName,
    displayName: item.displayName,
    isAvailable: item.isAvailable,
  };
}

export async function fetchAvailableTransportVehicles(
  driverId?: string,
): Promise<TransportVehicleListItem[]> {
  const query = driverId ? `?driverId=${encodeURIComponent(driverId)}` : '';
  const items = await apiRequest<ApiTransportVehicle[]>(`/transport-vehicles/available${query}`);
  return (items ?? []).map(mapVehicle);
}
