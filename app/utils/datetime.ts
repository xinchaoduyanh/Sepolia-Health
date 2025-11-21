/**
 * Datetime utility functions for consistent date/time handling
 * across the application
 */

/**
 * Format ISO datetime string to local date string
 * @param isoString - ISO 8601 datetime string
 * @returns Formatted date string in Vietnamese locale (e.g., "19/11/2025")
 */
export const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString('vi-VN');
};

/**
 * Format ISO datetime string to local time string
 * @param isoString - ISO 8601 datetime string
 * @returns Formatted time string (e.g., "14:30")
 */
export const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('vi-VN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

/**
 * Format ISO datetime string to local datetime string
 * @param isoString - ISO 8601 datetime string
 * @returns Formatted datetime string (e.g., "19/11/2025, 14:30")
 */
export const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString('vi-VN');
};

/**
 * Create ISO datetime string from date and time components
 * @param dateString - Date in YYYY-MM-DD format
 * @param timeString - Time in HH:mm format
 * @returns ISO 8601 datetime string in UTC
 */
export const createISODateTime = (
  dateString: string, // YYYY-MM-DD
  timeString: string  // HH:mm
): string => {
  const dateTime = new Date(`${dateString}T${timeString}:00`);
  return dateTime.toISOString();
};

/**
 * Get today's date in YYYY-MM-DD format
 * @returns Date string in YYYY-MM-DD format
 */
export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Parse ISO date string to Date object
 * @param isoString - ISO 8601 date or datetime string
 * @returns Date object
 */
export const parseISODate = (isoString: string): Date => {
  return new Date(isoString);
};

/**
 * Format date for API (YYYY-MM-DD)
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format
 */
export const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calculate appointment end time from start time and duration
 * @param startTime - ISO 8601 datetime string
 * @param durationMinutes - Duration in minutes
 * @returns ISO 8601 datetime string for end time
 */
export const getAppointmentEndTime = (startTime: string, durationMinutes: number): string => {
  const startDate = new Date(startTime);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  return endDate.toISOString();
};

  export const isWithin4Hours = (appointmentTime: string) => {
    const now = new Date();
    const apptTime = new Date(appointmentTime);
    const diffInHours = (apptTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffInHours < 4;
  };