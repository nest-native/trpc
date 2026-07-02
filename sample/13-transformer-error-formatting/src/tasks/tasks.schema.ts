import { z } from 'zod';

export const TaskSchema = z.object({
  id: z.number(),
  title: z.string(),
  dueAt: z.date(),
});

export const CreateTaskSchema = z.object({
  title: z.string().min(3),
  dueAt: z.date(),
});

export type Task = z.infer<typeof TaskSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
