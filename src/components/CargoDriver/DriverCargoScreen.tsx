import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useDriverLocationPublisher } from '../../hooks/useDriverLocationPublisher';
import type { CargoItem } from '../../api/cargo';
import { getCargoStatusLabel } from '../../api/cargo';
import CargoMap from '../CargoMap/CargoMap';
import { colors } from '../../theme/colors';
import { TRACKING_WS_BASE_URL } from '../../config/tracking';

interface DriverCargoScreenProps {
  cargo: CargoItem;
}

export function DriverCargoScreen({ cargo }: DriverCargoScreenProps) {
  const { user } = useAuth();
  const driverId = user?.id ?? '';

  const { isPublishing, lastSent, error } = useDriverLocationPublisher(cargo.id, driverId, {
    autoStart: Boolean(driverId),
  });

  const title = cargo.orderNumber ? `Заказ №${cargo.orderNumber}` : `Груз #${cargo.id.slice(0, 8).toUpperCase()}`;

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <Text style={styles.title}>{title} · водитель</Text>
        <Text style={styles.status}>{getCargoStatusLabel(cargo.status)}</Text>
      </View>

      <View style={styles.destinationCard}>
        <Text style={styles.destinationLabel}>Куда доставить</Text>
        <Text style={styles.destinationAddress}>{cargo.deliveryAddress}</Text>
        {cargo.productionAddress ? (
          <Text style={styles.origin}>Откуда: {cargo.productionAddress}</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ваша позиция на маршруте</Text>
        <CargoMap
          cargoId={cargo.id}
          deliveryAddress={cargo.deliveryAddress}
          productionAddress={cargo.productionAddress}
          vehicleLabel={`${cargo.weight.toLocaleString('ru-RU')} кг`}
          licensePlate={cargo.orderNumber ? `№${cargo.orderNumber}` : cargo.id.slice(0, 8).toUpperCase()}
          liveLocation={lastSent}
          subscribe={false}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.statusTitle}>
          {!driverId
            ? 'Не удалось определить ID водителя'
            : isPublishing
              ? 'GPS передаётся автоматически'
              : 'Подключение GPS...'}
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
  status: {
    fontSize: 14,
    color: colors.textMuted,
  },
  destinationCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 6,
  },
  destinationLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  destinationAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  origin: {
    fontSize: 13,
    color: colors.textMuted,
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
