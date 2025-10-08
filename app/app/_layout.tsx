import '../global.css';

import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppointmentProvider } from '@/contexts/AppointmentContext';
import { QueryProvider } from '@/providers/QueryProvider';

export default function Layout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppointmentProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </AppointmentProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
