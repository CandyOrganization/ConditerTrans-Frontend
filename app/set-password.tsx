import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { EyeIcon, EyeOffIcon, TruckIcon } from '../src/components/Icons/Icons';
import { Button, FieldLabel, Input, LoadingText } from '../src/components/ui/Ui';
import { colors } from '../src/theme/colors';

export default function SetPasswordScreen() {
  const { inviteId: inviteIdParam } = useLocalSearchParams<{ inviteId?: string | string[] }>();
  const inviteId = Array.isArray(inviteIdParam) ? inviteIdParam[0] : inviteIdParam;

  const { completeInvitation, loading: authLoading } = useAuth();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (authLoading) {
    return <LoadingText />;
  }

  const handleSubmit = async () => {
    if (!inviteId) {
      setError('Некорректная ссылка приглашения');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await completeInvitation({ inviteId, password });
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось установить пароль');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.brand}>
              <TruckIcon size={32} />
              <Text style={styles.brandTitle}>КондитерТранс</Text>
            </View>

            <Text style={styles.heading}>Установка пароля</Text>
            <Text style={styles.subtitle}>
              Задайте пароль для входа в систему. После сохранения вы сразу попадёте в приложение.
            </Text>

            {!inviteId ? (
              <Text style={styles.error}>
                Ссылка приглашения недействительна. Попросите администратора отправить новую.
              </Text>
            ) : (
              <>
                <FieldLabel>Новый пароль:</FieldLabel>
                <View style={styles.passwordWrap}>
                  <Input
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      setError('');
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    style={styles.passwordInput}
                  />
                  <Pressable
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </Pressable>
                </View>

                <FieldLabel>Подтверждение пароля:</FieldLabel>
                <View style={styles.passwordWrap}>
                  <Input
                    value={confirmPassword}
                    onChangeText={(v) => {
                      setConfirmPassword(v);
                      setError('');
                    }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    style={styles.passwordInput}
                  />
                  <Pressable
                    style={styles.eyeBtn}
                    onPress={() => setShowConfirmPassword((v) => !v)}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </Pressable>
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Button
                  title={submitting ? 'Сохранение...' : 'Установить пароль'}
                  onPress={handleSubmit}
                  loading={submitting}
                  fullWidth
                  style={styles.submit}
                />
              </>
            )}

            <Button
              title="Уже есть аккаунт — войти"
              onPress={() => router.replace('/login')}
              variant="secondary"
              fullWidth
              style={styles.loginBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 20,
  },
  passwordWrap: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeBtn: {
    position: 'absolute',
    right: 10,
    top: 10,
    padding: 4,
  },
  error: {
    color: colors.error,
    fontSize: 13,
    marginTop: 8,
    marginBottom: 4,
  },
  submit: {
    marginTop: 16,
  },
  loginBtn: {
    marginTop: 12,
  },
});
