import type { Application, ProcessApplicationDto, Trip, TripStatus } from '../types';
import { apiRequest } from './client';

export type CargoStatus =
  | 'NotAssignedToLogisticCompany'
  | 'AwaitingTransportation'
  | 'PickedUpFromProduction'
  | 'Delivered'
  | 'Cancelled';

interface CargoOrderLine {
  productName: string;
  quantityOfUnits: number;
  formattedQuantity: string;
  productPrice: number;
}

export interface CargoItem {
  id: string;
  orderId?: string | null;
  orderNumber?: number | null;
  loadingDate: string;
  unloadingDate: string;
  deliveryAddress: string;
  productionAddress?: string | null;
  volume: number;
  weight: number;
  status: CargoStatus;
  driverId?: string | null;
  driverName?: string | null;
  orderAmount?: number | null;
  paymentType?: string | null;
  orderLines: CargoOrderLine[];
}

interface CargoListResponse {
  result: CargoItem[];
}

function formatDisplayDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleDateString('ru-RU');
}

function formatWeight(weight: number): string {
  return `${weight.toLocaleString('ru-RU')} кг`;
}

function formatVolume(volume: number): string {
  return `${volume.toLocaleString('ru-RU')} м³`;
}

function formatLinesSummary(cargo: CargoItem): string {
  if (cargo.orderLines.length > 0) {
    return cargo.orderLines
      .map((line) => `${line.productName} (${line.formattedQuantity})`)
      .join(', ');
  }

  return `Вес: ${formatWeight(cargo.weight)}, объём: ${formatVolume(cargo.volume)}`;
}

export function mapCargoToApplication(cargo: CargoItem): Application {
  return {
    id: cargo.id,
    orderNumber: cargo.orderNumber ?? undefined,
    from: cargo.productionAddress?.trim() || '—',
    to: cargo.deliveryAddress,
    weight: formatLinesSummary(cargo),
    dimensions: formatVolume(cargo.volume),
    price: cargo.orderAmount
      ? `${cargo.orderAmount.toLocaleString('ru-RU')} ₽`
      : formatWeight(cargo.weight),
    loadingDate: formatDisplayDate(cargo.loadingDate),
    specialConditions: cargo.paymentType ? `Оплата: ${cargo.paymentType}` : undefined,
  };
}

function mapCargoStatusToTripStatus(status: CargoStatus): TripStatus {
  switch (status) {
    case 'PickedUpFromProduction':
      return 'in_transit';
    case 'AwaitingTransportation':
      return 'awaiting';
    case 'Delivered':
      return 'completed';
    case 'Cancelled':
      return 'problem';
    default:
      return 'awaiting';
  }
}

export function mapCargoToTrip(cargo: CargoItem): Trip {
  const from = cargo.productionAddress?.split(',')[0]?.trim() || 'Производство';
  const to = cargo.deliveryAddress.split(',')[0]?.trim() || cargo.deliveryAddress;

  return {
    id: cargo.id,
    route: `${from} → ${to}`,
    client: cargo.orderNumber ? `Заказ №${cargo.orderNumber}` : 'Груз',
    driver: cargo.driverName ?? '—',
    vehicle: formatVolume(cargo.volume),
    status: mapCargoStatusToTripStatus(cargo.status),
    loadingDate: formatDisplayDate(cargo.loadingDate),
  };
}

export function getCargoStatusLabel(status: CargoStatus): string {
  switch (status) {
    case 'NotAssignedToLogisticCompany':
      return 'Не назначено логистической компании';
    case 'AwaitingTransportation':
      return 'Ожидает транспортировки';
    case 'PickedUpFromProduction':
      return 'Забрано с производства';
    case 'Delivered':
      return 'Доставлено';
    case 'Cancelled':
      return 'Отменено';
    default:
      return status;
  }
}

async function fetchCargoList(endpoint: string): Promise<CargoItem[]> {
  const response = await apiRequest<CargoListResponse>(endpoint);
  return response.result ?? [];
}

export async function fetchPendingCargos(): Promise<Application[]> {
  const items = await fetchCargoList('/cargo/coordinator/pending');
  return items.map(mapCargoToApplication);
}

export async function fetchCoordinatorActiveCargos(): Promise<Trip[]> {
  const items = await fetchCargoList('/cargo/coordinator/active');
  return items.map(mapCargoToTrip);
}

export async function fetchDriverActiveCargos(): Promise<CargoItem[]> {
  return fetchCargoList('/cargo/driver/active');
}

export async function fetchCargoById(cargoId: string): Promise<CargoItem> {
  return apiRequest<CargoItem>(`/cargo/${cargoId}`);
}

export function formatCargoShortId(cargoId: string): string {
  return cargoId.slice(0, 8).toUpperCase();
}

export function formatCargoTitle(cargo: Pick<CargoItem, 'id' | 'orderNumber'>): string {
  if (cargo.orderNumber) {
    return `Заказ №${cargo.orderNumber}`;
  }

  return `Груз #${formatCargoShortId(cargo.id)}`;
}

export async function assignDriverToCargo(
  cargoId: string,
  payload: ProcessApplicationDto,
): Promise<void> {
  await apiRequest(`/cargo/${cargoId}/assign-driver`, {
    method: 'POST',
    body: JSON.stringify({
      driverId: payload.driverId,
      comment: payload.comment ?? null,
    }),
  });
}

export function formatApplicationRoute(application: Application): string {
  const from = application.from.split(',')[0]?.trim() ?? application.from;
  const to = application.to.split(',')[0]?.trim() ?? application.to;
  return `${from} - ${to}`;
}

export function formatApplicationLabel(application: Application): string {
  if (application.orderNumber) {
    return `Заказ №${application.orderNumber}`;
  }

  return `Груз #${application.id.slice(0, 8)}`;
}
