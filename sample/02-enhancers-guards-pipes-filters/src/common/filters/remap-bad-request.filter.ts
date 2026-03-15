import {
  BadRequestException,
  ExceptionFilter,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';

@Injectable()
export class RemapBadRequestFilter implements ExceptionFilter<BadRequestException> {
  catch(): never {
    throw new UnprocessableEntityException('filtered invalid payload');
  }
}
