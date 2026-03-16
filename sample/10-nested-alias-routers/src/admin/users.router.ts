import { Mutation, Query, Router } from 'nest-trpc-native';

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
