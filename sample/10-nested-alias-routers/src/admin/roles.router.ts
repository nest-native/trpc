import { Query, Router } from '@nest-native/trpc';

@Router('admin.roles')
export class AdminRolesRouter {
  @Query()
  list() {
    return ['owner', 'editor', 'viewer'];
  }
}
