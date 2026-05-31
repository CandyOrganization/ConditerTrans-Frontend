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
import type { CreateApplicationDto } from '../../types';
import { CloseIcon } from '../Icons/Icons';
import { Button, FieldLabel, Input } from '../ui/Ui';
import { colors } from '../../theme/colors';

const EMPTY_FORM: CreateApplicationDto = {
  from: '',
  to: '',
  weight: '',
  dimensions: '',
  price: '',
  loadingDate: '2025-06-03',
  deliveryDate: '',
  specialConditions: '',
};

interface CreateApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateApplicationDto) => Promise<void>;
}

export function CreateApplicationModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateApplicationModalProps) {
  const [form, setForm] = useState<CreateApplicationDto>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setSubmitting(false);
    }
  }, [isOpen]);

  const update = <K extends keyof CreateApplicationDto>(
    key: K,
    value: CreateApplicationDto[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.from || !form.to || !form.weight || !form.dimensions || !form.price || !form.deliveryDate) {
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
          <View style={styles.header}>
            <Text style={styles.title}>Создание Новой Заявки</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <CloseIcon />
            </Pressable>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            <FieldLabel>Адрес откуда:</FieldLabel>
            <Input value={form.from} onChangeText={(v) => update('from', v)} />

            <FieldLabel>Адрес куда:</FieldLabel>
            <Input value={form.to} onChangeText={(v) => update('to', v)} />

            <View style={styles.row}>
              <View style={styles.half}>
                <FieldLabel>Вес (кг):</FieldLabel>
                <Input
                  value={form.weight}
                  onChangeText={(v) => update('weight', v)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.half}>
                <FieldLabel>Габариты (ДхШхВ м):</FieldLabel>
                <Input
                  value={form.dimensions}
                  onChangeText={(v) => update('dimensions', v)}
                  placeholder="например, 3x2x2"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <FieldLabel>Стоимость (руб.):</FieldLabel>
                <Input
                  value={form.price}
                  onChangeText={(v) => update('price', v)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.half}>
                <FieldLabel>Дата загрузки:</FieldLabel>
                <Input
                  value={form.loadingDate}
                  onChangeText={(v) => update('loadingDate', v)}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>

            <FieldLabel>Ожидаемая дата доставки:</FieldLabel>
            <Input
              value={form.deliveryDate}
              onChangeText={(v) => update('deliveryDate', v)}
              placeholder="YYYY-MM-DD"
            />

            <FieldLabel>Специальные условия:</FieldLabel>
            <Input
              value={form.specialConditions}
              onChangeText={(v) => update('specialConditions', v)}
              multiline
              numberOfLines={3}
              style={styles.textarea}
              placeholder="например, Хрупкий груз"
            />
          </ScrollView>

          <View style={styles.footer}>
            <Button title="Отмена" variant="secondary" onPress={onClose} disabled={submitting} />
            <Button
              title={submitting ? 'Создание...' : 'Создать Заявку'}
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
    flex: 1,
  },
  body: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
    marginBottom: 8,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
