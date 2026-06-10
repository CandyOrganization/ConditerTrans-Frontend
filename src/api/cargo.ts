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

  dimensions?: string | null;

  loadingDate: string;

  unloadingDate: string;

  deliveryAddress: string;

  productionAddress?: string | null;

  volume: number;

  weight: number;

  status: CargoStatus;

  driverId?: string | null;

  driverName?: string | null;

  transportVehicleId?: string | null;

  vehicleDisplayName?: string | null;

  licensePlate?: string | null;

  orderAmount?: number | null;

  paymentType?: string | null;

  orderLines: CargoOrderLine[];

}



export interface PaginatedCargoList {

  items: CargoItem[];

  total: number;

  page: number;

  pageSize: number;

  totalPages: number;

}



interface CargoListApiResponse {

  result: CargoItem[];

  totalCount?: number;

  page?: number;

  pageSize?: number;

  totalPages?: number;

  TotalCount?: number;

  Page?: number;

  PageSize?: number;

  TotalPages?: number;

}



export interface CargoListFilter {

  page?: number;

  pageSize?: number;

}



function mapPagedCargoList(

  data: CargoListApiResponse,

  fallbackPage: number,

  fallbackPageSize: number,

): PaginatedCargoList {

  const total = data.totalCount ?? data.TotalCount ?? 0;

  const page = data.page ?? data.Page ?? fallbackPage;

  const pageSize = data.pageSize ?? data.PageSize ?? fallbackPageSize;

  const totalPages = data.totalPages ?? data.TotalPages ?? 0;



  return {

    items: data.result ?? [],

    total,

    page,

    pageSize,

    totalPages: totalPages > 0 ? totalPages : total > 0 ? Math.ceil(total / pageSize) : 0,

  };

}



async function fetchCargoListPaged(

  endpoint: string,

  params: CargoListFilter = {},

): Promise<PaginatedCargoList> {

  const page = params.page ?? 1;

  const pageSize = params.pageSize ?? 20;

  const query = new URLSearchParams();

  query.set('page', String(page));

  query.set('pageSize', String(pageSize));



  const data = await apiRequest<CargoListApiResponse>(`${endpoint}?${query.toString()}`);

  return mapPagedCargoList(data, page, pageSize);

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

    dimensions: cargo.dimensions?.trim() || formatVolume(cargo.volume),

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

    vehicle: cargo.vehicleDisplayName

      ? `${cargo.vehicleDisplayName}${cargo.licensePlate ? ` (${cargo.licensePlate})` : ''}`

      : formatVolume(cargo.volume),

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



export async function fetchPendingCargosPaged(

  params: CargoListFilter = {},

): Promise<PaginatedCargoList> {

  return fetchCargoListPaged('/cargo/coordinator/pending', params);

}



export async function fetchCoordinatorActiveCargosPaged(

  params: CargoListFilter = {},

): Promise<PaginatedCargoList> {

  return fetchCargoListPaged('/cargo/coordinator/active', params);

}



export async function fetchDriverActiveCargosPaged(

  params: CargoListFilter = {},

): Promise<PaginatedCargoList> {

  return fetchCargoListPaged('/cargo/driver/active', params);

}



/** @deprecated Используйте fetchPendingCargosPaged — возвращает только первую страницу */

export async function fetchPendingCargos(params?: CargoListFilter): Promise<Application[]> {

  const page = await fetchPendingCargosPaged(params);

  return page.items.map(mapCargoToApplication);

}



/** @deprecated Используйте fetchCoordinatorActiveCargosPaged */

export async function fetchCoordinatorActiveCargos(params?: CargoListFilter): Promise<Trip[]> {

  const page = await fetchCoordinatorActiveCargosPaged(params);

  return page.items.map(mapCargoToTrip);

}



/** @deprecated Используйте fetchDriverActiveCargosPaged */

export async function fetchDriverActiveCargos(params?: CargoListFilter): Promise<CargoItem[]> {

  const page = await fetchDriverActiveCargosPaged(params);

  return page.items;

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

      transportVehicleId: payload.transportVehicleId,

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

