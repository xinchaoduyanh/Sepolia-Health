import { APP_TIMEZONE_OFFSET } from '../constants';

/**
 * Date utility functions
 */
export class DateUtil {
  /**
   * Format date to string
   */
  static format(date: Date, format: string = 'YYYY-MM-DD'): string {
    // Get local values based on GMT+7
    const localDate = new Date(date.getTime() + APP_TIMEZONE_OFFSET * 3600000);
    
    const year = localDate.getUTCFullYear();
    const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(localDate.getUTCDate()).padStart(2, '0');
    const hours = String(localDate.getUTCHours()).padStart(2, '0');
    const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');
    const seconds = String(localDate.getUTCSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year.toString())
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * Get start of day
   */
  static startOfDay(date: Date = new Date()): Date {
    const result = new Date(date);
    // Adjustment to local midnight
    // 1. Get current local hours
    const utcHours = result.getUTCHours();
    const localHours = (utcHours + APP_TIMEZONE_OFFSET) % 24;
    
    // 2. Subtract local hours, minutes, seconds, ms to get to local midnight
    result.setUTCHours(utcHours - localHours, 0, 0, 0);
    return result;
  }

  /**
   * Get end of day
   */
  static endOfDay(date: Date = new Date()): Date {
    const result = new Date(date);
    // Adjustment to local 23:59:59.999
    const utcHours = result.getUTCHours();
    const localHours = (utcHours + APP_TIMEZONE_OFFSET) % 24;
    
    // Set to 23:59:59.999 local
    result.setUTCHours(utcHours + (23 - localHours), 59, 59, 999);
    return result;
  }

  /**
   * Add days to date
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Add months to date
   */
  static addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  /**
   * Get difference in days
   */
  static diffInDays(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if date is today
   */
  static isToday(date: Date): boolean {
    const today = new Date();
    return this.isSameDay(date, today);
  }

  /**
   * Check if two dates are the same day
   */
  static isSameDay(date1: Date, date2: Date): boolean {
    const d1 = new Date(date1.getTime() + APP_TIMEZONE_OFFSET * 3600000);
    const d2 = new Date(date2.getTime() + APP_TIMEZONE_OFFSET * 3600000);
    
    return (
      d1.getUTCFullYear() === d2.getUTCFullYear() &&
      d1.getUTCMonth() === d2.getUTCMonth() &&
      d1.getUTCDate() === d2.getUTCDate()
    );
  }

  /**
   * Get age from birth date
   */
  static getAge(birthDate: Date): number {
    const today = new Date();
    // Use GMT+7 for age calculation to be consistent
    const d1 = new Date(birthDate.getTime() + APP_TIMEZONE_OFFSET * 3600000);
    const d2 = new Date(today.getTime() + APP_TIMEZONE_OFFSET * 3600000);

    let age = d2.getUTCFullYear() - d1.getUTCFullYear();
    const monthDiff = d2.getUTCMonth() - d1.getUTCMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && d2.getUTCDate() < d1.getUTCDate())
    ) {
      age--;
    }

    return age;
  }

  /**
   * Check if date is weekend
   */
  static isWeekend(date: Date): boolean {
    const day = this.getDayOfWeek(date);
    return day === 0 || day === 6; // Sunday or Saturday
  }

  /**
   * Get business days between two dates
   */
  static getBusinessDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      if (!this.isWeekend(current)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  static getNextNDays(n: number, startDate: Date = new Date()): Date[] {
    const days: Date[] = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }

  /**
   * Get day of week from date (returns 0-6, where 0=Sunday, 6=Saturday)
   */
  static getDayOfWeek(date: Date): number {
    const localDate = new Date(date.getTime() + APP_TIMEZONE_OFFSET * 3600000);
    return localDate.getUTCDay();
  }

  // Helper function to parse date string safely
  static parseDate(dateString: string): Date {
    // Try different date formats
    const formats = [
      dateString, // Original format
      dateString.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'), // dd/mm/yyyy -> yyyy-mm-dd
      dateString.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'), // dd/mm/yyyy -> mm/dd/yyyy
    ];
  
    for (const format of formats) {
      const date = new Date(format);
      if (
        !isNaN(date.getTime()) &&
        date.getFullYear() > 1900 &&
        date.getFullYear() < 2100
      ) {
        return date;
      }
    }
  
    // Fallback to original string
    return new Date(dateString);
  }
}
