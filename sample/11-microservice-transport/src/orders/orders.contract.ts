export interface OrderDto {
  id: string;
  status: 'created' | 'paid' | 'shipped';
  source: 'microservice';
}
