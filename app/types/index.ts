// Appointment related types
export type BookingType = 'doctor' | 'specialty' | 'symptom';

export interface Specialty {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience?: string;
  rating?: number;
  avatar?: string;
  available?: boolean;
}

export interface TimeSlot {
  time: string;
  label: string;
  available: boolean;
}

export interface DateOption {
  date: string;
  label: string;
  day: string;
  isToday?: boolean;
  isTomorrow?: boolean;
  isDayAfter?: boolean;
}

// Customer related types
export type Gender = 'male' | 'female';
export type CustomerType = 'me' | 'add';

// Component props types
export interface DatePickerProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  placeholder?: string;
}

export interface TimePickerProps {
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  placeholder?: string;
  availableTimes?: string[];
}

// Appointment form data
export interface AppointmentFormData {
  bookingType: BookingType;
  selectedSpecialty?: string;
  selectedDoctor?: string;
  selectedDate: string;
  selectedTime: string;
  reason: string;
  customerInfo: {
    fullName: string;
    dateOfBirth: string;
    phoneNumber: string;
    gender: Gender;
    isForeigner: boolean;
  };
  location?: string;
}
