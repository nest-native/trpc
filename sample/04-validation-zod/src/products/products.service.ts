import { Injectable } from '@nestjs/common';
import { CreateProductInput, Product } from './products.schema';

@Injectable()
export class ProductsService {
  private readonly products: Product[] = [{ id: 1, name: 'Keyboard', price: 99 }];
  private nextId = 2;

  list() {
    return [...this.products];
  }

  byId(id: number) {
    return this.products.find(product => product.id === id);
  }

  create(input: CreateProductInput) {
    const product = { id: this.nextId++, ...input };
    this.products.push(product);
    return product;
  }
}
