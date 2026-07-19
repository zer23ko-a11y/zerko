import moment from 'moment-timezone';

export class TimezoneService {
  /**
   * Get user's timezone from IP or device
   */
  static detectTimezone(req: any): string {
    // Try to detect from headers
    const tzHeader = req.headers['x-timezone'] || req.headers['timezone'];
    if (tzHeader && moment.tz.zone(tzHeader)) {
      return tzHeader;
    }

    // Default to UTC
    return 'UTC';
  }

  /**
   * Convert date to user's timezone
   */
  static toUserTimezone(date: Date, timezone: string): string {
    return moment.tz(date, timezone).format('YYYY-MM-DD HH:mm:ss');
  }

  /**
   * Get current time in user's timezone
   */
  static getCurrentTime(timezone: string): Date {
    return moment.tz(timezone).toDate();
  }

  /**
   * Calculate expiry time in user's timezone
   */
  static calculateExpiry(hoursFromNow: number, timezone: string): Date {
    return moment.tz(timezone).add(hoursFromNow, 'hours').toDate();
  }

  /**
   * Get time remaining until expiry
   */
  static getTimeRemaining(expiresAt: Date, timezone: string): string {
    const now = moment.tz(timezone);
    const expiry = moment.tz(expiresAt, timezone);
    const duration = moment.duration(expiry.diff(now));

    if (duration.asSeconds() <= 0) {
      return 'Expired';
    }

    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  }
}
