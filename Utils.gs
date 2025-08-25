/**
 * Utility functions for date/time handling and formatting
 */

/**
 * Gets the week window (start and end dates) for a given date
 */
function getWeekWindow_(date, weekStartsOn, timeZone) {
  const localDateString = Utilities.formatDate(date, timeZone, "yyyy-MM-dd");
  const localMidnight = new Date(localDateString + "T00:00:00");

  const currentDay = localMidnight.getDay(); // 0=Sunday, 6=Saturday
  const isWeekStartMonday = String(weekStartsOn).toUpperCase() === "MONDAY";
  
  const daysFromWeekStart = isWeekStartMonday 
    ? (currentDay + 6) % 7  // Days since Monday
    : currentDay;           // Days since Sunday

  const weekStart = new Date(localMidnight);
  weekStart.setDate(weekStart.getDate() - daysFromWeekStart);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { start: weekStart, end: weekEnd };
}

/**
 * Converts various date formats to a standardized Date object
 */
function coerceToDate_(cellValue, timeZone) {
  if (cellValue instanceof Date) {
    return createMiddayDate_(cellValue);
  }
  
  if (!cellValue) return null;
  
  const dateString = String(cellValue).trim();
  const parsedDate = new Date(dateString);
  
  if (!isNaN(parsedDate.getTime())) {
    return createMiddayDate_(parsedDate);
  }
  
  return null;
}

/**
 * Creates a date set to midday to avoid DST edge cases
 */
function createMiddayDate_(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
}

/**
 * Converts various time formats to minutes since midnight
 */
function coerceToTimeMinutes_(timeValue) {
  if (timeValue == null || timeValue === "") return null;
  
  if (timeValue instanceof Date) {
    return timeValue.getHours() * 60 + timeValue.getMinutes();
  }
  
  if (typeof timeValue === "number") {
    return Math.round(timeValue * 24 * 60); // Google Sheets time fraction
  }
  
  return parseTimeString_(String(timeValue));
}

/**
 * Parses time strings like "2:30 PM" into minutes since midnight
 */
function parseTimeString_(timeString) {
  const cleanTime = timeString.trim().toUpperCase();
  const timeMatch = cleanTime.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)?$/);
  
  if (!timeMatch) return null;
  
  let hours = parseInt(timeMatch[1], 10);
  const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
  const meridiem = timeMatch[3];
  
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  
  return hours * 60 + minutes;
}

/**
 * Formats a date using the configured timezone
 */
function formatLocal_(date, pattern) {
  return Utilities.formatDate(date, CONFIG.timeZone, pattern);
}

/**
 * Converts minutes since midnight to formatted time string (e.g., "2:30 PM")
 */
function formatTimeFromMinutes_(totalMinutes) {
  if (totalMinutes == null) return "";
  
  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const meridiem = hours >= 12 ? "PM" : "AM";
  
  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;
  
  return `${hours}:${minutes.toString().padStart(2, "0")} ${meridiem}`;
}

/**
 * Gets current week window based on configuration
 */
function getCurrentWeekWindow_() {
  const today = new Date();
  return getWeekWindow_(today, CONFIG.weekStartsOn, CONFIG.timeZone);
}
