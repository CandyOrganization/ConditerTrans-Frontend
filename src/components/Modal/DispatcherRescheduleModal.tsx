import { useState } from 'react';
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
import { CloseIcon } from '../Icons/Icons';
import { Button, FieldLabel, Input } from '../ui/Ui';
import { colors } from '../../theme/colors';

interface DispatcherRescheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: { newDeliveryDate: string; reason: string }) => Promise<void>;
}

export function DispatcherRescheduleModal({
  visible,
  onClose,
  onSubmit,
}: DispatcherRescheduleModalProps) {
  const [newDeliveryDate, setNewDeliveryDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const date = newDeliveryDate.trim();
    const reasonText = reason.trim();
    if (!date) {
      setError('Укажите новую дату поставки (YYYY-MM-DD)');
      return;
    }
    if (!reasonText) {
      setError('Укажите причину срыва сроков');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({ newDeliveryDate: date, reason: reasonText });
      setNewDeliveryDate('');
      setReason('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить запрос');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setNewDeliveryDate('');
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Пересогласование сроков</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <CloseIcon />
            </Pressable>
          </View>
          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.subtitle}>
              Заказ будет отправлен менеджеру на пересогласование условий.
            </Text>
            <FieldLabel>Новая предлагаемая дата поставки (YYYY-MM-DD):</FieldLabel>
            <Input
              value={newDeliveryDate}
              onChangeText={setNewDeliveryDate}
              placeholder="2026-06-15"
            />
            <FieldLabel>Причина срыва сроков:</FieldLabel>
            <Input
              value={reason}
              onChangeText={setReason}
              placeholder="Опишите причину для менеджера"
              multiline
              numberOfLines={3}
              style={styles.textArea}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>
          <View style={styles.footer}>
            <Button title="Отмена" variant="secondary" onPress={handleClose} disabled={submitting} />
            <Button
              title={submitting ? 'Отправка...' : 'Отправить менеджеру'}
              variant="danger"
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
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 },
  subtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  body: { padding: 16 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  error: { color: colors.error, marginTop: 8, fontSize: 13 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
