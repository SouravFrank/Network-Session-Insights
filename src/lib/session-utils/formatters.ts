/**
 * Formats a duration from total seconds to "HH:MM:SS" string or "HH:MM" if seconds are zero.
 * @param totalSeconds - The duration in seconds.
 * @param includeSeconds - Whether to always include seconds, even if zero.
 * @returns A string in "HH:MM:SS" or "HH:MM" format.
 */
export function formatDurationFromSeconds(totalSeconds: number, includeSeconds: boolean = false): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return "00:00";
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const paddedHours = String(hours).padStart(2, '0');
  const paddedMinutes = String(minutes).padStart(2, '0');
  
  if (includeSeconds || seconds > 0) {
    const paddedSeconds = String(seconds).padStart(2, '0');
    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
  }
  return `${paddedHours}:${paddedMinutes}`;
}

/**
 * Formats a date object to "DD-MM-YYYY" string.
 * @param date - The Date object.
 * @returns A string in "DD-MM-YYYY" format.
 */
export function formatDate(date: Date): string {
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
