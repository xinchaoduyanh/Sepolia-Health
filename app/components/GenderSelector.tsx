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
    color: '#3B82F6',
  },
  {
    value: 'FEMALE' as const,
    label: 'Nữ',
    icon: 'female' as const,
    color: '#EC4899',
  },
  {
    value: 'OTHER' as const,
    label: 'Khác',
    icon: 'person' as const,
    color: '#6B7280',
  },
];

export default function GenderSelector({
  selectedGender,
  onGenderSelect,
  error,
}: GenderSelectorProps) {
  return (
    <View>
      <View className="mb-3">
        <Text className="text-base font-medium text-gray-700">Giới tính *</Text>
      </View>
      
      <View className="flex-row space-x-3">
        {genderOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => onGenderSelect(option.value)}
            className={`flex-1 flex-row items-center justify-center rounded-lg px-4 py-4 ${
              selectedGender === option.value
                ? 'border-2 border-blue-400 bg-blue-50'
                : error
                ? 'border border-red-200 bg-red-50'
                : 'border border-gray-200 bg-white'
            }`}>
            <Ionicons
              name={option.icon}
              size={20}
              color={
                selectedGender === option.value
                  ? option.color
                  : error
                  ? '#EF4444'
                  : '#6B7280'
              }
            />
            <Text
              className={`ml-2 font-medium ${
                selectedGender === option.value
                  ? 'text-blue-700'
                  : error
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {error && (
        <Text className="mt-1 text-xs text-red-600">{error}</Text>
      )}
    </View>
  );
}
