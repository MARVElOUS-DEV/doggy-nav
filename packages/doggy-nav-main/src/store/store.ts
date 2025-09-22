import { atom } from 'jotai';
import { NavItem, Category, Tag } from '@/types';


export const categoriesAtom = atom<Category[]>([]);
export const selectedCategoryAtom = atom<string>('');
export const tagsAtom = atom<Tag[]>([]);
export const navRankingAtom = atom<{ view: NavItem[]; star: NavItem[]; news: NavItem[] }>({ view: [], star: [], news: [] });
export const navDataAtom = atom<NavItem[]>([]);
export const showMenuTypeAtom = atom(true);
export const contentMarginLeftAtom = atom('200px');
export const showPopupAtom = atom(false);
export const showLogAtom = atom(false);
