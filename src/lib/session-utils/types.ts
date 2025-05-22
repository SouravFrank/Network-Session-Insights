/**
 * Represents a single user session.
 */
export interface SessionData {
  loginTime: string; // DD-MM-YYYY HH:MM:SS format
  sessionTime: string; // HH:MM:SS duration format
  download: number; // in MB, floating point
  upload: number; // in MB, floating point
}

/**
 * Represents a segment of a session, potentially split if it crosses a day boundary.
 * Used internally for aggregation.
 */
export interface SessionSegment {
  originalSession: SessionData; // Reference to the original session
  segmentStartTime: Date;
  segmentEndTime: Date;
  durationSeconds: number;
  downloadMB: number;
  uploadMB: number;
}

/**
 * Base interface for aggregated session data.
 */
interface AggregatedBase {
  totalDurationSeconds: number;
  totalDownloadedMB: number;
  totalUploadedMB: number;
  sessionCount: number;
  // segments: SessionSegment[]; // Optionally include segments for detailed breakdown
}

/**
 * Represents session data aggregated by day.
 * As returned by the utility function (raw data).
 * The UI layer will handle formatting (e.g., date strings, duration strings, MB/GB conversion).
 */
export interface RawDayAggregation extends AggregatedBase {
  date: Date; // The specific day
}

/**
 * Represents the desired output format for DayAggregation as specified by the user,
 * typically after processing RawDayAggregation in the UI or a formatting layer.
 */
export interface DayAggregation {
  date: string; // "DD-MM-YYYY" e.g., "09-11-2024"
  totalDuration: string; // "HH:MM" or "HH:MM:SS" format
  totalDownloaded: number; // Always in MB from util functions
  totalUploaded: number; // Always in MB from util functions
  // The following two fields require clearer definition or UI-level calculation
  // totalSessionDuration?: string; // "HH:MM" format
  // totalMissedDuration?: string; // "HH:MM" format
}


/**
 * Represents session data aggregated by week.
 * As returned by the utility function (raw data).
 */
export interface RawWeekAggregation extends AggregatedBase {
  year: number;
  weekNumber: number; // ISO week number
  startDate: Date; // Start date of the week
  endDate: Date; // End date of the week
}

/**
 * User-specified format for weekly aggregation.
 */
export interface WeekAggregation {
  weekRange: string; // E.g., "Nov 4, 2024 - Nov 10, 2024"
  totalDuration: string;
  totalDownloaded: number; // MB
  totalUploaded: number; // MB
}

/**
 * Represents session data aggregated by month.
 * As returned by the utility function (raw data).
 */
export interface RawMonthAggregation extends AggregatedBase {
  year: number;
  month: number; // 0-indexed (0 for January, 11 for December)
  monthName: string; // E.g., "November"
  startDate: Date; // Start date of the month
  endDate: Date; // End date of the month
}

/**
 * User-specified format for monthly aggregation.
 */
export interface MonthAggregation {
  monthDisplay: string; // E.g., "November 2024"
  totalDuration: string;
  totalDownloaded: number; // MB
  totalUploaded: number; // MB
}

/**
 * Error type for parsing issues.
 */
export class SessionDataParsingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionDataParsingError";
  }
}
