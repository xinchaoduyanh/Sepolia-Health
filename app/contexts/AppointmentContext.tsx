import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppointmentContextType {
  selectedSpecialty: string;
  selectedDoctor: string;
  selectedFacility: { id: number; name: string } | null;
  selectedService: { id: number; name: string; price: number; duration: number } | null;
  selectedDoctorServiceId: number | null;
  selectedDate: string | null;
  selectedTimeSlot: string | null;
  setSelectedSpecialty: (specialty: string) => void;
  setSelectedDoctor: (doctor: string) => void;
  setSelectedFacility: (facility: { id: number; name: string } | null) => void;
  setSelectedService: (service: { id: number; name: string; price: number; duration: number } | null) => void;
  setSelectedDoctorServiceId: (id: number | null) => void;
  setSelectedDate: (date: string | null) => void;
  setSelectedTimeSlot: (time: string | null) => void;
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

  const clearSelections = () => {
    setSelectedSpecialty('');
    setSelectedDoctor('');
    setSelectedFacility(null);
    setSelectedService(null);
    setSelectedDoctorServiceId(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
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
        setSelectedSpecialty,
        setSelectedDoctor,
        setSelectedFacility,
        setSelectedService,
        setSelectedDoctorServiceId,
        setSelectedDate,
        setSelectedTimeSlot,
        clearSelections,
      }}>
      {children}
    </AppointmentContext.Provider>
  );
};
