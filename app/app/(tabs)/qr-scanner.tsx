import { View, Text, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"

export default function QRScannerScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-8 h-32 w-32 items-center justify-center rounded-full bg-blue-100">
          <Ionicons name="qr-code" size={64} color="#3B82F6" />
        </View>

        <Text className="mb-4 text-2xl font-bold text-gray-800">Quét mã QR</Text>
        <Text className="mb-8 text-center text-gray-600">
          Tính năng quét mã QR sẽ được phát triển trong phiên bản tiếp theo
        </Text>

        <TouchableOpacity className="rounded-lg bg-blue-600 px-8 py-4">
          <Text className="text-lg font-semibold text-white">Mở máy quét</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
