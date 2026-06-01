import type {
  AcceptManagerRescheduleDto,
  ManagerOrderDetail,
  ManagerOrderListItem,
  RejectManagerRescheduleDto,
} from '../types';
import { apiRequest } from './client';

const ORDERS_API = '/orders';

interface ManagerOrdersListResponse {
  result: ApiManagerOrder[];
}

interface ApiManagerOrder {
  id: string;
  orderNumber: number;
  creationDate: string;
  status: string;
  productionAddress?: string | null;
  deliveryAddress?: string | null;
  paymentType?: string | null;
  amount: number;
  reschedule?: ApiRescheduleProposal | null;
  lines?: ApiManagerOrderLine[];
}

interface ApiRescheduleProposal {
  proposedDeliveryDate: string;
  reason: string;
}

interface ApiManagerOrderLine {
  productName: string;
  quantityOfUnits: number;
  formattedQuantity: string;
  productPrice: number;
}

function mapReschedule(
  value: ApiRescheduleProposal | null | undefined,
): ManagerOrderListItem['reschedule'] {
  if (!value) {
    return undefined;
  }
  return {
    proposedDeliveryDate: value.proposedDeliveryDate,
    reason: value.reason,
  };
}

function mapManagerOrder(item: ApiManagerOrder): ManagerOrderListItem {
  return {
    id: item.id,
    orderNumber: item.orderNumber,
    creationDate: item.creationDate,
    status: item.status as ManagerOrderListItem['status'],
    productionAddress: item.productionAddress ?? null,
    deliveryAddress: item.deliveryAddress ?? null,
    paymentType: item.paymentType ?? null,
    amount: item.amount,
    reschedule: mapReschedule(item.reschedule),
  };
}

function mapManagerOrderDetail(item: ApiManagerOrder): ManagerOrderDetail {
  const base = mapManagerOrder(item);
  return {
    ...base,
    lines: (item.lines ?? []).map((line) => ({
      productName: line.productName,
      quantity: line.quantityOfUnits,
      unit: '',
      formattedQuantity: line.formattedQuantity,
      productPrice: line.productPrice,
    })),
  };
}

export async function fetchRescheduledOrders(): Promise<ManagerOrderListItem[]> {
  const data = await apiRequest<ManagerOrdersListResponse>(`${ORDERS_API}/rescheduled`);
  return (data.result ?? []).map(mapManagerOrder);
}

export async function fetchManagerOrderById(id: string): Promise<ManagerOrderDetail> {
  const data = await apiRequest<ApiManagerOrder>(`${ORDERS_API}/${id}`);
  return mapManagerOrderDetail(data);
}

export async function acceptManagerReschedule(
  id: string,
  body: AcceptManagerRescheduleDto = {},
): Promise<ManagerOrderDetail> {
  const data = await apiRequest<ApiManagerOrder>(`${ORDERS_API}/${id}/reschedule/accept`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return mapManagerOrderDetail(data);
}

export async function rejectManagerReschedule(
  id: string,
  body: RejectManagerRescheduleDto = {},
): Promise<ManagerOrderDetail> {
  const data = await apiRequest<ApiManagerOrder>(`${ORDERS_API}/${id}/reschedule/reject`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return mapManagerOrderDetail(data);
}
