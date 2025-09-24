
export interface Category {
  _id: string;
  name: string;
  categoryId: string;
  createAt: number;
  icon?: string;
  children?: Category[];
  showInMenu: boolean;
  href?: string
}

export interface NavItem {
  _id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  href: string;
  desc: string;
  logo: string;
  authorName?: string;
  authorUrl?: string;
  auditTime?: string;
  createTime?: string;
  tags: string[];
  view: number;
  star: number;
  status: number;
  list?: NavItem[];
  highlightedName?: React.ReactNode;
  highlightedDesc?: React.ReactNode;
}

export interface Tag {
  _id: string;
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
}
