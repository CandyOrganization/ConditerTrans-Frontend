import type {
  AcceptManagerRescheduleDto,
  ManagerCurrentDraft,
  ManagerOrderDetail,
  ManagerOrderHistoryItem,
  ManagerOrderListItem,
  PaginatedManagerOrderHistory,
  RejectManagerRescheduleDto,
} from '../types';
import { formatOrderCode } from './dispatcherOrders';
import { apiRequest } from './client';

const ORDERS_API = '/orders';

export interface OrderLineMutationDto {
  productId: string;
  quantityOfUnits: number;
}

export type SubmitPaymentMethod = 'Cash' | 'Card' | 'BankTransfer';

export interface SubmitManagerOrderDto {
  productionAddress: string;
  deliveryAddress: string;
  paymentMethod: SubmitPaymentMethod;
  /** ISO date (YYYY-MM-DD или полная дата); на бэкенде — не раньше чем через 2 дня от сегодня (UTC) */
  requestedDeliveryDate: string;
}

export async function submitManagerOrder(orderId: string, dto: SubmitManagerOrderDto): Promise<void> {
  await apiRequest(`${ORDERS_API}/${orderId}/submit`, {
    method: 'POST',
    body: JSON.stringify({
      production_address: dto.productionAddress,
      delivery_address: dto.deliveryAddress,
      payment_method: dto.paymentMethod,
      requested_delivery_date: dto.requestedDeliveryDate,
    }),
  });
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

interface OrderHistoryApiResponse {
  result: ApiManagerOrder[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  TotalCount?: number;
  Page?: number;
  PageSize?: number;
  TotalPages?: number;
}

export interface ManagerOrderHistoryFilter {
  page?: number;
  pageSize?: number;
}

interface ApiCurrentOrder {
  id: string;
  orderNumber: number;
  creationDate: string;
  status: string;
  productionAddress?: string | null;
  deliveryAddress?: string | null;
  lines: Array<{
    id: string;
    productId: string;
    quantityOfUnits: number;
    productName: string;
    productPrice: number;
    formattedQuantity: string;
  }>;
}

export function formatManagerOrderLabel(order: ManagerOrderHistoryItem): string {
  return formatOrderCode(order.orderNumber, order.status);
}

export async function fetchManagerOrderHistory(
  params: ManagerOrderHistoryFilter = {},
): Promise<PaginatedManagerOrderHistory> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('pageSize', String(pageSize));

  const data = await apiRequest<OrderHistoryApiResponse>(
    `${ORDERS_API}/history?${query.toString()}`,
  );

  const total = data.totalCount ?? data.TotalCount ?? 0;
  const currentPage = data.page ?? data.Page ?? page;
  const currentPageSize = data.pageSize ?? data.PageSize ?? pageSize;
  const totalPages = data.totalPages ?? data.TotalPages ?? 0;

  return {
    items: (data.result ?? []).map((item) => mapManagerOrder(item)),
    total,
    page: currentPage,
    pageSize: currentPageSize,
    totalPages:
      totalPages > 0 ? totalPages : total > 0 ? Math.ceil(total / currentPageSize) : 0,
  };
}

export async function addProductToOrder(dto: OrderLineMutationDto): Promise<void> {
  await apiRequest(`${ORDERS_API}`, {
    method: 'POST',
    body: JSON.stringify({
      productId: dto.productId,
      quantityOfUnits: dto.quantityOfUnits,
    }),
  });
}

export async function removeProductFromOrder(dto: OrderLineMutationDto): Promise<void> {
  await apiRequest(`${ORDERS_API}/line`, {
    method: 'DELETE',
    body: JSON.stringify({
      productId: dto.productId,
      quantityOfUnits: dto.quantityOfUnits,
    }),
  });
}

export async function repeatManagerOrder(sourceOrderId: string): Promise<ManagerCurrentDraft> {
  const data = await apiRequest<ApiCurrentOrder>(`${ORDERS_API}/${sourceOrderId}/repeat`, {
    method: 'POST',
  });
  return {
    id: data.id,
    orderNumber: data.orderNumber,
    creationDate: data.creationDate,
    status: 'Draft',
    productionAddress: data.productionAddress ?? null,
    deliveryAddress: data.deliveryAddress ?? null,
    lines: data.lines ?? [],
  };
}
