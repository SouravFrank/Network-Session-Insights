import { SessionDataParsingError } from './types';

/**
 * Parses a login time string in "DD-MM-YYYY HH:MM:SS" format to a Date object.
 * @param loginTimeString - The login time string.
 * @returns A Date object.
 * @throws SessionDataParsingError if the format is invalid.
 */
export function parseLoginTime(loginTimeString: string): Date {
  const parts = loginTimeString.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!parts) {
    throw new SessionDataParsingError(`Invalid loginTime format: "${loginTimeString}". Expected "DD-MM-YYYY HH:MM:SS".`);
  }
  // DD-MM-YYYY HH:MM:SS
  // parts[1]=DD, parts[2]=MM, parts[3]=YYYY, parts[4]=HH, parts[5]=MM, parts[6]=SS
  const day = parseInt(parts[1], 10);
  const month = parseInt(parts[2], 10) - 1; // Month is 0-indexed in JavaScript Date
  const year = parseInt(parts[3], 10);
  const hours = parseInt(parts[4], 10);
  const minutes = parseInt(parts[5], 10);
  const seconds = parseInt(parts[6], 10);

  const date = new Date(year, month, day, hours, minutes, seconds);
  // Basic validation
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day ||
    date.getHours() !== hours ||
    date.getMinutes() !== minutes ||
    date.getSeconds() !== seconds
  ) {
    throw new SessionDataParsingError(`Invalid date values in loginTime: "${loginTimeString}".`);
  }
  return date;
}

/**
 * Parses a session duration string in "HH:MM:SS" format to total seconds.
 * @param durationString - The duration string.
 * @returns Total duration in seconds.
 * @throws SessionDataParsingError if the format is invalid.
 */
export function parseSessionDurationToSeconds(durationString: string): number {
  const parts = durationString.match(/^(\d{2}):(\d{2}):(\d{2})$/);
  if (!parts) {
    throw new SessionDataParsingError(`Invalid sessionTime format: "${durationString}". Expected "HH:MM:SS".`);
  }
  const hours = parseInt(parts[1], 10);
  const minutes = parseInt(parts[2], 10);
  const seconds = parseInt(parts[3], 10);

  if (hours < 0 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    throw new SessionDataParsingError(`Invalid time values in sessionTime: "${durationString}".`);
  }

  return hours * 3600 + minutes * 60 + seconds;
}
