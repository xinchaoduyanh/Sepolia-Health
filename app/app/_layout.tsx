import '../global.css';

import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { AppointmentProvider } from '../contexts/AppointmentContext';

export default function Layout() {
  return (
    <AuthProvider>
      <AppointmentProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </AppointmentProvider>
    </AuthProvider>
  );
}
