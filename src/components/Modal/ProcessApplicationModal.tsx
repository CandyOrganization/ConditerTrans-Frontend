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
import { formatApplicationLabel, formatApplicationRoute } from '../../api/applications';
import { fetchAvailableDrivers, formatDriverLabel } from '../../api/drivers';
import type { Application, Driver, ProcessApplicationDto } from '../../types';
import { CloseIcon } from '../Icons/Icons';
import { Button, FieldLabel, Input } from '../ui/Ui';
import { colors } from '../../theme/colors';

interface ProcessApplicationModalProps {
  application: Application | null;
  onClose: () => void;
  onSubmit: (applicationId: string, payload: ProcessApplicationDto) => Promise<void>;
}

export function ProcessApplicationModal({
  application,
  onClose,
  onSubmit,
}: ProcessApplicationModalProps) {
  const isOpen = application !== null;
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverId, setDriverId] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setComment('');
    setSubmitting(false);
    setLoadingDrivers(true);

    let cancelled = false;
    (async () => {
      const list = await fetchAvailableDrivers();
      if (cancelled) return;
      setDrivers(list);
      setDriverId(list[0]?.id ?? '');
      setLoadingDrivers(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, application?.id]);

  const handleSubmit = async () => {
    if (!application || !driverId) return;
    setSubmitting(true);
    try {
      await onSubmit(application.id, {
        driverId,
        comment: comment.trim() || undefined,
      });
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
            <Text style={styles.title}>
              {application ? formatApplicationLabel(application) : 'Назначение водителя'}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <CloseIcon />
            </Pressable>
          </View>

          {application && (
            <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
              <View style={styles.info}>
                <InfoRow label="Заказ:" value={formatApplicationLabel(application)} />
                <InfoRow label="Маршрут:" value={formatApplicationRoute(application)} />
                <InfoRow label="Состав:" value={application.weight} />
                {application.specialConditions && (
                  <InfoRow label="Спец. условия:" value={application.specialConditions} />
                )}
              </View>

              <FieldLabel>Назначить водителя:</FieldLabel>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={driverId}
                  enabled={!loadingDrivers && drivers.length > 0}
                  onValueChange={setDriverId}
                >
                  {loadingDrivers && <Picker.Item label="Загрузка..." value="" />}
                  {!loadingDrivers && drivers.length === 0 && (
                    <Picker.Item label="Нет свободных водителей" value="" />
                  )}
                  {drivers.map((driver) => (
                    <Picker.Item
                      key={driver.id}
                      label={formatDriverLabel(driver)}
                      value={driver.id}
                    />
                  ))}
                </Picker>
              </View>

              <FieldLabel>Комментарий:</FieldLabel>
              <Input
                value={comment}
                onChangeText={setComment}
                placeholder="Дополнительные инструкции..."
              />
            </ScrollView>
          )}

          <View style={styles.footer}>
            <Button title="Отмена" variant="secondary" onPress={onClose} disabled={submitting} />
            <Button
              title={submitting ? 'Назначение...' : 'Назначить водителя'}
              onPress={handleSubmit}
              loading={submitting}
              disabled={!driverId || loadingDrivers}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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
  info: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textMuted,
    width: 110,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
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
