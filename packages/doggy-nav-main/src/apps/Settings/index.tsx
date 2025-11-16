import { useEffect, useMemo, useState } from 'react';
import IframeContainer from '@/components/IframeContainer';
import { Plus } from 'lucide-react';
import type { DesktopCtx } from '@/apps/config';
import { getSetting, setSetting } from '@/utils/idb';
import { Message } from '@arco-design/web-react';
import { getRandomFallbackIcon } from '@/utils/fallbackIcons';
import { useDesktop } from '@/apps/Desktop/DesktopStore';
import { useGlobalAppWindow } from '@/store/GlobalAppWindowStore';

export default function SettingsApp({ ctx }: { ctx: DesktopCtx }) {
  const { state } = useDesktop();
  const globalWindow = useGlobalAppWindow();
  const [active, setActive] = useState<string>('music');

  // Music config form state
  const musicDefaultUrl = 'https://y.qq.com/';
  const [musicUrl, setMusicUrl] = useState(musicDefaultUrl);
  const [musicGlobalWindow, setMusicGlobalWindow] = useState(true);
  useEffect(() => {
    let alive = true;
    getSetting<string>('music.url').then((v) => {
      if (alive && v) setMusicUrl(v);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    getSetting<boolean>('music.globalWindow').then((v) => {
      if (!alive) return;
      if (typeof v === 'boolean') setMusicGlobalWindow(v);
    });
    return () => {
      alive = false;
    };
  }, []);

  const onSaveMusic = async () => {
    // Update music app to point to the new URL
    ctx.actions.updateApp('music', {
      keepAliveOnMinimize: true,
      globalWindow: musicGlobalWindow,
      webviewUrl: musicUrl || musicDefaultUrl,
      render: () => <IframeContainer src={musicUrl || musicDefaultUrl} title="music" />,
    });
    await setSetting('music.url', musicUrl || musicDefaultUrl);
    await setSetting('music.globalWindow', musicGlobalWindow);
    Message.success('Music settings saved');
  };

  // Add new app form state
  const [newName, setNewName] = useState('My Web App');
  const [newUrl, setNewUrl] = useState('https://');
  const [newIcon, setNewIcon] = useState('');
  const [newGlobalWindow, setNewGlobalWindow] = useState(false);
  const canCreate = useMemo(
    () => /^https?:\/\//i.test(newUrl) && newName.trim().length > 0,
    [newUrl, newName]
  );

  const onCreateApp = () => {
    if (!canCreate) return;
    const id = `app-${Date.now()}`;
    const rect = { x: 240, y: 120, width: 960, height: 640 } as const;
    ctx.actions.addApp({
      id,
      title: newName.trim(),
      icon: newIcon || getRandomFallbackIcon(),
      shouldOpenWindow: true,
      keepAliveOnMinimize: true,
      userApp: true,
      webviewUrl: newUrl,
      globalWindow: newGlobalWindow,
      open: false,
      minimized: false,
      defaultRect: rect,
      rect,
      z: undefined,
      render: () => <IframeContainer src={newUrl} title={newName} />,
    });
    // Open immediately
    if (newGlobalWindow) {
      globalWindow.openWindow({
        title: newName.trim(),
        rect,
        keepAliveOnMinimize: true,
        content: <IframeContainer src={newUrl} title={newName} />,
      });
    } else {
      ctx.actions.openWindow(id);
      ctx.actions.activateWindow(id);
    }
    Message.success('App created and opened');
  };

  const userApps = useMemo(
    () => Object.values(state.windows).filter((w) => w?.userApp),
    [state.windows]
  );
  const activeApp = useMemo(() => state.windows[active as any], [state.windows, active]);

  return (
    <div className="w-full h-full flex" style={{ color: 'var(--color-foreground)' }}>
      {/* Sidebar */}
      <aside
        className="w-56 border-r p-2 flex flex-col gap-2"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div
          className="text-sm font-medium px-2 pt-2 pb-1"
          style={{ color: 'var(--color-foreground)' }}
        >
          Settings
        </div>
        <button
          type="button"
          className={`text-sm text-left px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${active === 'music' ? 'bg-black/5 dark:bg-white/10' : ''}`}
          onClick={() => setActive('music')}
        >
          Music
        </button>
        {/* User apps list */}
        {userApps.length > 0 && (
          <div className="mt-2">
            <div className="text-[11px] px-2 mb-1" style={{ color: 'var(--color-foreground)' }}>
              Your Apps
            </div>
            <div className="flex flex-col gap-1">
              {userApps.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  className={`text-sm text-left px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${active === app.id ? 'bg-black/5 dark:bg-white/10' : ''}`}
                  onClick={() => setActive(app.id)}
                  title={app.title}
                >
                  {app.title}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mt-auto pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button
            type="button"
            className={`w-full inline-flex items-center gap-2 text-sm px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${active === 'add' ? 'bg-black/5 dark:bg-white/10' : ''}`}
            onClick={() => setActive('add')}
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </aside>

      {/* Content */}
      <section className="flex-1 p-4 overflow-auto">
        {active === 'music' && (
          <div className="max-w-2xl">
            <h2 className="text-base font-medium mb-2">Music App</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--color-foreground)' }}>
              Configure the embedded music application URL.
            </p>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs" style={{ color: 'var(--color-foreground)' }}>
                  URL
                </span>
                <input
                  value={musicUrl}
                  onChange={(e) => setMusicUrl(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-transparent px-2 py-1 text-sm outline-none"
                  style={{ borderColor: 'var(--color-border)' }}
                  placeholder={musicDefaultUrl}
                />
              </label>
              <label
                className="inline-flex items-center gap-2 text-xs"
                style={{ color: 'var(--color-foreground)' }}
              >
                <input
                  type="checkbox"
                  checked={musicGlobalWindow}
                  onChange={(e) => setMusicGlobalWindow(e.target.checked)}
                  className="rounded border bg-transparent"
                  style={{ borderColor: 'var(--color-border)' }}
                />
                <span>Use global window (keeps open when navigating to other pages)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSaveMusic}
                  className="px-3 py-1 text-sm rounded-md border hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {active !== 'music' && active !== 'add' && activeApp?.userApp && (
          <div className="max-w-2xl">
            <h2 className="text-base font-medium mb-2">{activeApp.title}</h2>
            <div className="text-xs mb-4" style={{ color: 'var(--color-foreground)' }}>
              User app
            </div>
            <div className="space-y-3">
              <div className="text-sm">
                <div className="text-xs" style={{ color: 'var(--color-foreground)' }}>
                  URL
                </div>
                <div
                  className="mt-1 break-all text-xs"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  {activeApp.webviewUrl || '—'}
                </div>
              </div>
              <label
                className="inline-flex items-center gap-2 text-xs"
                style={{ color: 'var(--color-foreground)' }}
              >
                <input
                  type="checkbox"
                  checked={!!activeApp.globalWindow}
                  onChange={(e) => {
                    ctx.actions.updateApp(active as any, { globalWindow: e.target.checked });
                    Message.success('Window setting updated');
                  }}
                  className="rounded border bg-transparent"
                  style={{ borderColor: 'var(--color-border)' }}
                />
                <span>Use global window (keeps open when navigating to other pages)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    ctx.actions.removeApp(active as any);
                    setActive('music');
                    Message.success('App removed');
                  }}
                  className="px-3 py-1 text-sm rounded-md border hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {active === 'add' && (
          <div className="max-w-2xl">
            <h2 className="text-base font-medium mb-2">Add Web App</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--color-foreground)' }}>
              Create a new app that opens an external URL in a window.
            </p>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs" style={{ color: 'var(--color-foreground)' }}>
                  Name
                </span>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-transparent px-2 py-1 text-sm outline-none"
                  style={{ borderColor: 'var(--color-border)' }}
                  placeholder="My Web App"
                />
              </label>
              <label className="block">
                <span className="text-xs" style={{ color: 'var(--color-foreground)' }}>
                  URL
                </span>
                <input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-transparent px-2 py-1 text-sm outline-none"
                  style={{ borderColor: 'var(--color-border)' }}
                  placeholder="https://example.com"
                />
              </label>
              <label className="block">
                <span className="text-xs" style={{ color: 'var(--color-foreground)' }}>
                  Icon URL (optional)
                </span>
                <input
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-transparent px-2 py-1 text-sm outline-none"
                  style={{ borderColor: 'var(--color-border)' }}
                  placeholder="/app-icons/tools.png"
                />
              </label>
              <label
                className="inline-flex items-center gap-2 text-xs"
                style={{ color: 'var(--color-foreground)' }}
              >
                <input
                  type="checkbox"
                  checked={newGlobalWindow}
                  onChange={(e) => setNewGlobalWindow(e.target.checked)}
                  className="rounded border bg-transparent"
                  style={{ borderColor: 'var(--color-border)' }}
                />
                <span>Use global window (keeps open when navigating to other pages)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!canCreate}
                  onClick={onCreateApp}
                  className="px-3 py-1 text-sm rounded-md border hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/10 transition-colors"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  Create and Open
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
