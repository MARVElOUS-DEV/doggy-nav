import { atom } from 'jotai';
import { NavItem, Category } from '@/types';


export const categoriesAtom = atom<Category[]>([]);
export const navRankingAtom = atom<{ view: NavItem[]; star: NavItem[]; news: NavItem[] }>({ view: [], star: [], news: [] });
export const navDataAtom = atom<NavItem[]>([]);
export const showMenuTypeAtom = atom(false);
export const contentMarginLeftAtom = atom('200px');
export const showPopupAtom = atom(false);
export const showLogAtom = atom(false);
