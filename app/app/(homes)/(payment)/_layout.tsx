import { Stack } from 'expo-router';

export default function PaymentLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="voucher-select"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="qr-payment"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
