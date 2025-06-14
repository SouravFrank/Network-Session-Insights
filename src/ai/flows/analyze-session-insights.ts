/**
 * @fileOverview Analyzes session data to provide insights at session, daily, weekly, and monthly levels,
 * and identifies peak/quiet hours.
 *
 * - analyzeSessionInsights - A function that analyzes session data.
 * - AnalyzeSessionInsightsInput - The input type for the analyzeSessionInsights function.
 * - AnalyzeSessionInsightsOutput - The return type for the analyzeSessionInsights function.
 */

// Define input type
export interface AnalyzeSessionInsightsInput {
  sessionData: string; // Raw session data, including timestamps and usage metrics.
}

// Define output type
export interface AnalyzeSessionInsightsOutput {
  sessionLevelSummary: string;   // Concise summary for session level patterns/outliers.
  dailyLevelSummary: string;     // Concise summary for daily aggregation.
  weeklyLevelSummary: string;    // Concise summary for weekly aggregation.
  monthlyLevelSummary: string;   // Concise summary for monthly aggregation.
  peakHours: string;             // Identified peak hours of system usage.
  quietHours: string;            // Identified quiet hours of system usage.
}

export async function analyzeSessionInsights(
  input: AnalyzeSessionInsightsInput
): Promise<AnalyzeSessionInsightsOutput> {
  // POST API call to http://localhost:8080/api/analyzeSessionInsights
  const response = await fetch('http://localhost:8080/api/analyzeSessionInsights', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionData: typeof input.sessionData !== "string" ? JSON.stringify(input.sessionData) : input.sessionData,
    }),
  });

  if (!response.ok) {
    throw new Error(`API call failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.data as AnalyzeSessionInsightsOutput;
}