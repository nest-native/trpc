---
sidebar_position: 3
---

# Pipes

NestJS pipes validate and transform input data before it reaches your procedure handler.

## Usage with Zod

When you define a Zod schema on a procedure, input validation happens automatically:

```ts
@Mutation({ input: z.object({ name: z.string().min(1) }) })
create(@Input() input: { name: string }) {
  return { id: '1', ...input };
}
```

## Usage with class-validator

Apply `ValidationPipe` to use DTO-based validation:

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

## Custom Pipes

```ts
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'object' && value !== null) {
      for (const key of Object.keys(value)) {
        if (typeof value[key] === 'string') {
          value[key] = value[key].trim();
        }
      }
    }
    return value;
  }
}
```

```ts
@Mutation()
@UsePipes(TrimPipe)
create(@Input() input: { name: string }) {
  // input.name is already trimmed
  return { id: '1', ...input };
}
```

## Global Pipes

Global pipes registered via `APP_PIPE` apply to all tRPC procedures:

```ts
import { APP_PIPE } from '@nestjs/core';

@Module({
  providers: [
    { provide: APP_PIPE, useClass: TrimPipe },
  ],
})
export class AppModule {}
```

See the runnable example:

- `sample/02-enhancers-guards-pipes-filters/src/app.module.ts`
- `sample/02-enhancers-guards-pipes-filters/src/common/pipes/trim.pipe.ts`
