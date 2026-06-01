import type {
  DispatcherOrderDetail,
  DispatcherOrderLine,
  DispatcherOrderListItem,
  DispatcherOrderStatus,
  HandoverDispatcherOrderDto,
  ReadyForShipmentDto,
  RejectDispatcherOrderDto,
  RescheduleDispatcherOrderDto,
} from '../types';
import { apiRequest } from './client';

const DISPATCHER_API = '/orders/dispatcher';

interface DispatcherOrdersListResponse {
  result: ApiDispatcherOrder[];
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
  productionAddress?: string | null;
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

export function formatOrderCode(orderNumber: number): string {
  return `№${orderNumber}`;
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
  };
}

function mapDetail(order: ApiDispatcherOrder): DispatcherOrderDetail {
  return {
    ...mapListItem(order),
    productionAddress: order.productionAddress,
    lines: (order.lines ?? []).map(mapLine),
    handoverVehicle: order.handoverVehicle,
    handoverDriver: order.handoverDriver,
  };
}

export async function fetchDispatcherOrders(params?: {
  search?: string;
  status?: DispatcherOrderStatus;
}): Promise<DispatcherOrderListItem[]> {
  const search = params?.search ?? '';
  const status = params?.status;
  const query = new URLSearchParams();
  if (search.trim()) {
    query.set('search', search.trim());
  }
  if (status) {
    query.set('status', status);
  }
  const qs = query.toString();
  const path = qs ? `${DISPATCHER_API}?${qs}` : DISPATCHER_API;

  const data = await apiRequest<DispatcherOrdersListResponse>(path);
  return (data.result ?? []).map(mapListItem);
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
    body: JSON.stringify({ shipmentDate: dto.shipmentDate }),
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
