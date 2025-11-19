import { Stack } from 'expo-router';

export default function TermsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackVisible: true,
        headerBackTitle: 'Tài khoản',
        headerStyle: {
          backgroundColor: '#0284C7',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen
        name="usage-regulations"
        options={{
          title: 'Quy định sử dụng',
        }}
      />
      <Stack.Screen
        name="dispute-resolution"
        options={{
          title: 'Chính sách giải quyết',
        }}
      />
      <Stack.Screen
        name="privacy-policy"
        options={{
          title: 'Chính sách bảo vệ dữ liệu',
        }}
      />
      <Stack.Screen
        name="app-faq"
        options={{
          title: 'Hỏi đáp về ứng dụng',
        }}
      />
    </Stack>
  );
}
