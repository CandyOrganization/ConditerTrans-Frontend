import { useEffect, useState } from 'react';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchTripDetails } from '../../src/api/tripDetails';
import { Header } from '../../src/components/Header/Header';
import {
  DownloadIcon,
  EditIcon,
  EmailIcon,
  FileContractIcon,
  FileDocIcon,
  FilePdfIcon,
  PhoneIcon,
  WarningIcon,
} from '../../src/components/Icons/Icons';
import TripMap from '../../src/components/TripMap/TripMap';
import { DriverTripScreen } from '../../src/components/TripDriver/DriverTripScreen';
import { StatusBadge } from '../../src/components/StatusBadge/StatusBadge';
import { Button, FieldLabel, Input, LoadingText } from '../../src/components/ui/Ui';
import { useAuth } from '../../src/context/AuthContext';
import type { TripDetails, TripDocument, TripDocumentType, TripHistoryEvent } from '../../src/types';
import { colors } from '../../src/theme/colors';

function InfoGrid({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <View style={styles.infoGrid}>
      {items.map((item) => (
        <View key={item.label} style={styles.infoItem}>
          <Text style={styles.infoLabel}>{item.label}</Text>
          <Text style={styles.infoValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

function DocumentIcon({ type }: { type: TripDocumentType }) {
  if (type === 'docx') return <FileDocIcon />;
  if (type === 'contract') return <FileContractIcon />;
  return <FilePdfIcon />;
}

function TripDetailsContent({ trip }: { trip: TripDetails }) {
  const [comment, setComment] = useState('');

  const orderItems = [
    { label: 'Клиент', value: trip.order.client },
    { label: 'Контактное лицо', value: trip.order.contactName },
    { label: 'Телефон', value: trip.order.contactPhone },
    { label: 'Вес груза', value: trip.order.weight },
    { label: 'Габариты', value: trip.order.dimensions },
    { label: 'Стоимость перевозки', value: trip.order.cost },
    { label: 'Дата заявки', value: trip.order.requestDate },
    { label: 'Плановая дата загрузки', value: trip.order.plannedLoadingDate },
    { label: 'Ожидаемая дата доставки (ETA)', value: trip.order.eta },
  ];

  const transportItems = [
    { label: 'Водитель', value: trip.transport.driver },
    { label: 'Телефон водителя', value: trip.transport.driverPhone },
    { label: 'Транспортное средство', value: trip.transport.vehicle },
    { label: 'Гос. номер', value: trip.transport.licensePlate },
    { label: 'Тип кузова', value: trip.transport.bodyType },
    { label: 'Грузоподъёмность', value: trip.transport.payloadCapacity },
  ];

  return (
    <>
      <View style={styles.hero}>
        <View style={styles.heroText}>
          <Text style={styles.title}>Рейс #{trip.id}</Text>
          <Text style={styles.route}>{trip.routeFull}</Text>
        </View>
        <StatusBadge status={trip.status} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Информация о Заказе</Text>
        <InfoGrid items={orderItems} />
        {trip.order.specialConditions && (
          <View style={styles.special}>
            <WarningIcon size={16} />
            <Text style={styles.specialText}>
              Спец. условия: <Text style={styles.specialBold}>{trip.order.specialConditions}</Text>
            </Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Исполнитель и Транспорт</Text>
        <InfoGrid items={transportItems} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Отслеживание на Карте</Text>
        <TripMap
          tripId={trip.id}
          routeLabel={trip.routeShort}
          vehicleLabel={trip.transport.vehicle}
          licensePlate={trip.transport.licensePlate}
          subscribe
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>История Рейса</Text>
        {trip.history.map((event: TripHistoryEvent) => (
          <View
            key={event.id}
            style={[
              styles.timelineItem,
              event.variant === 'success' && styles.timelineSuccess,
            ]}
          >
            <View style={styles.timelineDot} />
            <View style={styles.timelineBody}>
              <Text style={styles.timelineDate}>{event.date}</Text>
              <Text style={styles.timelineText}>{event.description}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Документы</Text>
        {trip.documents.length === 0 ? (
          <Text style={styles.emptyDocs}>Документы отсутствуют</Text>
        ) : (
          trip.documents.map((doc: TripDocument) => (
            <View key={doc.id} style={styles.docItem}>
              <DocumentIcon type={doc.type} />
              <Text style={styles.docName}>{doc.name}</Text>
              <Pressable hitSlop={8}>
                <DownloadIcon size={16} />
              </Pressable>
            </View>
          ))
        )}
        <Button title="+ Добавить документ" variant="secondary" onPress={() => {}} fullWidth />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Действия по Рейсу</Text>
        <View style={styles.actions}>
          <ActionBtn icon={<EditIcon size={16} />} label="Обновить Статус" primary />
          <ActionBtn icon={<PhoneIcon size={16} />} label="Связаться с Водителем" />
          <ActionBtn icon={<EmailIcon size={16} />} label="Связаться с Клиентом" />
          <ActionBtn icon={<WarningIcon size={16} />} label="Сообщить о Проблеме" danger />
        </View>

        <FieldLabel>Комментарий к рейсу</FieldLabel>
        <Input
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
          placeholder="Добавить комментарий к рейсу..."
          style={styles.commentInput}
        />
        <Button
          title="Сохранить комментарий"
          onPress={() => {}}
          disabled={!comment.trim()}
          fullWidth
        />
      </View>
    </>
  );
}

function ActionBtn({
  icon,
  label,
  primary,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.actionBtn,
        primary && styles.actionPrimary,
        danger && styles.actionDanger,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.actionText,
          primary && styles.actionTextPrimary,
          danger && styles.actionTextDanger,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function TripDetailsScreen() {
  const { tripId, mode } = useLocalSearchParams<{ tripId: string; mode?: string }>();
  const isDriverMode = mode === 'driver';
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!tripId || !isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    (async () => {
      const data = await fetchTripDetails(String(tripId));
      if (cancelled) return;
      if (!data) {
        setNotFound(true);
        setTrip(null);
      } else {
        setTrip(data);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId, isAuthenticated]);

  if (authLoading) return <LoadingText />;
  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header variant="trip" />

      <ScrollView style={styles.main} contentContainerStyle={styles.content}>
        {loading && <LoadingText />}

        {!loading && notFound && (
          <View style={styles.notFound}>
            <Text style={styles.notFoundText}>Рейс не найден</Text>
            <Button title="Вернуться на панель" onPress={() => router.push('/')} />
          </View>
        )}

        {!loading && trip && isDriverMode && <DriverTripScreen trip={trip} />}

        {!loading && trip && !isDriverMode && <TripDetailsContent trip={trip} />}
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
  infoGrid: {
    gap: 10,
  },
  infoItem: {
    gap: 2,
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
  special: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#fffbeb',
    padding: 8,
    borderRadius: 6,
  },
  specialText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  specialBold: {
    fontWeight: '700',
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    paddingLeft: 4,
  },
  timelineSuccess: {
    opacity: 1,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  timelineBody: {
    flex: 1,
  },
  timelineDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  timelineText: {
    fontSize: 14,
    color: colors.text,
    marginTop: 2,
  },
  emptyDocs: {
    color: colors.textMuted,
    marginBottom: 12,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  docName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  actions: {
    gap: 8,
    marginBottom: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  actionPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionDanger: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  actionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  actionTextPrimary: {
    color: '#fff',
  },
  actionTextDanger: {
    color: colors.error,
  },
  commentInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
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
