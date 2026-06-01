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
import type { ReadyForShipmentDto } from '../../types';

interface DispatcherReadyForShipmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: ReadyForShipmentDto) => Promise<void>;
  /** Запрос от Hangfire за 2 дня до доставки */
  deadlineMode?: boolean;
  requestedDeliveryDate?: string | null;
  deadlineConfirmationExpiresAt?: string | null;
}

export function DispatcherReadyForShipmentModal({
  visible,
  onClose,
  onSubmit,
  deadlineMode = false,
  requestedDeliveryDate,
  deadlineConfirmationExpiresAt,
}: DispatcherReadyForShipmentModalProps) {
  const [shipmentDate, setShipmentDate] = useState('');
  const [lengthM, setLengthM] = useState('');
  const [widthM, setWidthM] = useState('');
  const [heightM, setHeightM] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const parsePositive = (value: string): number | null => {
    const normalized = value.trim().replace(',', '.');
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return parsed;
  };

  const handleSubmit = async () => {
    const date = shipmentDate.trim();
    const length = parsePositive(lengthM);
    const width = parsePositive(widthM);
    const height = parsePositive(heightM);
    const weight = parsePositive(weightKg);

    if (!date) {
      setError('Укажите дату (YYYY-MM-DD)');
      return;
    }
    if (length === null || width === null || height === null) {
      setError('Укажите габариты в метрах (длина, ширина, высота)');
      return;
    }
    if (weight === null) {
      setError('Укажите вес груза в кг');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await onSubmit({
        shipmentDate: date,
        lengthM: length,
        widthM: width,
        heightM: height,
        weightKg: weight,
      });
      setShipmentDate('');
      setLengthM('');
      setWidthM('');
      setHeightM('');
      setWeightKg('');
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
    setLengthM('');
    setWidthM('');
    setHeightM('');
    setWeightKg('');
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
            <Text style={styles.title}>
              {deadlineMode ? 'Подтверждение готовности к сроку' : 'Готовность к отправке'}
            </Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <CloseIcon />
            </Pressable>
          </View>
          <ScrollView style={styles.body}>
            <Text style={styles.subtitle}>
              {deadlineMode
                ? `До даты доставки${requestedDeliveryDate ? ` (${formatDateLabel(requestedDeliveryDate)})` : ''} осталось 2 дня или меньше. Подтвердите готовность и укажите габариты — груз появится у логистов. Или перенесите срок через «Срыв сроков».`
                : 'Укажите фактические габариты и вес — по ним будет создан груз для логиста.'}
            </Text>
            {deadlineMode && deadlineConfirmationExpiresAt ? (
              <Text style={styles.deadlineHint}>
                Ответить до: {formatDateLabel(deadlineConfirmationExpiresAt, true)}
              </Text>
            ) : null}
            <FieldLabel>Дата передачи (YYYY-MM-DD)</FieldLabel>
            <Input
              value={shipmentDate}
              onChangeText={setShipmentDate}
              placeholder="2026-06-01"
            />
            <FieldLabel>Длина, м</FieldLabel>
            <Input value={lengthM} onChangeText={setLengthM} placeholder="1.2" keyboardType="decimal-pad" />
            <FieldLabel>Ширина, м</FieldLabel>
            <Input value={widthM} onChangeText={setWidthM} placeholder="0.8" keyboardType="decimal-pad" />
            <FieldLabel>Высота, м</FieldLabel>
            <Input value={heightM} onChangeText={setHeightM} placeholder="0.5" keyboardType="decimal-pad" />
            <FieldLabel>Вес, кг</FieldLabel>
            <Input value={weightKg} onChangeText={setWeightKg} placeholder="120" keyboardType="decimal-pad" />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>
          <View style={styles.footer}>
            <Button title="Отмена" variant="secondary" onPress={handleClose} disabled={submitting} />
            <Button
              title={submitting ? 'Сохранение...' : 'Подтвердить'}
              onPress={handleSubmit}
              loading={submitting}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function formatDateLabel(iso: string, withTime = false): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  if (withTime) {
    return date.toLocaleString('ru-RU');
  }
  return date.toLocaleDateString('ru-RU');
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
  subtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  deadlineHint: { fontSize: 13, color: colors.error, marginBottom: 16, fontWeight: '600' },
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
