import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TRPC_PATH } from './common/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`tRPC endpoint: ${await app.getUrl()}${TRPC_PATH}`);
}

void bootstrap();
