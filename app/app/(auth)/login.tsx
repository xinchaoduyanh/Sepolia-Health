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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { validateEmail, validatePassword } from '@/lib/utils/validation';
import { getErrorMessage } from '@/lib/utils/error';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { login, isLoggingIn, loginError } = useAuth();

  const handleLogin = async () => {
    // Clear previous errors
    setEmailError('');
    setPasswordError('');

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.message || '');
      return;
    }

    // Validate password cc
    // const passwordValidation = validatePassword(password);
    // if (!passwordValidation.isValid) {
    //   setPasswordError(passwordValidation.message || '');
    //   return;
    // }

    try {
      await login(email, password);
      router.replace('/(homes)' as any);
    } catch (error) {
      // Error is handled by useAuth hook and displayed in UI
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* Family Illustration with Overlay Logo */}
          <View className="mt-16 items-center px-6 py-8">
            <View className="relative h-64 w-80 items-center justify-center rounded-full bg-amber-50">
              <Image
                source={require('../../assets/Doctor-pana.png')}
                style={{
                  width: 280,
                  height: 200,
                  resizeMode: 'contain',
                }}
                fadeDuration={200}
              />
              {/* Logo Overlay */}
              <View
                style={{
                  position: 'absolute',
                  top: -195,
                  left: -120,
                  zIndex: 10,
                }}>
                <Image
                  source={require('../../assets/sepolia-icon.png')}
                  style={{
                    width: 380,
                    height: 360,
                    resizeMode: 'contain',
                  }}
                  fadeDuration={200}
                />
              </View>
            </View>
          </View>

          <View className="px-6 pb-8">
            {/* Phone/Email Input */}
            <View className="mb-4">
              <View
                className={`flex-row items-center rounded-lg px-4 py-4 ${emailError ? 'border border-red-200 bg-red-50' : 'bg-gray-100'}`}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={emailError ? '#EF4444' : '#000000'}
                />
                <TextInput
                  className="ml-3 flex-1 text-base text-gray-800"
                  placeholder="Số điện thoại/email đã đăng ký"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError(''); // Clear error when user types
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {emailError && <Text className="mt-1 text-xs text-red-600">{emailError}</Text>}
            </View>

            {/* Password Input */}
            <View className="mb-6">
              <View
                className={`flex-row items-center rounded-lg px-4 py-4 ${passwordError ? 'border border-red-200 bg-red-50' : 'bg-gray-100'}`}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={passwordError ? '#EF4444' : '#000000'}
                />
                <TextInput
                  className="ml-3 flex-1 text-base text-gray-800"
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError(''); // Clear error when user types
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="p-1"
                  activeOpacity={1}>
                  <Image
                    source={
                      showPassword
                        ? require('../../assets/pepe_open_eye.png')
                        : require('../../assets/pepe_cover_eye.png')
                    }
                    style={{ width: 30, height: 30 }}
                  />
                </TouchableOpacity>
              </View>
              {passwordError && <Text className="mt-1 text-xs text-red-600">{passwordError}</Text>}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoggingIn}
              className="mb-6 overflow-hidden rounded-lg bg-blue-400 py-4">
              <Text className="text-center text-lg font-bold text-white">
                {isLoggingIn ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Text>
            </TouchableOpacity>

            {/* Error Message */}
            {loginError && (
              <View className="mb-4 rounded-lg bg-red-50 p-3">
                <Text className="text-center text-sm text-red-600">
                  {getErrorMessage(loginError)}
                </Text>
              </View>
            )}

            {/* Forgot Password */}
            <TouchableOpacity
              className="mb-8 self-center"
              onPress={() => router.push('/forgot-password')}>
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
