import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fetchDispatcherOrders } from '../../api/dispatcherOrders';
import { ApiError } from '../../api/client';
import type { DispatcherOrderListItem, PaginatedDispatcherOrders } from '../../types';
import { DispatcherPagination } from './DispatcherPagination';
import { OrderListCard } from '../Order/OrderListCard';
import { Button, Input, LoadingText, SectionTitle } from '../ui/Ui';
import { colors } from '../../theme/colors';

const DEFAULT_PAGE_SIZE = 20;

const emptyPage: PaginatedDispatcherOrders = {
  items: [],
  total: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalPages: 0,
  hasOrdersRequiringDeadlineConfirmation: false,
};

export function DispatcherOrdersPanel() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedDispatcherOrders>(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const loadOrders = useCallback(async () => {
    setError('');
    try {
      const response = await fetchDispatcherOrders({
        search: appliedSearch,
        page,
        pageSize,
      });
      const totalPages =
        response.totalPages > 0
          ? response.totalPages
          : response.total > 0
            ? Math.ceil(response.total / response.pageSize)
            : 0;
      setData({ ...response, totalPages });
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError('Недостаточно прав для просмотра заказов');
      } else {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить заказы');
      }
      setData(emptyPage);
    }
  }, [appliedSearch, page, pageSize]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadOrders();
      if (!cancelled) {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadOrders]);

  useEffect(() => {
    const timer = setInterval(() => {
      void loadOrders();
    }, 30_000);
    return () => clearInterval(timer);
  }, [loadOrders]);

  const handleSearch = () => {
    setAppliedSearch(searchInput.trim());
    setPage(1);
  };

  const handlePageSizeChange = (nextSize: number) => {
    setPageSize(nextSize);
    setPage(1);
  };

  const openOrder = (order: DispatcherOrderListItem) => {
    router.push({
      pathname: '/order/[orderId]',
      params: { orderId: order.id },
    });
  };

  return (
    <>
      <SectionTitle>Список заказов</SectionTitle>

      {data.hasOrdersRequiringDeadlineConfirmation ? (
        <View style={styles.deadlineNotice}>
          <Text style={styles.deadlineNoticeText}>
            Есть заказы, по которым нужно подтвердить готовность к сроку (за 2 дня до доставки).
          </Text>
        </View>
      ) : null}

      <View style={styles.searchRow}>
        <Input
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Поиск по коду заказа, компании, адресу..."
          style={styles.searchInput}
          onSubmitEditing={handleSearch}
        />
        <Button title="Найти" onPress={handleSearch} />
      </View>

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

      {!loading && !error && data.items.length === 0 ? (
        <Text style={styles.empty}>Заказы не найдены</Text>
      ) : null}

      {!loading && !error && data.items.length > 0 ? (
        <View style={styles.grid}>
          {data.items.map((order) => (
            <OrderListCard key={order.id} order={order} onPress={openOrder} />
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
        <Pressable onPress={() => void loadOrders()}>
          <Text style={styles.refresh}>Обновить список</Text>
        </Pressable>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  deadlineNotice: {
    backgroundColor: '#fff4e5',
    borderColor: '#f0a500',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  deadlineNoticeText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: 200,
  },
  grid: {
    gap: 12,
    marginBottom: 8,
  },
  empty: {
    color: colors.textMuted,
    marginBottom: 16,
  },
  error: {
    color: colors.error,
    marginBottom: 16,
  },
  refresh: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
});
