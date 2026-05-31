import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchFreeTransportReport } from '../src/api/reports';
import { Header } from '../src/components/Header/Header';
import { Button, FieldLabel, Input, LoadingText, SectionTitle } from '../src/components/ui/Ui';
import { useAuth } from '../src/context/AuthContext';
import type { FreeTransportRow, ReportDateFilter } from '../src/types';
import { colors } from '../src/theme/colors';

export default function ReportsScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [rows, setRows] = useState<FreeTransportRow[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await fetchFreeTransportReport({ dateFrom: '', dateTo: '' });
      if (!cancelled) {
        setRows(data);
        setGenerated(true);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const handleGenerate = async () => {
    const filter: ReportDateFilter = { dateFrom, dateTo };
    setLoading(true);
    try {
      setRows(await fetchFreeTransportReport(filter));
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <LoadingText />;
  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header variant="app" />

      <ScrollView style={styles.main} contentContainerStyle={styles.content}>
        <SectionTitle>Анализ свободного транспорта</SectionTitle>

        <FieldLabel>Период с (YYYY-MM-DD):</FieldLabel>
        <Input value={dateFrom} onChangeText={setDateFrom} placeholder="2026-05-01" />

        <FieldLabel>по:</FieldLabel>
        <Input value={dateTo} onChangeText={setDateTo} placeholder="2026-05-28" />

        <Button
          title={loading ? 'Формирование...' : 'Сформировать'}
          onPress={handleGenerate}
          loading={loading}
          style={styles.generateBtn}
        />

        {generated && rows.map((row) => (
          <View key={`${row.driver}-${row.licensePlate}`} style={styles.card}>
            <Text style={styles.driver}>{row.driver}</Text>
            <Text style={styles.meta}>{row.vehicle} · {row.licensePlate}</Text>
            <Text style={styles.meta}>Город: {row.city}</Text>
            <Text style={styles.date}>Свободен с: {row.availableSince}</Text>
          </View>
        ))}

        {!generated && !loading && (
          <Text style={styles.hint}>Выберите период и нажмите «Сформировать»</Text>
        )}
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
  driver: {
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
});
