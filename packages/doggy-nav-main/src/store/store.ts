import { atom } from 'jotai';
import { NavItem, Category, Tag, User } from '@/types';
import api from '@/utils/api';


export const categoriesAtom = atom<Category[]>([]);
export const selectedCategoryAtom = atom<string>('');
export const tagsAtom = atom<Tag[]>([]);
export const navRankingAtom = atom<{ view: NavItem[]; star: NavItem[]; news: NavItem[] }>({ view: [], star: [], news: [] });
export const showMenuTypeAtom = atom(true);
export const mobileAtom = atom(false);
export const manualCollapseAtom = atom<boolean | null>(null); // null = no manual action, true/false = manual action
export const favoritesAtom = atom<NavItem[]>([]);
export const themeAtom = atom<'light' | 'dark'>('light');

// Authentication atoms
export const userAtom = atom<User | null>(null);
export const isAuthenticatedAtom = atom<boolean>(false);
export const tokenAtom = atom<string | null>(null);
export const authInitializedAtom = atom<boolean>(false);

// Derived atoms for auth state
export const authStateAtom = atom(
  (get) => ({
    isAuthenticated: get(isAuthenticatedAtom),
    user: get(userAtom),
    token: get(tokenAtom),
    initialized: get(authInitializedAtom),
  })
);

// Auth actions atom
export const authActionsAtom = atom(
  null,
  (get, set, action: { type: 'LOGIN'; payload: { user: User; token: string } } | { type: 'LOGOUT' }) => {
    switch (action.type) {
      case 'LOGIN':
        set(userAtom, action.payload.user);
        set(tokenAtom, action.payload.token);
        set(isAuthenticatedAtom, true);
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', action.payload.token);
          localStorage.setItem('user', JSON.stringify(action.payload.user));
        }
        break;
      case 'LOGOUT':
        set(userAtom, null);
        set(tokenAtom, null);
        set(isAuthenticatedAtom, false);
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        break;
    }
  }
);

// Initialize auth from localStorage atom
export const initAuthFromStorageAtom = atom(
  null,
  (get, set) => {
    if (typeof window === 'undefined') return;

    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser) as User;
        set(userAtom, user);
        set(tokenAtom, savedToken);
        set(isAuthenticatedAtom, true);
      } catch (error) {
        console.error('Failed to parse saved user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    set(authInitializedAtom, true);
  }
);

// Favorites actions atom - simplified for add/remove operations only
export const favoritesActionsAtom = atom(
  null,
  (get, set, action:
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
          return api.getFavoritesList().then(response => {
            set(favoritesAtom, response.data);
          }).catch(error => {
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
