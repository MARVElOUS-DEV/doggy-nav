export interface Category {
  id: string;
  name: string;
  categoryId: string;
  createAt: number;
  description?: string;
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
  count?: number;
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

export type SupportCurrency = 'usd' | 'hkd';

export interface CreatorProfileSettings {
  name?: string | null;
  title?: string | null;
  headline?: string | null;
  bio?: string | null;
  mission?: string | null;
}

export interface SupportTierDefinition {
  id: string;
  label: string;
  description: string;
  amounts?: Partial<Record<SupportCurrency, number>>;
}

export interface SupportSettings {
  enabled?: boolean | null;
  creatorLabel?: string | null;
  defaultCurrency?: SupportCurrency | null;
  currencies?: SupportCurrency[];
  tiers?: SupportTierDefinition[];
}

export interface SiteSettings {
  siteTitle?: string | null;
  logoUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  copyrightText?: string | null;
  feedbackUrl?: string | null;
  creatorProfile?: CreatorProfileSettings | null;
  supportSettings?: SupportSettings | null;
}

export type ToolOutputDirection = 'yaml-to-json' | 'json-to-yaml';

export interface ToolOutputPublication {
  toolId: string;
  enabled: boolean;
  publishId: string;
  subscriptionToken: string;
  direction: ToolOutputDirection;
  contentType: string;
  createdAt?: string;
  updatedAt?: string;
}
