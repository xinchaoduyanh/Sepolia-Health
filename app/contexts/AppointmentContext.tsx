import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppointmentContextType {
  selectedSpecialty: string;
  selectedDoctor: string;
  setSelectedSpecialty: (specialty: string) => void;
  setSelectedDoctor: (doctor: string) => void;
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

  const clearSelections = () => {
    setSelectedSpecialty('');
    setSelectedDoctor('');
  };

  return (
    <AppointmentContext.Provider
      value={{
        selectedSpecialty,
        selectedDoctor,
        setSelectedSpecialty,
        setSelectedDoctor,
        clearSelections,
      }}>
      {children}
    </AppointmentContext.Provider>
  );
};
