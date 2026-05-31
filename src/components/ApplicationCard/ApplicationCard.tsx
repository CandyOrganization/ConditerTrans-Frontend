import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Application } from '../../types';
import { formatApplicationLabel } from '../../api/applications';
import {
  BoxIcon,
  CalendarIcon,
  MoneyIcon,
  PinIcon,
  RouteIcon,
  WarningIcon,
  WeightIcon,
} from '../Icons/Icons';
import { Button } from '../ui/Ui';
import { colors } from '../../theme/colors';

interface ApplicationCardProps {
  application: Application;
  onProcess: (application: Application) => void;
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.icon}>{icon}</View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function ApplicationCard({ application, onProcess }: ApplicationCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.id}>{formatApplicationLabel(application)}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Ожидает водителя</Text>
        </View>
      </View>

      <DetailRow icon={<PinIcon />} label="Откуда:" value={application.from} />
      <DetailRow icon={<RouteIcon />} label="Куда:" value={application.to} />
      <DetailRow icon={<WeightIcon />} label="Состав:" value={application.weight} />
      <DetailRow icon={<CalendarIcon />} label="Загрузка:" value={application.loadingDate} />
      <DetailRow icon={<BoxIcon />} label="Габариты:" value={application.dimensions} />
      <DetailRow icon={<MoneyIcon />} label="Стоимость:" value={application.price} />

      {application.specialConditions && (
        <View style={styles.special}>
          <WarningIcon />
          <Text style={styles.specialText}>
            Спец. условия: <Text style={styles.specialBold}>{application.specialConditions}</Text>
          </Text>
        </View>
      )}

      <Button
        title="Назначить водителя"
        onPress={() => onProcess(application)}
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  id: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.badgeCyan,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.badgeCyanText,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: 20,
  },
  rowLabel: {
    fontSize: 13,
    color: colors.textMuted,
    width: 80,
  },
  rowValue: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  special: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#fffbeb',
    padding: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
  specialText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  specialBold: {
    fontWeight: '700',
  },
});
