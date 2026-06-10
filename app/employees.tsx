import { useCallback, useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchCompanyDrivers, formatDriverLabel } from '../src/api/drivers';
import {
  fetchCompanyEmployees,
  formatEmployeeName,
  getUserRoleLabel,
  inviteEmployee,
} from '../src/api/users';
import { ApiError } from '../src/api/client';
import { Header } from '../src/components/Header/Header';
import { CreateEmployeeModal } from '../src/components/Modal/CreateEmployeeModal';
import { InviteSuccessModal } from '../src/components/Modal/InviteSuccessModal';
import { Button, LoadingText, SectionTitle } from '../src/components/ui/Ui';
import { useAuth } from '../src/context/AuthContext';
import type { CurrentUser, Driver } from '../src/types';
import { colors } from '../src/theme/colors';

export default function EmployeesScreen() {
  const { isAuthenticated, isAdmin, userRole, loading: authLoading } = useAuth();
  const isCoordinator = userRole === 'Coordinator';
  const [employees, setEmployees] = useState<CurrentUser[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const showDriversOnly = isCoordinator && !isAdmin;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<{ inviteId: string; email: string } | null>(
    null,
  );

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (showDriversOnly) {
        setDrivers(await fetchCompanyDrivers());
        setEmployees([]);
        return;
      }

      setDrivers([]);
      setEmployees(await fetchCompanyEmployees());
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError(
          isCoordinator
            ? 'Недостаточно прав для просмотра водителей'
            : 'Недостаточно прав для просмотра сотрудников',
        );
      } else {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить сотрудников');
      }
      setEmployees([]);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, [showDriversOnly, isCoordinator]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isAdmin && !isCoordinator) return;
    void loadEmployees();
  }, [isAdmin, isAuthenticated, isCoordinator, loadEmployees]);

  const handleCreate = async (dto: Parameters<typeof inviteEmployee>[0]) => {
    const { inviteId } = await inviteEmployee(dto);
    setInviteSuccess({ inviteId, email: dto.email });
    await loadEmployees();
  };

  if (authLoading) {
    return <LoadingText />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!isAdmin && !isCoordinator) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header variant="app" />

      <ScrollView style={styles.main} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <SectionTitle>
            {showDriversOnly ? 'Водители' : 'Сотрудники организации'}
          </SectionTitle>
          {isAdmin ? <Button title="+ Добавить" onPress={() => setModalOpen(true)} /> : null}
        </View>

        {loading ? <LoadingText /> : null}

        {!loading && error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && !error && showDriversOnly && drivers.length === 0 ? (
          <Text style={styles.empty}>
            Водители не найдены. Добавьте водителя через администратора компании и зарегистрируйте
            ТС.
          </Text>
        ) : null}

        {!loading && !error && !showDriversOnly && employees.length === 0 ? (
          <Text style={styles.empty}>Сотрудники не найдены</Text>
        ) : null}

        {!loading && !error && showDriversOnly
          ? drivers.map((driver) => (
              <View key={driver.id} style={styles.card}>
                <Text style={styles.name}>{formatDriverLabel(driver)}</Text>
                <Text style={styles.meta}>{driver.phone}</Text>
                {driver.employeeNumber ? (
                  <Text style={styles.meta}>Таб. № {driver.employeeNumber}</Text>
                ) : null}
              </View>
            ))
          : null}

        {!loading && !error && !showDriversOnly
          ? employees.map((employee) => (
              <View key={employee.id} style={styles.card}>
                <Text style={styles.name}>{formatEmployeeName(employee)}</Text>
                <Text style={styles.meta}>{employee.email}</Text>
                <Text style={styles.meta}>
                  {getUserRoleLabel(employee.userRole)}
                  {employee.isAdmin ? ' · Администратор' : ''}
                </Text>
                {employee.employee?.phone ? (
                  <Text style={styles.meta}>{employee.employee.phone}</Text>
                ) : null}
                {employee.employee?.employeeNumber ? (
                  <Text style={styles.meta}>Таб. № {employee.employee.employeeNumber}</Text>
                ) : null}
              </View>
            ))
          : null}
      </ScrollView>

      <CreateEmployeeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        showRolePicker={userRole === 'Coordinator' || userRole === 'Dispatcher'}
        defaultUserRole={userRole === 'Dispatcher' ? 'Dispatcher' : 'Coordinator'}
        allowedRoles={
          userRole === 'Dispatcher'
            ? ['Dispatcher']
            : ['Coordinator', 'Driver']
        }
      />

      {inviteSuccess ? (
        <InviteSuccessModal
          isOpen
          inviteId={inviteSuccess.inviteId}
          email={inviteSuccess.email}
          onClose={() => setInviteSuccess(null)}
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
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  empty: {
    color: colors.textMuted,
  },
  error: {
    color: colors.error,
  },
});
