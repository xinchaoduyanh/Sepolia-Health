import React from 'react';
import { View, Text } from 'react-native';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { DateHeaderProps } from 'stream-chat-expo';

export const CustomDateSeparator = (props: DateHeaderProps) => {
  // Safely parse date with fallback
  let date: Date;
  try {
    if (props.dateString) {
      date = new Date(props.dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        date = new Date();
      }
    } else {
      date = new Date();
    }
  } catch {
    console.warn('Invalid date in CustomDateSeparator:', props.dateString);
    date = new Date();
  }

  const formatDate = (date: Date) => {
    try {
      if (isToday(date)) {
        return 'Hôm nay';
      } else if (isYesterday(date)) {
        return 'Hôm qua';
      } else {
        return format(date, 'EEEE, dd MMMM yyyy', { locale: vi });
      }
    } catch {
      console.warn('Error formatting date');
      return 'Hôm nay';
    }
  };

  // Don't show "Hôm nay" separator if no messages yet or for better UX
  // Only show date separators for previous days
  if (isToday(date)) {
    return null;
  }

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 16,
      }}>
      <View
        style={{
          backgroundColor: '#E2E8F0',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: '#64748B',
            textTransform: 'capitalize',
          }}>
          {formatDate(date)}
        </Text>
      </View>
    </View>
  );
};
