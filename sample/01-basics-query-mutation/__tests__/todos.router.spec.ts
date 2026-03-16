import 'reflect-metadata';
import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { TrpcRouter } from 'nest-trpc-native';
import { TrpcModule } from 'nest-trpc-native';
import { TRPC_PATH } from '../src/common/trpc-context';
import { TodosRouter } from '../src/todos/todos.router';
import { Todo, TodosService } from '../src/todos/todos.service';

test('TodosRouter.list delegates to TodosService.list', () => {
  const expected: Todo[] = [{ id: 1, title: 'Review sample tests' }];
  let listCalls = 0;
  const serviceStub: Pick<TodosService, 'list' | 'create'> = {
    list() {
      listCalls += 1;
      return expected;
    },
    create(title: string) {
      return { id: 2, title };
    },
  };

  const router = new TodosRouter(serviceStub as TodosService);
  const result = router.list();

  assert.deepEqual(result, expected);
  assert.equal(listCalls, 1);
});

test('TodosRouter.create delegates to TodosService.create with given title', () => {
  let createArg: string | undefined;
  const serviceStub: Pick<TodosService, 'list' | 'create'> = {
    list() {
      return [];
    },
    create(title: string) {
      createArg = title;
      return { id: 99, title };
    },
  };

  const router = new TodosRouter(serviceStub as TodosService);
  const created = router.create({ title: 'Ship router tests' });

  assert.equal(createArg, 'Ship router tests');
  assert.deepEqual(created, { id: 99, title: 'Ship router tests' });
});

async function bootstrapCaller() {
  @Module({
    imports: [TrpcModule.forRoot({ path: TRPC_PATH })],
    providers: [TodosRouter, TodosService],
  })
  class TestAppModule {}

  const app = await NestFactory.createApplicationContext(TestAppModule, {
    logger: false,
    abortOnError: false,
  });
  const trpcRouter = app.get(TrpcRouter);
  const caller = trpcRouter.getRouter().createCaller({}) as {
    todos: {
      list: () => Promise<Todo[]>;
      create: (input: { title: string }) => Promise<Todo>;
    };
  };

  return { app, caller };
}

test('in-process caller executes query/mutation with parsed input', async () => {
  const { app, caller } = await bootstrapCaller();

  try {
    const before = await caller.todos.list();
    const created = await caller.todos.create({ title: '  Write docs  ' });
    const after = await caller.todos.list();

    assert.equal(created.title, 'Write docs');
    assert.equal(after.length, before.length + 1);
  } finally {
    await app.close();
  }
});

test('in-process caller surfaces parser errors for invalid input', async () => {
  const { app, caller } = await bootstrapCaller();

  try {
    await assert.rejects(
      () => caller.todos.create({ title: '   ' }),
      /Expected non-empty "title" string/,
    );
  } finally {
    await app.close();
  }
});
