import axios from './axios';
import type {
  Category,
  NavItem,
  Tag,
  User,
  LoginFormValues,
  RegisterFormValues,
  OAuthProvider,
  SystemVersionInfo,
} from '@/types';

export const API_NAV_RANKING = '/api/nav/ranking';
export const API_NAV = '/api/nav';
export const API_NAV_SEARCH = '/api/nav/search';
export const API_NAV_ADD = '/api/nav/add';
export const API_NAV_REPTILE = '/api/nav/reptile';
export const API_TAG_LIST = '/api/tag/list';
export const API_NAV_RANDOM = '/api/nav/random';
export const API_NAV_LIST = '/api/nav/list';

const api = {
  // Get category list
  getCategoryList: (): Promise<Category[]> => axios.get('/api/category/list'),

  // Find nav by category id
  findNavByCategory: (categoryId: string): Promise<NavItem[]> =>
    axios.get(`/api/nav/find?categoryId=${categoryId}`),

  // Find nav by id (single item)
  findNavById: (id: string): Promise<NavItem> => axios.get(`/api/nav?id=${id}`),

  // Get nav ranking
  getNavRanking: (): Promise<{ view: NavItem[]; star: NavItem[]; news: NavItem[] }> =>
    axios.get(API_NAV_RANKING),

  // Get nav list with optional params
  getNavList: (params?: {
    categoryId?: string;
    page?: number;
    limit?: number;
    keyword?: string;
  }): Promise<{ data: NavItem[]; total: number; pageNumber: number }> =>
    axios.get(API_NAV_SEARCH, { params }),

  // Get full/paginated nav list (server /api/nav/list)
  getNavAll: (params?: {
    pageSize?: number;
    pageNumber?: number;
    status?: number;
    categoryId?: string;
    name?: string;
  }): Promise<{ data: NavItem[]; total: number; pageNumber: number }> =>
    axios.get(API_NAV_LIST, { params }),

  // Get random nav items
  getRandomNav: (count?: number): Promise<NavItem[]> =>
    axios.get(API_NAV_RANDOM, { params: { count } }),

  // Get tag list
  getTagList: (): Promise<{ data: Tag[] }> => axios.get(API_TAG_LIST),

  // Get current user's groups (if authenticated)
  getGroups: (): Promise<{ data: Array<{ id: string; slug: string; displayName?: string }>; total: number; pageNumber: number }> => axios.get('/api/groups'),

  // Add navigation (reptile)
  addNav: (data: {
    url: string;
    categoryId?: string;
    name?: string;
    desc?: string;
  }): Promise<NavItem> => axios.post(API_NAV_REPTILE, data),

  // Increment nav view count (server increments atomically)
  updateNavView: (id: string): Promise<void> => axios.post(`/api/nav/${id}/view`),

  // Increment nav star count (server increments atomically)
  updateNavStar: (id: string): Promise<void> => axios.post(`/api/nav/${id}/star`),

  // Authentication APIs - using Next.js proxy routes
  login: (credentials: LoginFormValues): Promise<{ user: User; token?: string }> =>
    axios.post('/api/auth/login', credentials),

  register: (userData: RegisterFormValues): Promise<{ user: User }> =>
    axios.post('/api/auth/register', userData),

  getAuthConfig: (): Promise<{ requireInviteForLocalRegister: boolean }> =>
    axios.get('/api/auth/config'),

  logout: (): Promise<void> => axios.post('/api/auth/logout'),

  getCurrentUser: (): Promise<{
    authenticated: boolean;
    user: User | null;
    accessExp: number | null;
  }> => axios.get('/api/auth/me'),

  updateProfile: (data: { username?: string; email?: string; avatar?: string }): Promise<User> =>
    axios.put('/api/user/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }): Promise<void> =>
    axios.put('/api/user/password', data),

  // Favorite APIs - require authentication
  addFavorite: (navId: string): Promise<void> => axios.post('/api/favorites', { navId }),

  removeFavorite: (navId: string): Promise<void> =>
    axios.post('/api/favorites/remove', undefined, { params: { navId } }),

  getFavoritesList: (): Promise<{ data: NavItem[] }> => axios.get('/api/favorites/list'),

  // Favorites structured (folders + root items)
  getFavoritesStructured: (): Promise<{ data: Array<any> }> =>
    axios.get('/api/favorites/structured'),

  // Favorite folders CRUD
  createFavoriteFolder: (payload: { name: string; navIds?: string[]; order?: number }) =>
    axios.post('/api/favorites/folders', payload),

  updateFavoriteFolder: (
    id: string,
    payload: { name?: string; addNavIds?: string[]; removeNavIds?: string[]; order?: number }
  ) => axios.put(`/api/favorites/folders/${id}`, payload),

  deleteFavoriteFolder: (id: string) => axios.delete(`/api/favorites/folders/${id}`),

  updateFavoritesPlacements: (payload: {
    root?: Array<{ navId: string; order: number }>;
    folders?: Array<{ folderId: string; order: number }>;
    moves?: Array<{ navId: string; parentFolderId?: string | null; order: number }>;
  }) => axios.put('/api/favorites/placements', payload),

  checkFavorite: (navId: string): Promise<{ isFavorite: boolean }> =>
    axios.get(`/api/favorites/check?navId=${navId}`),

  getFavoritesCount: (): Promise<{ count: number }> => axios.get('/api/favorites/count'),

  // OAuth providers
  getAuthProviders: (): Promise<{ providers: Array<OAuthProvider> }> =>
    axios.get('/api/auth/providers'),

  // System version info
  getSystemVersion: (): Promise<SystemVersionInfo> => axios.get('/api/system/version'),
};

export default api;
