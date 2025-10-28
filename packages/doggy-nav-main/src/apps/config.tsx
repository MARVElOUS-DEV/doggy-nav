import type { ReactNode } from 'react';
import type { NextRouter } from 'next/router';
import FavoritesWindow from './FavoritesWindow';
import WallpapersApp from './Wallpapers';
import NewsApp from './NewsApp';
import TranslationApp from './TranslationApp';

export type AppId = 'home' | 'favorites' | 'news' | 'translation' | 'wallpapers' | 'launchpad';

export type DesktopCtx = {
  router: NextRouter;
  openLaunchpad: () => void;
  wallpapers: {
    items: { id: string; name: string; src: string }[];
    current: string;
    set: (id: string) => void;
  };
};

export type DesktopAppConfig = {
  id: AppId;
  title: string;
  open: boolean;
  minimized?: boolean;
  rect?: { x: number; y: number; width: number; height: number };
  z?: number;
  icon: string;
  shouldOpenWindow: boolean;
  openByDefault?: boolean;
  defaultRect?: { x: number; y: number; width: number; height: number };
  expandable?: boolean;
  render?: (ctx: DesktopCtx) => ReactNode;
  externalAction?: (ctx: DesktopCtx) => void;
};

export const appsOrder: AppId[] = [
  'home',
  'favorites',
  'news',
  'translation',
  'launchpad',
  'wallpapers',
];

export const appsConfig: Record<AppId, DesktopAppConfig> = {
  home: {
    id: 'home',
    title: 'DoggyNav',
    open: false,
    minimized: false,
    icon: '/logo-icon.png',
    shouldOpenWindow: false,
    externalAction: (ctx) => ctx.router.push('/'),
  },
  favorites: {
    id: 'favorites',
    open: false,
    title: 'Favorites',
    icon: '/default-web.png',
    shouldOpenWindow: true,
    defaultRect: { x: 180, y: 140, width: 760, height: 500 },
    render: () => <FavoritesWindow />,
  },
  news: {
    id: 'news',
    open: false,
    title: 'News',
    icon: '/app-icons/news.png',
    shouldOpenWindow: true,
    defaultRect: { x: 200, y: 120, width: 860, height: 560 },
    render: () => <NewsApp />,
  },
  translation: {
    id: 'translation',
    open: false,
    title: 'Translation',
    icon: '/app-icons/translate.png',
    shouldOpenWindow: true,
    defaultRect: { x: 220, y: 140, width: 860, height: 560 },
    render: () => <TranslationApp />,
  },
  launchpad: {
    id: 'launchpad',
    open: false,
    title: 'Launchpad',
    icon: '/app-icons/launchpad/256.png',
    shouldOpenWindow: false,
    externalAction: (ctx) => ctx.openLaunchpad(),
  },
  wallpapers: {
    id: 'wallpapers',
    open: false,
    title: 'Wallpapers',
    icon: '/app-icons/wallpapers/256.png',
    shouldOpenWindow: true,
    defaultRect: { x: 220, y: 120, width: 720, height: 520 },
    render: (ctx) => (
      <WallpapersApp
        items={ctx.wallpapers.items}
        current={ctx.wallpapers.current}
        onPick={ctx.wallpapers.set}
      />
    ),
  },
};
