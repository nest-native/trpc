import { Input, Mutation, Query, Router } from 'nest-trpc-native';
import { parseCreateTodoInput } from './todos.schema';
import { TodosService } from './todos.service';

@Router('todos')
export class TodosRouter {
  constructor(private readonly todosService: TodosService) {}

  @Query()
  list() {
    return this.todosService.list();
  }

  @Mutation({ input: parseCreateTodoInput })
  create(@Input() input: { title: string }) {
    return this.todosService.create(input.title);
  }
}
