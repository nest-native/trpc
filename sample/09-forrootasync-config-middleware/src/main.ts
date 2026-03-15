import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { DEFAULT_TRPC_PATH, TRPC_PATH_CONFIG_KEY } from './common/trpc-context';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  const config = app.get(ConfigService);
  const trpcPath = config.get<string>(TRPC_PATH_CONFIG_KEY) ?? DEFAULT_TRPC_PATH;

  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`tRPC endpoint: ${await app.getUrl()}${trpcPath}`);
}

void bootstrap();
