// Re-export all types from type modules for convenient importing
export * from './appointment';
export * from './auth';
export * from './qna';
export * from './chat';
export * from './payment';
export * from './notification';
export * from './user';
export * from './video';
export * from './chatbot';
export * from './app-terms';

// Re-export doctor types, but exclude DoctorProfile to avoid conflict with auth
export type {
  Service,
  Doctor,
  Facility,
  Timeslot,
  DoctorFilters,
  ServiceFilters,
  DoctorAvailability,
  TimeSlot,
} from './doctor';
// DoctorProfile is exported from auth.ts

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

export interface ComponentTimeSlot {
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
