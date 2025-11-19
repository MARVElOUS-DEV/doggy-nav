export interface Category {
  id: string;
  name: string;
  categoryId: string;
  createAt: number;
  icon?: string;
  children?: Category[];
  showInMenu: boolean;
  onlyFolder?: boolean;
  href?: string;
}

export interface NavItem {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  href: string;
  desc: string;
  detail?: string;
  logo: string;
  authorName?: string;
  authorUrl?: string;
  auditTime?: string;
  createTime: number | string;
  tags: string[];
  view: number;
  star: number;
  status: number;
  list?: NavItem[];
  highlightedName?: React.ReactNode;
  highlightedDesc?: React.ReactNode;
  isFavorite?: boolean; // Track if item is favorited by current user
}

export interface Tag {
  id: string;
  name: string;
  parentName?: string;
  value?: string;
  label?: string;
}

export interface RecommendFormValues {
  href: string;
  tags: string[];
  name: string;
  logo: string;
  desc: string;
  categoryId: string;
  authorName?: string;
  authorUrl?: string;
  detail?: string;
  audience?: {
    visibility?: 'public' | 'authenticated' | 'restricted' | 'hide';
    allowRoles?: string[];
    allowGroups?: string[];
  };
}
export type OAuthProvider = 'github' | 'google' | 'linuxdo';
export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  role?: string;
}

export interface LoginFormValues {
  username: string;
  password: string;
}

export interface RegisterFormValues {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  inviteCode?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface SystemVersionInfo {
  currentCommitId: string | null;
  currentCommitTime: string | null;
  latestCommitId: string | null;
  latestCommitTime: string | null;
  hasNewVersion: boolean;
  checkedAt: string | null;
  error?: string;
}

export interface Affiche {
  id: string;
  text: string;
  linkHref?: string | null;
  linkText?: string | null;
  linkTarget?: string | null;
  active: boolean;
  order?: number | null;
}
