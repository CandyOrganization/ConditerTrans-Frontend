import { Alert, Platform } from 'react-native';

/** Alert.alert на web часто не показывается — для подтверждений используем window.confirm */
export function confirmAction(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Отмена', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Да', onPress: () => resolve(true) },
    ]);
  });
}
