/**
 * String utility functions
 */
export class StringUtil {
  /**
   * Generate random string
   */
  static random(
    length: number = 10,
    charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  ): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  /**
   * Generate UUID v4
   */
  static uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Slugify string
   */
  static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Capitalize first letter
   */
  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  /**
   * Capitalize each word
   */
  static capitalizeWords(text: string): string {
    return text
      .split(' ')
      .map((word) => this.capitalize(word))
      .join(' ');
  }

  /**
   * Truncate string
   */
  static truncate(
    text: string,
    length: number,
    suffix: string = '...',
  ): string {
    if (text.length <= length) return text;
    return text.substring(0, length - suffix.length) + suffix;
  }

  /**
   * Remove HTML tags
   */
  static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Check if string is email
   */
  static isEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if string is phone number
   */
  static isPhone(phone: string): boolean {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Format phone number
   */
  static formatPhone(phone: string, format: string = 'XXX-XXX-XXXX'): string {
    const cleaned = phone.replace(/\D/g, '');
    let formatted = format;

    for (let i = 0; i < cleaned.length && formatted.includes('X'); i++) {
      formatted = formatted.replace('X', cleaned[i]);
    }

    return formatted.replace(/X/g, '');
  }

  /**
   * Mask sensitive data
   */
  static mask(
    text: string,
    visibleChars: number = 4,
    maskChar: string = '*',
  ): string {
    if (text.length <= visibleChars) return text;
    const visible = text.slice(-visibleChars);
    const masked = maskChar.repeat(text.length - visibleChars);
    return masked + visible;
  }

  /**
   * Generate random password
   */
  static generatePassword(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = lowercase + uppercase + numbers + symbols;

    let password = '';

    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}
