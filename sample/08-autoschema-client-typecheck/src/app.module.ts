import { Module } from '@nestjs/common';
import { join } from 'path';
import { TrpcModule } from 'nest-trpc-native';
import { TRPC_PATH } from './common/trpc-context';
import { MathRouter } from './math/math.router';

@Module({
  imports: [
    TrpcModule.forRoot({
      path: TRPC_PATH,
      autoSchemaFile: join(process.cwd(), 'src/@generated/server.ts'),
    }),
  ],
  providers: [MathRouter],
})
export class AppModule {}
