// This is an auto-generated file from Firebase Studio.

'use server';

/**
 * @fileOverview Suggests an optimal schedule for tasks based on priorities, deadlines, and estimated completion time.
 *
 * - suggestTaskScheduleFlow - A function that suggests a task schedule.
 * - SuggestTaskScheduleInput - The input type for the suggestTaskSchedule function.
 * - SuggestTaskScheduleOutput - The return type for the suggestTaskSchedule function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {suggestTaskSchedule as suggestTaskScheduleService, Task as TaskType, SuggestedTimeSlot as SuggestedTimeSlotType} from '@/services/task-scheduling';

const SuggestTaskScheduleInputSchema = z.array(
  z.object({
    description: z.string().describe('The description of the task.'),
    dueDate: z.string().describe('The due date of the task (as an ISO string).'),
    priority: z.string().describe('The priority of the task (e.g., High, Medium, Low).'),
    estimatedTimeToCompletion: z
      .number()
      .describe('The estimated time to completion in minutes.'),
  })
);

export type SuggestTaskScheduleInput = z.infer<
  typeof SuggestTaskScheduleInputSchema
>;

const SuggestTaskScheduleOutputSchema = z.array(
  z.object({
    startTime: z.string().describe('The start time of the suggested time slot (as an ISO string).'),
    endTime: z.string().describe('The end time of the suggested time slot (as an ISO string).'),
  })
);

export type SuggestTaskScheduleOutput = z.infer<
  typeof SuggestTaskScheduleOutputSchema
>;

export async function suggestTaskSchedule(
  input: SuggestTaskScheduleInput
): Promise<SuggestTaskScheduleOutput> {
  return suggestTaskScheduleFlow(input);
}

const suggestTaskScheduleFlow =
  ai.defineFlow<
    typeof SuggestTaskScheduleInputSchema,
    typeof SuggestTaskScheduleOutputSchema
  >(
    {
      name: 'suggestTaskScheduleFlow',
      inputSchema: SuggestTaskScheduleInputSchema,
      outputSchema: SuggestTaskScheduleOutputSchema,
    },
    async input => {
      const typedInput: TaskType[] = input.map(task => ({
        ...task,
        dueDate: new Date(task.dueDate),
      }));

      const suggestedSchedule: SuggestedTimeSlotType[] = await suggestTaskScheduleService(
        typedInput
      );

      const output: SuggestTaskScheduleOutput = suggestedSchedule.map(
        slot => ({
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
        })
      );

      return output;
    }
  );
