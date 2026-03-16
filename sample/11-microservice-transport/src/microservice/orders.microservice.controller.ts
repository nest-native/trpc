import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { OrderDto } from '../orders/orders.contract';

@Controller()
export class OrdersMicroserviceController {
  @MessagePattern('orders.findById')
  findById(payload: { id: string }): OrderDto {
    return {
      id: payload.id,
      status: 'created',
      source: 'microservice',
    };
  }
}
