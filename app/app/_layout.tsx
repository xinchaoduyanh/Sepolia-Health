import '../global.css';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Stack } from 'expo-router';
import { AppointmentProvider } from '@/contexts/AppointmentContext';
import { PaymentProvider } from '@/contexts/PaymentContext';
import { QueryProvider } from '@/providers/QueryProvider';
import { ChatProvider } from '@/contexts/ChatContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { BackgroundPrefetch } from '@/components/BackgroundPrefetch';
import Constants from 'expo-constants';

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
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
