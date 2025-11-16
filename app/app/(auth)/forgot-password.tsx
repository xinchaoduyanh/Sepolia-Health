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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useRef } from 'react';
import { useForgotPasswordFlow } from '@/lib/hooks/useFogotPassword';
import { validatePassword } from '@/lib/utils/validation';

type ForgotPasswordStep = 'email' | 'otp' | 'password';

export default function ForgotPasswordScreen() {
  const {
    sendOtp,
    verifyOtp,
    resetPassword,
    isSendingOtp,
    isVerifyingOtp,
    isResettingPassword,
    sendOtpError,
    verifyOtpError,
    resetPasswordError,
  } = useForgotPasswordFlow();

  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Refs for OTP inputs
  const otpRefs = useRef<TextInput[]>([]);

  const handleSendOTP = async () => {
    // Clear previous errors
    setEmailError('');

    // Validate email
    if (!email.trim()) {
      setEmailError('Vui lòng nhập email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Email không hợp lệ');
      return;
    }

    try {
      await sendOtp({ email });
      setStep('otp');
    } catch {
      // Error is handled by hook and displayed below
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ 6 số');
      return;
    }

    try {
      await verifyOtp({ email, otp: otpCode });
      setStep('password');
    } catch {
      // Error is handled by hook
    }
  };

  const handleResetPassword = async () => {
    // Clear previous errors
    setPasswordError('');
    setConfirmPasswordError('');

    // Validate password
    if (!newPassword.trim()) {
      setPasswordError('Vui lòng nhập mật khẩu mới');
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.message || 'Mật khẩu không hợp lệ');
      return;
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Vui lòng xác nhận mật khẩu');
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      await resetPassword({ email, otp: otp.join(''), newPassword });
      Alert.alert('Thành công', 'Đặt lại mật khẩu thành công!', [
        { text: 'OK', onPress: () => router.push('/(auth)/login' as any) },
      ]);
    } catch {
      // Error is handled by hook
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="px-6 py-6">
            <View className="mb-3 flex-row gap-2">
              <View
                className={`h-1.5 flex-1 rounded-full ${step === 'email' ? 'bg-blue-400' : 'bg-gray-200'}`}
              />
              <View
                className={`h-1.5 flex-1 rounded-full ${step === 'otp' ? 'bg-blue-400' : 'bg-gray-200'}`}
              />
              <View
                className={`h-1.5 flex-1 rounded-full ${step === 'password' ? 'bg-blue-400' : 'bg-gray-200'}`}
              />
            </View>
            <Text className="text-center text-sm font-medium text-gray-600">
              Bước {step === 'email' ? '1' : step === 'otp' ? '2' : '3'} / 3
            </Text>
          </View>

          {/* Step 1: Email */}
          {step === 'email' && (
            <View className="px-6">
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

              <View className="gap-4">
                <View className="mb-2">
                  <View
                    className={`flex-row items-center rounded-lg px-4 py-4 ${emailError ? 'border border-red-200 bg-red-50' : 'bg-gray-100'}`}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={emailError ? '#EF4444' : '#000000'}
                    />
                    <TextInput
                      className="ml-3 flex-1 text-base text-gray-800"
                      placeholder="Nhập email của bạn"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (emailError) setEmailError('');
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  {emailError && <Text className="mt-1 text-xs text-red-600">{emailError}</Text>}
                </View>

                <TouchableOpacity
                  className="mt-4 overflow-hidden rounded-lg bg-blue-400 py-4"
                  onPress={handleSendOTP}
                  disabled={isSendingOtp}>
                  <Text className="text-center text-lg font-bold text-white">
                    {isSendingOtp ? 'Đang gửi...' : 'Gửi mã xác thực'}
                  </Text>
                </TouchableOpacity>

                {sendOtpError && (
                  <View className="mt-4 rounded-lg bg-red-50 p-3">
                    <Text className="text-center text-sm text-red-600">
                      {typeof sendOtpError === 'string'
                        ? sendOtpError
                        : (sendOtpError as any)?.message || 'Không thể gửi mã xác thực'}
                    </Text>
                  </View>
                )}

                <TouchableOpacity onPress={() => router.back()} className="mt-4">
                  <Text className="text-center font-medium text-blue-500">
                    ← Quay lại đăng nhập
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <View className="px-6">
              <View className="mb-10 items-center">
                <View className="mb-6 h-32 w-32 items-center justify-center rounded-full bg-amber-50">
                  <Image
                    source={require('../../assets/Doctors-bro.png')}
                    style={{
                      width: 120,
                      height: 120,
                      resizeMode: 'contain',
                    }}
                    fadeDuration={200}
                  />
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

                <TouchableOpacity
                  className="overflow-hidden rounded-lg bg-blue-400 py-4"
                  onPress={handleVerifyOTP}
                  disabled={isVerifyingOtp}>
                  <Text className="text-center text-lg font-bold text-white">
                    {isVerifyingOtp ? 'Đang xác thực...' : 'Xác nhận'}
                  </Text>
                </TouchableOpacity>

                {verifyOtpError && (
                  <View className="mt-4 rounded-lg bg-red-50 p-3">
                    <Text className="text-center text-sm text-red-600">
                      {typeof verifyOtpError === 'string'
                        ? verifyOtpError
                        : (verifyOtpError as any)?.message || 'Mã xác thực không đúng'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Step 3: New Password */}
          {step === 'password' && (
            <View className="px-6">
              <View className="mb-10 items-center">
                <View className="mb-6 h-32 w-32 items-center justify-center rounded-full bg-amber-50">
                  <Image
                    source={require('../../assets/Medicine-bro.png')}
                    style={{
                      width: 120,
                      height: 120,
                      resizeMode: 'contain',
                    }}
                    fadeDuration={200}
                  />
                </View>
                <Text className="mb-3 text-3xl font-bold text-gray-800">Đặt lại mật khẩu</Text>
                <Text className="text-center text-base leading-6 text-gray-500">
                  Nhập mật khẩu mới cho tài khoản
                </Text>
              </View>

              <View className="gap-5">
                {/* New Password */}
                <View>
                  <View
                    className={`flex-row items-center rounded-lg px-4 py-4 ${passwordError ? 'border border-red-200 bg-red-50' : 'bg-gray-100'}`}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={passwordError ? '#EF4444' : '#000000'}
                    />
                    <TextInput
                      className="ml-3 flex-1 text-base text-gray-800"
                      placeholder="Mật khẩu mới (6+ ký tự, có IN HOA, số, ký tự đặc biệt)"
                      placeholderTextColor="#9CA3AF"
                      value={newPassword}
                      onChangeText={(text) => {
                        setNewPassword(text);
                        if (passwordError) setPasswordError('');
                      }}
                      secureTextEntry={!showNewPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      className="p-1">
                      <Ionicons
                        name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>
                  {passwordError && (
                    <Text className="mt-1 text-xs text-red-600">{passwordError}</Text>
                  )}
                </View>

                {/* Confirm Password */}
                <View>
                  <View
                    className={`flex-row items-center rounded-lg px-4 py-4 ${confirmPasswordError ? 'border border-red-200 bg-red-50' : 'bg-gray-100'}`}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={confirmPasswordError ? '#EF4444' : '#000000'}
                    />
                    <TextInput
                      className="ml-3 flex-1 text-base text-gray-800"
                      placeholder="Xác nhận mật khẩu"
                      placeholderTextColor="#9CA3AF"
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        if (confirmPasswordError) setConfirmPasswordError('');
                      }}
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
                  {confirmPasswordError && (
                    <Text className="mt-1 text-xs text-red-600">{confirmPasswordError}</Text>
                  )}
                </View>

                <TouchableOpacity
                  className="mt-2 overflow-hidden rounded-lg bg-blue-400 py-4"
                  onPress={handleResetPassword}
                  disabled={isResettingPassword}>
                  <Text className="text-center text-lg font-bold text-white">
                    {isResettingPassword ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                  </Text>
                </TouchableOpacity>

                {resetPasswordError && (
                  <View className="mt-4 rounded-lg bg-red-50 p-3">
                    <Text className="text-center text-sm text-red-600">
                      {typeof resetPasswordError === 'string'
                        ? resetPasswordError
                        : (resetPasswordError as any)?.message || 'Đặt lại mật khẩu thất bại'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View className="h-10" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
