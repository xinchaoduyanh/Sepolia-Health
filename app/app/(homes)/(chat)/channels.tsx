'use client';

import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useNavigation } from '@react-navigation/native';

interface ChatChannel {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  avatar: string;
  isOnline: boolean;
  specialty?: string;
}

const chatChannels: ChatChannel[] = [
  {
    id: 'general',
    name: 'Tư vấn tổng quát',
    lastMessage: 'Xin chào! Tôi có thể giúp bạn tư vấn về sức khỏe tổng quát.',
    timestamp: '10:30',
    unreadCount: 2,
    avatar: 'medical',
    isOnline: true,
    specialty: 'Bác sĩ đa khoa',
  },
  {
    id: 'specialist',
    name: 'BS. Nguyễn Văn A',
    lastMessage: 'Bạn có thể mô tả chi tiết triệu chứng không?',
    timestamp: '09:15',
    unreadCount: 0,
    avatar: 'stethoscope',
    isOnline: true,
    specialty: 'Bác sĩ chuyên khoa Nội',
  },
  {
    id: 'emergency',
    name: 'Cấp cứu 24/7',
    lastMessage: 'Hệ thống cấp cứu luôn sẵn sàng hỗ trợ bạn',
    timestamp: 'Hôm qua',
    unreadCount: 1,
    avatar: 'warning',
    isOnline: true,
    specialty: 'Đội ngũ cấp cứu',
  },
  {
    id: 'nutrition',
    name: 'NS. Trần Thị B',
    lastMessage: 'Chế độ ăn uống cân bằng rất quan trọng cho sức khỏe',
    timestamp: 'Hôm qua',
    unreadCount: 0,
    avatar: 'restaurant',
    isOnline: false,
    specialty: 'Chuyên gia dinh dưỡng',
  },
  {
    id: 'pharmacy',
    name: 'Dược sĩ C',
    lastMessage: 'Thuốc này nên uống sau ăn để tránh tác dụng phụ',
    timestamp: '2 ngày',
    unreadCount: 3,
    avatar: 'flask',
    isOnline: true,
    specialty: 'Dược sĩ tư vấn',
  },
];

export default function ChannelsScreen() {
  const navigation = useNavigation();

  // Hide tab bar when in channels
  React.useEffect(() => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.setOptions({
        tabBarStyle: { display: 'none' },
      });
    }

    return () => {
      // Show tab bar when leaving channels
      if (parentNavigation) {
        parentNavigation.setOptions({
          tabBarStyle: {
            backgroundColor: '#F0FDFA',
            borderTopWidth: 1,
            borderTopColor: '#E0F2FE',
            paddingBottom: 5,
            paddingTop: 5,
            height: 70,
          },
        });
      }
    };
  }, [navigation]);

  const handleChannelPress = (channel: ChatChannel) => {
    // Navigate to consultation chat with channel info
    router.push({
      pathname: '/consultation',
      params: {
        channelId: channel.id,
        channelTitle: channel.name,
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0284C7" />

      {/* Header */}
      <LinearGradient
        colors={['#0284C7', '#06B6D4']}
        style={{
          paddingTop: 60,
          paddingBottom: 20,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 2 }}>
              Tin nhắn
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
              Kết nối với đội ngũ y tế
            </Text>
          </View>

          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Chat List */}
      <FlatList
        data={chatChannels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleChannelPress(item)}
            style={{
              backgroundColor: 'white',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#F1F5F9',
              flexDirection: 'row',
              alignItems: 'center',
            }}
            activeOpacity={0.7}>
            {/* Avatar */}
            <View style={{ position: 'relative', marginRight: 12 }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor:
                    item.id === 'general'
                      ? '#E0F2FE'
                      : item.id === 'specialist'
                        ? '#D1FAE5'
                        : item.id === 'emergency'
                          ? '#FEE2E2'
                          : item.id === 'nutrition'
                            ? '#FEF3C7'
                            : '#CFFAFE',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons
                  name={item.avatar as any}
                  size={24}
                  color={
                    item.id === 'general'
                      ? '#0284C7'
                      : item.id === 'specialist'
                        ? '#10B981'
                        : item.id === 'emergency'
                          ? '#EF4444'
                          : item.id === 'nutrition'
                            ? '#F59E0B'
                            : '#06B6D4'
                  }
                />
              </View>

              {/* Online indicator */}
              {item.isOnline && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: '#10B981',
                    borderWidth: 2,
                    borderColor: 'white',
                  }}
                />
              )}
            </View>

            {/* Content */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#0F172A',
                    flex: 1,
                  }}>
                  {item.name}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: '#64748B',
                  }}>
                  {item.timestamp}
                </Text>
              </View>

              {item.specialty && (
                <Text
                  style={{
                    fontSize: 12,
                    color: '#64748B',
                    marginBottom: 4,
                  }}>
                  {item.specialty}
                </Text>
              )}

              <Text
                style={{
                  fontSize: 14,
                  color: '#64748B',
                  flex: 1,
                }}
                numberOfLines={1}>
                {item.lastMessage}
              </Text>
            </View>

            {/* Unread count */}
            {item.unreadCount > 0 && (
              <View
                style={{
                  backgroundColor: '#0284C7',
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: 'white',
                  }}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
