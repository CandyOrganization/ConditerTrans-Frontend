import { useState } from 'react';
import { Redirect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fetchDispatcherProductRatingReport,
  fetchDispatcherRejectionReport,
} from '../src/api/dispatcherReports';
import { fetchFreeTransportReport } from '../src/api/reports';
import { ApiError } from '../src/api/client';
import { Header } from '../src/components/Header/Header';
import { Button, FieldLabel, Input, LoadingText, SectionTitle } from '../src/components/ui/Ui';
import { useAuth } from '../src/context/AuthContext';
import type {
  FreeTransportRow,
  ProductRatingRow,
  RejectionReportRow,
  ReportDateFilter,
} from '../src/types';
import { colors } from '../src/theme/colors';

type DispatcherReportTab = 'refusals' | 'rating';

export default function ReportsScreen() {
  const { isAuthenticated, loading: authLoading, userRole } = useAuth();
  const isDispatcher = userRole === 'Dispatcher';
  const isCoordinator = userRole === 'Coordinator';

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState('');

  const [freeTransportRows, setFreeTransportRows] = useState<FreeTransportRow[]>([]);
  const [refusalRows, setRefusalRows] = useState<RejectionReportRow[]>([]);
  const [ratingRows, setRatingRows] = useState<ProductRatingRow[]>([]);
  const [dispatcherTab, setDispatcherTab] = useState<DispatcherReportTab>('refusals');

  const handleGenerateCoordinator = async () => {
    const filter: ReportDateFilter = { dateFrom, dateTo };
    setLoading(true);
    setError('');
    try {
      setFreeTransportRows(await fetchFreeTransportReport(filter));
      setGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сформировать отчёт');
      setFreeTransportRows([]);
      setGenerated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDispatcher = async () => {
    const filter: ReportDateFilter = { dateFrom, dateTo };
    setLoading(true);
    setError('');
    try {
      if (dispatcherTab === 'refusals') {
        setRefusalRows(await fetchDispatcherRejectionReport(filter));
        setRatingRows([]);
      } else {
        setRatingRows(await fetchDispatcherProductRatingReport(filter));
        setRefusalRows([]);
      }
      setGenerated(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError('Недостаточно прав для отчётов диспетчера');
      } else {
        setError(err instanceof Error ? err.message : 'Не удалось сформировать отчёт');
      }
      setRefusalRows([]);
      setRatingRows([]);
      setGenerated(false);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <LoadingText />;
  if (!isAuthenticated) return <Redirect href="/login" />;

  if (!isDispatcher && !isCoordinator) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header variant="app" />

      <ScrollView style={styles.main} contentContainerStyle={styles.content}>
        <SectionTitle>{isDispatcher ? 'Отчёты диспетчера' : 'Анализ свободного транспорта'}</SectionTitle>

        {isDispatcher ? (
          <View style={styles.tabs}>
            <TabButton
              label="Статистика отказов"
              active={dispatcherTab === 'refusals'}
              onPress={() => {
                setDispatcherTab('refusals');
                setGenerated(false);
                setError('');
              }}
            />
            <TabButton
              label="Рейтинг продукции"
              active={dispatcherTab === 'rating'}
              onPress={() => {
                setDispatcherTab('rating');
                setGenerated(false);
                setError('');
              }}
            />
          </View>
        ) : null}

        {isDispatcher && dispatcherTab === 'refusals' ? (
          <Text style={styles.hintBlock}>
            Учитываются заказы со статусом «Отклонён» за выбранный период, группировка по причине
            отказа.
          </Text>
        ) : null}

        {isDispatcher && dispatcherTab === 'rating' ? (
          <Text style={styles.hintBlock}>
            Топ товаров по числу подтверждённых заказов за период (статус «Подтверждён»).
          </Text>
        ) : null}

        <FieldLabel>Период с (YYYY-MM-DD):</FieldLabel>
        <Input value={dateFrom} onChangeText={setDateFrom} placeholder="2026-05-01" />

        <FieldLabel>по:</FieldLabel>
        <Input value={dateTo} onChangeText={setDateTo} placeholder="2026-05-28" />

        <Button
          title={loading ? 'Формирование...' : 'Сформировать'}
          onPress={isDispatcher ? handleGenerateDispatcher : handleGenerateCoordinator}
          loading={loading}
          style={styles.generateBtn}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {isDispatcher && generated && dispatcherTab === 'refusals'
          ? refusalRows.length > 0
            ? refusalRows.map((row) => (
                <View key={row.reason} style={styles.card}>
                  <Text style={styles.cardTitleText}>{row.reason}</Text>
                  <Text style={styles.meta}>
                    Заказов: {row.orderCount} · Доля: {row.sharePercent}%
                  </Text>
                </View>
              ))
            : (
                <Text style={styles.empty}>За период отказов не найдено</Text>
              )
          : null}

        {isDispatcher && generated && dispatcherTab === 'rating'
          ? ratingRows.length > 0
            ? ratingRows.map((row) => (
                <View key={`${row.rank}-${row.name}`} style={styles.card}>
                  <Text style={styles.cardTitleText}>
                    {row.rank}. {row.name}
                  </Text>
                  <Text style={styles.meta}>Заказов: {row.orderCount}</Text>
                </View>
              ))
            : (
                <Text style={styles.empty}>За период подтверждённых заказов не найдено</Text>
              )
          : null}

        {isCoordinator && generated
          ? freeTransportRows.length > 0
            ? freeTransportRows.map((row) => (
                <View key={`${row.driver}-${row.licensePlate}`} style={styles.card}>
                  <Text style={styles.cardTitleText}>{row.driver}</Text>
                  <Text style={styles.meta}>
                    {row.vehicle} · {row.licensePlate}
                  </Text>
                  <Text style={styles.meta}>Город: {row.city}</Text>
                  <Text style={styles.date}>Свободен с: {row.availableSince}</Text>
                </View>
              ))
            : (
                <Text style={styles.empty}>Свободный транспорт не найден</Text>
              )
          : null}

        {!generated && !loading && !error && (
          <Text style={styles.hint}>Выберите период и нажмите «Сформировать»</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
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
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: '#fff',
  },
  hintBlock: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 12,
    lineHeight: 18,
  },
  generateBtn: {
    marginVertical: 16,
    alignSelf: 'flex-start',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitleText: {
    fontSize: 15,
    fontWeight: '700',
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
  hint: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
  error: {
    color: colors.error,
    marginBottom: 8,
  },
});
