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

interface DispatcherRejectModalProps {
  visible: boolean;
  orderLabel: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export function DispatcherRejectModal({
  visible,
  orderLabel,
  onClose,
  onSubmit,
}: DispatcherRejectModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Укажите причину отказа');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setReason('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отклонить заказ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
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
            <Text style={styles.title}>Отказ от заказа</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <CloseIcon />
            </Pressable>
          </View>
          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.subtitle}>
              {orderLabel}. Заказ будет переведён в статус «Отклонён», причина уйдёт менеджеру по
              закупкам.
            </Text>
            <FieldLabel>Причина отказа (обязательно):</FieldLabel>
            <Input
              value={reason}
              onChangeText={setReason}
              placeholder="Например: нехватка сырья на складе"
              multiline
              numberOfLines={4}
              style={styles.textArea}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>
          <View style={styles.footer}>
            <Button title="Отмена" variant="secondary" onPress={handleClose} disabled={submitting} />
            <Button
              title={submitting ? 'Отправка...' : 'Подтвердить отказ'}
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
  subtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 16, lineHeight: 20 },
  body: { padding: 16 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
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
