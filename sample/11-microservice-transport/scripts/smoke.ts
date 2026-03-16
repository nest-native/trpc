import { createServer } from 'node:net';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { AppModule } from '../src/app.module';
import {
  ORDERS_CLIENT_TOKEN,
  ORDERS_TCP_HOST,
  ORDERS_TCP_PORT_ENV,
  TRPC_PATH,
} from '../src/common/constants';
import { OrdersMicroserviceModule } from '../src/microservice/orders.microservice.module';
import type { AppRouter } from '../src/@generated/server';

async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on('error', reject);
    server.listen(0, ORDERS_TCP_HOST, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Could not determine free port'));
        return;
      }
      const { port } = address;
      server.close(err => {
        if (err) {
          reject(err);
          return;
        }
        resolve(port);
      });
    });
  });
}

async function smoke() {
  const tcpPort = await getFreePort();
  process.env[ORDERS_TCP_PORT_ENV] = String(tcpPort);

  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(
    OrdersMicroserviceModule,
    {
      transport: Transport.TCP,
      options: {
        host: ORDERS_TCP_HOST,
        port: tcpPort,
      },
      logger: false,
    },
  );

  await microservice.listen();

  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, '127.0.0.1');

  try {
    const baseUrl = await app.getUrl();
    const client = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${baseUrl}${TRPC_PATH}`,
        }),
      ],
    });

    const order = await client.orders.get.query();

    if (!order || typeof order !== 'object') {
      throw new Error('Expected order payload from microservice transport');
    }

    const record = order as Record<string, unknown>;
    if (record.id !== 'order-42') {
      throw new Error('Expected order id to be sourced from query input');
    }
    if (record.source !== 'microservice') {
      throw new Error('Expected order source to be microservice');
    }
  } finally {
    const ordersClient = app.get(ORDERS_CLIENT_TOKEN, { strict: false }) as
      | { close?: () => unknown }
      | undefined;
    ordersClient?.close?.();
    await app.close();
    await microservice.close();
    delete process.env[ORDERS_TCP_PORT_ENV];
  }
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
