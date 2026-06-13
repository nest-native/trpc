import { Mutation, Query, Router } from '@nest-native/trpc';

@Router('admin.users')
export class AdminUsersRouter {
  @Query()
  list() {
    return ['alice', 'bob'];
  }

  @Mutation()
  create() {
    return { ok: true as const };
  }
}
