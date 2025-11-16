export type ID = string;

export interface Group {
  id: ID;
  slug: string;
  displayName: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthContext {
  roles?: string[];
  groups?: string[]; // group slugs
  source?: 'main' | 'admin';
  roleIds?: string[]; // db ids as strings
  groupIds?: string[]; // db ids as strings
}

export type Visibility = 'public' | 'authenticated' | 'restricted' | 'hide';

export interface Audience {
  visibility?: Visibility;
  allowRoles?: string[]; // role ids
  allowGroups?: string[]; // group ids
}

export interface Category {
  id: ID;
  name: string;
  categoryId?: string | null;
  description?: string | null;
  onlyFolder?: boolean;
  icon?: string | null;
  showInMenu?: boolean;
  audience?: Audience;
  children?: Category[];
}

export interface NavItem {
  id: ID;
  categoryId?: string | null;
  name: string;
  href?: string | null;
  desc?: string | null;
  logo?: string | null;
  authorName?: string | null;
  authorUrl?: string | null;
  auditTime?: string | null;
  createTime?: number | null;
  tags?: string[];
  view?: number;
  star?: number;
  status?: number; // 0 pass, 1 wait, 2 refuse
  isFavorite?: boolean;
  categoryName?: string | null;
  audience?: Audience;
}

export interface Role {
  id: ID;
  slug: string;
  displayName: string;
  description?: string;
  permissions?: string[];
  isSystem?: boolean;
}

export interface InviteCode {
  id: ID;
  code: string;
  usageLimit: number;
  usedCount: number;
  active: boolean;
  expiresAt?: string | null;
  allowedEmailDomain?: string | null;
  createdBy?: string | null;
  lastUsedAt?: string | null;
  lastUsedBy?: string | null;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  fromName: string;
  fromAddress: string;
  replyTo: string;
  enableNotifications: boolean;
  adminEmails: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Tag {
  id: ID;
  name: string;
  parentName?: string | null;
}

export interface FavoriteFolder {
  id: ID;
  name: string;
  order?: number | null;
  coverNavId?: string | null;
}

export type FavoriteUnionItem =
  | { type: 'folder'; order?: number | null; folder: FavoriteFolder; items: NavItem[] }
  | { type: 'nav'; order?: number | null; nav: NavItem };

export interface Prompt {
  id: ID;
  name: string;
  content: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Affiche {
  id: ID;
  text: string;
  linkHref?: string | null;
  linkText?: string | null;
  linkTarget?: string | null;
  active: boolean;
  order?: number | null;
  createdAt?: string;
  updatedAt?: string;
}
