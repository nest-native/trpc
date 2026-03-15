import { Module } from '@nestjs/common';
import { join } from 'path';
import { TrpcModule } from 'nest-trpc-native';
import { AccountsRouter } from './accounts/accounts.router';
import { AccountsService } from './accounts/accounts.service';

@Module({
  imports: [
    TrpcModule.forRoot({
      path: '/trpc',
      autoSchemaFile: join(process.cwd(), 'src/@generated/server.ts'),
    }),
  ],
  providers: [AccountsService, AccountsRouter],
})
export class AppModule {}
