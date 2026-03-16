import { Query, Router } from 'nest-trpc-native';
import { OrdersGatewayService } from './orders-gateway.service';

@Router('orders')
export class OrdersRouter {
  constructor(private readonly ordersGatewayService: OrdersGatewayService) {}

  @Query()
  get() {
    return this.ordersGatewayService.findById('order-42');
  }
}
