import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="set-password" />
        <Stack.Screen name="employees" />
        <Stack.Screen name="reports" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="cargo/[cargoId]" />
        <Stack.Screen name="trip/[tripId]" />
        <Stack.Screen name="order/[orderId]" />
      </Stack>
    </AuthProvider>
  );
}
