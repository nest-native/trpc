---
sidebar_position: 8
---

# Express and Fastify

`nest-trpc-native` is adapter-agnostic. Your router code stays identical regardless of the underlying HTTP framework.

## Express (Default)

```ts title="main.ts"
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

## Fastify

```ts title="main-fastify.ts"
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  await app.listen(3000);
}
bootstrap();
```

## No Router Changes Needed

The same router class works with both adapters:

```ts
@Router('cats')
class CatsRouter {
  @Query()
  list() {
    return [{ id: '1', name: 'Whiskers' }];
  }
}
```

The `TrpcHttpAdapter` internally uses the tRPC Fetch adapter, which normalizes the request/response interface across frameworks.

## Verifying Adapter Parity

The showcase includes smoke tests for both adapters:

```bash
npm run smoke:express
npm run smoke:fastify
```

Both run identical client requests against the server to confirm consistent behavior.
