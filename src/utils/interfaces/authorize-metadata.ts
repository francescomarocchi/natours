import { UserRoles } from '../../model/user';

export interface AuthorizeMetadata {
  key: string;
  roles?: UserRoles[];
}
