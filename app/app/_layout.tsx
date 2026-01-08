import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';

import { BackgroundPrefetch } from '@/components/BackgroundPrefetch';
import { AppointmentProvider } from '@/contexts/AppointmentContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { PaymentProvider } from '@/contexts/PaymentContext';
import { QueryProvider } from '@/providers/QueryProvider';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';

// Lazy import VideoProvider to avoid loading native modules in Expo Go
let VideoProvider: any = ({ children }: { children: React.ReactNode }) => <>{children}</>;

// Only load VideoProvider if not in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';
if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const videoModule = require('@/contexts/VideoContext');
    VideoProvider = videoModule.VideoProvider;
  } catch (error) {
    console.warn('VideoProvider not available in Expo Go:', error);
  }
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <AuthProvider>
          <BackgroundPrefetch />
          <ChatProvider>
            <NotificationProvider>
              <VideoProvider>
                <AppointmentProvider>
                  <PaymentProvider>
                    <Stack
                      screenOptions={{
                        headerShown: false,
                      }}
                    />
                  </PaymentProvider>
                </AppointmentProvider>
              </VideoProvider>
            </NotificationProvider>
          </ChatProvider>
        </AuthProvider>
      </QueryProvider>
      {/* Toast must be at the root level to show on all screens */}
      <Toast />
    </GestureHandlerRootView>
  );
}
