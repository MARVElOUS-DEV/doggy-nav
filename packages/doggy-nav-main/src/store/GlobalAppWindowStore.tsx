import React, { createContext, useContext, useMemo, useState } from 'react';
import AppWindow, { type WindowRect } from '@/apps/Desktop/AppWindow';
import { useWindowZ } from '@/store/WindowZStore';

type GlobalAppWindowState = {
  open: boolean;
  minimized: boolean;
  title?: string;
  rect: WindowRect;
  keepAliveOnMinimize: boolean;
  zIndex: number;
  content: React.ReactNode | null;
  sourceId?: string;
};

type OpenOptions = {
  title?: string;
  rect?: WindowRect;
  keepAliveOnMinimize?: boolean;
  content: React.ReactNode;
  sourceId?: string;
};

type GlobalAppWindowContextValue = {
  state: GlobalAppWindowState;
  openWindow: (options: OpenOptions) => void;
  closeWindow: () => void;
  minimizeWindow: () => void;
  restoreWindow: () => void;
  activateWindow: () => void;
  setRect: (rect: WindowRect) => void;
};

const DEFAULT_RECT: WindowRect = { x: 120, y: 90, width: 860, height: 520 };

const GlobalAppWindowContext = createContext<GlobalAppWindowContextValue | undefined>(undefined);

export function GlobalAppWindowProvider({ children }: { children: React.ReactNode }) {
  const { getNextZ } = useWindowZ();
  const [state, setState] = useState<GlobalAppWindowState>({
    open: false,
    minimized: false,
    title: 'App',
    rect: DEFAULT_RECT,
    keepAliveOnMinimize: true,
    zIndex: 0,
    content: null,
  });

  const ctxValue: GlobalAppWindowContextValue = useMemo(
    () => ({
      state,
      openWindow: (options: OpenOptions) => {
        setState((prev) => ({
          ...prev,
          open: true,
          minimized: false,
          title: options.title ?? prev.title,
          rect: options.rect ?? prev.rect ?? DEFAULT_RECT,
          keepAliveOnMinimize:
            typeof options.keepAliveOnMinimize === 'boolean'
              ? options.keepAliveOnMinimize
              : prev.keepAliveOnMinimize,
          zIndex: getNextZ(),
          content: options.content,
          sourceId: options.sourceId,
        }));
      },
      closeWindow: () => {
        setState((prev) => ({ ...prev, open: false, minimized: false, sourceId: undefined }));
      },
      minimizeWindow: () => {
        setState((prev) => ({ ...prev, minimized: true }));
      },
      restoreWindow: () => {
        setState((prev) => ({ ...prev, minimized: false, open: true, zIndex: getNextZ() }));
      },
      activateWindow: () => {
        setState((prev) => ({ ...prev, zIndex: getNextZ() }));
      },
      setRect: (rect: WindowRect) => {
        setState((prev) => ({ ...prev, rect }));
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  );

  return (
    <GlobalAppWindowContext.Provider value={ctxValue}>
      {children}
      <AppWindow
        title={state.title}
        open={state.open}
        minimized={state.minimized}
        keepAliveIfMinimized={state.keepAliveOnMinimize}
        rect={state.rect}
        onRectChange={(rect) => ctxValue.setRect(rect)}
        onClose={ctxValue.closeWindow}
        onMinimize={ctxValue.minimizeWindow}
        onActivate={ctxValue.activateWindow}
        zIndex={state.zIndex}
        bounds="window"
        getMaxArea={() => {
          if (typeof window === 'undefined') {
            return { x: 0, y: 0, width: 1024, height: 768 };
          }
          if (typeof document !== 'undefined') {
            const el = document.getElementById('windows-area');
            if (el) {
              const r = el.getBoundingClientRect();
              return { x: r.left, y: r.top, width: r.width, height: r.height };
            }
          }
          return { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
        }}
      >
        {state.content}
      </AppWindow>
    </GlobalAppWindowContext.Provider>
  );
}

export function useGlobalAppWindow() {
  const ctx = useContext(GlobalAppWindowContext);
  if (!ctx) {
    throw new Error('useGlobalAppWindow must be used within GlobalAppWindowProvider');
  }
  return ctx;
}
