import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './@generated/server';

const client = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: 'http://localhost:3000/trpc' })],
});

async function assertTypes() {
  const created = await client.products.create.mutate({
    name: 'Mouse',
    price: 29,
  });
  const _createdId: number = created.id;

  const maybeProduct = await client.products.byId.query({ id: 1 });
  if (maybeProduct) {
    const _name: string = maybeProduct.name;
  }

  const list = await client.products.list.query();
  const _firstPrice: number | undefined = list[0]?.price;
}

void assertTypes;
