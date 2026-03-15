---
sidebar_position: 2
---

# @Query() and @Mutation()

These decorators define tRPC procedures on router methods.

## @Query()

Marks a method as a tRPC query (read operation):

```ts
import { Query, Router } from 'nest-trpc-native';

@Router('cats')
class CatsRouter {
  @Query()
  list() {
    return [{ id: '1', name: 'Whiskers' }];
  }
}
```

Client: `trpc.cats.list.query()`

## @Mutation()

Marks a method as a tRPC mutation (write operation):

```ts
import { Input, Mutation, Router } from 'nest-trpc-native';
import { z } from 'zod';

const CreateCatSchema = z.object({ name: z.string().min(1) });

@Router('cats')
class CatsRouter {
  @Mutation({ input: CreateCatSchema })
  create(@Input() input: { name: string }) {
    return { id: '2', ...input };
  }
}
```

Client: `trpc.cats.create.mutate({ name: 'Luna' })`

## Procedure Options

Both decorators accept an options object:

| Option | Type | Description |
|---|---|---|
| `input` | Zod schema | Validates and types the procedure input |
| `output` | Zod schema | Validates and types the procedure output |

```ts
@Query({
  input: z.object({ id: z.string() }),
  output: z.object({ id: z.string(), name: z.string() }),
})
findOne(@Input() input: { id: string }) {
  return { id: input.id, name: 'Whiskers' };
}
```

## Custom Procedure Names

By default, the method name becomes the procedure name. Pass a string to override:

```ts
@Query('findAll')
list() {
  return [];
}
```

Client: `trpc.cats.findAll.query()` instead of `trpc.cats.list.query()`
