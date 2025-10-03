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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState, useRef } from 'react';

type RegisterStep = 'email' | 'otp' | 'info';

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState<RegisterStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Refs for OTP inputs
  const otpRefs = useRef<TextInput[]>([]);

  const handleSendOTP = () => {
    // Send OTP logic here
    setStep('otp');
  };

  const handleVerifyOTP = () => {
    // Verify OTP logic here
    if (otp.every((digit) => digit !== '')) {
      setStep('info');
    }
  };

  const handleRegister = () => {
    // Register logic here
    router.push('/(auth)/login' as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Close Button */}
          <View className="px-6 pt-4">
            <TouchableOpacity
              className="h-8 w-8 items-center justify-center"
              onPress={() => router.back()}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          <View className="px-6 py-6">
            <View className="mb-3 flex-row gap-2">
              <View
                className={`h-1.5 flex-1 rounded-full ${step === 'email' ? 'bg-blue-400' : 'bg-gray-200'}`}
              />
              <View
                className={`h-1.5 flex-1 rounded-full ${step === 'otp' ? 'bg-blue-400' : 'bg-gray-200'}`}
              />
              <View
                className={`h-1.5 flex-1 rounded-full ${step === 'info' ? 'bg-blue-400' : 'bg-gray-200'}`}
              />
            </View>
            <Text className="text-center text-sm font-medium text-gray-600">
              Bước {step === 'email' ? '1' : step === 'otp' ? '2' : '3'} / 3
            </Text>
          </View>

          {/* Step 1: Email */}
          {step === 'email' && (
            <View className="px-6">
              {/* Family Illustration */}
              <View className="items-center px-6 py-8">
                <View className="h-64 w-80 items-center justify-center rounded-full bg-amber-50">
                  {/* Placeholder for family illustration - using emoji for now */}
                  <Text className="text-8xl">👨‍👩‍👧</Text>
                </View>
              </View>

              <View className="gap-4">
                <View className="mb-2">
                  <View className="flex-row items-center rounded-lg bg-gray-100 px-4 py-4">
                    <Ionicons name="mail-outline" size={20} color="#000000" />
                    <TextInput
                      className="ml-3 flex-1 text-base text-gray-800"
                      placeholder="Nhập email của bạn"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  className="mt-4 overflow-hidden rounded-lg bg-blue-400 py-4"
                  onPress={handleSendOTP}>
                  <Text className="text-center text-lg font-bold text-white">Gửi mã xác thực</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <View className="px-6">
              <View className="mb-10 items-center">
                <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-amber-50">
                  <Ionicons name="shield-checkmark" size={40} color="#000000" />
                </View>
                <Text className="mb-3 text-3xl font-bold text-gray-800">Xác thực email</Text>
                <Text className="text-center text-base leading-6 text-gray-500">
                  Nhập mã 6 số đã được gửi đến{'\n'}
                  <Text className="font-semibold text-blue-500">{email}</Text>
                </Text>
              </View>

              <View className="gap-4">
                <View className="mb-8 flex-row justify-between gap-2">
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        if (ref) otpRefs.current[index] = ref;
                      }}
                      className="h-16 flex-1 rounded-lg border-2 border-gray-200 bg-white text-center text-2xl font-bold text-gray-800"
                      value={digit}
                      onChangeText={(text) => {
                        const newOtp = [...otp];
                        const chars = text.replace(/\D/g, '').split('');

                        chars.forEach((c, i) => {
                          if (index + i < 6) newOtp[index + i] = c;
                        });
                        setOtp(newOtp);

                        // Focus ô trống tiếp theo
                        if (text && index < 5) {
                          setTimeout(() => {
                            otpRefs.current[index + 1]?.focus();
                          }, 0);
                        }
                      }}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === 'Backspace') {
                          if (otp[index]) {
                            const newOtp = [...otp];
                            newOtp[index] = '';
                            setOtp(newOtp);
                          } else if (index > 0) {
                            otpRefs.current[index - 1]?.focus();
                          }
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                    />
                  ))}
                </View>

                <TouchableOpacity className="mb-4 flex-row items-center justify-center">
                  <Text className="text-sm text-gray-500">Không nhận được mã? </Text>
                  <Text className="text-sm font-bold text-blue-500">Gửi lại</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="overflow-hidden rounded-lg bg-blue-400 py-4"
                  onPress={handleVerifyOTP}>
                  <Text className="text-center text-lg font-bold text-white">Xác nhận</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 3: Basic Info */}
          {step === 'info' && (
            <View className="px-6">
              <View className="mb-10 items-center">
                <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-amber-50">
                  <Ionicons name="person" size={40} color="#000000" />
                </View>
                <Text className="mb-3 text-3xl font-bold text-gray-800">Thông tin cá nhân</Text>
                <Text className="text-center text-base leading-6 text-gray-500">
                  Hoàn tất thông tin để tạo tài khoản
                </Text>
              </View>

              <View className="gap-5">
                {/* Full Name */}
                <View>
                  <View className="flex-row items-center rounded-lg bg-gray-100 px-4 py-4">
                    <Ionicons name="person-outline" size={20} color="#000000" />
                    <TextInput
                      className="ml-3 flex-1 text-base text-gray-800"
                      placeholder="Họ và tên"
                      placeholderTextColor="#9CA3AF"
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>
                </View>

                {/* Phone */}
                <View>
                  <View className="flex-row items-center rounded-lg bg-gray-100 px-4 py-4">
                    <Ionicons name="call-outline" size={20} color="#000000" />
                    <TextInput
                      className="ml-3 flex-1 text-base text-gray-800"
                      placeholder="Số điện thoại"
                      placeholderTextColor="#9CA3AF"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                {/* Date of Birth */}
                <View>
                  <View className="flex-row items-center rounded-lg bg-gray-100 px-4 py-4">
                    <Ionicons name="calendar-outline" size={20} color="#000000" />
                    <TextInput
                      className="ml-3 flex-1 text-base text-gray-800"
                      placeholder="Ngày sinh (DD/MM/YYYY)"
                      placeholderTextColor="#9CA3AF"
                      value={dateOfBirth}
                      onChangeText={setDateOfBirth}
                    />
                  </View>
                </View>

                {/* Gender */}
                <View>
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      className={`flex-1 flex-row items-center justify-center gap-2 rounded-lg border px-4 py-4 ${
                        gender === 'male'
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                      onPress={() => setGender('male')}>
                      <Ionicons
                        name="male"
                        size={20}
                        color={gender === 'male' ? '#3B82F6' : '#6B7280'}
                      />
                      <Text
                        className={`text-base font-semibold ${gender === 'male' ? 'text-blue-500' : 'text-gray-500'}`}>
                        Nam
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className={`flex-1 flex-row items-center justify-center gap-2 rounded-lg border px-4 py-4 ${
                        gender === 'female'
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                      onPress={() => setGender('female')}>
                      <Ionicons
                        name="female"
                        size={20}
                        color={gender === 'female' ? '#3B82F6' : '#6B7280'}
                      />
                      <Text
                        className={`text-base font-semibold ${gender === 'female' ? 'text-blue-500' : 'text-gray-500'}`}>
                        Nữ
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Password */}
                <View>
                  <View className="flex-row items-center rounded-lg bg-gray-100 px-4 py-4">
                    <Ionicons name="lock-closed-outline" size={20} color="#000000" />
                    <TextInput
                      className="ml-3 flex-1 text-base text-gray-800"
                      placeholder="Mật khẩu (tối thiểu 8 ký tự)"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="p-1">
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password */}
                <View>
                  <View className="flex-row items-center rounded-lg bg-gray-100 px-4 py-4">
                    <Ionicons name="lock-closed-outline" size={20} color="#000000" />
                    <TextInput
                      className="ml-3 flex-1 text-base text-gray-800"
                      placeholder="Xác nhận mật khẩu"
                      placeholderTextColor="#9CA3AF"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="p-1">
                      <Ionicons
                        name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  className="mt-2 overflow-hidden rounded-lg bg-blue-400 py-4"
                  onPress={handleRegister}>
                  <Text className="text-center text-lg font-bold text-white">Hoàn tất đăng ký</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Login Link */}
          <View className="mt-8 flex-row items-center justify-center">
            <Text className="text-sm text-gray-500">Đã có tài khoản? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text className="text-sm font-bold text-blue-500">Đăng nhập</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View className="h-10" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
