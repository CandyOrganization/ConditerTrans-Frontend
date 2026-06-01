import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDisplayDate, formatOrderCode } from '../../api/dispatcherOrders';
import type { DispatcherOrderListItem } from '../../types';
import { OrderStatusBadge } from './OrderStatusBadge';
import { colors } from '../../theme/colors';

interface OrderListCardProps {
  order: DispatcherOrderListItem;
  onPress: (order: DispatcherOrderListItem) => void;
}

export function OrderListCard({ order, onPress }: OrderListCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(order)}
    >
      <View style={styles.header}>
        <Text style={styles.code}>{formatOrderCode(order.orderNumber)}</Text>
        <OrderStatusBadge status={order.status} />
      </View>
      <Text style={styles.company}>{order.companyName}</Text>
      <Text style={styles.meta}>Сформирован: {formatDisplayDate(order.creationDate)}</Text>
      <Text style={styles.address} numberOfLines={2}>
        {order.deliveryAddress}
      </Text>
      {order.amount != null ? (
        <Text style={styles.amount}>
          {order.amount.toLocaleString('ru-RU')} ₽
          {order.paymentType ? ` · ${order.paymentType}` : ''}
        </Text>
      ) : null}
      <Text style={styles.link}>Открыть карточку →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  cardPressed: {
    opacity: 0.85,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  code: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  company: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  address: {
    fontSize: 13,
    color: colors.text,
  },
  amount: {
    fontSize: 13,
    color: colors.textMuted,
  },
  link: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
});
