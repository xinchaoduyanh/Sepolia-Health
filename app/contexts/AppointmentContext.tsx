import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppointmentContextType {
  selectedSpecialty: string;
  selectedDoctor: string;
  selectedFacility: { id: number; name: string } | null;
  selectedService: { id: number; name: string; price: number; duration: number } | null;
  selectedDoctorServiceId: number | null;
  selectedDate: string | null;
  selectedTimeSlot: string | null;
  // Patient form fields
  selectedCustomer: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  phoneNumber: string;
  gender: 'MALE' | 'FEMALE' | null;
  patientDescription: string;
  setSelectedSpecialty: (specialty: string) => void;
  setSelectedDoctor: (doctor: string) => void;
  setSelectedFacility: (facility: { id: number; name: string } | null) => void;
  setSelectedService: (service: { id: number; name: string; price: number; duration: number } | null) => void;
  setSelectedDoctorServiceId: (id: number | null) => void;
  setSelectedDate: (date: string | null) => void;
  setSelectedTimeSlot: (time: string | null) => void;
  // Patient form setters
  setSelectedCustomer: (customer: string) => void;
  setFirstName: (name: string) => void;
  setLastName: (name: string) => void;
  setDateOfBirth: (date: Date | null) => void;
  setPhoneNumber: (phone: string) => void;
  setGender: (gender: 'MALE' | 'FEMALE' | null) => void;
  setPatientDescription: (description: string) => void;
  clearSelections: () => void;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const useAppointment = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointment must be used within an AppointmentProvider');
  }
  return context;
};

interface AppointmentProviderProps {
  children: ReactNode;
}

export const AppointmentProvider = ({ children }: AppointmentProviderProps) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedFacility, setSelectedFacility] = useState<{ id: number; name: string } | null>(
    null
  );
  const [selectedService, setSelectedService] = useState<{
    id: number;
    name: string;
    price: number;
    duration: number;
  } | null>(null);
  const [selectedDoctorServiceId, setSelectedDoctorServiceId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  
  // Patient form fields
  const [selectedCustomer, setSelectedCustomer] = useState<string>('me');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | null>(null);
  const [patientDescription, setPatientDescription] = useState<string>('');

  const clearSelections = () => {
    setSelectedSpecialty('');
    setSelectedDoctor('');
    setSelectedFacility(null);
    setSelectedService(null);
    setSelectedDoctorServiceId(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    // Clear patient form fields
    setSelectedCustomer('me');
    setFirstName('');
    setLastName('');
    setDateOfBirth(null);
    setPhoneNumber('');
    setGender(null);
    setPatientDescription('');
  };

  return (
    <AppointmentContext.Provider
      value={{
        selectedSpecialty,
        selectedDoctor,
        selectedFacility,
        selectedService,
        selectedDoctorServiceId,
        selectedDate,
        selectedTimeSlot,
        selectedCustomer,
        firstName,
        lastName,
        dateOfBirth,
        phoneNumber,
        gender,
        patientDescription,
        setSelectedSpecialty,
        setSelectedDoctor,
        setSelectedFacility,
        setSelectedService,
        setSelectedDoctorServiceId,
        setSelectedDate,
        setSelectedTimeSlot,
        setSelectedCustomer,
        setFirstName,
        setLastName,
        setDateOfBirth,
        setPhoneNumber,
        setGender,
        setPatientDescription,
        clearSelections,
      }}>
      {children}
    </AppointmentContext.Provider>
  );
};
