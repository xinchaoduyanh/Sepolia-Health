import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, Text } from 'react-native';
import Constants from 'expo-constants';
import React from 'react';

// Lazy import CallOverlay
let CallOverlay: any = () => null;
const isExpoGo = Constants.appOwnership === 'expo';
if (!isExpoGo) {
  try {
    const callModule = require('@/components/video/CallOverlay');
    CallOverlay = callModule.CallOverlay;
  } catch (error) {
    console.warn('CallOverlay not available in Expo Go');
  }
}

export default function TabLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#0284C7',
          tabBarInactiveTintColor: '#475569',
          tabBarStyle: {
            backgroundColor: '#F0FDFA',
            borderTopWidth: 1,
            borderTopColor: '#E0F2FE',
            paddingBottom: 5,
            paddingTop: 5,
            height: 70,
          },
        }}
        className="bg-teal-50">
        <Tabs.Screen
          name="index"
          options={{
            title: 'Trang chủ',
            tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="(appointment)"
          options={{
            title: 'Lịch hẹn',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(qna)"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="(qr-scanner)"
          options={{
            title: 'Quét QR',
            tabBarIcon: ({ color, size }) => (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: '#0284C7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#0284C7',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    elevation: 8,
                    marginTop: -20,
                  }}>
                  <Ionicons name="qr-code" size={28} color="white" />
                </View>
              </View>
            ),
            tabBarButton: (props) => {
              const { onPress } = props;
              return (
                <TouchableOpacity
                  onPress={onPress}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingTop: 10,
                  }}>
                  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: '#0284C7',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#0284C7',
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.4,
                        shadowRadius: 12,
                        elevation: 8,
                        marginTop: -20,
                      }}>
                      <Ionicons name="qr-code" size={28} color="white" />
                    </View>
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '500',
                        color: '#0284C7',
                        marginTop: 4,
                      }}>
                      Quét QR
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            },
          }}
        />
        <Tabs.Screen
          name="(profile)"
          options={{
            title: 'Hồ sơ',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="folder-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(account)"
          options={{
            title: 'Tài khoản',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />

        {/* Hidden tabs - không hiển thị trong footer */}
        <Tabs.Screen
          name="(payment)"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="(chat)"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="(notification)"
          options={{
            href: null,
          }}
        />
      </Tabs>

      {/* Global Call Overlay */}
      <CallOverlay />
    </>
  );
}
