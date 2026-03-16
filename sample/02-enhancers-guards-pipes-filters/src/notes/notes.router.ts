import {
  BadRequestException,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  Input,
  Mutation,
  Query,
  Router,
  TrpcContext,
} from 'nest-trpc-native';
import { RemapBadRequestFilter } from '../common/filters/remap-bad-request.filter';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ExecutionTimeInterceptor } from '../common/interceptors/execution-time.interceptor';
import { parseCreateNoteInput, parseNoteSearchInput } from './notes.schema';
import { NotesService } from './notes.service';

@Router('notes')
@UseInterceptors(ExecutionTimeInterceptor)
export class NotesRouter {
  constructor(private readonly notesService: NotesService) {}

  @Query()
  list() {
    return this.notesService.list();
  }

  @Query({ input: parseNoteSearchInput })
  search(@Input('query') query: string) {
    return this.notesService.search(query);
  }

  @Mutation({ input: parseCreateNoteInput })
  @UseGuards(ApiKeyGuard)
  create(
    @Input() input: { text: string },
    @TrpcContext('requestId') requestId: string,
  ) {
    return this.notesService.create(input.text, requestId);
  }

  @Mutation()
  @UseFilters(RemapBadRequestFilter)
  filteredError() {
    throw new BadRequestException('raw invalid payload');
  }
}
