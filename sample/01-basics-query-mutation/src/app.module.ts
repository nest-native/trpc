import { Module } from '@nestjs/common';
import { join } from 'path';
import { TrpcModule } from 'nest-trpc-native';
import { TRPC_PATH } from './common/trpc-context';
import { TodosRouter } from './todos/todos.router';
import { TodosService } from './todos/todos.service';

@Module({
  imports: [
    TrpcModule.forRoot({
      path: TRPC_PATH,
      autoSchemaFile: join(process.cwd(), 'src/@generated/server.ts'),
    }),
  ],
  providers: [TodosRouter, TodosService],
})
export class AppModule {}
