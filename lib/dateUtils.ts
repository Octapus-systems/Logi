/**
 * Get the date range for "today" in Indian Standard Time (IST)
 * IST is UTC + 5:30
 */
/**
 * Get today's date at UTC midnight for consistent database querying.
 * All attendance/lives queries use this as the canonical "today" boundary.
 */
export function getToday(): Date {
  const now = new Date();
  // IST offset is 5.5 hours
  const istOffset = 5.5 * 60 * 60 * 1000;
  // Get current time in IST
  const istTime = new Date(now.getTime() + istOffset);
  
  // Create a UTC date that represents the same YYYY-MM-DD as the IST date
  const today = new Date(Date.UTC(istTime.getUTCFullYear(), istTime.getUTCMonth(), istTime.getUTCDate(), 0, 0, 0, 0));
  return today;
}

export function getISTTodayRange() {
  const now = new Date();
  // IST offset is 5.5 hours
  const istOffset = 5.5 * 60 * 60 * 1000;
  
  // Get current time in IST by adding offset
  const istTime = new Date(now.getTime() + istOffset);
  
  // Create start of day in IST
  const startOfISTDay = new Date(istTime);
  startOfISTDay.setUTCHours(0, 0, 0, 0);
  // Convert back to UTC for database query
  const startOfISTDayUTC = new Date(startOfISTDay.getTime() - istOffset);
  
  // Create end of day in IST
  const endOfISTDay = new Date(istTime);
  endOfISTDay.setUTCHours(23, 59, 59, 999);
  // Convert back to UTC for database query
  const endOfISTDayUTC = new Date(endOfISTDay.getTime() - istOffset);
  
  return {
    start: startOfISTDayUTC,
    end: endOfISTDayUTC
  };
}
