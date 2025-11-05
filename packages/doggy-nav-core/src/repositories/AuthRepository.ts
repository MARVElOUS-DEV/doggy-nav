export interface AuthUser {
  id: string;
  username: string;
  email?: string | null;
  avatar?: string | null;
  roles: string[]; // slugs
  groups: string[]; // slugs
  permissions: string[];
}

export interface AuthRepository {
  verifyCredentials(identifier: string, password: string): Promise<{ userId: string } | null>;
  loadAuthUser(userId: string): Promise<AuthUser>;
  recordSuccessfulLogin(userId: string): Promise<void>;
}
