import { Query, Router, Mutation, Input } from 'nest-trpc-native';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './create-account.dto';

function parseCreateAccountInput(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Expected object input');
  }
  return input as Record<string, unknown>;
}

@Router('accounts')
export class AccountsRouter {
  constructor(private readonly accountsService: AccountsService) {}

  @Query()
  list() {
    return this.accountsService.list();
  }

  @Mutation({ input: parseCreateAccountInput })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  create(@Input() input: CreateAccountDto) {
    return this.accountsService.create(input);
  }
}
