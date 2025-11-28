import type { ReactNode } from 'react';
import type { NextRouter } from 'next/router';
import WallpapersApp from './Wallpapers';
import NewsApp from './NewsApp';
import TranslationApp from './TranslationApp';
import IframeContainer from '@/components/IframeContainer';
import SettingsApp from './Settings';
import BookmarkGraphApp from './BookmarkGraph/BookmarkGraphApp';

export type AppId = string;

export type DesktopCtx = {
  router: NextRouter;
  openLaunchpad: () => void;
  wallpapers: {
    items: { id: string; name: string; src: string }[];
    current: string;
    set: (id: string) => void;
  };
  actions: {
    addApp: (config: DesktopAppConfig) => void;
    updateApp: (id: string, patch: Partial<DesktopAppConfig>) => void;
    openWindow: (id: AppId) => void;
    activateWindow: (id: AppId) => void;
    removeApp: (id: AppId) => void;
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
  // If true, window stays mounted when minimized (useful for iframes/media)
  keepAliveOnMinimize?: boolean;
  // If true, this app prefers the global AppWindow that persists across routes
  globalWindow?: boolean;
  // Runtime webview metadata for user-created apps
  userApp?: boolean;
  webviewUrl?: string;
  render?: (ctx: DesktopCtx) => ReactNode;
  externalAction?: (ctx: DesktopCtx) => void;
};

export const appsOrder: AppId[] = [
  'bookmark-graph',
  'settings',
  'news',
  'translation',
  'music',
  'launchpad',
  'wallpapers',
];

export const appsConfig: Record<AppId, DesktopAppConfig> = {
  settings: {
    id: 'settings',
    open: false,
    title: 'Settings',
    icon: '/app-icons/settings.png',
    shouldOpenWindow: true,
    defaultRect: { x: 220, y: 120, width: 780, height: 560 },
    render: (ctx) => <SettingsApp ctx={ctx} />,
  },
  'bookmark-editor': {
    id: 'bookmark-graph',
    open: false,
    title: 'Bookmark Editor',
    icon: '/app-icons/tools.png',
    shouldOpenWindow: true,
    defaultRect: { x: 100, y: 80, width: 1024, height: 768 },
    render: () => <BookmarkGraphApp />,
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
    defaultRect: { x: 220, y: 140, width: 860, height: 480 },
    render: () => <TranslationApp />,
  },
  music: {
    id: 'music',
    open: false,
    title: 'Music',
    icon: '/app-icons/music.png',
    shouldOpenWindow: true,
    keepAliveOnMinimize: true,
    globalWindow: true,
    defaultRect: { x: 240, y: 120, width: 960, height: 640 },
    render: () => <IframeContainer src={'https://y.qq.com/'} title="music" />,
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
