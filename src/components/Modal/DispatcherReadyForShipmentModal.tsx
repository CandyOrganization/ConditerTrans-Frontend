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

interface DispatcherReadyForShipmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (shipmentDate: string) => Promise<void>;
}

export function DispatcherReadyForShipmentModal({
  visible,
  onClose,
  onSubmit,
}: DispatcherReadyForShipmentModalProps) {
  const [shipmentDate, setShipmentDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const date = shipmentDate.trim();
    if (!date) {
      setError('Укажите дату (YYYY-MM-DD)');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(date);
      setShipmentDate('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось подтвердить готовность');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setShipmentDate('');
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
            <Text style={styles.title}>Подтверждение готовности</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <CloseIcon />
            </Pressable>
          </View>
          <ScrollView style={styles.body}>
            <Text style={styles.subtitle}>
              Заказ будет передан в пул активных заявок для логистов.
            </Text>
            <FieldLabel>Фактическая дата передачи груза (YYYY-MM-DD):</FieldLabel>
            <Input
              value={shipmentDate}
              onChangeText={setShipmentDate}
              placeholder="2026-06-01"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>
          <View style={styles.footer}>
            <Button title="Отмена" variant="secondary" onPress={handleClose} disabled={submitting} />
            <Button
              title={submitting ? 'Сохранение...' : 'Подтвердить готовность'}
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
    maxHeight: '70%',
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
