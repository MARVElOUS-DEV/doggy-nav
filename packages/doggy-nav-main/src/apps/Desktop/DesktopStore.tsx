import React, { createContext, useContext, useMemo, useReducer, useEffect } from 'react';
import type { AppId, DesktopAppConfig } from '@/apps/config';
import { appsConfig, appsOrder } from '@/apps/config';
import IframeContainer from '@/components/IframeContainer';
import { getSetting, setSetting } from '@/utils/idb';

export type WindowRect = { x: number; y: number; width: number; height: number };

type DesktopState = {
  wallpaper: string;
  sysOpen: boolean;
  lpOpen: boolean;
  zCounter: number;
  order: string[];
  windows: Record<AppId, DesktopAppConfig>;
};

type DesktopAction =
  | { type: 'set_wallpaper'; payload: string }
  | { type: 'toggle_sys' }
  | { type: 'set_sys'; payload: boolean }
  | { type: 'open_launchpad' }
  | { type: 'close_launchpad' }
  | { type: 'open_window'; id: AppId }
  | { type: 'close_window'; id: AppId }
  | { type: 'minimize_window'; id: AppId }
  | { type: 'activate_window'; id: AppId }
  | { type: 'set_rect'; id: AppId; rect: WindowRect }
  | { type: 'add_app'; id: string; config: DesktopAppConfig; appendToOrder?: boolean }
  | { type: 'update_app'; id: string; patch: Partial<DesktopAppConfig> }
  | { type: 'remove_app'; id: AppId };

function buildInitialWindows(): Record<AppId, DesktopAppConfig> {
  const init: Record<AppId, DesktopAppConfig> = {} as any;
  let z = 50;
  appsOrder.forEach((id) => {
    const cfg = appsConfig[id];
    if (!cfg) return; // skip unknown ids to avoid SSR crashes
    init[id] = {
      ...cfg,
      open: cfg.shouldOpenWindow && !!cfg.openByDefault,
      minimized: false,
      rect: cfg.defaultRect ?? { x: 120, y: 90, width: 860, height: 520 },
      z: ++z,
    } as DesktopAppConfig;
  });
  return init;
}

const initialState: DesktopState = {
  wallpaper: '/wallpapers/ventura-1.webp',
  sysOpen: false,
  lpOpen: false,
  zCounter: 50,
  order: appsOrder.slice(),
  windows: buildInitialWindows(),
};

function reducer(state: DesktopState, action: DesktopAction): DesktopState {
  switch (action.type) {
    case 'set_wallpaper':
      return { ...state, wallpaper: action.payload };
    case 'toggle_sys':
      return { ...state, sysOpen: !state.sysOpen };
    case 'set_sys':
      return { ...state, sysOpen: action.payload };
    case 'open_launchpad':
      return { ...state, lpOpen: true };
    case 'close_launchpad':
      return { ...state, lpOpen: false };
    case 'open_window': {
      const id = action.id;
      const prev = state.windows[id];
      return {
        ...state,
        windows: { ...state.windows, [id]: { ...prev, open: true, minimized: false } },
      };
    }
    case 'close_window': {
      const id = action.id;
      const prev = state.windows[id];
      return {
        ...state,
        windows: { ...state.windows, [id]: { ...prev, open: false, minimized: false } },
      };
    }
    case 'minimize_window': {
      const id = action.id;
      const prev = state.windows[id];
      return {
        ...state,
        windows: { ...state.windows, [id]: { ...prev, minimized: true } },
      };
    }
    case 'activate_window': {
      const id = action.id;
      const prev = state.windows[id];
      const newZ = state.zCounter + 1;
      return {
        ...state,
        zCounter: newZ,
        windows: { ...state.windows, [id]: { ...prev, z: newZ } },
      };
    }
    case 'set_rect': {
      const id = action.id;
      const prev = state.windows[id];
      return {
        ...state,
        windows: { ...state.windows, [id]: { ...prev, rect: action.rect } },
      };
    }
    case 'add_app': {
      const { id, config } = action;
      const exists = !!state.windows[id];
      const order = exists
        ? state.order
        : [...state.order, id];
      return {
        ...state,
        order,
        windows: { ...state.windows, [id]: { ...config } },
      };
    }
    case 'update_app': {
      const prev = state.windows[action.id];
      if (!prev) return state;
      return {
        ...state,
        windows: { ...state.windows, [action.id]: { ...prev, ...action.patch } },
      };
    }
    case 'remove_app': {
      const id = action.id;
      const prev = state.windows[id];
      if (!prev || !prev.userApp) return state; // only remove user apps
      const { [id]: _omit, ...rest } = state.windows;
      return {
        ...state,
        order: state.order.filter((x) => x !== id),
        windows: rest,
      };
    }
    default:
      return state;
  }
}

type DesktopContextValue = {
  state: DesktopState;
  wallpapers: {
    items: { id: string; name: string; src: string }[];
    current: string;
    setById: (id: string) => void;
  };
  actions: {
    toggleSys: () => void;
    setSys: (open: boolean) => void;
    openLaunchpad: () => void;
    closeLaunchpad: () => void;
    openWindow: (id: AppId) => void;
    closeWindow: (id: AppId) => void;
    minimizeWindow: (id: AppId) => void;
    activateWindow: (id: AppId) => void;
    setWindowRect: (id: AppId, rect: WindowRect) => void;
    addApp: (config: DesktopAppConfig) => void;
    updateApp: (id: string, patch: Partial<DesktopAppConfig>) => void;
    removeApp: (id: AppId) => void;
  };
};

