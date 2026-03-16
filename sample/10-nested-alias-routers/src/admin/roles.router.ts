import { Query, Router } from 'nest-trpc-native';

@Router('admin.roles')
export class AdminRolesRouter {
  @Query()
  list() {
    return ['owner', 'editor', 'viewer'];
  }
}
