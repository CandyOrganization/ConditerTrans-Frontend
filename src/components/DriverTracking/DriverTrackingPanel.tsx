import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../ui/Ui';
import { useDriverLocationPublisher } from '../../hooks/useDriverLocationPublisher';
import { colors } from '../../theme/colors';

interface DriverTrackingPanelProps {
  tripId: string;
  employeeId: string;
  driverName: string;
}

export function DriverTrackingPanel({
  tripId,
  employeeId,
  driverName,
}: DriverTrackingPanelProps) {
  const { isPublishing, lastSent, error, start, stop } = useDriverLocationPublisher(
    tripId,
    employeeId,
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Передача GPS водителя</Text>
      <Text style={styles.subtitle}>
        {driverName} · рейс {tripId}
      </Text>
      <Text style={styles.hint}>
        Включите режим водителя на телефоне сотрудника — координаты будут уходить в
        WebSocket-сервис и отображаться на карте диспетчера.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {lastSent ? (
        <Text style={styles.coords}>
          Последняя отправка: {lastSent.latitude.toFixed(5)}, {lastSent.longitude.toFixed(5)}
        </Text>
      ) : null}

      <Button
        title={isPublishing ? 'Остановить передачу GPS' : 'Начать передачу GPS'}
        onPress={isPublishing ? stop : start}
        variant={isPublishing ? 'secondary' : 'primary'}
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  error: {
    fontSize: 13,
    color: colors.error,
  },
  coords: {
    fontSize: 12,
    color: colors.text,
  },
});
