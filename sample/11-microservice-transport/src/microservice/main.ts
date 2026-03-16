import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  ORDERS_TCP_DEFAULT_PORT,
  ORDERS_TCP_HOST,
  ORDERS_TCP_PORT_ENV,
} from '../common/constants';
import { OrdersMicroserviceModule } from './orders.microservice.module';

async function bootstrap() {
  const port = Number(process.env[ORDERS_TCP_PORT_ENV] ?? ORDERS_TCP_DEFAULT_PORT);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OrdersMicroserviceModule,
    {
      transport: Transport.TCP,
      options: {
        host: ORDERS_TCP_HOST,
        port,
      },
    },
  );

  await app.listen();
  console.log(`Orders microservice listening on tcp://${ORDERS_TCP_HOST}:${port}`);
}

void bootstrap();
