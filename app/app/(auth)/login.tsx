'use client';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        router.replace('/(tabs)' as any);
      } else {
        Alert.alert('Lỗi', 'Email hoặc mật khẩu không đúng');
      }
    } catch {
      Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* Close Button */}
          <View className="px-6 pt-4">
            <TouchableOpacity className="h-8 w-8 items-center justify-center">
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* Family Illustration */}
          <View className="items-center px-6 py-8">
            <View className="h-64 w-80 items-center justify-center rounded-full bg-amber-50">
              {/* Placeholder for family illustration - using emoji for now */}
              <Text className="text-8xl">👨‍👩‍👧</Text>
            </View>
          </View>

          <View className="px-6 pb-8">
            {/* Phone/Email Input */}
            <View className="mb-4">
              <View className="flex-row items-center rounded-lg bg-gray-100 px-4 py-4">
                <Ionicons name="person-outline" size={20} color="#000000" />
                <TextInput
                  className="ml-3 flex-1 text-base text-gray-800"
                  placeholder="Số điện thoại/email đã đăng ký"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-6">
              <View className="flex-row items-center rounded-lg bg-gray-100 px-4 py-4">
                <Ionicons name="lock-closed-outline" size={20} color="#000000" />
                <TextInput
                  className="ml-3 flex-1 text-base text-gray-800"
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className="mb-6 overflow-hidden rounded-lg bg-blue-400 py-4">
              <Text className="text-center text-lg font-bold text-white">
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Text>
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity className="mb-8 self-center">
              <Text className="text-sm font-semibold text-blue-500">Quên mật khẩu?</Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View className="flex-row items-center justify-center pb-8">
              <Text className="text-sm text-gray-500">Bạn chưa có tài khoản? </Text>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text className="text-sm font-bold text-blue-500">Đăng ký ngay</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
