import axios from './axios';
import type { Category, NavItem, Tag, User, LoginFormValues, RegisterFormValues } from '@/types';

export const API_NAV_RANKING = '/api/nav/ranking';
export const API_NAV = '/api/nav';
export const API_NAV_SEARCH = '/api/nav/search';
export const API_NAV_ADD = '/api/nav/add';
export const API_NAV_REPTILE = '/api/nav/reptile';
export const API_TAG_LIST = '/api/tag/list';
export const API_NAV_RANDOM = '/api/nav/random';

const api = {
  // Get category list
  getCategoryList: (): Promise<Category[]> =>
    axios.get('/api/category/list'),

  // Find nav by category id
  findNavByCategory: (categoryId: string): Promise<NavItem[]> =>
    axios.get(`/api/nav/find?categoryId=${categoryId}`),

  // Find nav by id (single item)
  findNavById: (id: string): Promise<NavItem> =>
    axios.get(`/api/nav?id=${id}`),

  // Get nav ranking
  getNavRanking: (): Promise<{ view: NavItem[]; star: NavItem[]; news: NavItem[] }> =>
    axios.get(API_NAV_RANKING),

  // Get nav list with optional params
  getNavList: (params?: {
    categoryId?: string;
    page?: number;
    limit?: number;
    keyword?: string;
  }): Promise<{data: NavItem[], total: number, pageNumber: number}> =>
    axios.get(API_NAV_SEARCH, { params }),

  // Get random nav items
  getRandomNav: (count?: number): Promise<NavItem[]> =>
    axios.get(API_NAV_RANDOM, { params: { count } }),

  // Get tag list
  getTagList: (): Promise<{data: Tag[]}> =>
    axios.get(API_TAG_LIST),

  // Add navigation (reptile)
  addNav: (data: {
    url: string;
    categoryId?: string;
    name?: string;
    desc?: string;
  }): Promise<NavItem> =>
    axios.post(API_NAV_REPTILE, data),

  // Update nav view count
  updateNavView: (id: string): Promise<void> =>
    axios.patch(`${API_NAV}/${id}/view`),

  // Update nav star count
  updateNavStar: (id: string): Promise<void> =>
    axios.patch(`${API_NAV}/${id}/star`),

  // Authentication APIs - using Next.js proxy routes
  login: (credentials: LoginFormValues): Promise<{token: string, user: User}> =>
    axios.post('/api/auth/login', credentials),

  register: (userData: RegisterFormValues): Promise<{ user: User }> =>
    axios.post('/api/auth/register', userData),

  logout: (): Promise<void> =>
    axios.post('/api/auth/logout'),

  getCurrentUser: (): Promise<User> =>
    axios.get('/api/auth/me'),

  updateProfile: (data: { username?: string; email?: string; avatar?: string }): Promise<User> =>
    axios.put('/api/user/profile', data),

  // Favorite APIs - require authentication
  addFavorite: (navId: string): Promise<void> =>
    axios.post('/api/favorites', { navId }),

  removeFavorite: (navId: string): Promise<void> =>
    axios.get(`/api/favorites/remove?navId=${navId}`),

  getFavoritesList: (): Promise<{data: NavItem[]}> =>
    axios.get('/api/favorites/list'),

  checkFavorite: (navId: string): Promise<{isFavorite: boolean}> =>
    axios.get(`/api/favorites/check?navId=${navId}`),

  getFavoritesCount: (): Promise<{count: number}> =>
    axios.get('/api/favorites/count'),
};

export default api;
