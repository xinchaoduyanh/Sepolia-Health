import '../global.css';
import 'react-native-reanimated';
import 'react-native-gesture-handler';

import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppointmentProvider } from '@/contexts/AppointmentContext';
import { PaymentProvider } from '@/contexts/PaymentContext';
import { QueryProvider } from '@/providers/QueryProvider';
import { ChatProvider } from '@/contexts/ChatContext';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Lazy import VideoProvider to avoid loading native modules in Expo Go
let VideoProvider: any = ({ children }: { children: React.ReactNode }) => <>{children}</>;

// Only load VideoProvider if not in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';
if (!isExpoGo) {
  try {
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
        <ChatProvider>
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
        </ChatProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
