import React from 'react';
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
    selectedColor: '#0284C7',
    unselectedColor: '#9CA3AF',
  },
  {
    value: 'FEMALE' as const,
    label: 'Nữ',
    icon: 'female' as const,
    selectedColor: '#DB2777',
    unselectedColor: '#9CA3AF',
  },
];

export default function GenderSelector({
  selectedGender,
  onGenderSelect,
  error,
  disabled = false,
}: GenderSelectorProps) {
  return (
    <View>
      <View className="mb-4">
        <Text className="text-lg font-bold text-slate-900">Giới tính *</Text>
      </View>

      <View className="flex-row gap-3">
        {genderOptions.map((option) => (
          <TouchableOpacity
            activeOpacity={1}
            key={option.value}
            onPress={() => !disabled && onGenderSelect(option.value)}
            disabled={disabled}
            className={`flex-1 flex-row items-center justify-center rounded-xl border-2 px-5 py-4 ${
              selectedGender === option.value
                ? option.value === 'FEMALE'
                  ? 'border-pink-500'
                  : 'border-sky-600'
                : error
                  ? 'border-red-200'
                  : 'border-cyan-100'
            }`}
            style={{
              backgroundColor: disabled
                ? '#F3F4F6'
                : selectedGender === option.value
                  ? option.value === 'FEMALE'
                    ? '#FCE7F3'
                    : '#E0F2FE'
                  : error
                    ? '#FEF2F2'
                    : '#F0FDFA',
            }}>
            <Ionicons
              name={option.icon}
              size={22}
              color={
                disabled
                  ? '#9CA3AF'
                  : selectedGender === option.value
                    ? option.selectedColor
                    : error
                      ? '#EF4444'
                      : option.unselectedColor
              }
            />
            <Text
              className={`ml-3 text-lg font-medium ${
                disabled
                  ? 'text-gray-400'
                  : selectedGender === option.value
                    ? option.value === 'FEMALE'
                      ? 'text-pink-600'
                      : 'text-sky-600'
                    : error
                      ? 'text-red-600'
                      : 'text-slate-600'
              }`}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && <Text className="mt-1 text-xs text-red-600">{error}</Text>}
    </View>
  );
}
