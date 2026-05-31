import { useEffect, useState } from 'react';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchCargoById, getCargoStatusLabel, type CargoItem } from '../../src/api/cargo';
import { ApiError } from '../../src/api/client';
import CargoMap from '../../src/components/CargoMap/CargoMap';
import { DriverCargoScreen } from '../../src/components/CargoDriver/DriverCargoScreen';
import { Header } from '../../src/components/Header/Header';
import { Button, LoadingText } from '../../src/components/ui/Ui';
import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/theme/colors';

function CargoDetailsContent({ cargo }: { cargo: CargoItem }) {
  const title = cargo.orderNumber ? `Заказ №${cargo.orderNumber}` : `Груз #${cargo.id.slice(0, 8).toUpperCase()}`;

  return (
    <>
      <View style={styles.hero}>
        <View style={styles.heroText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.route}>{cargo.deliveryAddress}</Text>
        </View>
        <Text style={styles.statusBadge}>{getCargoStatusLabel(cargo.status)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Информация о грузе</Text>
        <InfoRow label="Адрес доставки" value={cargo.deliveryAddress} />
        {cargo.productionAddress ? (
          <InfoRow label="Адрес погрузки" value={cargo.productionAddress} />
        ) : null}
        <InfoRow label="Водитель" value={cargo.driverName ?? '—'} />
        <InfoRow
          label="Вес / объём"
          value={`${cargo.weight.toLocaleString('ru-RU')} кг · ${cargo.volume.toLocaleString('ru-RU')} м³`}
        />
        <InfoRow
          label="Даты"
          value={`Погрузка: ${new Date(cargo.loadingDate).toLocaleDateString('ru-RU')} · Выгрузка: ${new Date(cargo.unloadingDate).toLocaleDateString('ru-RU')}`}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Отслеживание на карте</Text>
        <CargoMap
          cargoId={cargo.id}
          deliveryAddress={cargo.deliveryAddress}
          productionAddress={cargo.productionAddress}
          vehicleLabel={cargo.driverName ?? 'Водитель'}
          licensePlate={cargo.orderNumber ? `№${cargo.orderNumber}` : cargo.id.slice(0, 8).toUpperCase()}
          subscribe
        />
      </View>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function CargoDetailsScreen() {
  const { cargoId, mode } = useLocalSearchParams<{ cargoId: string; mode?: string }>();
  const isDriverMode = mode === 'driver';
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [cargo, setCargo] = useState<CargoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!cargoId || !isAuthenticated) return;
    let cancelled = false;

    setLoading(true);
    setNotFound(false);
    setError('');

    (async () => {
      try {
        const data = await fetchCargoById(String(cargoId));
        if (cancelled) return;
        setCargo(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(err instanceof Error ? err.message : 'Не удалось загрузить груз');
        }
        setCargo(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cargoId, isAuthenticated]);

  if (authLoading) return <LoadingText />;
  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header variant="trip" />

      <ScrollView style={styles.main} contentContainerStyle={styles.content}>
        {loading && <LoadingText />}

        {!loading && error ? (
          <View style={styles.notFound}>
            <Text style={styles.notFoundText}>{error}</Text>
            <Button title="Вернуться на панель" onPress={() => router.push('/')} />
          </View>
        ) : null}

        {!loading && notFound && (
          <View style={styles.notFound}>
            <Text style={styles.notFoundText}>Груз не найден</Text>
            <Button title="Вернуться на панель" onPress={() => router.push('/')} />
          </View>
        )}

        {!loading && cargo && isDriverMode && <DriverCargoScreen cargo={cargo} />}
        {!loading && cargo && !isDriverMode && <CargoDetailsContent cargo={cargo} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  main: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  heroText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  route: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  infoRow: {
    gap: 2,
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  notFound: {
    alignItems: 'center',
    gap: 16,
    padding: 32,
  },
  notFoundText: {
    fontSize: 16,
    color: colors.text,
  },
});
