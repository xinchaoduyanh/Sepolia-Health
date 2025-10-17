import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';

// Test function to verify overlap logic
const testOverlapLogic = () => {
  // Simulate existing appointment: 8:00 - 9:30
  const existingAppointment = {
    startTime: '08:00',
    endTime: '09:30',
  };

  // Test cases
  const testCases = [
    {
      start: '07:00',
      end: '09:30',
      shouldOverlap: true,
      description: '7:00-9:30 (overlaps with 8:00-9:30)',
    },
    {
      start: '07:30',
      end: '10:00',
      shouldOverlap: true,
      description: '7:30-10:00 (overlaps with 8:00-9:30)',
    },
    {
      start: '08:30',
      end: '10:00',
      shouldOverlap: true,
      description: '8:30-10:00 (overlaps with 8:00-9:30)',
    },
    {
      start: '09:00',
      end: '10:30',
      shouldOverlap: true,
      description: '9:00-10:30 (overlaps with 8:00-9:30)',
    },
    {
      start: '09:30',
      end: '11:00',
      shouldOverlap: false,
      description: '9:30-11:00 (no overlap with 8:00-9:30)',
    },
    {
      start: '10:00',
      end: '11:30',
      shouldOverlap: false,
      description: '10:00-11:30 (no overlap with 8:00-9:30)',
    },
    {
      start: '07:00',
      end: '08:00',
      shouldOverlap: false,
      description: '7:00-8:00 (no overlap with 8:00-9:30)',
    },
  ];

  // Convert time to minutes
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Check overlap logic (same as backend)
  const checkOverlap = (
    slotStart: string,
    slotEnd: string,
    aptStart: string,
    aptEnd: string
  ): boolean => {
    const slotStartMin = timeToMinutes(slotStart);
    const slotEndMin = timeToMinutes(slotEnd);
    const aptStartMin = timeToMinutes(aptStart);
    const aptEndMin = timeToMinutes(aptEnd);

    // Check for overlap: slot must not overlap with existing appointment
    return slotStartMin < aptEndMin && slotEndMin > aptStartMin;
  };

  // Test all cases
  const results = testCases.map((testCase) => {
    const hasOverlap = checkOverlap(
      testCase.start,
      testCase.end,
      existingAppointment.startTime,
      existingAppointment.endTime
    );

    const isCorrect = hasOverlap === testCase.shouldOverlap;

    return {
      ...testCase,
      hasOverlap,
      isCorrect,
    };
  });

  // Show results
  const correctCount = results.filter((r) => r.isCorrect).length;
  const totalCount = results.length;

  const message = `
Overlap Logic Test Results:
${results
  .map(
    (r) =>
      `${r.isCorrect ? '✅' : '❌'} ${r.description} - ${r.hasOverlap ? 'OVERLAP' : 'NO OVERLAP'}`
  )
  .join('\n')}

Correct: ${correctCount}/${totalCount}
${correctCount === totalCount ? '🎉 All tests passed!' : '⚠️ Some tests failed!'}
  `;

  Alert.alert('Overlap Test Results', message);
};

export default function OverlapTest() {
  return (
    <View className="p-4">
      <TouchableOpacity onPress={testOverlapLogic} className="rounded-lg bg-blue-500 px-4 py-2">
        <Text className="text-center font-medium text-white">Test Overlap Logic</Text>
      </TouchableOpacity>
    </View>
  );
}
