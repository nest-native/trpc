import { Module } from '@nestjs/common';
import { join } from 'path';
import { TrpcModule } from 'nest-trpc-native';
import { AdminRolesRouter } from './admin/roles.router';
import { AdminUsersRouter } from './admin/users.router';
import { TRPC_PATH } from './common/trpc-context';
import { HealthRouter } from './health.router';

@Module({
  imports: [
    TrpcModule.forRoot({
      path: TRPC_PATH,
      autoSchemaFile: join(process.cwd(), 'src/@generated/server.ts'),
    }),
  ],
  providers: [AdminUsersRouter, AdminRolesRouter, HealthRouter],
})
export class AppModule {}
