import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number().positive(),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
});

export const ProductIdSchema = z.object({
  id: z.number().int().positive(),
});

export type Product = z.infer<typeof ProductSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
