---
sidebar_position: 4
---

# @Input()

The `@Input()` decorator extracts the validated procedure input and injects it into a method parameter.

## Basic Usage

```ts
import { Input, Mutation, Router } from 'nest-trpc-native';
import { z } from 'zod';

const CreateCatSchema = z.object({ name: z.string().min(1) });

@Router('cats')
class CatsRouter {
  @Mutation({ input: CreateCatSchema })
  create(@Input() input: { name: string }) {
    return { id: '1', ...input };
  }
}
```

## Extracting Nested Properties

Pass a property path to extract a specific field from the input:

```ts
@Mutation({ input: z.object({ name: z.string(), age: z.number() }) })
create(@Input('name') name: string) {
  // `name` is directly the string value
  return { id: '1', name };
}
```

## Without Zod (class-validator)

`@Input()` also works with class-validator DTOs when combined with `@UsePipes()`:

```ts
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';

class CreateCatDto {
  @IsString()
  @MinLength(1)
  name!: string;
}

@Mutation()
@UsePipes(new ValidationPipe({ whitelist: true }))
create(@Input() input: CreateCatDto) {
  return { id: '1', ...input };
}
```
