import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GenderSelectorProps {
  selectedGender: 'MALE' | 'FEMALE' | 'OTHER' | null;
  onGenderSelect: (gender: 'MALE' | 'FEMALE' | 'OTHER') => void;
  error?: string;
}

const genderOptions = [
  {
    value: 'MALE' as const,
    label: 'Nam',
    icon: 'male' as const,
    selectedColor: '#0284C7',
    unselectedColor: '#06B6D4',
  },
  {
    value: 'FEMALE' as const,
    label: 'Nữ',
    icon: 'female' as const,
    selectedColor: '#0284C7',
    unselectedColor: '#06B6D4',
  },
  {
    value: 'OTHER' as const,
    label: 'Khác',
    icon: 'person' as const,
    selectedColor: '#0284C7',
    unselectedColor: '#06B6D4',
  },
];

export default function GenderSelector({
  selectedGender,
  onGenderSelect,
  error,
}: GenderSelectorProps) {
  return (
    <View>
      <View className="mb-4">
        <Text className="text-lg font-bold text-slate-900">Giới tính *</Text>
      </View>

      <View className="flex-row space-x-4">
        {genderOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => onGenderSelect(option.value)}
            className={`flex-1 flex-row items-center justify-center rounded-xl border-2 px-5 py-4 ${
              selectedGender === option.value
                ? 'border-sky-600'
                : error
                  ? 'border-red-200'
                  : 'border-cyan-100'
            }`}
            style={{
              backgroundColor:
                selectedGender === option.value ? '#E0F2FE' : error ? '#FEF2F2' : '#F0FDFA',
            }}>
            <Ionicons
              name={option.icon}
              size={22}
              color={
                selectedGender === option.value
                  ? option.selectedColor
                  : error
                    ? '#EF4444'
                    : option.unselectedColor
              }
            />
            <Text
              className={`ml-3 text-lg font-medium ${
                selectedGender === option.value
                  ? 'text-sky-600'
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
