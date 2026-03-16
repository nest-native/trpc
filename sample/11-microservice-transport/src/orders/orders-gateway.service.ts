import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ORDERS_CLIENT_TOKEN } from '../common/constants';
import { OrderDto } from './orders.contract';

@Injectable()
export class OrdersGatewayService {
  constructor(
    @Inject(ORDERS_CLIENT_TOKEN)
    private readonly ordersClient: ClientProxy,
  ) {}

  async findById(id: string): Promise<OrderDto> {
    return lastValueFrom(this.ordersClient.send('orders.findById', { id }));
  }
}
