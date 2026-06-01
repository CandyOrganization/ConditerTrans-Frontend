import type { DispatcherOrderStatus } from '../types';

export const DISPATCHER_ORDER_STATUS_LABELS: Record<DispatcherOrderStatus, string> = {
  Draft: 'Черновик',
  PendingApproval: 'Ожидает подтверждения',
  Confirmed: 'Подтверждён',
  Rescheduled: 'Пересогласование',
  Rejected: 'Отклонён',
  AwaitingShipment: 'Готов к отправке',
  Shipped: 'Отгружен',
  Delivered: 'Доставлен',
};

export function getDispatcherOrderStatusLabel(status: DispatcherOrderStatus): string {
  return DISPATCHER_ORDER_STATUS_LABELS[status] ?? status;
}

export type DispatcherOrderAction =
  | 'confirm'
  | 'reject'
  | 'reschedule'
  | 'readyForShipment'
  | 'handover';

export function getAvailableDispatcherActions(
  status: DispatcherOrderStatus,
): DispatcherOrderAction[] {
  switch (status) {
    case 'PendingApproval':
      return ['confirm', 'reject', 'reschedule'];
    case 'Rescheduled':
      return ['reschedule'];
    case 'Confirmed':
      return ['readyForShipment', 'reschedule'];
    case 'AwaitingShipment':
      return ['handover'];
    default:
      return [];
  }
}
