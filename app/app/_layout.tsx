import '../global.css';
import 'react-native-reanimated';
import 'react-native-gesture-handler';

import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppointmentProvider } from '@/contexts/AppointmentContext';
import { PaymentProvider } from '@/contexts/PaymentContext';
import { QueryProvider } from '@/providers/QueryProvider';
import { ChatProvider } from '@/contexts/ChatContext';

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}
