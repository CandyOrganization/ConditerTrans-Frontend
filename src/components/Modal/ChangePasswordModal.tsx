import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ChangePasswordDto } from '../../types';
import { Button, FieldLabel, Input } from '../ui/Ui';
import { colors } from '../../theme/colors';

const EMPTY_FORM: ChangePasswordDto = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: ChangePasswordDto) => Promise<void>;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  onSubmit,
}: ChangePasswordModalProps) {
  const [form, setForm] = useState<ChangePasswordDto>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setError('');
      setSubmitting(false);
    }
  }, [isOpen]);

  const update = <K extends keyof ChangePasswordDto>(
    key: K,
    value: ChangePasswordDto[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    if (form.newPassword !== form.confirmPassword) {
      setError('Новый пароль и подтверждение не совпадают');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('Новый пароль должен быть не короче 6 символов');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обновить пароль');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modal}>
          <Text style={styles.title}>Изменение пароля</Text>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            <FieldLabel>Текущий пароль:</FieldLabel>
            <Input
              value={form.currentPassword}
              onChangeText={(v) => update('currentPassword', v)}
              secureTextEntry
              autoCapitalize="none"
            />

            <FieldLabel>Новый пароль:</FieldLabel>
            <Input
              value={form.newPassword}
              onChangeText={(v) => update('newPassword', v)}
              secureTextEntry
              autoCapitalize="none"
            />

            <FieldLabel>Подтвердите новый пароль:</FieldLabel>
            <Input
              value={form.confirmPassword}
              onChangeText={(v) => update('confirmPassword', v)}
              secureTextEntry
              autoCapitalize="none"
              style={error ? styles.inputError : undefined}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.footer}>
            <Button title="Отмена" variant="secondary" onPress={onClose} disabled={submitting} />
            <Button
              title={submitting ? 'Обновление...' : 'Обновить пароль'}
              onPress={handleSubmit}
              loading={submitting}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '75%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  body: {
    padding: 16,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    color: colors.error,
    fontSize: 13,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
