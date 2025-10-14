// Export all types
export * from './auth';
export * from './appointment';
export * from './doctor';

// Additional types for components
export interface DatePickerProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  placeholder?: string;
}

export interface DateOption {
  date: string;
  label: string;
  day: string;
  isToday: boolean;
  isTomorrow: boolean;
  isDayAfter: boolean;
}

export interface TimePickerProps {
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  placeholder?: string;
  availableTimes?: string[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export type BookingType = 'doctor' | 'specialty' | 'symptom';

export interface Specialty {
  id: number;
  name: string;
  description?: string;
  icon?: string;
}

export type CustomerType = 'self' | 'other';
