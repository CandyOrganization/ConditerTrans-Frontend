import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  changePassword,
  fetchUserProfile,
  formatFullName,
  getProfileInitials,
  updateUserProfile,
} from '../src/api/profile';
import { Header } from '../src/components/Header/Header';
import { ChangePasswordModal } from '../src/components/Modal/ChangePasswordModal';
import { EditProfileModal } from '../src/components/Modal/EditProfileModal';
import { Button, LoadingText, SectionTitle } from '../src/components/ui/Ui';
import { useAuth } from '../src/context/AuthContext';
import type { ChangePasswordDto, UpdateProfileDto, UserProfile } from '../src/types';
import { colors } from '../src/theme/colors';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchUserProfile();
        if (!cancelled) {
          setProfile(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Не удалось загрузить профиль');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const handleSaveProfile = async (dto: UpdateProfileDto) => {
    setProfile(await updateUserProfile(dto));
  };

  const handleChangePassword = async (dto: ChangePasswordDto) => {
    await changePassword(dto);
    setError(null);
  };

  if (authLoading) return <LoadingText />;
  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header variant="app" />

      <ScrollView style={styles.main} contentContainerStyle={styles.content}>
        <SectionTitle>Настройки профиля</SectionTitle>

        {loading ? (
          <LoadingText />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : !profile ? (
          <LoadingText />
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getProfileInitials(profile)}</Text>
              </View>
              <Text style={styles.name}>{formatFullName(profile)}</Text>
              <Text style={styles.role}>{profile.role}</Text>

              <Button
                title="Редактировать профиль"
                onPress={() => setEditingProfile(profile)}
                fullWidth
                style={styles.btn}
              />
              <Button
                title="Изменить пароль"
                variant="danger"
                onPress={() => setPasswordModalOpen(true)}
                fullWidth
              />
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Служебная информация</Text>
              <InfoRow label="Табельный номер" value={profile.personnelNumber} />
              <InfoRow label="Телефон" value={profile.phone} />
              <InfoRow label="Рабочая почта" value={profile.email} />
              <InfoRow label="Дата регистрации" value={profile.registrationDate} />
            </View>
          </>
        )}
      </ScrollView>

      <EditProfileModal
        profile={editingProfile}
        onClose={() => setEditingProfile(null)}
        onSubmit={handleSaveProfile}
      />

      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSubmit={handleChangePassword}
      />
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8EDF2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#94A3B8',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  role: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  btn: {
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    width: 140,
    fontSize: 13,
    color: colors.textMuted,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  error: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
