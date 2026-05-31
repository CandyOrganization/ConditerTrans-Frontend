import { StyleSheet, Text, View } from 'react-native';
import { useDriverLocationPublisher } from '../../hooks/useDriverLocationPublisher';
import TripMap from '../TripMap/TripMap';
import { colors } from '../../theme/colors';
import type { TripDetails } from '../../types';
import { TRACKING_WS_BASE_URL } from '../../config/tracking';

interface DriverTripScreenProps {
  trip: TripDetails;
}

export function DriverTripScreen({ trip }: DriverTripScreenProps) {
  const { isPublishing, lastSent, error } = useDriverLocationPublisher(
    trip.id,
    trip.transport.employeeId,
    { autoStart: true },
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <Text style={styles.title}>Рейс #{trip.id} · водитель</Text>
        <Text style={styles.route}>{trip.routeFull}</Text>
        <Text style={styles.driver}>{trip.transport.driver}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ваша позиция на маршруте</Text>
        <TripMap
          tripId={trip.id}
          routeLabel={trip.routeShort}
          vehicleLabel={trip.transport.vehicle}
          licensePlate={trip.transport.licensePlate}
          liveLocation={lastSent}
          subscribe={false}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.statusTitle}>
          {isPublishing ? 'GPS передаётся автоматически' : 'Подключение GPS...'}
        </Text>
        {lastSent ? (
          <Text style={styles.coords}>
            {lastSent.latitude.toFixed(5)}, {lastSent.longitude.toFixed(5)}
          </Text>
        ) : (
          <Text style={styles.coords}>Ожидание первой координаты...</Text>
        )}
        <Text style={styles.wsUrl}>WS: {TRACKING_WS_BASE_URL}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  hero: {
    marginBottom: 4,
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  route: {
    fontSize: 14,
    color: colors.textMuted,
  },
  driver: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  coords: {
    fontSize: 13,
    color: colors.text,
  },
  wsUrl: {
    fontSize: 11,
    color: colors.textMuted,
  },
  error: {
    fontSize: 13,
    color: colors.error,
  },
});
