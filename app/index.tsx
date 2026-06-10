import { useCallback, useEffect, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchApplicationsPaged, processApplication } from '../src/api/applications';
import {
  fetchCoordinatorActiveCargosPaged,
  fetchDriverActiveCargosPaged,
  formatCargoShortId,
  mapCargoToTrip,
} from '../src/api/cargo';
import { DispatcherPagination } from '../src/components/Dispatcher/DispatcherPagination';
import { fetchTrips } from '../src/api/trips';
import { ApiError } from '../src/api/client';
import type {
  Application,
  PaginatedTrips,
  ProcessApplicationDto,
  Trip,
  TripStatus,
} from '../src/types';
import { ApplicationCard } from '../src/components/ApplicationCard/ApplicationCard';
import { DispatcherOrdersPanel } from '../src/components/Dispatcher/DispatcherOrdersPanel';
import { ManagerOrderHistoryPanel } from '../src/components/Manager/ManagerOrderHistoryPanel';
import { ProcessApplicationModal } from '../src/components/Modal/ProcessApplicationModal';
import { Header } from '../src/components/Header/Header';
import { TripTable } from '../src/components/TripTable/TripTable';
import { LoadingText, SectionTitle } from '../src/components/ui/Ui';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/theme/colors';

export default function DashboardScreen() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, userRole } = useAuth();
  const isCoordinator = userRole === 'Coordinator';
  const isDriver = userRole === 'Driver';
  const isDispatcher = userRole === 'Dispatcher';
  const isManager = userRole === 'Manager';

  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationsTotal, setApplicationsTotal] = useState(0);
  const [applicationsPage, setApplicationsPage] = useState(1);
  const [applicationsPageSize, setApplicationsPageSize] = useState(20);
  const [applicationsTotalPages, setApplicationsTotalPages] = useState(0);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [activeTripsTotal, setActiveTripsTotal] = useState(0);
  const [activeTripsPage, setActiveTripsPage] = useState(1);
  const [activeTripsPageSize, setActiveTripsPageSize] = useState(20);
  const [activeTripsTotalPages, setActiveTripsTotalPages] = useState(0);
  const [trips, setTrips] = useState<PaginatedTrips | null>(null);
  const [loading, setLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState('');
  const [activeTripsError, setActiveTripsError] = useState('');
  const [processingApplication, setProcessingApplication] = useState<Application | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TripStatus | 'all'>('all');
  const [page, setPage] = useState(1);

  const loadApplications = useCallback(async () => {
    if (!isCoordinator) {
      setApplications([]);
      setApplicationsTotal(0);
      return;
    }

    setApplicationsError('');
    try {
      const response = await fetchApplicationsPaged({
        page: applicationsPage,
        pageSize: applicationsPageSize,
      });
      setApplications(response.applications);
      setApplicationsTotal(response.total);
      setApplicationsTotalPages(
        response.totalPages > 0
          ? response.totalPages
          : response.total > 0
            ? Math.ceil(response.total / response.pageSize)
            : 0,
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setApplicationsError('Недостаточно прав для просмотра заказов');
      } else {
        setApplicationsError(err instanceof Error ? err.message : 'Не удалось загрузить заказы');
      }
      setApplications([]);
      setApplicationsTotal(0);
      setApplicationsTotalPages(0);
    }
  }, [isCoordinator, applicationsPage, applicationsPageSize]);

  const loadActiveTrips = useCallback(async () => {
    if (isCoordinator) {
      setActiveTripsError('');
      try {
        const response = await fetchCoordinatorActiveCargosPaged({
          page: activeTripsPage,
          pageSize: activeTripsPageSize,
        });
        setActiveTrips(response.items.map(mapCargoToTrip));
        setActiveTripsTotal(response.total);
        setActiveTripsTotalPages(
          response.totalPages > 0
            ? response.totalPages
            : response.total > 0
              ? Math.ceil(response.total / response.pageSize)
              : 0,
        );
      } catch (err) {
        setActiveTripsError(
          err instanceof Error ? err.message : 'Не удалось загрузить активные рейсы',
        );
        setActiveTrips([]);
        setActiveTripsTotal(0);
        setActiveTripsTotalPages(0);
      }
      return;
    }

    if (isDriver) {
      setActiveTripsError('');
      try {
        const response = await fetchDriverActiveCargosPaged({
          page: activeTripsPage,
          pageSize: activeTripsPageSize,
        });
        setActiveTrips(
          response.items.map((cargo) => ({
            id: cargo.id,
            route: cargo.deliveryAddress,
            client: cargo.orderNumber ? `Заказ №${cargo.orderNumber}` : 'Груз',
            driver: 'Вы',
            vehicle: `${cargo.volume} м³`,
            status: cargo.status === 'PickedUpFromProduction' ? 'in_transit' : 'awaiting',
            loadingDate: new Date(cargo.loadingDate).toLocaleDateString('ru-RU'),
          })),
        );
        setActiveTripsTotal(response.total);
        setActiveTripsTotalPages(
          response.totalPages > 0
            ? response.totalPages
            : response.total > 0
              ? Math.ceil(response.total / response.pageSize)
              : 0,
        );
      } catch (err) {
        setActiveTripsError(
          err instanceof Error ? err.message : 'Не удалось загрузить активные рейсы',
        );
        setActiveTrips([]);
        setActiveTripsTotal(0);
        setActiveTripsTotalPages(0);
      }
      return;
    }

    setActiveTrips([]);
    setActiveTripsTotal(0);
  }, [isCoordinator, isDriver, activeTripsPage, activeTripsPageSize]);

  const loadTrips = useCallback(async () => {
    if (isCoordinator || isDriver || isDispatcher || isManager) {
      setTrips(null);
      return;
    }

    setTrips(
      await fetchTrips({
        search,
        status: statusFilter,
        page,
        pageSize: 5,
      }),
    );
  }, [isCoordinator, isDriver, isDispatcher, isManager, search, statusFilter, page]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      await Promise.all([loadApplications(), loadActiveTrips(), loadTrips()]);
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, loadApplications, loadActiveTrips, loadTrips]);

  const handleProcessSubmit = async (id: string, payload: ProcessApplicationDto) => {
    await processApplication(id, payload);
    await Promise.all([loadApplications(), loadActiveTrips()]);
  };

  if (authLoading) {
    return <LoadingText />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const showActiveTrips = isCoordinator || isDriver;

  if (isDispatcher) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header />
        <ScrollView style={styles.main} contentContainerStyle={styles.content}>
          <DispatcherOrdersPanel />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isManager) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header />
        <ScrollView style={styles.main} contentContainerStyle={styles.content}>
          <ManagerOrderHistoryPanel />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header />

      <ScrollView style={styles.main} contentContainerStyle={styles.content}>
        {loading ? (
          <LoadingText />
        ) : (
          <>
            {isCoordinator ? (
              <>
                <SectionTitle>Заказы к обработке ({applicationsTotal})</SectionTitle>
                {applicationsError ? (
                  <Text style={styles.error}>{applicationsError}</Text>
                ) : null}
                {!applicationsError && applications.length === 0 ? (
                  <Text style={styles.empty}>
                    Нет грузов, ожидающих назначения логистической компании
                  </Text>
                ) : null}
                {!applicationsError && applications.length > 0 ? (
                  <View style={styles.grid}>
                    {applications.map((app) => (
                      <ApplicationCard
                        key={app.id}
                        application={app}
                        onProcess={setProcessingApplication}
                      />
                    ))}
                  </View>
                ) : null}
                <DispatcherPagination
                  page={applicationsPage}
                  pageSize={applicationsPageSize}
                  total={applicationsTotal}
                  totalPages={applicationsTotalPages}
                  onPageChange={setApplicationsPage}
                  onPageSizeChange={(size) => {
                    setApplicationsPageSize(size);
                    setApplicationsPage(1);
                  }}
                />
              </>
            ) : null}

            {showActiveTrips ? (
              <>
                <SectionTitle>Активные рейсы ({activeTripsTotal})</SectionTitle>
                {activeTripsError ? <Text style={styles.error}>{activeTripsError}</Text> : null}
                {!activeTripsError && activeTrips.length === 0 ? (
                  <Text style={styles.empty}>Нет активных рейсов</Text>
                ) : null}
                {!activeTripsError && activeTrips.length > 0 ? (
                  <View style={styles.grid}>
                    {activeTrips.map((trip) => (
                      <Pressable
                        key={trip.id}
                        style={({ pressed }) => [styles.tripCard, pressed && styles.tripCardPressed]}
                        onPress={() =>
                          router.push({
                            pathname: '/cargo/[cargoId]',
                            params: isDriver
                              ? { cargoId: trip.id, mode: 'driver' }
                              : { cargoId: trip.id },
                          })
                        }
                      >
                        <Text style={styles.tripTitle}>{trip.route}</Text>
                        <Text style={styles.tripMeta}>{trip.client}</Text>
                        <Text style={styles.tripMeta}>#{formatCargoShortId(trip.id)}</Text>
                        {isCoordinator ? (
                          <Text style={styles.tripMeta}>Водитель: {trip.driver}</Text>
                        ) : null}
                        <Text style={styles.tripMeta}>Погрузка: {trip.loadingDate}</Text>
                        <Text style={styles.tripLink}>
                          {isDriver ? 'Открыть маршрут и GPS →' : 'Открыть карту →'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                <DispatcherPagination
                  page={activeTripsPage}
                  pageSize={activeTripsPageSize}
                  total={activeTripsTotal}
                  totalPages={activeTripsTotalPages}
                  onPageChange={setActiveTripsPage}
                  onPageSizeChange={(size) => {
                    setActiveTripsPageSize(size);
                    setActiveTripsPage(1);
                  }}
                />
              </>
            ) : null}

            {!isCoordinator && !isDriver && trips ? (
              <TripTable
                data={trips}
                search={search}
                statusFilter={statusFilter}
                onSearchChange={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
                onStatusFilterChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
                onPageChange={setPage}
              />
            ) : null}
          </>
        )}
      </ScrollView>

      {isCoordinator ? (
        <ProcessApplicationModal
          application={processingApplication}
          onClose={() => setProcessingApplication(null)}
          onSubmit={handleProcessSubmit}
        />
      ) : null}
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
  tripCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  tripCardPressed: {
    opacity: 0.85,
  },
  tripTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  tripMeta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  tripLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
});
