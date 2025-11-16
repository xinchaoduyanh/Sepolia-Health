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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { useState } from 'react';
import { useChangePassword } from '@/lib/api/auth';
import { validatePassword } from '@/lib/utils/validation';

export default function ChangePasswordScreen() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation errors
  const [oldPasswordError, setOldPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const { mutate: changePassword, isPending } = useChangePassword();

  const handleChangePassword = () => {
    // Clear previous errors
    setOldPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');

    let hasError = false;

    // Validate old password
    if (!oldPassword.trim()) {
      setOldPasswordError('Vui lòng nhập mật khẩu cũ');
      hasError = true;
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setNewPasswordError(passwordValidation.message || '');
      hasError = true;
    }

    // Validate confirm password
    if (!confirmNewPassword.trim()) {
      setConfirmPasswordError('Vui lòng nhập lại mật khẩu mới');
      hasError = true;
    } else if (newPassword !== confirmNewPassword) {
      setConfirmPasswordError('Mật khẩu nhập lại không khớp');
      hasError = true;
    }

    // Check if new password is same as old password
    if (oldPassword && newPassword && oldPassword === newPassword) {
      setNewPasswordError('Mật khẩu mới phải khác mật khẩu cũ');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    // Call API
    changePassword(
      {
        oldPassword,
        newPassword,
      },
      {
        onSuccess: () => {
          Alert.alert('Thành công', 'Đổi mật khẩu thành công', [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]);
        },
        onError: (error: any) => {
          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            'Đổi mật khẩu thất bại. Vui lòng thử lại.';
          Alert.alert('Lỗi', errorMessage);
        },
      }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          scrollEventThrottle={16}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}>
          {/* Background Gradient */}
          <View style={{ height: 280, position: 'relative', marginTop: -60 }}>
            <LinearGradient
              colors={['#0284C7', '#06B6D4', '#10B981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            />
            {/* Curved bottom edge using SVG */}
            <Svg
              height="70"
              width="200%"
              viewBox="0 0 1440 120"
              style={{ position: 'absolute', bottom: -1, left: 0, right: 0 }}>
              <Path d="M0,0 Q720,120 1440,0 L1440,120 L0,120 Z" fill="#E0F2FE" />
            </Svg>

            {/* Decorative circles */}
            <View
              style={{
                position: 'absolute',
                top: -40,
                right: -40,
                height: 120,
                width: 120,
                borderRadius: 60,
                backgroundColor: 'rgba(255,255,255,0.12)',
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 80,
                left: -30,
                height: 100,
                width: 100,
                borderRadius: 50,
                backgroundColor: 'rgba(255,255,255,0.08)',
              }}
            />

            {/* Header positioned within gradient */}
            <View
              style={{
                position: 'absolute',
                top: 100,
                left: 24,
                right: 24,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  height: 40,
                  width: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  marginRight: 12,
                }}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', flex: 1 }}>
                Đổi mật khẩu
              </Text>
            </View>
          </View>

          {/* Content */}
          <View style={{ paddingHorizontal: 24, marginTop: -80, marginBottom: 24 }}>
            {/* Old Password Input */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: '600', color: '#1E293B' }}>
                Mật khẩu cũ
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  backgroundColor: oldPasswordError ? '#FEF2F2' : '#FFFFFF',
                  borderWidth: oldPasswordError ? 1 : 0,
                  borderColor: oldPasswordError ? '#FECACA' : 'transparent',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={oldPasswordError ? '#EF4444' : '#64748B'}
                />
                <TextInput
                  style={{
                    marginLeft: 12,
                    flex: 1,
                    fontSize: 16,
                    color: '#1E293B',
                  }}
                  placeholder="Nhập mật khẩu cũ"
                  placeholderTextColor="#94A3B8"
                  value={oldPassword}
                  onChangeText={(text) => {
                    setOldPassword(text);
                    if (oldPasswordError) setOldPasswordError('');
                  }}
                  secureTextEntry={!showOldPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowOldPassword(!showOldPassword)}
                  style={{ padding: 4 }}
                  activeOpacity={0.7}>
                  <Image
                    source={
                      showOldPassword
                        ? require('../../../assets/pepe_open_eye.png')
                        : require('../../../assets/pepe_cover_eye.png')
                    }
                    style={{ width: 30, height: 30 }}
                  />
                </TouchableOpacity>
              </View>
              {oldPasswordError && (
                <Text style={{ marginTop: 6, fontSize: 12, color: '#EF4444' }}>
                  {oldPasswordError}
                </Text>
              )}
            </View>

            {/* New Password Input */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: '600', color: '#1E293B' }}>
                Mật khẩu mới
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  backgroundColor: newPasswordError ? '#FEF2F2' : '#FFFFFF',
                  borderWidth: newPasswordError ? 1 : 0,
                  borderColor: newPasswordError ? '#FECACA' : 'transparent',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={newPasswordError ? '#EF4444' : '#64748B'}
                />
                <TextInput
                  style={{
                    marginLeft: 12,
                    flex: 1,
                    fontSize: 16,
                    color: '#1E293B',
                  }}
                  placeholder="Nhập mật khẩu mới (6+ ký tự, có IN HOA, số, ký tự đặc biệt)"
                  placeholderTextColor="#94A3B8"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (newPasswordError) setNewPasswordError('');
                    // Clear confirm password error if passwords match
                    if (confirmPasswordError && text === confirmNewPassword) {
                      setConfirmPasswordError('');
                    }
                  }}
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={{ padding: 4 }}
                  activeOpacity={0.7}>
                  <Image
                    source={
                      showNewPassword
                        ? require('../../../assets/pepe_open_eye.png')
                        : require('../../../assets/pepe_cover_eye.png')
                    }
                    style={{ width: 30, height: 30 }}
                  />
                </TouchableOpacity>
              </View>
              {newPasswordError && (
                <Text style={{ marginTop: 6, fontSize: 12, color: '#EF4444' }}>
                  {newPasswordError}
                </Text>
              )}
            </View>

            {/* Confirm New Password Input */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: '600', color: '#1E293B' }}>
                Nhập lại mật khẩu mới
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  backgroundColor: confirmPasswordError ? '#FEF2F2' : '#FFFFFF',
                  borderWidth: confirmPasswordError ? 1 : 0,
                  borderColor: confirmPasswordError ? '#FECACA' : 'transparent',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={confirmPasswordError ? '#EF4444' : '#64748B'}
                />
                <TextInput
                  style={{
                    marginLeft: 12,
                    flex: 1,
                    fontSize: 16,
                    color: '#1E293B',
                  }}
                  placeholder="Nhập lại mật khẩu mới"
                  placeholderTextColor="#94A3B8"
                  value={confirmNewPassword}
                  onChangeText={(text) => {
                    setConfirmNewPassword(text);
                    if (confirmPasswordError) {
                      // Clear error if passwords now match
                      if (text === newPassword) {
                        setConfirmPasswordError('');
                      } else {
                        setConfirmPasswordError('Mật khẩu nhập lại không khớp');
                      }
                    }
                  }}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ padding: 4 }}
                  activeOpacity={0.7}>
                  <Image
                    source={
                      showConfirmPassword
                        ? require('../../../assets/pepe_open_eye.png')
                        : require('../../../assets/pepe_cover_eye.png')
                    }
                    style={{ width: 30, height: 30 }}
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError && (
                <Text style={{ marginTop: 6, fontSize: 12, color: '#EF4444' }}>
                  {confirmPasswordError}
                </Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={isPending}
              style={{
                marginTop: 8,
                marginBottom: 24,
                overflow: 'hidden',
                borderRadius: 12,
                paddingVertical: 16,
                backgroundColor: isPending ? '#94A3B8' : '#0284C7',
                shadowColor: '#0284C7',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
              activeOpacity={0.8}>
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                }}>
                {isPending ? 'Đang xử lý...' : 'Đổi mật khẩu'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
