import type { PageQuery } from '../dto/pagination';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string | null;
  roles: string[]; // slugs
  groups: string[]; // slugs
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileInput {
  email?: string;
  avatar?: string | null;
}

export interface AdminUserListFilter {
  account?: string;
  email?: string;
  status?: boolean;
}

export interface AdminUserListItem {
  id: string;
  account: string;
  nickName: string;
  avatar: string;
  email: string;
  roles: string[]; // role slugs
  groups: string[]; // display names or slugs
  status: 0 | 1;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminGetUserResponse {
  id: string;
  account: string;
  nickName: string;
  email: string;
  phone: string;
  status: boolean;
  role: 'admin' | 'default';
  roles: string[]; // role ids
  groups: string[]; // group ids
}

export interface AdminCreateUserInput {
  account: string;
  email: string;
  password: string;
  status: boolean;
  nickName?: string;
  phone?: string;
  roles?: string[]; // role ids
  role?: 'admin' | 'user';
  groups?: string[]; // group ids
}

export interface AdminUpdateUserInput {
  account?: string;
  email?: string;
  password?: string;
  status?: boolean;
  nickName?: string;
  phone?: string;
  roles?: string[]; // role ids
  role?: 'admin' | 'user';
  groups?: string[]; // group ids
}

export interface UserRepository {
  getProfile(userId: string): Promise<UserProfile>;
  updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfile>;
  adminList(filter: AdminUserListFilter, page: PageQuery): Promise<{ list: AdminUserListItem[]; total: number }>;
  adminGetOne(id: string): Promise<AdminGetUserResponse | null>;
  adminCreate(input: AdminCreateUserInput): Promise<{ id: string }>;
  adminUpdate(id: string, input: AdminUpdateUserInput): Promise<boolean>;
  adminDelete(ids: string[]): Promise<boolean>;
}
