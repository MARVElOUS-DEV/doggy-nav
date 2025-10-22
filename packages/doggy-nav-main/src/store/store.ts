import { atom } from 'jotai';
import { NavItem, Category, Tag, User } from '@/types';
import api from '@/utils/api';
import { setAccessExpEpochMs } from '@/utils/session';

export const categoriesAtom = atom<Category[]>([]);
export const selectedCategoryAtom = atom<string>('');
export const tagsAtom = atom<Tag[]>([]);
export const navRankingAtom = atom<{ view: NavItem[]; star: NavItem[]; news: NavItem[] }>({
  view: [],
  star: [],
  news: [],
});
export const showMenuTypeAtom = atom(true);
export const mobileAtom = atom(false);
export const manualCollapseAtom = atom<boolean | null>(null); // null = no manual action, true/false = manual action
export const favoritesAtom = atom<NavItem[]>([]);
export const themeAtom = atom<'light' | 'dark'>('light');

// Authentication atoms
export const userAtom = atom<User | null>(null);
export const isAuthenticatedAtom = atom<boolean>(false);
export const authInitializedAtom = atom<boolean>(false);

// Derived atoms for auth state
export const authStateAtom = atom((get) => ({
  isAuthenticated: get(isAuthenticatedAtom),
  user: get(userAtom),
  initialized: get(authInitializedAtom),
}));

// Auth actions atom
export const authActionsAtom = atom(
  null,
  (
    get,
    set,
    action:
      | { type: 'LOGIN'; payload: { user: User } }
      | { type: 'LOGOUT' }
      | { type: 'HYDRATE'; payload: { user: User | null } }
  ) => {
    switch (action.type) {
      case 'LOGIN':
        set(userAtom, action.payload.user);
        set(isAuthenticatedAtom, true);
        break;
      case 'LOGOUT':
        set(userAtom, null);
        set(isAuthenticatedAtom, false);
        break;
      case 'HYDRATE':
        if (action.payload.user) {
          set(userAtom, action.payload.user);
          set(isAuthenticatedAtom, true);
        } else {
          set(userAtom, null);
          set(isAuthenticatedAtom, false);
        }
        break;
    }
  }
);

// Initialize auth by calling API
export const initAuthFromServerAtom = atom(null, async (get, set) => {
  if (typeof window === 'undefined' || get(authInitializedAtom)) return;

  try {
    const response = await api.getCurrentUser();
    if (response?.authenticated && response.user) {
      set(userAtom, response.user);
      set(isAuthenticatedAtom, true);
      if (typeof response.accessExp === 'number') {
        setAccessExpEpochMs(response.accessExp);
      }
    } else {
      set(userAtom, null);
      set(isAuthenticatedAtom, false);
    }
  } catch (error) {
    console.error('Failed to initialize auth state:', error);
    set(userAtom, null);
    set(isAuthenticatedAtom, false);
  } finally {
    set(authInitializedAtom, true);
  }
});

// Favorites actions atom - simplified for add/remove operations only
export const favoritesActionsAtom = atom(
  null,
  (
    get,
    set,
    action:
      | { type: 'ADD_FAVORITE'; navId: string }
      | { type: 'REMOVE_FAVORITE'; navId: string }
      | { type: 'LOAD_FAVORITES' } // Keep for favorites page initialization
      | { type: 'SET_FAVORITES'; favorites: NavItem[] }
  ) => {
    switch (action.type) {
      case 'ADD_FAVORITE':
        // Just make the API call, don't manage favorites list here
        return api.addFavorite(action.navId);

      case 'REMOVE_FAVORITE':
        // Just make the API call, don't manage favorites list here
        return api.removeFavorite(action.navId);

      case 'LOAD_FAVORITES':
        // Only used for dedicated favorites page
        if (get(isAuthenticatedAtom)) {
          return api
            .getFavoritesList()
            .then((response) => {
              set(favoritesAtom, response.data);
            })
            .catch((error) => {
              console.error('Failed to load favorites:', error);
              set(favoritesAtom, []);
            });
        } else {
          set(favoritesAtom, []);
        }
        break;

      case 'SET_FAVORITES':
        set(favoritesAtom, action.favorites);
        break;
    }
  }
);
