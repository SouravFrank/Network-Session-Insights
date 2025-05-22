// Implemented analyzeUsagePatternsFlow to analyze session data and identify peak/quiet hours.

'use server';

/**
 * @fileOverview Analyzes usage patterns to identify peak and quiet hours.
 *
 * - analyzeUsagePatterns - A function that analyzes session data to identify peak and quiet hours.
 * - AnalyzeUsagePatternsInput - The input type for the analyzeUsagePatterns function.
 * - AnalyzeUsagePatternsOutput - The return type for the analyzeUsagePatterns function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeUsagePatternsInputSchema = z.object({
  sessionData: z
    .string()
    .describe('Raw session data, including timestamps and usage metrics.'),
});
export type AnalyzeUsagePatternsInput = z.infer<typeof AnalyzeUsagePatternsInputSchema>;

const AnalyzeUsagePatternsOutputSchema = z.object({
  peakHours: z.string().describe('The peak hours of system usage.'),
  quietHours: z.string().describe('The quiet hours of system usage.'),
  overallTrends: z.string().describe('Overall trends.'),
});
export type AnalyzeUsagePatternsOutput = z.infer<typeof AnalyzeUsagePatternsOutputSchema>;

export async function analyzeUsagePatterns(
  input: AnalyzeUsagePatternsInput
): Promise<AnalyzeUsagePatternsOutput> {
  return analyzeUsagePatternsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeUsagePatternsPrompt',
  input: {schema: AnalyzeUsagePatternsInputSchema},
  output: {schema: AnalyzeUsagePatternsOutputSchema},
  prompt: `You are an expert system administrator specializing in analyzing system usage patterns.

Analyze the following session data to identify peak and quiet hours, and provide a summary of overall trends:

Session Data: {{{sessionData}}}

Based on this data, identify the peak hours, quiet hours, and overall trends. Return the result in JSON format.
`,
});

const analyzeUsagePatternsFlow = ai.defineFlow(
  {
    name: 'analyzeUsagePatternsFlow',
    inputSchema: AnalyzeUsagePatternsInputSchema,
    outputSchema: AnalyzeUsagePatternsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
