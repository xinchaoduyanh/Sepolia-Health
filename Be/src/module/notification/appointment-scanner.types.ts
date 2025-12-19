// Simple types for appointment scanner to avoid circular dependencies

export interface AppointmentScannerStats {
  lastScanTime: Date | null;
  nextScanTime: Date | null;
  totalDoctorsNotified: number;
  totalPendingAppointments: number;
  averageProcessingTime: number;
}