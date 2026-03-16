import { Provider } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import {
  ORDERS_CLIENT_TOKEN,
  ORDERS_TCP_DEFAULT_PORT,
  ORDERS_TCP_HOST,
  ORDERS_TCP_PORT_ENV,
} from '../common/constants';

export const ordersClientProvider: Provider = {
  provide: ORDERS_CLIENT_TOKEN,
  useFactory: () => {
    const port = Number(process.env[ORDERS_TCP_PORT_ENV] ?? ORDERS_TCP_DEFAULT_PORT);
    return ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: ORDERS_TCP_HOST,
        port,
      },
    });
  },
};
