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
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { validatePassword, validateName, validatePhone } from '@/lib/utils/validation';
import BirthDatePicker from '@/components/BirthDatePicker';
import GenderSelector from '@/components/GenderSelector';
import OtpInput from '@/components/OtpInput';

type RegisterStep = 'email' | 'otp' | 'info';

export default function RegisterScreen() {
  const router = useRouter();
  const {
    register,
    verifyEmail,
    completeRegister,
    isRegistering,
    isVerifyingEmail,
    isCompletingRegister,
    registerError,
    verifyEmailError,
    completeRegisterError,
  } = useAuth();

  const [step, setStep] = useState<RegisterStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | null>(null);

  // Validation errors
  const [emailError, setEmailError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [dateOfBirthError, setDateOfBirthError] = useState('');
  const [genderError, setGenderError] = useState('');

  const handleSendOTP = async () => {
    // Clear previous errors
    setEmailError('');

    // Validate email
    if (!email.trim()) {
      setEmailError('Vui lòng nhập email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Email không hợp lệ');
      return;
    }

    try {
      await register(email);
      setStep('otp');
    } catch { }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ 6 số');
      return;
    }

    try {
      await verifyEmail(email, otpCode);
      setStep('info');
    } catch {
      // Error is handled by useAuth hook and displayed in UI
    }
  };

  const handleRegister = async () => {
    // Clear previous errors
    setFirstNameError('');
    setLastNameError('');
    setPhoneError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setDateOfBirthError('');
    setGenderError('');

    // Validate first name
    const firstNameValidation = validateName(firstName);
    if (!firstNameValidation.isValid) {
      setFirstNameError(firstNameValidation.message || 'Tên không hợp lệ');
      return;
    }

    // Validate last name
    const lastNameValidation = validateName(lastName);
    if (!lastNameValidation.isValid) {
      setLastNameError(lastNameValidation.message || 'Họ không hợp lệ');
      return;
    }

    // Validate phone
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.message || 'Số điện thoại không hợp lệ');
      return;
    }

    // Validate date of birth
    if (!dateOfBirth) {
      setDateOfBirthError('Vui lòng chọn ngày sinh');
      return;
    }

    // Validate gender
    if (!gender) {
      setGenderError('Vui lòng chọn giới tính');
      return;
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError('Vui lòng nhập mật khẩu');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.message || 'Mật khẩu không hợp lệ');
      return;
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Vui lòng xác nhận mật khẩu');
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      await completeRegister({
        email,
        otp: otp.join(''),
        firstName,
        lastName,
        phone,
        password,
        dateOfBirth: dateOfBirth!.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        gender: gender!,
        role: 'PATIENT',
      });
      Alert.alert('Thành công', 'Đăng ký thành công!', [
        { text: 'OK', onPress: () => router.push('/(auth)/login') },
      ]);
    } catch {
      // Error is handled by useAuth hook and displayed in UI
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
                        if (emailError) setEmailError(''); // Clear error when user types
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
                  disabled={isRegistering}>
                  <Text className="text-center text-lg font-bold text-white">
                    {isRegistering ? 'Đang gửi...' : 'Gửi mã xác thực'}
                  </Text>
                </TouchableOpacity>

                {/* Error Message */}
                {registerError && (
                  <View className="mt-4 rounded-lg bg-red-50 p-3">
                    <Text className="text-center text-sm text-red-600">
                      {typeof registerError === 'string'
                        ? registerError
                        : registerError?.message || 'Không thể gửi mã xác thực'}
                    </Text>
                  </View>
                )}
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
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  length={6}
                  onResendOTP={handleSendOTP}
                />

                <TouchableOpacity
                  className="overflow-hidden rounded-lg bg-blue-400 py-4"
                  onPress={handleVerifyOTP}
                  disabled={isVerifyingEmail}>
                  <Text className="text-center text-lg font-bold text-white">
                    {isVerifyingEmail ? 'Đang xác thực...' : 'Xác nhận'}
                  </Text>
                </TouchableOpacity>

                {/* Error Message */}
                {verifyEmailError && (
                  <View className="mt-4 rounded-lg bg-red-50 p-3">
                    <Text className="text-center text-sm text-red-600">
                      {typeof verifyEmailError === 'string'
                        ? verifyEmailError
                        : verifyEmailError?.message || 'Mã xác thực không đúng'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Step 3: Basic Info */}
          {step === 'info' && (
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
                <Text className="mb-3 text-3xl font-bold text-gray-800">Thông tin cá nhân</Text>
                <Text className="text-center text-base leading-6 text-gray-500">
                  Hoàn tất thông tin để tạo tài khoản
                </Text>
              </View>

              <View className="gap-5">
                {/* First Name */}
                <View>
                  <View
                    className={`flex-row items-center rounded-lg px-4 py-4 ${firstNameError ? 'border border-red-200 bg-red-50' : 'bg-gray-100'}`}>
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={firstNameError ? '#EF4444' : '#000000'}
                    />
                    <TextInput
                      className="ml-3 flex-1 text-base text-gray-800"
                      placeholder="Tên"
                      placeholderTextColor="#9CA3AF"
                      value={firstName}
                      onChangeText={(text) => {
                        setFirstName(text);
                        if (firstNameError) setFirstNameError(''); // Clear error when user types
                      }}
                    />
                  </View>
                  {firstNameError && (
                    <Text className="mt-1 text-xs text-red-600">{firstNameError}</Text>
                  )}
                </View>

                {/* Last Name */}
                <View>
                  <View
                    className={`flex-row items-center rounded-lg px-4 py-4 ${lastNameError ? 'border border-red-200 bg-red-50' : 'bg-gray-100'}`}>
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={lastNameError ? '#EF4444' : '#000000'}
                    />
                    <TextInput
                      className="ml-3 flex-1 text-base text-gray-800"
                      placeholder="Họ"
                      placeholderTextColor="#9CA3AF"
                      value={lastName}
                      onChangeText={(text) => {
                        setLastName(text);
                        if (lastNameError) setLastNameError(''); // Clear error when user types
                      }}
                    />
                  </View>
                  {lastNameError && (
                    <Text className="mt-1 text-xs text-red-600">{lastNameError}</Text>
                  )}
                </View>

                {/* Phone */}
                <View>
                  <View
                    className={`flex-row items-center rounded-lg px-4 py-4 ${phoneError ? 'border border-red-200 bg-red-50' : 'bg-gray-100'}`}>
                    <Ionicons
                      name="call-outline"
                      size={20}
                      color={phoneError ? '#EF4444' : '#000000'}
                    />
                    <TextInput
                      className="ml-3 flex-1 text-base text-gray-800"
                      placeholder="Số điện thoại"
                      placeholderTextColor="#9CA3AF"
                      value={phone}
                      onChangeText={(text) => {
                        setPhone(text);
                        if (phoneError) setPhoneError(''); // Clear error when user types
                      }}
                      keyboardType="phone-pad"
                    />
                  </View>
                  {phoneError && <Text className="mt-1 text-xs text-red-600">{phoneError}</Text>}
                </View>

                {/* Date of Birth */}
                <View>
                  <BirthDatePicker
                    selectedDate={dateOfBirth}
                    onDateSelect={setDateOfBirth}
                    placeholder="Chọn ngày sinh"
                    error={dateOfBirthError}
                  />
                </View>

                {/* Gender */}
                <View>
                  <GenderSelector
                    selectedGender={gender}
                    onGenderSelect={setGender}
                    error={genderError}
                  />
                </View>

                {/* Password */}
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
                      placeholder="Mật khẩu (6+ ký tự, có IN HOA, số, ký tự đặc biệt)"
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
                      className="p-1">
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
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
                        if (confirmPasswordError) setConfirmPasswordError(''); // Clear error when user types
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
                  onPress={handleRegister}
                  disabled={isCompletingRegister}>
                  <Text className="text-center text-lg font-bold text-white">
                    {isCompletingRegister ? 'Đang đăng ký...' : 'Hoàn tất đăng ký'}
                  </Text>
                </TouchableOpacity>

                {/* Error Message */}
                {completeRegisterError && (
                  <View className="mt-4 rounded-lg bg-red-50 p-3">
                    <Text className="text-center text-sm text-red-600">
                      {typeof completeRegisterError === 'string'
                        ? completeRegisterError
                        : completeRegisterError?.message || 'Đăng ký thất bại'}
                    </Text>
                  </View>
                )}
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
