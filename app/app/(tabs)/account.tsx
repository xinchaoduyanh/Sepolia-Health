"use client"

import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useAuth } from "../../contexts/AuthContext"

export default function AccountScreen() {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: logout,
      },
    ])
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <LinearGradient colors={["#3B82F6", "#2563EB"]} className="px-6 pb-8 pt-6">
        <View className="items-center">
          <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl">
            <Text className="text-3xl font-bold text-blue-600">{user?.name?.charAt(0).toUpperCase() || "A"}</Text>
          </View>
          <Text className="text-xl font-bold text-white">{user?.name || "Nguyễn Văn A"}</Text>
          <Text className="text-blue-100 italic mt-1">{user?.email}</Text>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <View className="mb-6">
            <Text className="text-base font-bold text-gray-800 mb-3">Cài đặt tài khoản</Text>
            <View className="space-y-3">
              <TouchableOpacity className="flex-row items-center rounded-xl bg-white p-4 shadow-sm">
                <View className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-blue-50">
                  <Ionicons name="person-outline" size={22} color="#3B82F6" />
                </View>
                <Text className="flex-1 text-base font-medium text-gray-800">Thông tin cá nhân</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center rounded-xl bg-white p-4 shadow-sm">
                <View className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-green-50">
                  <Ionicons name="shield-outline" size={22} color="#10B981" />
                </View>
                <Text className="flex-1 text-base font-medium text-gray-800">Bảo mật</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center rounded-xl bg-white p-4 shadow-sm">
                <View className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-blue-50">
                  <Ionicons name="notifications-outline" size={22} color="#3B82F6" />
                </View>
                <Text className="flex-1 text-base font-medium text-gray-800">Thông báo</Text>
                <View className="mr-3 rounded-full bg-red-500 px-2 py-0.5">
                  <Text className="text-xs font-bold text-white">5</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-base font-bold text-gray-800 mb-3">Hỗ trợ</Text>
            <View className="space-y-3">
              <TouchableOpacity className="flex-row items-center rounded-xl bg-white p-4 shadow-sm">
                <View className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-blue-50">
                  <Ionicons name="settings-outline" size={22} color="#3B82F6" />
                </View>
                <Text className="flex-1 text-base font-medium text-gray-800">Cài đặt</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center rounded-xl bg-white p-4 shadow-sm">
                <View className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-green-50">
                  <Ionicons name="help-circle-outline" size={22} color="#10B981" />
                </View>
                <Text className="flex-1 text-base font-medium text-gray-800">Trợ giúp</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center rounded-xl bg-white p-4 shadow-sm">
                <View className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-blue-50">
                  <Ionicons name="information-circle-outline" size={22} color="#3B82F6" />
                </View>
                <Text className="flex-1 text-base font-medium text-gray-800">Về chúng tôi</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center justify-center rounded-xl bg-red-50 p-4 shadow-sm mb-6"
          >
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-red-100">
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            </View>
            <Text className="text-base font-semibold text-red-600">Đăng xuất</Text>
          </TouchableOpacity>

          <View className="items-center py-4">
            <Text className="text-xs text-gray-400">Phiên bản 1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
