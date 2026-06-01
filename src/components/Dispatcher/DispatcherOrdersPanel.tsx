import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fetchDispatcherOrders } from '../../api/dispatcherOrders';
import { ApiError } from '../../api/client';
import type { DispatcherOrderListItem } from '../../types';
import { OrderListCard } from '../Order/OrderListCard';
import { Button, Input, LoadingText, SectionTitle } from '../ui/Ui';
import { colors } from '../../theme/colors';

export function DispatcherOrdersPanel() {
  const router = useRouter();
  const [orders, setOrders] = useState<DispatcherOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const loadOrders = useCallback(async () => {
    setError('');
    try {
      setOrders(await fetchDispatcherOrders({ search: appliedSearch }));
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError('Недостаточно прав для просмотра заказов');
      } else {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить заказы');
      }
      setOrders([]);
    }
  }, [appliedSearch]);

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

  const handleSearch = () => {
    setAppliedSearch(searchInput.trim());
  };

  const openOrder = (order: DispatcherOrderListItem) => {
    router.push({
      pathname: '/order/[orderId]',
      params: { orderId: order.id },
    });
  };

  return (
    <>
      <SectionTitle>Список заказов ({orders.length})</SectionTitle>

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

      {loading ? <LoadingText /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && !error && orders.length === 0 ? (
        <Text style={styles.empty}>Заказы не найдены</Text>
      ) : null}

      {!loading && !error && orders.length > 0 ? (
        <View style={styles.grid}>
          {orders.map((order) => (
            <OrderListCard key={order.id} order={order} onPress={openOrder} />
          ))}
        </View>
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: 200,
  },
  grid: {
    gap: 12,
    marginBottom: 16,
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
