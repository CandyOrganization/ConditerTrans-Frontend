import type {
  DispatcherOrderDetail,
  DispatcherOrderLine,
  DispatcherOrderListItem,
  DispatcherOrderStatus,
  DispatcherOrdersFilter,
  HandoverDispatcherOrderDto,
  PaginatedDispatcherOrders,
  ReadyForShipmentDto,
  RejectDispatcherOrderDto,
  RescheduleDispatcherOrderDto,
} from '../types';
import { apiRequest } from './client';

const DISPATCHER_API = '/orders/dispatcher';

interface DispatcherOrdersListResponse {
  result: ApiDispatcherOrder[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  hasOrdersRequiringDeadlineConfirmation?: boolean;
  TotalCount?: number;
  Page?: number;
  PageSize?: number;
  TotalPages?: number;
  HasOrdersRequiringDeadlineConfirmation?: boolean;
}

interface ApiDispatcherOrder {
  id: string;
  orderNumber: number;
  companyName: string;
  creationDate: string;
  deliveryAddress?: string | null;
  status: DispatcherOrderStatus;
  amount: number;
  paymentType?: string | null;
  paymentMethod?: string | null;
  paymentMethodLabel?: string | null;
  productionAddress?: string | null;
  proposedDeliveryDate?: string | null;
  rescheduleReason?: string | null;
  shipmentLengthM?: number | null;
  shipmentWidthM?: number | null;
  shipmentHeightM?: number | null;
  shipmentWeightKg?: number | null;
  requestedDeliveryDate?: string | null;
  requiresDeadlineConfirmation?: boolean;
  deadlineConfirmationExpiresAt?: string | null;
  deadlineConfirmationPhase?: string;
  lines?: ApiDispatcherOrderLine[];
  handoverVehicle?: string | null;
  handoverDriver?: string | null;
}

interface ApiDispatcherOrderLine {
  productName: string;
  quantityOfUnits: number;
  formattedQuantity: string;
  productPrice: number;
}

export function formatOrderCode(
  orderNumber: number | null | undefined,
  status?: DispatcherOrderStatus,
): string {
  if (orderNumber != null && orderNumber > 0) {
    return `№${String(orderNumber).padStart(5, '0')}`;
  }

  if (status === 'Draft') {
    return 'Черновик';
  }

  return 'Без номера';
}

export function formatDisplayDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString('ru-RU');
}

function mapLine(line: ApiDispatcherOrderLine): DispatcherOrderLine {
  return {
    productName: line.productName,
    quantity: line.quantityOfUnits,
    unit: '',
    formattedQuantity: line.formattedQuantity,
    productPrice: line.productPrice,
  };
}

function mapListItem(order: ApiDispatcherOrder): DispatcherOrderListItem {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    companyName: order.companyName,
    creationDate: order.creationDate,
    deliveryAddress: order.deliveryAddress ?? '—',
    status: order.status,
    amount: order.amount,
    paymentType: order.paymentType,
    paymentMethod: order.paymentMethod ?? null,
    paymentMethodLabel: order.paymentMethodLabel ?? null,
    requestedDeliveryDate: order.requestedDeliveryDate ?? null,
    requiresDeadlineConfirmation: order.requiresDeadlineConfirmation ?? false,
    deadlineConfirmationExpiresAt: order.deadlineConfirmationExpiresAt ?? null,
    deadlineConfirmationPhase: (order.deadlineConfirmationPhase as DispatcherOrderListItem['deadlineConfirmationPhase']) ?? 'None',
  };
}

function mapDetail(order: ApiDispatcherOrder): DispatcherOrderDetail {
  return {
    ...mapListItem(order),
    productionAddress: order.productionAddress,
    proposedDeliveryDate: order.proposedDeliveryDate ?? null,
    rescheduleReason: order.rescheduleReason ?? null,
    shipmentLengthM: order.shipmentLengthM ?? null,
    shipmentWidthM: order.shipmentWidthM ?? null,
    shipmentHeightM: order.shipmentHeightM ?? null,
    shipmentWeightKg: order.shipmentWeightKg ?? null,
    lines: (order.lines ?? []).map(mapLine),
    handoverVehicle: order.handoverVehicle,
    handoverDriver: order.handoverDriver,
  };
}