const DesktopContext = createContext<DesktopContextValue | undefined>(undefined);

export function DesktopProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const wallpapersList = useMemo(() => {
    const core = [
      { id: 'ventura-1.webp', name: 'Ventura', src: '/wallpapers/ventura-1.webp' },
      {
        id: 'big-sur-graphic-1.jpg',
        name: 'Big Sur Graphic',
        src: '/wallpapers/big-sur-graphic-1.jpg',
      },
    ];
    const extras = Array.from({ length: 64 - 38 + 1 }, (_, i) => 38 + i).map((n) => ({
      id: `${n}.jpg`,
      name: `Wallpaper ${n}`,
      src: `/wallpapers/${n}.jpg`,
    }));
    return [...core, ...extras];
  }, []);

  const currentWallId = useMemo(() => {
    const id = state.wallpaper.split('/').pop() || '';
    const found = wallpapersList.find((w) => w.id === id)?.id;
    return found || wallpapersList[0]?.id || '';
  }, [state.wallpaper, wallpapersList]);

  const setWallpaperById = (id: string) => {
    const found = wallpapersList.find((w) => w.id === id);
    if (!found) return;
    dispatch({ type: 'set_wallpaper', payload: found.src });
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('desktop:wallpaper', id);
      } catch {}
    }
  };

  // Hydrate wallpaper and custom apps on first mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedId = window.localStorage.getItem('desktop:wallpaper');
      if (savedId) {
        const found = wallpapersList.find((w) => w.id === savedId);
        if (found) {
          dispatch({ type: 'set_wallpaper', payload: found.src });
        }
      }
      // Hydrate music app url from IndexedDB if present
      getSetting<string>('music.url')
        .then((url) => {
          if (!url) return;
          dispatch({
            type: 'update_app',
            id: 'music',
            patch: {
              keepAliveOnMinimize: true,
              render: () => <IframeContainer src={url} title="music" />,
            },
          });
        })
        .catch(() => {});
    } catch {}
      // Hydrate user apps list from IndexedDB
      getSetting<{ id: string; title: string; icon: string; webviewUrl: string; keepAlive?: boolean; rect?: WindowRect }[]>(
        'customApps'
      )
        .then((arr) => {
          if (!arr || !Array.isArray(arr)) return;
          arr.forEach((it) => {
            const cfg: DesktopAppConfig = {
              id: it.id as AppId,
              title: it.title,
              icon: it.icon || '/default-web.png',
              shouldOpenWindow: true,
              userApp: true,
              webviewUrl: it.webviewUrl,
              keepAliveOnMinimize: !!it.keepAlive,
              open: false,
              minimized: false,
              defaultRect: it.rect || { x: 220, y: 120, width: 900, height: 600 },
              rect: it.rect || { x: 220, y: 120, width: 900, height: 600 },
              z: undefined,
              render: () => <IframeContainer src={it.webviewUrl} title={it.title} />,
            };
            dispatch({ type: 'add_app', id: cfg.id, config: cfg, appendToOrder: true });
          });
        })
        .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Persist user apps to IndexedDB whenever windows/order change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const list = state.order
      .map((id) => state.windows[id])
      .filter((w): w is DesktopAppConfig => !!w && !!w.userApp)
      .map((w) => ({
        id: w.id,
        title: w.title,
        icon: w.icon,
        webviewUrl: w.webviewUrl || '',
        keepAlive: !!w.keepAliveOnMinimize,
        rect: (w.rect || w.defaultRect) as WindowRect | undefined,
      }));
    setSetting('customApps', list).catch(() => {});
  }, [state.order, state.windows]);
  const value: DesktopContextValue = {
    state,
    wallpapers: {
      items: wallpapersList,
      current: currentWallId,
      setById: setWallpaperById,
    },
    actions: {
      toggleSys: () => dispatch({ type: 'toggle_sys' }),
      setSys: (open: boolean) => dispatch({ type: 'set_sys', payload: open }),
      openLaunchpad: () => dispatch({ type: 'open_launchpad' }),
      closeLaunchpad: () => dispatch({ type: 'close_launchpad' }),
      openWindow: (id: AppId) => dispatch({ type: 'open_window', id }),
      closeWindow: (id: AppId) => dispatch({ type: 'close_window', id }),
      minimizeWindow: (id: AppId) => dispatch({ type: 'minimize_window', id }),
      activateWindow: (id: AppId) => dispatch({ type: 'activate_window', id }),
      setWindowRect: (id: AppId, rect: WindowRect) => dispatch({ type: 'set_rect', id, rect }),
      // Runtime extension APIs
      addApp: (config: DesktopAppConfig) => {
        const merged = { userApp: true, ...config } as DesktopAppConfig;
        dispatch({ type: 'add_app', id: merged.id, config: merged, appendToOrder: true });
      },
      updateApp: (id: string, patch: Partial<DesktopAppConfig>) => dispatch({ type: 'update_app', id, patch }),
      removeApp: (id: AppId) => dispatch({ type: 'remove_app', id }),
    },
  };

  return <DesktopContext.Provider value={value}>{children}</DesktopContext.Provider>;
}

export function useDesktop() {
  const ctx = useContext(DesktopContext);
  if (!ctx) throw new Error('useDesktop must be used within DesktopProvider');
  return ctx;
}
