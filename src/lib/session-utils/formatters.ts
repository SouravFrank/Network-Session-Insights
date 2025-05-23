
import { differenceInCalendarDays } from 'date-fns';

/**
 * Formats a duration from total seconds to a human-readable string, including days if applicable.
 * Examples:
 * - 90061 seconds, includeSeconds=true  => "1d 01:01:01"
 * - 90000 seconds, includeSeconds=false => "1d 01:00"
 * - 3660 seconds, includeSeconds=true   => "01:01:00"
 * - 3600 seconds, includeSeconds=false  => "01:00"
 * - 120 seconds, includeSeconds=false   => "00:02"
 * - 30 seconds, includeSeconds=true    => "00:00:30"
 * - 0 seconds, includeSeconds=false     => "00:00"
 * @param totalSeconds - The duration in seconds.
 * @param includeSeconds - Whether to always include seconds in the HH:MM:SS part, even if zero.
 * @returns A string representing the duration.
 */
export function formatDurationFromSeconds(totalSeconds: number, includeSeconds: boolean = false): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    totalSeconds = 0;
  }

  const days = Math.floor(totalSeconds / 86400);
  const remainingSecondsAfterDays = totalSeconds % 86400;
  const hours = Math.floor(remainingSecondsAfterDays / 3600);
  const remainingSecondsAfterHours = remainingSecondsAfterDays % 3600;
  const minutes = Math.floor(remainingSecondsAfterHours / 60);
  const seconds = Math.floor(remainingSecondsAfterHours % 60);

  const paddedHours = String(hours).padStart(2, '0');
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');

  let timeString = "";

  if (days > 0) {
    timeString = `${days}d `;
  }

  if (includeSeconds || seconds > 0 || totalSeconds === 0) { // show seconds if explicitly asked, or non-zero, or if total is zero to show 00:00:00
    timeString += `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
  } else { // Omit seconds if they are zero and not explicitly requested
    timeString += `${paddedHours}:${paddedMinutes}`;
  }
  
  // If only days were present and time part is 00:00 or 00:00:00, ensure it's displayed
  if (days > 0 && hours === 0 && minutes === 0 && (seconds === 0 && !includeSeconds)) {
     timeString = `${days}d 00:00`;
  } else if (days > 0 && hours === 0 && minutes === 0 && seconds === 0 && includeSeconds) {
     timeString = `${days}d 00:00:00`;
  }


  // Fallback for very short durations if days are not involved and time is 0
  if (!days && !hours && !minutes && (seconds === 0 && !includeSeconds) && totalSeconds > 0){
    return `00:00:${paddedSeconds}`; // e.g. 0.5 seconds became 0 with floor
  }
  if (!days && timeString === "00:00" && totalSeconds > 0 && totalSeconds < 60 && includeSeconds) {
    return `00:00:${paddedSeconds}`;
  }
   if (!days && timeString === "00:00" && !includeSeconds && totalSeconds === 0) {
    return `00:00`;
  }
   if (!days && timeString === "00:00:00" && includeSeconds && totalSeconds === 0) {
    return `00:00:00`;
  }


  return timeString;
}


/**
 * Formats a date object to "DD-MM-YYYY" string.
 * @param date - The Date object.
 * @returns A string in "DD-MM-YYYY" format.
 */
export function formatDate(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "Invalid Date";
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Formats a number of megabytes (MB) into a display string, converting to gigabytes (GB) if >= 1024 MB.
 * To be used in the UI layer. Utility functions should always deal in MB.
 * @param megabytes - The value in MB.
 * @param precision - Number of decimal places for GB.
 * @returns A string like "500.0 MB" or "1.5 GB".
 */
export function formatDataSizeForDisplay(megabytes: number, precision: number = 1): string {
  if (isNaN(megabytes) || megabytes < 0) {
    return "0 MB";
  }
  if (megabytes >= 1024) {
    return `${(megabytes / 1024).toFixed(precision)} GB`;
  }
  return `${megabytes.toFixed(precision)} MB`;
}

/**
 * Calculates the number of days in a given period, inclusive of start and end date.
 * @param startDate - The start date of the period.
 * @param endDate - The end date of the period.
 * @returns The number of days.
 */
export function getDaysInPeriod(startDate: Date, endDate: Date): number {
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 0;
  }
  // differenceInCalendarDays is exclusive of the end date for ranges, so add 1
  return differenceInCalendarDays(endDate, startDate) + 1;
}