export function formatShipmentDimensions(order: {
  shipmentLengthM?: number | null;
  shipmentWidthM?: number | null;
  shipmentHeightM?: number | null;
  shipmentWeightKg?: number | null;
}): string | null {
  const { shipmentLengthM: l, shipmentWidthM: w, shipmentHeightM: h, shipmentWeightKg: kg } = order;
  if (l == null && w == null && h == null && kg == null) {
    return null;
  }
  const parts: string[] = [];
  if (l != null && w != null && h != null) {
    parts.push(`${l}×${w}×${h} м`);
  }
  if (kg != null) {
    parts.push(`${kg} кг`);
  }
  return parts.length > 0 ? parts.join(', ') : null;
}

export async function fetchDispatcherOrders(
  params: DispatcherOrdersFilter = {},
): Promise<PaginatedDispatcherOrders> {
  const search = params.search ?? '';
  const status = params.status;
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('pageSize', String(pageSize));
  if (search.trim()) {
    query.set('search', search.trim());
  }
  if (status) {
    query.set('status', status);
  }

  const data = await apiRequest<DispatcherOrdersListResponse>(
    `${DISPATCHER_API}?${query.toString()}`,
  );

  const total = data.totalCount ?? data.TotalCount ?? 0;
  const currentPage = data.page ?? data.Page ?? page;
  const currentPageSize = data.pageSize ?? data.PageSize ?? pageSize;
  const totalPages = data.totalPages ?? data.TotalPages ?? 0;

  return {
    items: (data.result ?? []).map(mapListItem),
    total,
    page: currentPage,
    pageSize: currentPageSize,
    totalPages,
    hasOrdersRequiringDeadlineConfirmation:
      data.hasOrdersRequiringDeadlineConfirmation ??
      data.HasOrdersRequiringDeadlineConfirmation ??
      false,
  };
}

export async function fetchDispatcherOrderById(id: string): Promise<DispatcherOrderDetail> {
  const data = await apiRequest<ApiDispatcherOrder>(`${DISPATCHER_API}/${id}`);
  return mapDetail(data);
}

export async function confirmDispatcherOrder(id: string): Promise<DispatcherOrderDetail> {
  const data = await apiRequest<ApiDispatcherOrder>(`${DISPATCHER_API}/${id}/confirm`, {
    method: 'POST',
  });
  return mapDetail(data);
}

export async function rejectDispatcherOrder(
  id: string,
  dto: RejectDispatcherOrderDto,
): Promise<DispatcherOrderDetail> {
  const data = await apiRequest<ApiDispatcherOrder>(`${DISPATCHER_API}/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  return mapDetail(data);
}

export async function rescheduleDispatcherOrder(
  id: string,
  dto: RescheduleDispatcherOrderDto,
): Promise<DispatcherOrderDetail> {
  const data = await apiRequest<ApiDispatcherOrder>(`${DISPATCHER_API}/${id}/reschedule`, {
    method: 'POST',
    body: JSON.stringify({
      newDeliveryDate: dto.newDeliveryDate,
      reason: dto.reason,
    }),
  });
  return mapDetail(data);
}

export async function readyDispatcherOrderForShipment(
  id: string,
  dto: ReadyForShipmentDto,
): Promise<DispatcherOrderDetail> {
  const data = await apiRequest<ApiDispatcherOrder>(`${DISPATCHER_API}/${id}/ready-for-shipment`, {
    method: 'POST',
    body: JSON.stringify({
      shipmentDate: dto.shipmentDate,
      lengthM: dto.lengthM,
      widthM: dto.widthM,
      heightM: dto.heightM,
      weightKg: dto.weightKg,
    }),
  });
  return mapDetail(data);
}

export async function handoverDispatcherOrder(
  id: string,
  dto: HandoverDispatcherOrderDto,
): Promise<DispatcherOrderDetail> {
  const data = await apiRequest<ApiDispatcherOrder>(`${DISPATCHER_API}/${id}/handover`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  return mapDetail(data);
}
