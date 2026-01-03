import { APP_TIMEZONE_OFFSET } from '../constants';

export class TimeUtil {
  static FOUR_HOURS = 4 * 60 * 60 * 1000;
  /**
   * Convert time string (HH:mm) to minutes since midnight
   */
  static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since midnight to time string (HH:mm)
   */
  static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}`;
  }

  /**
   * Get total minutes from a Date object, adjusted for the application's timezone offset
   */
  static dateToMinutes(date: Date): number {
    // Get UTC hours and minutes, then add the timezone offset
    // We adjust the date by adding the offset in hours to get the local time
    const utcHours = date.getUTCHours();
    const localHours = (utcHours + APP_TIMEZONE_OFFSET) % 24;
    return localHours * 60 + date.getUTCMinutes();
  }

  /**
   * Check if d2 - d1 <= 4 hours
   */
  static isLessThanFourHours(d1: Date | string, d2: Date | string) {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return Math.abs(+date2 - +date1) <= TimeUtil.FOUR_HOURS;
  }
}
