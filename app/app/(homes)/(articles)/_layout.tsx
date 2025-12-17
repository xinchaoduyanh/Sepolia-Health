import React from 'react';
import { Stack } from 'expo-router';

export default function ArticlesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          href: null // Ẩn khỏi tab bar
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
          href: null // Ẩn khỏi tab bar
        }}
      />
    </Stack>
  );
}