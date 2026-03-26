---
sidebar_position: 1
---

# Zod Validation

Use tRPC-native Zod schemas for input and output validation with automatic type inference.
Examples in this guide target Zod `4.x`.

## Input Validation

```ts
import { z } from 'zod';
import { Input, Mutation, Router } from 'nest-trpc-native';

const CreateCatSchema = z.object({
  name: z.string().min(1),
  breed: z.string().optional(),
});

@Router('cats')
class CatsRouter {
  @Mutation({ input: CreateCatSchema })
  create(@Input() input: z.infer<typeof CreateCatSchema>) {
    return { id: '1', ...input };
  }
}
```

Invalid input is automatically rejected with a tRPC `BAD_REQUEST` error before reaching your handler.

## Output Validation

```ts
const CatSchema = z.object({ id: z.string(), name: z.string() });

@Query({ output: z.array(CatSchema) })
list() {
  return [{ id: '1', name: 'Whiskers' }];
}
```

Output validation ensures your handler returns data matching the declared schema.

## Combined Input + Output

```ts
@Query({
  input: z.object({ id: z.string() }),
  output: z.object({ id: z.string(), name: z.string(), breed: z.string() }),
})
findOne(@Input() input: { id: string }) {
  return this.catsService.findById(input.id);
}
```

## Schema Organization

Keep schemas in dedicated files next to your routers:

```
cats/
  cats.router.ts
  cats.schema.ts    ← Zod schemas
  cats.service.ts
```

```ts title="cats.schema.ts"
import { z } from 'zod';

export const CatSchema = z.object({
  id: z.string(),
  name: z.string(),
  breed: z.string().optional(),
});

export const CreateCatSchema = CatSchema.omit({ id: true });
```
