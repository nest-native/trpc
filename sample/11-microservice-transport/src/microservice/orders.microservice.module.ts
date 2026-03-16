import { Module } from '@nestjs/common';
import { OrdersMicroserviceController } from './orders.microservice.controller';

@Module({
  controllers: [OrdersMicroserviceController],
})
export class OrdersMicroserviceModule {}
