import '../global.css';

import { Stack } from 'expo-router';
import { AppointmentProvider } from '@/contexts/AppointmentContext';
import { PaymentProvider } from '@/contexts/PaymentContext';
import { QueryProvider } from '@/providers/QueryProvider';

export default function Layout() {
  return (
    <QueryProvider>
      <AppointmentProvider>
        <PaymentProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </PaymentProvider>
      </AppointmentProvider>
    </QueryProvider>
  );
}
