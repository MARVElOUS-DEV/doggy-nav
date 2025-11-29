import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NextPage } from 'next';
import AuthGuard from '@/components/AuthGuard';
import TopMenuBar from '@/apps/Desktop/TopMenuBar';
import AppWindow, { type WindowRect } from '@/apps/Desktop/AppWindow';
import Dock, { type DockItem } from '@/apps/Desktop/Dock';
import SystemMenu from '@/apps/Desktop/SystemMenu';
import Launchpad from '@/apps/LaunchPad';
import { useRouter } from 'next/router';
import { DesktopCtx, type AppId } from '@/apps/config';
import { DesktopProvider, useDesktop } from '@/apps/Desktop/DesktopStore';
import { useGlobalAppWindow } from '@/store/GlobalAppWindowStore';

type NextPageWithLayout = NextPage & { getLayout?: (page: React.ReactNode) => React.ReactNode };

function DesktopInner() {
  const router = useRouter();
  const { state, actions, wallpapers } = useDesktop();
  const globalWindow = useGlobalAppWindow();
  const [dockOffset, setDockOffset] = useState(0);
  const [topbarHeight, setTopbarHeight] = useState(32);
  const isClient = typeof window !== 'undefined';

  useEffect(() => {
    const measure = () => {
      if (typeof window === 'undefined') return;
      const dock = document.getElementById('desktop-dock');
      const topbar = document.getElementById('desktop-topbar');
      if (topbar) setTopbarHeight(Math.round(topbar.getBoundingClientRect().height));
      if (dock) {
        const rect = dock.getBoundingClientRect();
        const offset = Math.max(0, window.innerHeight - rect.top);
        setDockOffset(Math.round(offset));
      } else {
        setDockOffset(0);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const dockItems: DockItem[] = useMemo(() => {
    if (!isClient) return [];
    const ctx: DesktopCtx = {
      router,
      openLaunchpad: () => actions.openLaunchpad(),
      wallpapers: {
        items: wallpapers.items,
        current: wallpapers.current,
        set: (id: string) => wallpapers.setById(id),
      },
      actions: {
        addApp: (cfg) => actions.addApp(cfg),
        updateApp: (id, patch) => actions.updateApp(id, patch),
        openWindow: (id) => actions.openWindow(id),
        activateWindow: (id) => actions.activateWindow(id),
        removeApp: (id) => actions.removeApp(id),
      },
    };
    return state.order
      .map((id) => {
        const cfg = state.windows[id];
        if (!cfg) return null as any;
        const isGlobalRunning =
          !!cfg.globalWindow && globalWindow.state.open && globalWindow.state.sourceId === id;
        const running = cfg.open || cfg.minimized || isGlobalRunning;
        return {
          key: id,
          label: cfg.title || id,
          iconSrc: cfg.icon,
          iconClass: cfg.iconClass,
          running,
          onClick: () => {
            if (id === 'launchpad') {
              state.lpOpen ? actions.closeLaunchpad() : actions.openLaunchpad();
              return;
            }
            actions.closeLaunchpad();
            if (cfg.globalWindow) {
              const rect: WindowRect = (cfg.rect as WindowRect) ??
                (cfg.defaultRect as WindowRect) ?? {
                  x: 120,
                  y: 90,
                  width: 860,
                  height: 520,
                };
              const content = typeof cfg.render === 'function' ? cfg.render(ctx) : null;
              globalWindow.openWindow({
                sourceId: id,
                title: cfg.title || id,
                rect,
                keepAliveOnMinimize: cfg.keepAliveOnMinimize ?? true,
                content,
              });
            } else if (cfg.shouldOpenWindow) {
              actions.openWindow(id);
              actions.activateWindow(id);
            } else {
              cfg.externalAction?.(ctx);
            }
          },
        };
      })
      .filter(Boolean);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isClient,
    state.order,
    state.windows,
    state.lpOpen,
    wallpapers.current,
    wallpapers.items,
    router,
    globalWindow,
  ]);

  const onMenuClick = useCallback(() => actions.toggleSys(), [actions]);

  const wallUrl = state.wallpaper;
  const lpOpen = state.lpOpen;
  const sysOpen = state.sysOpen;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Wallpaper */}
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url(${wallUrl})` }}
      />
      {/* Subtle vignette for readability */}
      <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />

      {/* Top bar */}
      <TopMenuBar onMenuClick={onMenuClick} />
      <SystemMenu
        open={sysOpen}
        onClose={() => actions.setSys(false)}
        wallpapers={wallpapers.items}
        current={wallpapers.current}
        onPick={(id) => wallpapers.setById(id)}
        onOpenWallpapers={() => {
          actions.openWindow('wallpapers');
          actions.activateWindow('wallpapers');
          actions.setSys(false);
        }}
      />

      {/* Windows Area wrapper between top bar and dock */}
      <div
        id="windows-area"
        className={`fixed left-0 right-0 z-[55] ${lpOpen ? '' : 'pointer-events-none'}`}
        style={{ top: topbarHeight, bottom: dockOffset }}
      >
        {/* Launchpad should cover header bar and windows area (full-screen overlay) */}
        <Launchpad
          open={lpOpen}
          onClose={() => actions.closeLaunchpad()}
          withinArea={false}
          dockOffset={dockOffset}
        />
      </div>

      {/* Windows generated from config */}
      {isClient &&
        state.order.map((id) => {
          const win = state.windows[id];
          if (!win) return null;
          if (!win.shouldOpenWindow) return null;
          const onRectChange = (r: WindowRect) => actions.setWindowRect(id as AppId, r);
          const onClose = () => actions.closeWindow(id as AppId);
          const onMinimize = () => actions.minimizeWindow(id as AppId);
          const onActivate = () => actions.activateWindow(id as AppId);
          const ctx: DesktopCtx = {
            router,
            openLaunchpad: () => actions.openLaunchpad(),
            wallpapers: {
              items: wallpapers.items,
              current: wallpapers.current,
              set: (wid: string) => wallpapers.setById(wid),
            },
            actions: {
              addApp: (cfg) => actions.addApp(cfg),
              updateApp: (id, patch) => actions.updateApp(id, patch),
              openWindow: (id) => actions.openWindow(id),
              activateWindow: (id) => actions.activateWindow(id),
              removeApp: (id) => actions.removeApp(id),
            },
          };
          return (
            <AppWindow
              key={id}
              title={win.title}
              open={!!win.open}
              minimized={!!win.minimized}
              keepAliveIfMinimized={!!win.keepAliveOnMinimize}
              rect={(win.rect as WindowRect) ?? { x: 120, y: 90, width: 860, height: 520 }}
              onRectChange={onRectChange}
              onClose={onClose}
              onMinimize={onMinimize}
              onActivate={onActivate}
              zIndex={win.z}
              bounds="#windows-area"
              expandable={win.expandable ?? true}
              getMaxArea={() => {
                if (typeof document !== 'undefined') {
                  const el = document.getElementById('windows-area');
                  if (el) {
                    const r = el.getBoundingClientRect();
                    return { x: r.left, y: r.top, width: r.width, height: r.height };
                  }
                }
                // Fallback approximately below top bar and above dock
                const margin = 20;
                const top = 60;
                const w = Math.max(320, window.innerWidth - margin * 2);
                const h = Math.max(200, window.innerHeight - top - margin);
                return { x: margin, y: top, width: w, height: h };
              }}
            >
              {typeof win.render === 'function' ? win.render(ctx) : null}
            </AppWindow>
          );
        })}

      {/* Dock */}
      <Dock items={dockItems} />
    </div>
  );
}

const DesktopPage: NextPageWithLayout = () => {
  return (
    <AuthGuard redirectTo="/login">
      <DesktopProvider>
        <DesktopInner />
      </DesktopProvider>
    </AuthGuard>
  );
};

DesktopPage.getLayout = (page) => page; // Bypass RootLayout for a true full-screen desktop

export default DesktopPage;
