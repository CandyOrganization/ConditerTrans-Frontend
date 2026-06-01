import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { BellIcon, TruckIcon, UserIcon } from '../Icons/Icons';
import { colors } from '../../theme/colors';

const BRAND_NAME = 'КондитерТранс';

interface HeaderProps {
  variant?: 'dashboard' | 'app' | 'trip';
}

export function Header({ variant = 'dashboard' }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, isAdmin, userRole } = useAuth();
  const isDispatcher = userRole === 'Dispatcher';

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const isTripDetails =
    variant === 'trip' ||
    pathname.startsWith('/trip/') ||
    pathname.startsWith('/cargo/') ||
    pathname.startsWith('/order/');
  const showMainNav =
    variant === 'app' ||
    variant === 'dashboard' ||
    pathname === '/' ||
    pathname === '/reports' ||
    pathname === '/profile' ||
    pathname === '/employees';

  return (
    <View style={styles.header}>
      <View style={styles.inner}>
        <Pressable style={styles.logo} onPress={() => router.push('/')}>
          <TruckIcon size={28} />
          <Text style={styles.title}>{BRAND_NAME}</Text>
        </Pressable>

        {isTripDetails ? (
          <View style={styles.actions}>
            <Pressable style={styles.backBtn} onPress={() => router.push('/')}>
              <Text style={styles.backText}>← Назад</Text>
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <BellIcon />
              <View style={styles.dot} />
            </Pressable>
            <Pressable style={styles.avatarBtn} onPress={() => router.push('/profile')}>
              <UserIcon size={32} />
            </Pressable>
          </View>
        ) : showMainNav ? (
          <>
            <View style={styles.nav}>
              <NavLink href="/" label="Заказы" active={pathname === '/'} />
              {isAdmin ? (
                <NavLink
                  href="/employees"
                  label="Сотрудники"
                  active={pathname === '/employees'}
                />
              ) : null}
              {!isDispatcher ? (
                <NavLink href="/reports" label="Отчёты" active={pathname === '/reports'} />
              ) : null}
              <NavLink href="/profile" label="Профиль" active={pathname === '/profile'} />
            </View>
            <View style={styles.actions}>
              <Pressable style={styles.iconBtn}>
                <BellIcon />
                <View style={styles.dot} />
              </Pressable>
              <Pressable style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutText}>Выйти →</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.actions}>
            <Pressable style={styles.iconBtn}>
              <BellIcon />
              <View style={styles.dot} />
            </Pressable>
            <Pressable style={styles.avatarBtn} onPress={() => router.push('/profile')}>
              <UserIcon size={32} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push(href as never)}>
      <Text style={[styles.navLink, active && styles.navLinkActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  backText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  iconBtn: {
    padding: 6,
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  avatarBtn: {
    padding: 2,
  },
  nav: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  navLink: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  navLinkActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  logoutBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  logoutText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 13,
  },
});
