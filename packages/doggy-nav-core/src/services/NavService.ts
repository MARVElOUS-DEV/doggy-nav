import type { AuthContext, NavItem, Audience, Visibility } from '../types/types';
import type { PageQuery, PageResult } from '../dto/pagination';
import type { NavRepository, NavListFilter } from '../repositories/NavRepository';
import type { CategoryRepository } from '../repositories/CategoryRepository';

function isSysAdmin(roles?: string[]) {
  const r = Array.isArray(roles) ? roles : [];
  return r.includes('sysadmin') || r.includes('admin');
}

function hasAny(hay: string[] | undefined, needles: string[] | undefined) {
  if (!Array.isArray(hay) || !Array.isArray(needles)) return false;
  const set = new Set(hay);
  return needles.some((n) => set.has(n));
}

function audienceVisible(aud: Audience | undefined, user?: AuthContext): boolean {
  const vis: Visibility = (aud?.visibility as Visibility) || 'public';
  const roles = Array.isArray(user?.roles) ? user!.roles! : [];
  const roleIds = Array.isArray(user?.roleIds) ? user!.roleIds! : [];
  const groupIds = Array.isArray(user?.groupIds) ? user!.groupIds! : [];
  if (roles.includes('sysadmin')) return true;
  if (vis === 'hide') return false;
  if (vis === 'public') return true;
  if (vis === 'authenticated') return !!user;
  if (vis === 'restricted') {
    const allowRoles = (aud?.allowRoles || []).map(String);
    const allowGroups = (aud?.allowGroups || []).map(String);
    return hasAny(allowRoles, roleIds) || hasAny(allowGroups, groupIds);
  }
  return true;
}

function normalizePage(page: PageQuery) {
  const pageSize = Math.min(Math.max(Number(page.pageSize) || 10, 1), 100);
  const pageNumber = Math.max(Number(page.pageNumber) || 1, 1);
  return { pageSize, pageNumber };
}

import { dateToChromeTime } from '../utils/timeUtil';

export class NavService {
  constructor(
    private readonly repo: NavRepository,
    private readonly categories: CategoryRepository
  ) {}

  async list(
    page: PageQuery,
    filter: NavListFilter | undefined,
    user?: AuthContext
  ): Promise<PageResult<NavItem>> {
    const { pageSize, pageNumber } = normalizePage(page);
    const roles = Array.isArray(user?.roles) ? user!.roles! : [];
    const isAuthenticated = !!user;
    const admin = isSysAdmin(roles);

    // Status rule parity:
    // - unauthenticated: only status=0 (pass)
    // - authenticated: if no status provided, allow status 0 or undefined
    let effFilter: NavListFilter = { ...filter };
    if (!isAuthenticated) {
      effFilter.status = 0;
    }

    // If year is provided, calculate the chrome time range
    if (filter?.year) {
      const startOfYear = new Date(filter.year, 0, 1);
      const endOfYear = new Date(filter.year + 1, 0, 1);
      const startChrome = dateToChromeTime(startOfYear);
      const endChrome = dateToChromeTime(endOfYear);

      effFilter.createTimeStart = startChrome;
      effFilter.createTimeEnd = endChrome;

      // Remove year from filter as it is not a direct field
      delete effFilter.year;
    }

    // Allowed categories via audience
    let allowedCategoryIds = new Set<string>();
    try {
      const cats = await this.categories.listAll();
      const visibleCats = admin ? cats : cats.filter((c) => audienceVisible(c.audience, user));
      allowedCategoryIds = new Set(visibleCats.map((c) => String(c.id)));
    } catch {
      // if categories fail, proceed without narrowing which may include more items
    }

    const res = await this.repo.list({
      page: { pageSize, pageNumber },
      filter: effFilter,
      userIdForFavorites: null,
    });

    // Apply audience + category visibility post-filter
    const filtered = admin
      ? res.data
      : res.data.filter((n) => {
          if (!audienceVisible(n.audience, user)) return false;
          if (n.categoryId && !allowedCategoryIds.has(String(n.categoryId))) return false;
          if (isAuthenticated) {
            // if no explicit status provided, emulate legacy: allow status undefined or 0
            if (
              effFilter.status === undefined &&
              !(n.status === 0 || n.status === undefined || n.status === null)
            )
              return false;
          }
          return true;
        });

    return {
      data: filtered,
      total: res.total,
      pageNumber: Math.ceil(res.total / pageSize),
    };
  }
}

export default NavService;
