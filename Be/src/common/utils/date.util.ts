/**
 * Date utility functions
 */
export class DateUtil {
  /**
   * Format date to string
   */
  static format(date: Date, format: string = 'YYYY-MM-DD'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

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
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get end of day
   */
  static endOfDay(date: Date = new Date()): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
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
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Get age from birth date
   */
  static getAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  /**
   * Check if date is weekend
   */
  static isWeekend(date: Date): boolean {
    const day = date.getDay();
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
    return date.getDay();
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
