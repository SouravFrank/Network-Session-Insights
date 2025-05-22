import {
  addSeconds,
  differenceInSeconds,
  endOfDay,
  isSameDay,
  startOfDay,
  isBefore,
  min,
  max,
  getWeek,
  startOfWeek,
  endOfWeek,
  getMonth,
  startOfMonth,
  endOfMonth,
  format as formatDateFns,
} from 'date-fns';
import type { SessionData, SessionSegment, RawDayAggregation, RawWeekAggregation, RawMonthAggregation } from './types';
import { parseLoginTime, parseSessionDurationToSeconds } from './parsers';

/**
 * Splits a single session into daily segments if it spans multiple days.
 * Prorates download and upload data based on the duration of the segment within each day.
 * @param session - The original session data.
 * @returns An array of SessionSegment objects.
 */
function splitSessionIntoDailySegments(session: SessionData): SessionSegment[] {
  const segments: SessionSegment[] = [];
  const S_loginTime = parseLoginTime(session.loginTime);
  const S_totalDurationSeconds = parseSessionDurationToSeconds(session.sessionTime);

  if (S_totalDurationSeconds <= 0) {
    return []; // Skip sessions with no duration
  }

  let S_endTime = addSeconds(S_loginTime, S_totalDurationSeconds);

  let currentSegmentStartTime = S_loginTime;

  while (isBefore(currentSegmentStartTime, S_endTime)) {
    const currentDayEndOfDay = endOfDay(currentSegmentStartTime);
    let currentSegmentEndTime = min([S_endTime, currentDayEndOfDay]);
    
    // Ensure segment end time does not exceed overall session end time
    if(isBefore(S_endTime, currentSegmentEndTime)) {
      currentSegmentEndTime = S_endTime;
    }

    const segmentDurationSeconds = differenceInSeconds(currentSegmentEndTime, currentSegmentStartTime);

    if (segmentDurationSeconds <= 0 && !isSameDay(currentSegmentStartTime, currentSegmentEndTime)) { 
      // This can happen if a segment starts exactly at 23:59:59.500 and ends at 00:00:00.000 of next day
      // due to millisecond precision, differenceInSeconds might yield 0 for a very short segment.
      // If it crosses a day boundary but duration is 0, it's likely a precision issue or very short span.
      // We can either create a tiny segment or adjust. For simplicity, let's skip 0-duration segments unless forced.
      // However, if it's the *only* part of the session, and S_totalDurationSeconds > 0, this needs care.
      // For now, if segment is 0s, only add if it's the last part and there's remaining duration
      // This case is tricky, for now, let's assume positive duration for valid segments.
       if (segmentDurationSeconds < 0) { // Should not happen with min/max logic
         currentSegmentStartTime = addSeconds(currentSegmentEndTime, 1); // Move to next second of next day
         continue;
       }
    }
     if (segmentDurationSeconds <=0 ) {
        // If a segment has no duration (e.g. session ends exactly at midnight),
        // advance to next day to avoid infinite loop.
        currentSegmentStartTime = startOfDay(addSeconds(currentSegmentEndTime,1)); // start of next day
        if(isBefore(currentSegmentStartTime, S_endTime)) continue; else break;
    }


    const proportion = segmentDurationSeconds / S_totalDurationSeconds;
    const segmentDownloadMB = session.download * proportion;
    const segmentUploadMB = session.upload * proportion;

    segments.push({
      originalSession: session,
      segmentStartTime: currentSegmentStartTime,
      segmentEndTime: currentSegmentEndTime,
      durationSeconds: segmentDurationSeconds,
      downloadMB: segmentDownloadMB,
      uploadMB: segmentUploadMB,
    });

    currentSegmentStartTime = currentSegmentEndTime; // Start of next segment is end of current one

    // If currentSegmentStartTime is exactly at the end of a day (e.g., 23:59:59.xxx)
    // and S_endTime is later, ensure next segment starts at 00:00:00 of the next day.
     if (isSameDay(currentSegmentStartTime, currentDayEndOfDay) && isBefore(currentSegmentStartTime, S_endTime)) {
       currentSegmentStartTime = startOfDay(addSeconds(currentSegmentStartTime, 1)); // Move to start of next day
     }
  }
  return segments;
}


/**
 * Aggregates session data by day.
 * Handles sessions crossing midnight by splitting them and prorating data.
 * @param sessions - An array of SessionData objects.
 * @returns An array of RawDayAggregation objects, sorted by date descending.
 */
