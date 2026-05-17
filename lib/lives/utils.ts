/**
 * Get the current date in IST
 */
export function getIstDate(): Date {
  const now = new Date();
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + istOffset);
}

/**
 * Get the reset lives value based on the current IST date
 * Rules:
 * - May 01: 2 lives
 * - Other days: 4 lives
 */
export function getResetLivesValue(): number {
  const istNow = getIstDate();
  // Month is 0-indexed, so 4 is May
  const isMayFirst = istNow.getUTCMonth() === 4 && istNow.getUTCDate() === 1;
  return isMayFirst ? 2 : 4;
}

/**
 * Re-export centralized getToday() for backward compatibility.
 * Uses UTC midnight for consistent database querying.
 */
export { getToday } from '@/lib/dateUtils';

