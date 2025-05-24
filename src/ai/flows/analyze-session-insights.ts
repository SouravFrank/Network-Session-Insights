'use server';

/**
 * @fileOverview Analyzes session data to provide insights at session, daily, weekly, and monthly levels,
 * and identifies peak/quiet hours.
 *
 * - analyzeSessionInsights - A function that analyzes session data.
 * - AnalyzeSessionInsightsInput - The input type for the analyzeSessionInsights function.
 * - AnalyzeSessionInsightsOutput - The return type for the analyzeSessionInsights function.
 */

import {ai} from '@/ai/genkit';
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
  return analyzeSessionInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSessionInsightsPrompt',
  input: {schema: AnalyzeSessionInsightsInputSchema},
  output: {schema: AnalyzeSessionInsightsOutputSchema},
  prompt: `You are an expert data analyst specializing in interpreting user session data for a system like an ISP or a VPN.
Analyze the following raw session data. The data includes login times, session durations, and download/upload amounts in MB.

Raw Session Data:
{{{sessionData}}}

Based on this data, provide the following insights in a structured JSON format:

1.  \`sessionLevelSummary\`: A concise summary (1-2 sentences) highlighting any notable patterns or outliers observed at the individual session level. For example, mention if there are exceptionally long sessions, sessions with unusually high/low data transfer, or clusters of activity.
2.  \`dailyLevelSummary\`: A concise summary (1-2 sentences) of key observations from a daily aggregation perspective. For instance, identify days with peak usage, days with lowest usage, or any noticeable daily trends (e.g., consistently higher usage on weekends).
3.  \`weeklyLevelSummary\`: A concise summary (1-2 sentences) of key observations from a weekly aggregation perspective. Identify trends like increasing/decreasing weekly usage, or weeks that stand out.
4.  \`monthlyLevelSummary\`: A concise summary (1-2 sentences) of key observations from a monthly aggregation perspective. Identify trends or standout months.
5.  \`peakHours\`: Identify the peak hours of system usage based on the session data.
6.  \`quietHours\`: Identify the quiet hours of system usage.

Avoid merely restating raw numbers. Focus on qualitative insights, comparisons, and trends that would be valuable for understanding usage behavior.
`,
});

const analyzeSessionInsightsFlow = ai.defineFlow(
  {
    name: 'analyzeSessionInsightsFlow',
    inputSchema: AnalyzeSessionInsightsInputSchema,
    outputSchema: AnalyzeSessionInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
