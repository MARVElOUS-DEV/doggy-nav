import { useCallback, useMemo, useState } from 'react';
import type { NextPage } from 'next';
import AuthGuard from '@/components/AuthGuard';
import TopMenuBar from '@/components/Desktop/TopMenuBar';
import AppWindow, { type WindowRect } from '@/components/Desktop/AppWindow';
import Dock, { type DockItem } from '@/components/Desktop/Dock';
import SystemMenu from '@/components/Desktop/SystemMenu';
import Launchpad from '@/components/Desktop/Launchpad';
import { useRouter } from 'next/router';
import { appsConfig, appsOrder, type AppId, type DesktopAppConfig } from '@/apps/config';
import ReactIf from '@/components/ReactIf';

type NextPageWithLayout = NextPage & { getLayout?: (page: React.ReactNode) => React.ReactNode };

const DesktopPage: NextPageWithLayout = () => {
  const [wallpaper, setWallpaper] = useState<string>('/wallpapers/ventura-1.webp');
  const router = useRouter();
  // AppId comes from apps/config
  const [zCounter, setZCounter] = useState(50);
  const [windows, setWindows] = useState<Record<AppId, DesktopAppConfig>>(() => {
    const init: Record<AppId, DesktopAppConfig> = {} as any;
    let z = 50;
    appsOrder.forEach((id) => {
      const cfg = appsConfig[id];
      init[id] = {
        ...cfg,
        open: cfg.shouldOpenWindow && !!cfg.openByDefault,
        minimized: false,
        rect: cfg.defaultRect ?? { x: 120, y: 90, width: 860, height: 520 },
        z: ++z,
      } as DesktopAppConfig;
    });
    return init;
  });
  const [sysOpen, setSysOpen] = useState(false);
  const [lpOpen, setLpOpen] = useState(false);

  const wallpapers = useMemo(
    () => [
      { id: 'ventura', name: 'Ventura', src: '/wallpapers/ventura-1.webp' },
      { id: 'big-sur', name: 'Big Sur Graphic', src: '/wallpapers/big-sur-graphic-1.jpg' },
    ],
    []
  );
  const currentWall = useMemo(
    () => (wallpaper.includes('ventura') ? 'ventura' : 'big-sur'),
    [wallpaper]
  );
  const setWallById = (id: string) =>
    setWallpaper(
      id === 'ventura' ? '/wallpapers/ventura-1.webp' : '/wallpapers/big-sur-graphic-1.jpg'
    );

  const bringToFront = (id: AppId) =>
    setWindows((prev) => {
      const nz = zCounter + 1;
      setZCounter(nz);
      return { ...prev, [id]: { ...prev[id], z: nz } };
    });

  const dockItems: DockItem[] = useMemo(() => {
    const ctx = {
      router,
      openLaunchpad: () => setLpOpen(true),
      wallpapers: { items: wallpapers, current: currentWall, set: (id: string) => setWallById(id) },
    } as any;
    return appsOrder.map((id) => {
      const cfg = appsConfig[id];
      const running = windows[id]?.open || windows[id]?.minimized;
      return {
        key: id,
        label: cfg.title ?? id,
        iconSrc: cfg.icon,
        running,
        onClick: () => {
          if (cfg.shouldOpenWindow) {
            setWindows((prev) => ({
              ...prev,
              [id]: { ...prev[id], open: true, minimized: false },
            }));
            bringToFront(id);
          } else {
            cfg.externalAction?.(ctx);
          }
        },
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windows, currentWall, router, wallpapers]);

  const onMenuClick = useCallback(() => setSysOpen((v) => !v), []);

  return (
    <AuthGuard redirectTo="/login">
      <div className="relative h-screen w-screen overflow-hidden">
        {/* Wallpaper */}
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${wallpaper})` }}
        />
        {/* Subtle vignette for readability */}
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />

        {/* Top bar */}
        <TopMenuBar onMenuClick={onMenuClick} />
        <SystemMenu
          open={sysOpen}
          onClose={() => setSysOpen(false)}
          wallpapers={wallpapers}
          current={currentWall}
          onPick={(id) => setWallById(id)}
          onOpenWallpapers={() => {
            setWindows((prev) => ({
              ...prev,
              wallpapers: { ...prev.wallpapers, open: true, minimized: false },
            }));
            bringToFront('wallpapers');
            setSysOpen(false);
          }}
        />

        {/* Launchpad overlay */}
        <Launchpad open={lpOpen} onClose={() => setLpOpen(false)} />

        {/* Windows generated from config */}
        {appsOrder.map((id) => {
          const cfg = appsConfig[id];
          if (!cfg.shouldOpenWindow) return null;
          const win = windows[id];
          if (!win) return null;
          const onRectChange = (r: WindowRect) =>
            setWindows((prev) => ({ ...prev, [id]: { ...prev[id], rect: r } }));
          const onClose = () =>
            setWindows((prev) => ({
              ...prev,
              [id]: { ...prev[id], open: false, minimized: false },
            }));
          const onMinimize = () =>
            setWindows((prev) => ({ ...prev, [id]: { ...prev[id], minimized: true } }));
          const onActivate = () => bringToFront(id);
          const ctx = {
            router,
            openLaunchpad: () => setLpOpen(true),
            wallpapers: {
              items: wallpapers,
              current: currentWall,
              set: (id: string) => setWallById(id),
            },
          } as any;
          return (
            <AppWindow
              key={id}
              title={win.title}
              open={!!win.open}
              minimized={!!win.minimized}
              rect={(win.rect as WindowRect) ?? { x: 120, y: 90, width: 860, height: 520 }}
              onRectChange={onRectChange}
              onClose={onClose}
              onMinimize={onMinimize}
              onActivate={onActivate}
              zIndex={win.z}
            >
              {cfg.render?.(ctx)}
            </AppWindow>
          );
        })}

        {/* Dock */}
        <Dock items={dockItems} />

        {/* Wallpapers app window now generated by config above */}
      </div>
    </AuthGuard>
  );
};

DesktopPage.getLayout = (page) => page; // Bypass RootLayout for a true full-screen desktop

export default DesktopPage;
