import { StyleSheet, Text, View } from 'react-native';
import { getDispatcherOrderStatusLabel } from '../../api/dispatcherOrderStatus';
import type { DispatcherOrderStatus } from '../../types';
import { colors } from '../../theme/colors';

const STATUS_STYLE: Record<DispatcherOrderStatus, { bg: string; text: string }> = {
  Draft: { bg: colors.badgeGray, text: colors.badgeGrayText },
  PendingApproval: { bg: colors.badgeOrange, text: colors.badgeOrangeText },
  Confirmed: { bg: colors.badgeOrange, text: colors.badgeOrangeText },
  Rescheduled: { bg: colors.badgeRed, text: colors.badgeRedText },
  Rejected: { bg: colors.badgeRed, text: colors.badgeRedText },
  AwaitingShipment: { bg: colors.badgeCyan, text: colors.badgeCyanText },
  Shipped: { bg: colors.badgeGreen, text: colors.badgeGreenText },
  Delivered: { bg: colors.badgeGreen, text: colors.badgeGreenText },
};

interface OrderStatusBadgeProps {
  status: DispatcherOrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.Draft;
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.text }]}>
        {getDispatcherOrderStatusLabel(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
