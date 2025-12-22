import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GenderSelectorProps {
  selectedGender: 'MALE' | 'FEMALE' | null;
  onGenderSelect: (gender: 'MALE' | 'FEMALE') => void;
  error?: string;
  disabled?: boolean;
}

const genderOptions = [
  {
    value: 'MALE' as const,
    label: 'Nam',
    icon: 'male' as const,
  },
  {
    value: 'FEMALE' as const,
    label: 'Nữ',
    icon: 'female' as const,
  },
];

export default function GenderSelector({
  selectedGender,
  onGenderSelect,
  error,
  disabled = false,
}: GenderSelectorProps) {
  return (
    <View
      onStartShouldSetResponderCapture={() => false}
      onMoveShouldSetResponderCapture={() => false}>
      <View className="mb-4">
        <Text className="text-lg font-bold text-slate-900">Giới tính *</Text>
      </View>

      <View className="flex-row gap-4">
        {genderOptions.map((option) => {
          const isSelected = selectedGender === option.value;
          const isMale = option.value === 'MALE';
          const hasSelection = selectedGender !== null;

          // Xác định màu sắc dựa trên trạng thái
          let backgroundColor = '#FFFFFF';
          let borderColor = '#E2E8F0'; // slate-200
          let iconColor = '#64748B'; // slate-500
          let textColor = '#334155'; // slate-700
          let borderWidth = 1;

          // Logic mới: Ưu tiên hiển thị trạng thái Selected trước, kể cả khi Disabled
          if (isSelected) {
            if (isMale) {
              backgroundColor = '#0EA5E9'; // sky-500
              borderColor = '#0284C7'; // sky-600
              iconColor = '#FFFFFF';
              textColor = '#FFFFFF';
            } else {
              backgroundColor = '#EC4899'; // pink-500
              borderColor = '#DB2777'; // pink-600
              iconColor = '#FFFFFF';
              textColor = '#FFFFFF';
            }
          } else if (disabled) {
            // Nếu disabled và KHÔNG được chọn -> Hiển thị mờ nhạt (xám)
            backgroundColor = '#F8FAFC'; // slate-50
            borderColor = '#E2E8F0'; // slate-200
            iconColor = '#94A3B8'; // slate-400
            textColor = '#94A3B8'; // slate-400
          } else if (hasSelection) {
            // Khi cái kia được chọn -> cái này mờ đi
            backgroundColor = '#F8FAFC'; // slate-50
            borderColor = '#E2E8F0'; // slate-200
            iconColor = '#64748B'; // slate-500
            textColor = '#64748B'; // slate-500
          } else {
            // Trạng thái ban đầu (chưa có gì được chọn)
            if (isMale) {
              backgroundColor = '#F0F9FF'; // sky-50
              borderColor = '#BAE6FD'; // sky-200
              iconColor = '#0369A1'; // sky-700
              textColor = '#075985'; // sky-800
            } else {
              backgroundColor = '#FDF2F8'; // pink-50
              borderColor = '#FBCFE8'; // pink-200
              iconColor = '#BE185D'; // pink-700
              textColor = '#9D174D'; // pink-800
            }
          }

          if (error && !isSelected && !disabled) {
            borderColor = '#FCA5A5'; // red-300
          }

          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => !disabled && onGenderSelect(option.value)}
              disabled={disabled}
              activeOpacity={0.7}
              delayPressIn={0}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                backgroundColor,
                borderColor,
                borderWidth,
                // Shadow nhẹ
                shadowColor: isSelected ? (isMale ? '#0EA5E9' : '#EC4899') : '#000',
                shadowOffset: { width: 0, height: isSelected ? 2 : 1 },
                shadowOpacity: isSelected ? 0.3 : 0.05,
                shadowRadius: isSelected ? 4 : 2,
                elevation: isSelected ? 3 : 1,
              }}>
              <Ionicons name={option.icon} size={20} color={iconColor} />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 16,
                  color: textColor,
                  fontWeight: isSelected ? '600' : '500'
                }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {error && <Text className="mt-1 text-xs text-red-600">{error}</Text>}
    </View>
  );
}
