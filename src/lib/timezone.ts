/**
 * Centralized timezone handling for the application.
 *
 * Strategy:
 * - Store all dates in UTC in the database
 * - Display dates in Europe/Zurich timezone to users
 * - Use Europe/Zurich timezone for date boundary calculations (start/end of month/day)
 *   so that queries return correct results for Swiss users
 */

import { toZonedTime, fromZonedTime, format as formatTz } from "date-fns-tz";
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  addDays as dfAddDays,
  addMonths as dfAddMonths,
  subMonths as dfSubMonths,
  isBefore as dfIsBefore,
  isAfter as dfIsAfter,
  isSameDay as dfIsSameDay,
  differenceInDays as dfDifferenceInDays,
  parse as dfParse,
} from "date-fns";
import type { Locale } from "date-fns";

/**
 * The application's display timezone.
 * All date boundaries and display formatting use this timezone.
 */
export const APP_TIMEZONE = "Europe/Zurich" as const;

// ============================================================================
// BOUNDARY FUNCTIONS - Return UTC dates for DB queries
// These calculate boundaries based on Europe/Zurich timezone
// ============================================================================

/**
 * Get the start of the current month in UTC, based on Europe/Zurich timezone.
 * Example: If it's Jan 15 00:30 UTC, but Jan 15 01:30 in Zurich,
 * this returns Jan 1 00:00 Zurich time converted to UTC (Dec 31 23:00 UTC).
 */
export function getMonthStartUTC(date: Date = new Date()): Date {
  // Convert the input date to Zurich timezone
  const zurichDate = toZonedTime(date, APP_TIMEZONE);
  // Get the start of month in Zurich timezone
  const zurichMonthStart = startOfMonth(zurichDate);
  // Convert back to UTC
  return fromZonedTime(zurichMonthStart, APP_TIMEZONE);
}

/**
 * Get the end of the current month in UTC, based on Europe/Zurich timezone.
 * Returns the last millisecond of the last day of the month.
 */
export function getMonthEndUTC(date: Date = new Date()): Date {
  // Convert the input date to Zurich timezone
  const zurichDate = toZonedTime(date, APP_TIMEZONE);
  // Get the end of month in Zurich timezone
  const zurichMonthEnd = endOfMonth(zurichDate);
  // Convert back to UTC
  return fromZonedTime(zurichMonthEnd, APP_TIMEZONE);
}

/**
 * Get the start of the current day in UTC, based on Europe/Zurich timezone.
 */
export function getDayStartUTC(date: Date = new Date()): Date {
  // Convert the input date to Zurich timezone
  const zurichDate = toZonedTime(date, APP_TIMEZONE);
  // Get the start of day in Zurich timezone
  const zurichDayStart = startOfDay(zurichDate);
  // Convert back to UTC
  return fromZonedTime(zurichDayStart, APP_TIMEZONE);
}

/**
 * Get the end of the current day in UTC, based on Europe/Zurich timezone.
 */
export function getDayEndUTC(date: Date = new Date()): Date {
  // Convert the input date to Zurich timezone
  const zurichDate = toZonedTime(date, APP_TIMEZONE);
  // Get the end of day in Zurich timezone
  const zurichDayEnd = endOfDay(zurichDate);
  // Convert back to UTC
  return fromZonedTime(zurichDayEnd, APP_TIMEZONE);
}

/**
 * Get the start and end of a specific month/year in UTC, based on Europe/Zurich timezone.
 * Useful for database queries that filter by month.
 *
 * @param month - 1-indexed month (1 = January, 12 = December)
 * @param year - Full year (e.g., 2024)
 */
export function getMonthBoundariesUTC(month: number, year: number): { start: Date; end: Date } {
  // Create a date in Zurich timezone for the first of the given month
  // We use the 15th to avoid any edge cases with month boundaries
  const zurichDate = new Date(year, month - 1, 15, 12, 0, 0);

  // Get start and end of month in Zurich timezone
  const monthStart = startOfMonth(zurichDate);
  const monthEnd = endOfMonth(zurichDate);

  // Convert to UTC
  return {
    start: fromZonedTime(monthStart, APP_TIMEZONE),
    end: fromZonedTime(monthEnd, APP_TIMEZONE),
  };
}

// ============================================================================
// DISPLAY FORMATTING - Convert UTC to Europe/Zurich for display
// ============================================================================

/**
 * Format a UTC date for display in Europe/Zurich timezone.
 *
 * @param date - The date to format (assumed to be in UTC)
 * @param formatStr - The date-fns format string
 * @param locale - Optional locale for localized formatting
 */
export function formatInAppTimezone(
  date: Date | string | number,
  formatStr: string,
  locale?: Locale,
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return formatTz(dateObj, formatStr, {
    timeZone: APP_TIMEZONE,
    locale,
  });
}

/**
 * Convert a UTC date to a Date object representing that moment in Zurich timezone.
 * Useful when you need to work with the date components in local time.
 */
export function toAppTimezone(date: Date | string | number): Date {
  const dateObj = date instanceof Date ? date : new Date(date);
  return toZonedTime(dateObj, APP_TIMEZONE);
}

/**
 * Convert a local date (interpreted as Zurich time) to UTC.
 * Useful when converting user input to UTC for storage.
 */
export function fromAppTimezone(date: Date): Date {
  return fromZonedTime(date, APP_TIMEZONE);
}

// ============================================================================
// RE-EXPORTS - Unchanged date-fns functions for convenience
// ============================================================================

export {
  dfAddDays as addDays,
  dfAddMonths as addMonths,
  dfSubMonths as subMonths,
  dfIsBefore as isBefore,
  dfIsAfter as isAfter,
  dfIsSameDay as isSameDay,
  dfDifferenceInDays as differenceInDays,
  dfParse as parse,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
};
