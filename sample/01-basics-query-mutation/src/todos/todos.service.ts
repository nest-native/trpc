import { Injectable } from '@nestjs/common';

export interface Todo {
  id: number;
  title: string;
}

@Injectable()
export class TodosService {
  private readonly todos: Todo[] = [{ id: 1, title: 'Read the docs' }];
  private nextId = 2;

  list(): Todo[] {
    return [...this.todos];
  }

  create(title: string): Todo {
    const todo = { id: this.nextId++, title };
    this.todos.push(todo);
    return todo;
  }
}
