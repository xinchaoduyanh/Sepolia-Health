import '../global.css';
import 'react-native-reanimated';

import { Stack } from 'expo-router';
import { AppointmentProvider } from '@/contexts/AppointmentContext';
import { PaymentProvider } from '@/contexts/PaymentContext';
import { QueryProvider } from '@/providers/QueryProvider';
import { ChatProvider } from '@/contexts/ChatContext';

export default function Layout() {
  return (
    <QueryProvider>
      <ChatProvider>
        <AppointmentProvider>
          <PaymentProvider>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            />
          </PaymentProvider>
        </AppointmentProvider>
      </ChatProvider>
    </QueryProvider>
  );
}