export function aggregateSessionsByDay(sessions: SessionData[]): RawDayAggregation[] {
  const dailyAggregations = new Map<string, RawDayAggregation>();

  sessions.forEach(session => {
    const segments = splitSessionIntoDailySegments(session);
    segments.forEach(segment => {
      if (segment.durationSeconds <= 0) return; // Skip zero-duration segments

      const dayKey = formatDateFns(segment.segmentStartTime, 'yyyy-MM-dd');
      
      if (!dailyAggregations.has(dayKey)) {
        dailyAggregations.set(dayKey, {
          date: startOfDay(segment.segmentStartTime), // Store Date object for sorting
          totalDurationSeconds: 0,
          totalDownloadedMB: 0,
          totalUploadedMB: 0,
          sessionCount: 0, // This will count unique original sessions contributing to the day
                           // Or simply increment for each segment if that's preferred.
                           // Let's count segments for now as a proxy for activity.
        });
      }

      const aggregation = dailyAggregations.get(dayKey)!;
      aggregation.totalDurationSeconds += segment.durationSeconds;
      aggregation.totalDownloadedMB += segment.downloadMB;
      aggregation.totalUploadedMB += segment.uploadMB;
      aggregation.sessionCount += 1; // or handle unique session counting differently
    });
  });

  // Convert map to array and sort by date descending
  return Array.from(dailyAggregations.values()).sort((a, b) =>
    b.date.getTime() - a.date.getTime()
  );
}

/**
 * Aggregates session data by calendar week.
 * Handles sessions crossing week boundaries by splitting them.
 * (This is a simplified stub, proper weekly split logic would be similar to daily)
 * @param sessions - An array of SessionData objects.
 * @returns An array of RawWeekAggregation objects, sorted by week descending.
 */
export function aggregateSessionsByWeek(sessions: SessionData[]): RawWeekAggregation[] {
  const weeklyAggregations = new Map<string, RawWeekAggregation>();

  sessions.forEach(session => {
    // TODO: Implement segment splitting logic similar to splitSessionIntoDailySegments, but for weeks.
    // For simplicity, this stub assigns the entire session to the week of its loginTime.
    // A full implementation would prorate data across weeks if a session spans a week boundary.
    
    const S_loginTime = parseLoginTime(session.loginTime);
    const S_totalDurationSeconds = parseSessionDurationToSeconds(session.sessionTime);

    if (S_totalDurationSeconds <= 0) return;

    const year = S_loginTime.getFullYear();
    const weekNum = getWeek(S_loginTime, { weekStartsOn: 1 }); // ISO week, starts on Monday
    const weekKey = `${year}-W${String(weekNum).padStart(2, '0')}`;
    
    const weekStartDate = startOfWeek(S_loginTime, { weekStartsOn: 1 });
    const weekEndDate = endOfWeek(S_loginTime, { weekStartsOn: 1 });

    if (!weeklyAggregations.has(weekKey)) {
      weeklyAggregations.set(weekKey, {
        year: year,
        weekNumber: weekNum,
        startDate: weekStartDate,
        endDate: weekEndDate,
        totalDurationSeconds: 0,
        totalDownloadedMB: 0,
        totalUploadedMB: 0,
        sessionCount: 0,
      });
    }

    const aggregation = weeklyAggregations.get(weekKey)!;
    // In a full implementation, use prorated segment data here
    aggregation.totalDurationSeconds += S_totalDurationSeconds;
    aggregation.totalDownloadedMB += session.download;
    aggregation.totalUploadedMB += session.upload;
    aggregation.sessionCount += 1; 
  });
  
  return Array.from(weeklyAggregations.values()).sort((a, b) => {
    if (b.year !== a.year) {
      return b.year - a.year;
    }
    return b.weekNumber - a.weekNumber;
  });
}


/**
 * Aggregates session data by month.
 * Handles sessions crossing month boundaries by splitting them.
 * (This is a simplified stub, proper monthly split logic would be similar to daily)
 * @param sessions - An array of SessionData objects.
 * @returns An array of RawMonthAggregation objects, sorted by month descending.
 */
export function aggregateSessionsByMonth(sessions: SessionData[]): RawMonthAggregation[] {
  const monthlyAggregations = new Map<string, RawMonthAggregation>();

  sessions.forEach(session => {
    // TODO: Implement segment splitting logic similar to splitSessionIntoDailySegments, but for months.
    // For simplicity, this stub assigns the entire session to the month of its loginTime.

    const S_loginTime = parseLoginTime(session.loginTime);
    const S_totalDurationSeconds = parseSessionDurationToSeconds(session.sessionTime);

    if (S_totalDurationSeconds <= 0) return;

    const year = S_loginTime.getFullYear();
    const monthIndex = getMonth(S_loginTime); // 0-indexed
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    
    const monthStartDate = startOfMonth(S_loginTime);
    const monthEndDate = endOfMonth(S_loginTime);
    const monthNameStr = formatDateFns(S_loginTime, 'MMMM');


    if (!monthlyAggregations.has(monthKey)) {
      monthlyAggregations.set(monthKey, {
        year: year,
        month: monthIndex,
        monthName: monthNameStr,
        startDate: monthStartDate,
        endDate: monthEndDate,
        totalDurationSeconds: 0,
        totalDownloadedMB: 0,
        totalUploadedMB: 0,
        sessionCount: 0,
      });
    }

    const aggregation = monthlyAggregations.get(monthKey)!;
    // In a full implementation, use prorated segment data here
    aggregation.totalDurationSeconds += S_totalDurationSeconds;
    aggregation.totalDownloadedMB += session.download;
    aggregation.totalUploadedMB += session.upload;
    aggregation.sessionCount += 1;
  });
  
  return Array.from(monthlyAggregations.values()).sort((a, b) => {
    if (b.year !== a.year) {
      return b.year - a.year;
    }
    return b.month - a.month;
  });
}
