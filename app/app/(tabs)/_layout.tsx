import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="folder-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="qr-scanner"
        options={{
          title: '',
          tabBarIcon: ({ color, size }) => (
            <View className="items-center justify-center">
              <View className="h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                <Ionicons name="qr-code" size={24} color="white" />
              </View>
            </View>
          ),
          tabBarButton: (props) => {
            const { onPress } = props;
            return (
              <TouchableOpacity
                onPress={onPress}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <View
                    style={{
                      height: 48,
                      width: 48,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                      backgroundColor: '#3B82F6',
                    }}>
                    <Ionicons name="qr-code" size={24} color="white" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          },
        }}
      />
      <Tabs.Screen
        name="appointment"
        options={{
          title: 'Đặt lịch',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
