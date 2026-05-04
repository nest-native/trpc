import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TRPC_PATH } from './common/trpc-context';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
  });

  await app.listen(3000);

  const url = await app.getUrl();
  console.log(`Angular showcase API: ${url}`);
  console.log(`tRPC endpoint: ${url}${TRPC_PATH}`);
}

void bootstrap();
