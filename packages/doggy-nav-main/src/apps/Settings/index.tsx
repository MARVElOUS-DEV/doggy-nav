import { useEffect, useMemo, useState } from 'react';
import IframeContainer from '@/components/IframeContainer';
import { Plus } from 'lucide-react';
import type { DesktopCtx } from '@/apps/config';
import { getSetting, setSetting } from '@/utils/idb';
import { Message } from '@arco-design/web-react';

export default function SettingsApp({ ctx }: { ctx: DesktopCtx }) {
  const [active, setActive] = useState<'music' | 'add'>('music');

  // Music config form state
  const musicDefaultUrl = 'https://y.qq.com/';
  const [musicUrl, setMusicUrl] = useState(musicDefaultUrl);
  useEffect(() => {
    let alive = true;
    getSetting<string>('music.url').then((v) => {
      if (alive && v) setMusicUrl(v);
    });
    return () => {
      alive = false;
    };
  }, []);

  const onSaveMusic = async () => {
    // Update music app to point to the new URL
    ctx.actions.updateApp('music', {
      keepAliveOnMinimize: true,
      render: () => <IframeContainer src={musicUrl || musicDefaultUrl} title="music" />,
    });
    await setSetting('music.url', musicUrl || musicDefaultUrl);
    Message.success('Music settings saved');
  };

  // Add new app form state
  const [newName, setNewName] = useState('My Web App');
  const [newUrl, setNewUrl] = useState('https://');
  const [newIcon, setNewIcon] = useState('');
  const canCreate = useMemo(
    () => /^https?:\/\//i.test(newUrl) && newName.trim().length > 0,
    [newUrl, newName]
  );

  const onCreateApp = () => {
    if (!canCreate) return;
    const id = `app-${Date.now()}`;
    ctx.actions.addApp({
      id,
      title: newName.trim(),
      icon: newIcon || '/default-web.png',
      shouldOpenWindow: true,
      keepAliveOnMinimize: true,
      open: false,
      minimized: false,
      defaultRect: { x: 240, y: 120, width: 960, height: 640 },
      rect: { x: 240, y: 120, width: 960, height: 640 },
      z: undefined,
      render: () => <IframeContainer src={newUrl} title={newName} />,
    });
    // Open immediately
    ctx.actions.openWindow(id);
    ctx.actions.activateWindow(id);
    Message.success('App created and opened');
  };

  return (
    <div className="w-full h-full flex" style={{ color: 'var(--color-foreground)' }}>
      {/* Sidebar */}
      <aside
        className="w-56 border-r p-2 flex flex-col gap-2"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div
          className="text-sm font-medium px-2 pt-2 pb-1"
          style={{ color: 'var(--color-muted-foreground)' }}
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
            <p className="text-xs mb-4" style={{ color: 'var(--color-muted-foreground)' }}>
              Configure the embedded music application URL.
            </p>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
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

        {active === 'add' && (
          <div className="max-w-2xl">
            <h2 className="text-base font-medium mb-2">Add Web App</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--color-muted-foreground)' }}>
              Create a new app that opens an external URL in a window.
            </p>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
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
                <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
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
                <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
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
