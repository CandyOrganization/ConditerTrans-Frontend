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
import { Picker } from '@react-native-picker/picker';
import type { CreateEmployeeDto, UserRole } from '../../types';
import { CloseIcon } from '../Icons/Icons';
import { Button, FieldLabel, Input } from '../ui/Ui';
import { colors } from '../../theme/colors';

const EMPTY_FORM: CreateEmployeeDto = {
  name: '',
  surname: '',
  patronymic: '',
  phone: '',
  employeeNumber: '',
  email: '',
  userRole: 'Coordinator',
};

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateEmployeeDto) => Promise<void>;
  showRolePicker: boolean;
  defaultUserRole?: UserRole;
  allowedRoles?: UserRole[];
}

export function CreateEmployeeModal({
  isOpen,
  onClose,
  onSubmit,
  showRolePicker,
  defaultUserRole = 'Coordinator',
  allowedRoles = ['Coordinator', 'Driver'],
}: CreateEmployeeModalProps) {
  const [form, setForm] = useState<CreateEmployeeDto>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm({
        ...EMPTY_FORM,
        userRole: defaultUserRole,
      });
      setSubmitting(false);
      setError('');
    }
  }, [isOpen, defaultUserRole]);

  const update = <K extends keyof CreateEmployeeDto>(
    key: K,
    value: CreateEmployeeDto[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.surname ||
      !form.phone ||
      !form.employeeNumber ||
      !form.email
    ) {
      setError('Заполните все обязательные поля');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось добавить сотрудника');
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
          <View style={styles.header}>
            <Text style={styles.title}>Добавить сотрудника</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <CloseIcon />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.form}>
            <FieldLabel>Фамилия *</FieldLabel>
            <Input value={form.surname} onChangeText={(v) => update('surname', v)} />

            <FieldLabel>Имя *</FieldLabel>
            <Input value={form.name} onChangeText={(v) => update('name', v)} />

            <FieldLabel>Отчество</FieldLabel>
            <Input value={form.patronymic} onChangeText={(v) => update('patronymic', v)} />

            <FieldLabel>Телефон *</FieldLabel>
            <Input
              value={form.phone}
              onChangeText={(v) => update('phone', v)}
              keyboardType="phone-pad"
              placeholder="+79991234567"
            />

            <FieldLabel>Табельный номер (10 цифр) *</FieldLabel>
            <Input
              value={form.employeeNumber}
              onChangeText={(v) => update('employeeNumber', v)}
              keyboardType="number-pad"
              maxLength={10}
            />

            <FieldLabel>Email *</FieldLabel>
            <Input
              value={form.email}
              onChangeText={(v) => update('email', v)}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {showRolePicker ? (
              <>
                <FieldLabel>Роль *</FieldLabel>
                <View style={styles.pickerWrap}>
                  <Picker
                    selectedValue={form.userRole}
                    onValueChange={(value) => update('userRole', value as UserRole)}
                  >
                    {allowedRoles.includes('Coordinator') ? (
                      <Picker.Item label="Логист-координатор" value="Coordinator" />
                    ) : null}
                    {allowedRoles.includes('Driver') ? (
                      <Picker.Item label="Водитель" value="Driver" />
                    ) : null}
                    {allowedRoles.includes('Dispatcher') ? (
                      <Picker.Item label="Диспетчер производства" value="Dispatcher" />
                    ) : null}
                  </Picker>
                </View>
              </>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              title={submitting ? 'Отправка...' : 'Отправить приглашение'}
              onPress={handleSubmit}
              loading={submitting}
              fullWidth
            />
          </ScrollView>
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
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  form: {
    padding: 16,
    gap: 8,
    paddingBottom: 32,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  error: {
    color: colors.error,
    fontSize: 13,
  },
});
