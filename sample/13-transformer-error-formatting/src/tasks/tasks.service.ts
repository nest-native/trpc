import { Injectable } from '@nestjs/common';
import { CreateTaskInput, Task } from './tasks.schema';

@Injectable()
export class TasksService {
  private readonly tasks: Task[] = [
    {
      id: 1,
      title: 'Ship release',
      dueAt: new Date('2026-01-02T03:04:05.000Z'),
    },
  ];
  private nextId = 2;

  list() {
    return [...this.tasks];
  }

  create(input: CreateTaskInput) {
    const task = { id: this.nextId++, ...input };
    this.tasks.push(task);
    return task;
  }
}
