import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  fetchManagerOrderHistory,
  formatManagerOrderLabel,
  repeatManagerOrder,
} from '../../api/managerOrders';
import { ApiError } from '../../api/client';
import type { ManagerCurrentDraft, PaginatedManagerOrderHistory } from '../../types';
import { DispatcherPagination } from '../Dispatcher/DispatcherPagination';
import { OrderStatusBadge } from '../Order/OrderStatusBadge';
import { Button, LoadingText, SectionTitle } from '../ui/Ui';
import { colors } from '../../theme/colors';

const DEFAULT_PAGE_SIZE = 20;

const emptyPage: PaginatedManagerOrderHistory = {
  items: [],
  total: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalPages: 0,
};

interface ManagerOrderHistoryPanelProps {
  onDraftCreated?: (draft: ManagerCurrentDraft) => void;
}

export function ManagerOrderHistoryPanel({ onDraftCreated }: ManagerOrderHistoryPanelProps) {
  const [data, setData] = useState<PaginatedManagerOrderHistory>(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [repeatingId, setRepeatingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const loadHistory = useCallback(async () => {
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetchManagerOrderHistory({ page, pageSize });
      const totalPages =
        response.totalPages > 0
          ? response.totalPages
          : response.total > 0
            ? Math.ceil(response.total / response.pageSize)
            : 0;
      setData({ ...response, totalPages });
    } catch (err) {
      setData(emptyPage);
      setError(err instanceof Error ? err.message : 'Не удалось загрузить историю заказов');
    }
  }, [page, pageSize]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadHistory();
      if (!cancelled) {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadHistory]);

  const handlePageSizeChange = (nextSize: number) => {
    setPageSize(nextSize);
    setPage(1);
  };

  const handleRepeat = async (orderId: string, lineCountHint: number) => {
    setRepeatingId(orderId);
    setError('');
    setSuccessMessage('');
    try {
      const draft = await repeatManagerOrder(orderId);
      setSuccessMessage(
        `Создан черновик заказа (${draft.lines.length || lineCountHint} поз.). Оформите и отправьте на согласование.`,
      );
      onDraftCreated?.(draft);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('Заказ не найден');
      } else {
        setError(err instanceof Error ? err.message : 'Не удалось повторить заказ');
      }
    } finally {
      setRepeatingId(null);
    }
  };

  return (
    <>
      <SectionTitle>История заказов</SectionTitle>

      {!loading && !error && data.total > 0 ? (
        <DispatcherPagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      ) : null}

      {loading ? <LoadingText /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

      {!loading && !error && data.total === 0 ? (
        <Text style={styles.empty}>Заказов в истории пока нет</Text>
      ) : null}

      {!loading && data.items.length > 0 ? (
        <View style={styles.list}>
          {data.items.map((order) => (
            <View key={order.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.code}>{formatManagerOrderLabel(order)}</Text>
                <OrderStatusBadge status={order.status} />
              </View>
              <Text style={styles.meta}>
                {new Date(order.creationDate).toLocaleDateString('ru-RU')} ·{' '}
                {order.amount.toLocaleString('ru-RU')} ₽
              </Text>
              {order.reschedule ? (
                <Text style={styles.reschedule}>
                  Перенос: {order.reschedule.reason} →{' '}
                  {new Date(order.reschedule.proposedDeliveryDate).toLocaleDateString('ru-RU')}
                </Text>
              ) : null}
              <Button
                title={repeatingId === order.id ? 'Создание…' : 'Повторить заказ'}
                onPress={() => void handleRepeat(order.id, 0)}
                disabled={repeatingId !== null}
              />
            </View>
          ))}
        </View>
      ) : null}

      {!loading && !error && data.total > 0 ? (
        <DispatcherPagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      ) : null}

      {!loading ? (
        <Pressable onPress={() => void loadHistory()}>
          <Text style={styles.refresh}>Обновить историю</Text>
        </Pressable>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  code: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  reschedule: {
    fontSize: 12,
    color: colors.warning,
  },
  empty: {
    color: colors.textMuted,
    marginBottom: 12,
  },
  error: {
    color: colors.error,
    marginBottom: 12,
  },
  success: {
    color: colors.success,
    marginBottom: 12,
    fontWeight: '600',
  },
  refresh: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
});
