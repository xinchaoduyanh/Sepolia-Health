import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="channels"
        options={{
          title: 'Tin nhắn',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="consultation"
        options={{
          title: 'Tư vấn',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
