import { useForgotPassword } from '@/lib/hooks/useFogotPassword';
import { router } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';

export default function ForgotPasswordScreen() {
  const { email, setEmail, handleForgotPassword, isLoading, error } = useForgotPassword();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="pt- flex-1 bg-white px-10 pt-7">
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

      <View className="mb-10">
        <Text className="mb-2 text-3xl font-bold text-blue-500">Quên mật khẩu</Text>
        <Text className="text-gray-500">
          Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.
        </Text>
      </View>

      {/* Input */}
      <View className="mb-6">
        <Text className="mb-2 font-medium text-gray-700">Email</Text>
        <TextInput
          className="rounded-xl border border-gray-300 px-4 py-3 text-base"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        onPress={() => handleForgotPassword(email)}
        className="mb-4 rounded-xl bg-blue-500 py-4 shadow-sm active:opacity-90">
        <Text className="text-center text-base font-semibold text-white">Gửi liên kết đặt lại</Text>
      </TouchableOpacity>

      {/* Back to Login */}
      <TouchableOpacity onPress={() => router.back()}>
        <Text className="text-center font-medium text-blue-500">← Quay lại đăng nhập</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
