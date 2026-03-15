import { Injectable } from '@nestjs/common';

export interface Account {
  id: number;
  name: string;
  email: string;
}

@Injectable()
export class AccountsService {
  private readonly accounts: Account[] = [];
  private nextId = 1;

  list() {
    return [...this.accounts];
  }

  create(input: { name: string; email: string }) {
    const account = { id: this.nextId++, ...input };
    this.accounts.push(account);
    return account;
  }
}
