import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ChatAPI, Clinic } from '@/lib/api/chat';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChatContext } from '@/contexts/ChatContext';
import { useState } from 'react';

const ClinicItem = ({
  item,
  onPress,
  isLoading,
}: {
  item: Clinic;
  onPress: (id: number) => void;
  isLoading: boolean;
}) => {
  return (
    <TouchableOpacity
      onPress={() => onPress(item.id)}
      disabled={isLoading}
      className="mb-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
      <View className="flex-row items-center">
        {/* Clinic Icon */}
        <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-cyan-50">
          <Ionicons name="medical" size={24} color="#06b6d4" />
        </View>

        {/* Clinic Info */}
        <View className="flex-1">
          <Text className="mb-1 text-lg font-semibold text-gray-900">{item.name}</Text>
          <Text className="mb-1 text-sm text-gray-600" numberOfLines={2}>
            {item.address}
          </Text>
          {item.phone && (
            <View className="flex-row items-center">
              <Ionicons name="call-outline" size={14} color="#6b7280" />
              <Text className="ml-1 text-sm text-gray-500">{item.phone}</Text>
            </View>
          )}
        </View>

        {/* Action Button */}
        <View className="ml-4">
          {isLoading ? (
            <ActivityIndicator size="small" color="#06b6d4" />
          ) : (
            <View className="h-8 w-8 items-center justify-center rounded-full bg-cyan-500">
              <Ionicons name="chatbubble-outline" size={16} color="white" />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ClinicsScreen = () => {
  const router = useRouter();
  const { createChannel } = useChatContext();
  const [creatingChannelId, setCreatingChannelId] = useState<number | null>(null);

  const {
    data: clinics,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['clinics'],
    queryFn: ChatAPI.getClinics,
  });

  const { isChatReady } = useChatContext();

  const handleSelectClinic = async (clinicId: number) => {
    if (creatingChannelId || !isChatReady) return; // Prevent multiple simultaneous requests and ensure chat is ready

    setCreatingChannelId(clinicId);
    try {
      const channel = await createChannel(clinicId);
      if (channel) {
        // Wait a bit to ensure channel is fully created
        setTimeout(() => {
          router.replace({
            pathname: '/(homes)/(chat)/[cid]',
            params: { cid: channel.cid },
          });
        }, 500);
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
      Alert.alert(
        'Không thể bắt đầu tư vấn',
        'Có lỗi xảy ra khi kết nối với cơ sở y tế. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
    } finally {
      setCreatingChannelId(null);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <Stack.Screen
          options={{
            title: 'Chọn cơ sở y tế',
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                className="ml-4 h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}>
                <Ionicons name="arrow-back" size={20} color="#06b6d4" />
              </TouchableOpacity>
            ),
            headerStyle: {
              backgroundColor: '#06b6d4',
            },
            headerTintColor: '#ffffff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#06b6d4" />
          <Text className="mt-4 text-base text-gray-600">Đang tải danh sách cơ sở...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <Stack.Screen
          options={{
            title: 'Chọn cơ sở y tế',
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                className="ml-4 h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}>
                <Ionicons name="arrow-back" size={20} color="#06b6d4" />
              </TouchableOpacity>
            ),
            headerStyle: {
              backgroundColor: '#06b6d4',
            },
            headerTintColor: '#ffffff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <View className="flex-1 items-center justify-center p-8">
          <View className="shadow-inner mb-6 items-center justify-center rounded-full bg-gradient-to-br from-red-50 to-orange-50 p-8">
            <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          </View>
          <Text className="mb-3 text-center text-2xl font-bold text-gray-900">
            Không thể tải danh sách cơ sở
          </Text>
          <Text className="mb-8 text-center text-base leading-6 text-gray-600">
            Vui lòng kiểm tra kết nối internet và thử lại.
          </Text>
          <TouchableOpacity
            onPress={handleRefresh}
            className="flex-row items-center rounded-xl bg-cyan-500 px-8 py-4 shadow-lg"
            disabled={isRefetching}
            style={{
              shadowColor: '#06b6d4',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}>
            {isRefetching ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="refresh" size={24} color="white" />
            )}
            <Text className="ml-3 text-lg font-semibold text-white">
              {isRefetching ? 'Đang tải...' : 'Thử lại'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Stack.Screen
        options={{
          title: 'Chọn cơ sở y tế',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              className="ml-4 h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}>
              <Ionicons name="arrow-back" size={20} color="#06b6d4" />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: '#06b6d4',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <View className="flex-1 p-4">
        {/* Clinics List */}
        {clinics && clinics.length > 0 ? (
          <FlatList
            data={clinics}
            renderItem={({ item }) => (
              <ClinicItem
                item={item}
                onPress={handleSelectClinic}
                isLoading={creatingChannelId === item.id}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={handleRefresh}
                colors={['#06b6d4']}
                tintColor="#06b6d4"
              />
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-8">
            <View className="shadow-inner mb-6 items-center justify-center rounded-full bg-gradient-to-br from-red-50 to-orange-50 p-8">
              <Ionicons name="medical" size={64} color="#ef4444" />
            </View>
            <Text className="mb-3 text-center text-xl font-bold text-gray-900">
              Không có cơ sở nào
            </Text>
            <Text className="text-center text-base leading-6 text-gray-600">
              Hiện tại chưa có cơ sở y tế nào khả dụng để tư vấn. Vui lòng thử lại sau.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ClinicsScreen;
