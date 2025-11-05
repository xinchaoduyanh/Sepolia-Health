import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        tabBarStyle: { display: 'none' }, // Ẩn tab bar khi vào chat
      }}
    />
  );
}
