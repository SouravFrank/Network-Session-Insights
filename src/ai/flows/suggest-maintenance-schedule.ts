'use server';

/**
 * @fileOverview AI-driven suggestions for optimal system maintenance times based on predicted usage patterns.
 *
 * - suggestMaintenanceSchedule - A function that handles the maintenance schedule suggestion process.
 * - SuggestMaintenanceScheduleInput - The input type for the suggestMaintenanceSchedule function.
 * - SuggestMaintenanceScheduleOutput - The return type for the suggestMaintenanceSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMaintenanceScheduleInputSchema = z.object({
  usagePatterns: z
    .string()
    .describe(
      'A description of the system usage patterns, including peak and quiet hours.'
    ),
  currentTime: z.string().describe('The current time.'),
});
export type SuggestMaintenanceScheduleInput = z.infer<
  typeof SuggestMaintenanceScheduleInputSchema
>;

const SuggestMaintenanceScheduleOutputSchema = z.object({
  suggestedMaintenanceTime: z
    .string()
    .describe(
      'The suggested time for system maintenance, considering minimal disruption and efficient resource management.'
    ),
  reasoning: z
    .string()
    .describe(
      'The reasoning behind the suggested maintenance time, based on the usage patterns.'
    ),
});
export type SuggestMaintenanceScheduleOutput = z.infer<
  typeof SuggestMaintenanceScheduleOutputSchema
>;

export async function suggestMaintenanceSchedule(
  input: SuggestMaintenanceScheduleInput
): Promise<SuggestMaintenanceScheduleOutput> {
  return suggestMaintenanceScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMaintenanceSchedulePrompt',
  input: {schema: SuggestMaintenanceScheduleInputSchema},
  output: {schema: SuggestMaintenanceScheduleOutputSchema},
  prompt: `You are an expert system administrator specializing in scheduling system maintenance.

You will use the provided system usage patterns and the current time to suggest an optimal time for system maintenance.
Consider minimizing disruption and ensuring efficient resource management.

Current Time: {{{currentTime}}}
Usage Patterns: {{{usagePatterns}}}

Based on this information, suggest a maintenance time and explain your reasoning.
`,
});

const suggestMaintenanceScheduleFlow = ai.defineFlow(
  {
    name: 'suggestMaintenanceScheduleFlow',
    inputSchema: SuggestMaintenanceScheduleInputSchema,
    outputSchema: SuggestMaintenanceScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
