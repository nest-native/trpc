import { Input, Mutation, Query, Router } from 'nest-trpc-native';
import { z } from 'zod';
import {
  CreateProductSchema,
  ProductIdSchema,
  ProductSchema,
} from './products.schema';
import { ProductsService } from './products.service';

@Router('products')
export class ProductsRouter {
  constructor(private readonly productsService: ProductsService) {}

  @Query({ output: z.array(ProductSchema) })
  list() {
    return this.productsService.list();
  }

  @Query({ input: ProductIdSchema, output: ProductSchema.nullable() })
  byId(@Input() input: { id: number }) {
    return this.productsService.byId(input.id) ?? null;
  }

  @Mutation({ input: CreateProductSchema, output: ProductSchema })
  create(@Input() input: { name: string; price: number }) {
    return this.productsService.create(input);
  }
}
