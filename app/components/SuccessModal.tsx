import { Ionicons } from '@expo/vector-icons';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

/** Màu success đồng bộ với màn thanh toán (qr-payment / payment index). */
export const SUCCESS_GREEN = '#10B981';
export const SUCCESS_GREEN_SOFT = '#D1FAE5';

export type SuccessModalProps = {
  visible: boolean;
  title: string;
  message?: string;
  primaryLabel?: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Default: onPrimary — chỉ 1 lần navigate/dismiss, tránh double. */
  onRequestClose?: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
};

/**
 * Modal thông báo thành công dùng chung.
 * Chỉ mount 1 instance / màn; caller phải tắt Alert song song để không double notify.
 */
export default function SuccessModal({
  visible,
  title,
  message,
  primaryLabel = 'OK',
  onPrimary,
  secondaryLabel,
  onSecondary,
  onRequestClose,
  iconName = 'checkmark-circle',
}: SuccessModalProps) {
  const handleClose = onRequestClose ?? onPrimary;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={handleClose}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-sm items-center rounded-2xl bg-white p-8 shadow-sm">
          <View
            className="mb-4 h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: SUCCESS_GREEN_SOFT }}>
            <Ionicons name={iconName} size={56} color={SUCCESS_GREEN} />
          </View>

          <Text
            className="mb-2 text-center text-xl font-bold"
            style={{ color: SUCCESS_GREEN }}>
            {title}
          </Text>

          {message ? (
            <Text className="mb-6 text-center text-base leading-6 text-gray-600">
              {message}
            </Text>
          ) : (
            <View className="mb-6" />
          )}

          <TouchableOpacity
            onPress={onPrimary}
            activeOpacity={0.85}
            className="w-full items-center rounded-xl py-3.5"
            style={{ backgroundColor: SUCCESS_GREEN }}>
            <Text className="text-base font-semibold text-white">{primaryLabel}</Text>
          </TouchableOpacity>

          {secondaryLabel && onSecondary ? (
            <TouchableOpacity
              onPress={onSecondary}
              activeOpacity={0.85}
              className="mt-3 w-full items-center rounded-xl border-2 py-3.5"
              style={{ borderColor: SUCCESS_GREEN, backgroundColor: 'white' }}>
              <Text className="text-base font-semibold" style={{ color: SUCCESS_GREEN }}>
                {secondaryLabel}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
