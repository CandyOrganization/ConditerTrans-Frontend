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
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { EyeIcon, EyeOffIcon, TruckIcon } from '../src/components/Icons/Icons';
import { Button, FieldLabel, Input, LoadingText } from '../src/components/ui/Ui';
import { colors } from '../src/theme/colors';

export default function LoginScreen() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (authLoading) {
    return <LoadingText />;
  }

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await login({ email, password });
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
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

            <Text style={styles.heading}>Вход в систему</Text>

            <FieldLabel>Email:</FieldLabel>
            <Input
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setError('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            <FieldLabel>Пароль:</FieldLabel>
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

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              title={submitting ? 'Вход...' : 'Войти'}
              onPress={handleSubmit}
              loading={submitting}
              fullWidth
              style={styles.submit}
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
  testBtn: {
    marginTop: 12,
  },
  testHint: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
});
