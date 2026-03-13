import { Module } from '@nestjs/common';
import { UsersRouter } from './users.router';
import { UsersService } from './users.service';
import { RemapBadRequestFilter } from '../common/filters/remap-bad-request.filter';
import { RequestMetaService } from './request-meta.service';

@Module({
  providers: [UsersService, UsersRouter, RemapBadRequestFilter, RequestMetaService],
  exports: [UsersService],
})
export class UsersModule {}
