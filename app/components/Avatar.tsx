import React from 'react';
import { View, Text, Image, ImageStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AvatarProps {
  source?: string;
  name: string;
  size?: number;
  role?: string;
  style?: ViewStyle;
}

export function Avatar({ source, name, size = 40, role, style }: AvatarProps) {
  const roleBadge = getRoleBadgeColor(role);

  const avatarStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: '#F3F4F6',
    ...style,
  };

  if (source) {
    return (
      <Image
        source={{ uri: source }}
        style={avatarStyle}
      />
    );
  }

  return (
    <View
      style={{
        ...avatarStyle,
        backgroundColor: roleBadge.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        style={{
          fontSize: size * 0.4,
          fontWeight: 'bold',
          color: roleBadge.text,
        }}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

function getRoleBadgeColor(role?: string) {
  switch (role) {
    case 'DOCTOR':
      return { bg: '#DBEAFE', text: '#1E40AF' };
    case 'RECEPTIONIST':
      return { bg: '#F3E8FF', text: '#7C3AED' };
    case 'ADMIN':
      return { bg: '#FEE2E2', text: '#DC2626' };
    case 'PATIENT':
      return { bg: '#D1FAE5', text: '#065F46' };
    default:
      return { bg: '#F3F4F6', text: '#6B7280' };
  }
}