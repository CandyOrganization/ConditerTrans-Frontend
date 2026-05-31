import { Picker } from '@react-native-picker/picker';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { PaginatedTrips, TripStatus } from '../../types';
import { getTripStatusLabel } from '../../api/trips';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { Input, SectionTitle } from '../ui/Ui';
import { colors } from '../../theme/colors';

interface TripTableProps {
  data: PaginatedTrips;
  search: string;
  statusFilter: TripStatus | 'all';
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: TripStatus | 'all') => void;
  onPageChange: (page: number) => void;
}

const STATUS_OPTIONS: Array<{ value: TripStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Все статусы' },
  { value: 'in_transit', label: getTripStatusLabel('in_transit') },
  { value: 'awaiting', label: getTripStatusLabel('awaiting') },
  { value: 'problem', label: getTripStatusLabel('problem') },
  { value: 'delayed', label: getTripStatusLabel('delayed') },
  { value: 'completed', label: getTripStatusLabel('completed') },
];

export function TripTable({
  data,
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
}: TripTableProps) {
  const router = useRouter();
  const pages = Array.from({ length: data.totalPages }, (_, i) => i + 1);

  return (
    <View style={styles.section}>
      <SectionTitle>Активные Рейсы ({data.total})</SectionTitle>

      <Input
        placeholder="Поиск по ID, Маршруту..."
        value={search}
        onChangeText={onSearchChange}
        style={styles.search}
      />

      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={statusFilter}
          onValueChange={(v) => onStatusFilterChange(v as TripStatus | 'all')}
        >
          {STATUS_OPTIONS.map((opt) => (
            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
          ))}
        </Picker>
      </View>

      {data.items.length === 0 ? (
        <Text style={styles.empty}>Рейсы не найдены</Text>
      ) : (
        data.items.map((trip) => (
          <Pressable
            key={trip.id}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push(`/trip/${trip.id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.tripId}>#{trip.id}</Text>
              <StatusBadge status={trip.status} />
            </View>
            <Text style={styles.route}>{trip.route}</Text>
            <Text style={styles.meta}>Клиент: {trip.client}</Text>
            <Text style={styles.meta}>Водитель: {trip.driver}</Text>
            <Text style={styles.meta}>ТС: {trip.vehicle}</Text>
            <Text style={styles.date}>Загрузка: {trip.loadingDate}</Text>
          </Pressable>
        ))
      )}

      {data.totalPages > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pagination}>
          <Pressable
            style={[styles.pageBtn, data.page <= 1 && styles.pageBtnDisabled]}
            disabled={data.page <= 1}
            onPress={() => onPageChange(data.page - 1)}
          >
            <Text style={styles.pageBtnText}>‹</Text>
          </Pressable>
          {pages.map((p) => (
            <Pressable
              key={p}
              style={[styles.pageBtn, p === data.page && styles.pageBtnActive]}
              onPress={() => onPageChange(p)}
            >
              <Text style={[styles.pageBtnText, p === data.page && styles.pageBtnTextActive]}>
                {p}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={[styles.pageBtn, data.page >= data.totalPages && styles.pageBtnDisabled]}
            disabled={data.page >= data.totalPages}
            onPress={() => onPageChange(data.page + 1)}
          >
            <Text style={styles.pageBtnText}>›</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
  },
  search: {
    marginBottom: 8,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    marginBottom: 12,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tripId: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  route: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 2,
  },
  date: {
    fontSize: 13,
    color: colors.text,
    marginTop: 4,
  },
  pagination: {
    flexDirection: 'row',
    marginTop: 8,
  },
  pageBtn: {
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    marginRight: 6,
    backgroundColor: colors.surface,
  },
  pageBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: 14,
    color: colors.text,
  },
  pageBtnTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
