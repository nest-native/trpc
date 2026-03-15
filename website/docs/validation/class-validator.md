---
sidebar_position: 2
---

# class-validator Validation

Use NestJS-style DTOs with `class-validator` and `ValidationPipe` instead of Zod.

## Setup

```bash
npm i class-validator class-transformer
```

## Define a DTO

```ts
import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateCatDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  breed?: string;
}
```

## Use with @Input()

```ts
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { Input, Mutation, Router } from 'nest-trpc-native';
import { CreateCatDto } from './create-cat.dto';

@Router('cats')
class CatsRouter {
  @Mutation()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  create(@Input() input: CreateCatDto) {
    return { id: '1', ...input };
  }
}
```

## Global ValidationPipe

Apply validation globally to all procedures:

```ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
```

## When to Use class-validator vs Zod

| | class-validator | Zod |
|---|---|---|
| **Style** | Decorators on classes | Functional schemas |
| **Type inference** | Manual DTO types | Automatic `z.infer` |
| **tRPC schema gen** | Not supported | Full support |
| **Nest familiarity** | Native Nest pattern | tRPC-native pattern |

:::tip
You can use both approaches in the same app. Use Zod for procedures that benefit from auto-generated types, and class-validator for procedures where you prefer the DTO pattern.
:::
