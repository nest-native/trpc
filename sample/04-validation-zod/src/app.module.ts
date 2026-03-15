import { Module } from '@nestjs/common';
import { join } from 'path';
import { TrpcModule } from 'nest-trpc-native';
import { TRPC_PATH } from './common/trpc-context';
import { ProductsRouter } from './products/products.router';
import { ProductsService } from './products/products.service';

@Module({
  imports: [
    TrpcModule.forRoot({
      path: TRPC_PATH,
      autoSchemaFile: join(process.cwd(), 'src/@generated/server.ts'),
    }),
  ],
  providers: [ProductsService, ProductsRouter],
})
export class AppModule {}
