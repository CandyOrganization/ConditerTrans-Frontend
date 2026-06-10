export type PaymentMethod = 'Cash' | 'Card' | 'BankTransfer';

const LABELS: Record<PaymentMethod, string> = {
  Cash: 'Наличные',
  Card: 'Карта',
  BankTransfer: 'Перевод',
};

export function formatPaymentMethodLabel(
  paymentMethod?: PaymentMethod | string | null,
  paymentMethodLabel?: string | null,
  paymentType?: string | null,
): string {
  if (paymentMethodLabel?.trim()) {
    return paymentMethodLabel.trim();
  }

  if (paymentMethod && paymentMethod in LABELS) {
    return LABELS[paymentMethod as PaymentMethod];
  }

  const legacy = paymentType?.trim().toLowerCase();
  if (legacy === 'cash') return LABELS.Cash;
  if (legacy === 'card') return LABELS.Card;
  if (legacy === 'invoice' || legacy === 'banktransfer') return LABELS.BankTransfer;

  return paymentType?.trim() || '—';
}
