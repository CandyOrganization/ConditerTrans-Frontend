import { StyleSheet, Text, View } from 'react-native';
import type { TripStatus } from '../../types';
import { getTripStatusLabel } from '../../api/trips';
import { colors } from '../../theme/colors';

const STATUS_STYLE: Record<
  TripStatus,
  { bg: string; text: string }
> = {
  in_transit: { bg: colors.badgeGreen, text: colors.badgeGreenText },
  awaiting: { bg: colors.badgeCyan, text: colors.badgeCyanText },
  problem: { bg: colors.badgeRed, text: colors.badgeRedText },
  delayed: { bg: colors.badgeOrange, text: colors.badgeOrangeText },
  completed: { bg: colors.badgeGray, text: colors.badgeGrayText },
};

interface StatusBadgeProps {
  status: TripStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLE[status];
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.text }]}>
        {getTripStatusLabel(status)}
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
