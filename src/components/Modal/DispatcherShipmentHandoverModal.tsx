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
import { Button } from '../ui/Ui';
import { colors } from '../../theme/colors';

interface DispatcherShipmentHandoverModalProps {
  visible: boolean;
  vehicleLabel?: string | null;
  driverLabel?: string | null;
  onClose: () => void;
  onSubmit: (documentsHandedOver: boolean) => Promise<void>;
}

export function DispatcherShipmentHandoverModal({
  visible,
  vehicleLabel,
  driverLabel,
  onClose,
  onSubmit,
}: DispatcherShipmentHandoverModalProps) {
  const [docsChecked, setDocsChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!docsChecked) {
      setError('Подтвердите передачу документов');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(true);
      setDocsChecked(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось зафиксировать отгрузку');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setDocsChecked(false);
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
            <Text style={styles.title}>Фиксация отгрузки</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <CloseIcon />
            </Pressable>
          </View>
          <ScrollView style={styles.body}>
            <Text style={styles.subtitle}>
              Подтвердите передачу груза представителю логистической компании.
            </Text>
            <View style={styles.transportBox}>
              <Text style={styles.transportTitle}>
                Транспорт: {vehicleLabel ?? 'Будет назначен логистом'}
              </Text>
              <Text style={styles.transportMeta}>
                Водитель: {driverLabel ?? '—'}
              </Text>
              <Pressable
                style={styles.checkboxRow}
                onPress={() => setDocsChecked((v) => !v)}
              >
                <View style={[styles.checkbox, docsChecked && styles.checkboxChecked]}>
                  {docsChecked ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <Text style={styles.checkboxLabel}>
                  Комплект сопроводительных документов передан
                </Text>
              </Pressable>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>
          <View style={styles.footer}>
            <Button title="Отмена" variant="secondary" onPress={handleClose} disabled={submitting} />
            <Button
              title={submitting ? 'Сохранение...' : 'Отгрузить со склада'}
              onPress={handleSubmit}
              loading={submitting}
              style={styles.shipBtn}
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
    maxHeight: '80%',
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
  subtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 12 },
  body: { padding: 16 },
  transportBox: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  transportTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  transportMeta: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  checkboxLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
  error: { color: colors.error, marginTop: 12, fontSize: 13 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  shipBtn: { backgroundColor: colors.warning },
});
