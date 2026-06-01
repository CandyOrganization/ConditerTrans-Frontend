import { useCallback, useEffect, useState } from 'react';
import { Redirect, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  confirmDispatcherOrder,
  fetchDispatcherOrderById,
  formatDisplayDate,
  formatOrderCode,
  handoverDispatcherOrder,
  readyDispatcherOrderForShipment,
  rejectDispatcherOrder,
  rescheduleDispatcherOrder,
} from '../../src/api/dispatcherOrders';
import {
  getAvailableDispatcherActions,
  type DispatcherOrderAction,
} from '../../src/api/dispatcherOrderStatus';
import { ApiError } from '../../src/api/client';
import { Header } from '../../src/components/Header/Header';
import { DispatcherReadyForShipmentModal } from '../../src/components/Modal/DispatcherReadyForShipmentModal';
import { DispatcherRejectModal } from '../../src/components/Modal/DispatcherRejectModal';
import { DispatcherRescheduleModal } from '../../src/components/Modal/DispatcherRescheduleModal';
import { DispatcherShipmentHandoverModal } from '../../src/components/Modal/DispatcherShipmentHandoverModal';
import { OrderStatusBadge } from '../../src/components/Order/OrderStatusBadge';
import { Button, LoadingText } from '../../src/components/ui/Ui';
import { useAuth } from '../../src/context/AuthContext';
import type { DispatcherOrderDetail } from '../../src/types';
import { colors } from '../../src/theme/colors';
import { confirmAction } from '../../src/utils/confirm';

type ActiveModal = 'reject' | 'reschedule' | 'ready' | 'handover' | null;

export default function DispatcherOrderDetailsScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, userRole } = useAuth();
  const isDispatcher = userRole === 'Dispatcher';

  const [order, setOrder] = useState<DispatcherOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    setError('');
    try {
      setOrder(await fetchDispatcherOrderById(String(orderId)));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('Заказ не найден');
      } else {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить заказ');
      }
      setOrder(null);
    }
  }, [orderId]);

  useEffect(() => {
    if (!isAuthenticated || !isDispatcher || !orderId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadOrder();
      if (!cancelled) {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isDispatcher, orderId, loadOrder]);

  const refreshAfterAction = async (updater: () => Promise<DispatcherOrderDetail>) => {
    setActionLoading(true);
    try {
      const updated = await updater();
      setOrder(updated);
      return updated;
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!order) return;

    const confirmed = await confirmAction(
      'Принять заказ',
      'Перевести заказ в производство? Мощности будут зарезервированы.',
    );
    if (!confirmed) return;

    try {
      await refreshAfterAction(() => confirmDispatcherOrder(order.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось принять заказ');
    }
  };

  const actionLabels: Record<DispatcherOrderAction, { title: string; variant?: 'primary' | 'danger' }> = {
    confirm: { title: 'Принять заказ' },
    reject: { title: 'Отказать в заказе', variant: 'danger' },
    reschedule: { title: 'Срыв сроков производства', variant: 'danger' },
    readyForShipment: { title: 'Подтвердить готовность' },
    handover: { title: 'Фиксировать отгрузку' },
  };

  const runAction = async (action: DispatcherOrderAction) => {
    switch (action) {
      case 'confirm':
        await handleConfirm();
        break;
      case 'reject':
        setActiveModal('reject');
        break;
      case 'reschedule':
        setActiveModal('reschedule');
        break;
      case 'readyForShipment':
        setActiveModal('ready');
        break;
      case 'handover':
        setActiveModal('handover');
        break;
      default:
        break;
    }
  };

  if (authLoading) {
    return <LoadingText />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!isDispatcher) {
    return <Redirect href="/" />;
  }

  const availableActions = order ? getAvailableDispatcherActions(order.status) : [];
  const orderLabel = order ? formatOrderCode(order.orderNumber) : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header variant="trip" />

      <ScrollView style={styles.main} contentContainerStyle={styles.content}>
        {loading ? <LoadingText /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && order ? (
          <>
            <View style={styles.hero}>
              <View style={styles.heroText}>
                <Text style={styles.title}>{formatOrderCode(order.orderNumber)}</Text>
                <Text style={styles.company}>{order.companyName}</Text>
              </View>
              <OrderStatusBadge status={order.status} />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Информация о заказе</Text>
              <InfoRow label="Дата формирования" value={formatDisplayDate(order.creationDate)} />
              <InfoRow label="Заказчик" value={order.companyName} />
              <InfoRow label="Адрес доставки" value={order.deliveryAddress} />
              {order.productionAddress ? (
                <InfoRow label="Адрес погрузки" value={order.productionAddress} />
              ) : null}
              {order.paymentType ? (
                <InfoRow label="Оплата" value={order.paymentType} />
              ) : null}
              {order.amount != null ? (
                <InfoRow
                  label="Сумма"
                  value={`${order.amount.toLocaleString('ru-RU')} ₽`}
                />
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Состав заказа</Text>
              {order.lines.map((line, index) => (
                <View key={`${line.productName}-${index}`} style={styles.lineRow}>
                  <Text style={styles.lineName}>{line.productName}</Text>
                  <Text style={styles.lineQty}>
                    {line.formattedQuantity ?? `${line.quantity} ${line.unit}`}
                  </Text>
                </View>
              ))}
            </View>

            {availableActions.length > 0 ? (
              <View style={styles.actionsCard}>
                <Text style={styles.cardTitle}>Действия диспетчера</Text>
                {availableActions.map((action) => {
                  const meta = actionLabels[action];
                  return (
                    <Button
                      key={action}
                      title={meta.title}
                      variant={meta.variant ?? 'primary'}
                      onPress={() => void runAction(action)}
                      disabled={actionLoading}
                      fullWidth
                      style={styles.actionBtn}
                    />
                  );
                })}
              </View>
            ) : (
              <Text style={styles.hint}>
                Для текущего статуса нет доступных действий. Вернитесь к списку заказов.
              </Text>
            )}
          </>
        ) : null}

        {!loading && !error && !order ? (
          <Button title="К списку заказов" onPress={() => router.replace('/')} />
        ) : null}
      </ScrollView>

      {order ? (
        <>
          <DispatcherRejectModal
            visible={activeModal === 'reject'}
            orderLabel={orderLabel}
            onClose={() => setActiveModal(null)}
            onSubmit={async (reason) => {
              await refreshAfterAction(() => rejectDispatcherOrder(order.id, { reason }));
            }}
          />
          <DispatcherRescheduleModal
            visible={activeModal === 'reschedule'}
            onClose={() => setActiveModal(null)}
            onSubmit={async (payload) => {
              await refreshAfterAction(() => rescheduleDispatcherOrder(order.id, payload));
            }}
          />
          <DispatcherReadyForShipmentModal
            visible={activeModal === 'ready'}
            onClose={() => setActiveModal(null)}
            onSubmit={async (shipmentDate) => {
              await refreshAfterAction(() =>
                readyDispatcherOrderForShipment(order.id, { shipmentDate }),
              );
            }}
          />
          <DispatcherShipmentHandoverModal
            visible={activeModal === 'handover'}
            vehicleLabel={order.handoverVehicle}
            driverLabel={order.handoverDriver}
            onClose={() => setActiveModal(null)}
            onSubmit={async (documentsHandedOver) => {
              await refreshAfterAction(() =>
                handoverDispatcherOrder(order.id, { documentsHandedOver }),
              );
            }}
          />
        </>
      ) : null}
    </SafeAreaView>
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
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  heroText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  company: {
    fontSize: 15,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    gap: 8,
  },
  actionsCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  infoRow: {
    gap: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lineName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  lineQty: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  actionBtn: {
    marginTop: 0,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  error: {
    color: colors.error,
    marginBottom: 16,
  },
});
