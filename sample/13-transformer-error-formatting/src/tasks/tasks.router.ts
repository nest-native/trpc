import { Input, Mutation, Query, Router } from '@nest-native/trpc';
import { z } from 'zod';
import { CreateTaskSchema, TaskSchema } from './tasks.schema';
import { TasksService } from './tasks.service';

@Router('tasks')
export class TasksRouter {
  constructor(private readonly tasksService: TasksService) {}

  @Query({ output: z.array(TaskSchema) })
  list() {
    // `dueAt` stays a real `Date` on the wire thanks to superjson.
    return this.tasksService.list();
  }

  @Mutation({ input: CreateTaskSchema, output: TaskSchema })
  create(@Input() input: { title: string; dueAt: Date }) {
    return this.tasksService.create(input);
  }
}
