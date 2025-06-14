'use server';

/**
 * @fileOverview Analyzes session data to provide insights at session, daily, weekly, and monthly levels,
 * and identifies peak/quiet hours.
 *
 * - analyzeSessionInsights - A function that analyzes session data.
 * - AnalyzeSessionInsightsInput - The input type for the analyzeSessionInsights function.
 * - AnalyzeSessionInsightsOutput - The return type for the analyzeSessionInsights function.
 */

import {z} from 'genkit';

const AnalyzeSessionInsightsInputSchema = z.object({
  sessionData: z
    .string()
    .describe('Raw session data, including timestamps and usage metrics.'),
});
export type AnalyzeSessionInsightsInput = z.infer<typeof AnalyzeSessionInsightsInputSchema>;

const AnalyzeSessionInsightsOutputSchema = z.object({
  sessionLevelSummary: z.string().describe("A concise summary (1-2 sentences) highlighting notable patterns or outliers at the individual session level. e.g., exceptionally long sessions, sessions with unusually high/low data transfer, or clusters of activity."),
  dailyLevelSummary: z.string().describe("A concise summary (1-2 sentences) of key observations from a daily aggregation perspective. e.g., identify days with peak/lowest usage, or noticeable daily trends like higher usage on weekends."),
  weeklyLevelSummary: z.string().describe("A concise summary (1-2 sentences) of key observations from a weekly aggregation perspective. e.g., identify trends like increasing/decreasing weekly usage, or standout weeks."),
  monthlyLevelSummary: z.string().describe("A concise summary (1-2 sentences) of key observations from a monthly aggregation perspective. e.g., identify trends or standout months."),
  peakHours: z.string().describe("The identified peak hours of system usage based on the session data."),
  quietHours: z.string().describe("The identified quiet hours of system usage based on the session data."),
});
export type AnalyzeSessionInsightsOutput = z.infer<typeof AnalyzeSessionInsightsOutputSchema>;

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