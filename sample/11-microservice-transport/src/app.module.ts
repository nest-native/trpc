import { Module } from '@nestjs/common';
import { join } from 'path';
import { TrpcModule } from 'nest-trpc-native';
import { TRPC_PATH } from './common/constants';
import { ordersClientProvider } from './orders/orders-client.provider';
import { OrdersGatewayService } from './orders/orders-gateway.service';
import { OrdersRouter } from './orders/orders.router';

@Module({
  imports: [
    TrpcModule.forRoot({
      path: TRPC_PATH,
      autoSchemaFile: join(process.cwd(), 'src/@generated/server.ts'),
    }),
  ],
  providers: [ordersClientProvider, OrdersGatewayService, OrdersRouter],
})
export class AppModule {}
