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
import type { UpdateProfileDto, UserProfile } from '../../types';
import { Button, FieldLabel, Input } from '../ui/Ui';
import { colors } from '../../theme/colors';

interface EditProfileModalProps {
  profile: UserProfile | null;
  onClose: () => void;
  onSubmit: (dto: UpdateProfileDto) => Promise<void>;
}

function profileToForm(profile: UserProfile): UpdateProfileDto {
  return {
    lastName: profile.lastName,
    firstName: profile.firstName,
    middleName: profile.middleName,
    phone: profile.phone,
    email: profile.email,
  };
}

export function EditProfileModal({ profile, onClose, onSubmit }: EditProfileModalProps) {
  const isOpen = profile !== null;
  const [form, setForm] = useState<UpdateProfileDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (profile) {
      setForm(profileToForm(profile));
      setEmailError('');
      setSubmitting(false);
    }
  }, [profile]);

  const update = <K extends keyof UpdateProfileDto>(key: K, value: UpdateProfileDto[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    if (key === 'email') setEmailError('');
  };

  const validateEmail = (email: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async () => {
    if (!form) return;
    if (!validateEmail(form.email)) {
      setEmailError('Введите корректный email');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
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
          <Text style={styles.title}>Редактирование данных</Text>

          {form && (
            <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
              <FieldLabel>Фамилия:</FieldLabel>
              <Input value={form.lastName} onChangeText={(v) => update('lastName', v)} />

              <FieldLabel>Имя:</FieldLabel>
              <Input value={form.firstName} onChangeText={(v) => update('firstName', v)} />

              <FieldLabel>Отчество:</FieldLabel>
              <Input value={form.middleName} onChangeText={(v) => update('middleName', v)} />

              <View style={styles.divider} />

              <FieldLabel>Контактный телефон:</FieldLabel>
              <Input
                value={form.phone}
                onChangeText={(v) => update('phone', v)}
                keyboardType="phone-pad"
              />

              <FieldLabel>Рабочая почта:</FieldLabel>
              <Input
                value={form.email}
                onChangeText={(v) => update('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
                style={emailError ? styles.inputError : undefined}
              />
              {emailError ? <Text style={styles.error}>{emailError}</Text> : null}
            </ScrollView>
          )}

          <View style={styles.footer}>
            <Button title="Отмена" variant="secondary" onPress={onClose} disabled={submitting} />
            <Button
              title={submitting ? 'Сохранение...' : 'Сохранить'}
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
    maxHeight: '85%',
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    color: colors.error,
    fontSize: 12,
    marginBottom: 8,
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
