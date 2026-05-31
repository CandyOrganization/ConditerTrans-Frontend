import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { buildSetPasswordLink } from '../../utils/inviteLink';
import { CloseIcon } from '../Icons/Icons';
import { Button } from '../ui/Ui';
import { colors } from '../../theme/colors';

interface InviteSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteId: string;
  email: string;
}

export function InviteSuccessModal({
  isOpen,
  onClose,
  inviteId,
  email,
}: InviteSuccessModalProps) {
  const [copied, setCopied] = useState(false);
  const inviteLink = buildSetPasswordLink(inviteId);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal visible={isOpen} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Приглашение создано</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <CloseIcon />
            </Pressable>
          </View>

          <Text style={styles.text}>
            Сотрудник <Text style={styles.email}>{email}</Text> добавлен. Отправьте ему ссылку для
            установки пароля:
          </Text>

          <View style={styles.linkBox}>
            <Text style={styles.link} selectable>
              {inviteLink}
            </Text>
          </View>

          <Button
            title={copied ? 'Скопировано!' : 'Скопировать ссылку'}
            onPress={handleCopy}
            fullWidth
          />

          {Platform.OS === 'web' ? (
            <Text style={styles.hint}>
              Сотрудник откроет ссылку, задаст пароль и сразу попадёт в систему.
            </Text>
          ) : (
            <Text style={styles.hint}>
              Скопируйте ссылку и отправьте в мессенджере или по почте.
            </Text>
          )}

          <Button title="Готово" onPress={onClose} variant="secondary" fullWidth style={styles.done} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  text: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  email: {
    color: colors.text,
    fontWeight: '600',
  },
  linkBox: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  link: {
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    textAlign: 'center',
  },
  done: {
    marginTop: 4,
  },
});
