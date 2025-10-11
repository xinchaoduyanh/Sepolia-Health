import '../global.css';

import { Stack } from 'expo-router';
import { AppointmentProvider } from '@/contexts/AppointmentContext';
import { QueryProvider } from '@/providers/QueryProvider';

export default function Layout() {
  return (
    <QueryProvider>
      <AppointmentProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </AppointmentProvider>
    </QueryProvider>
  );
}
