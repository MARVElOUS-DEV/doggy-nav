import { useCallback, useEffect, useMemo, useState } from 'react';
import IframeContainer from '@/components/IframeContainer';
import {
  SUPPORT_CURRENCY_OPTIONS,
  formatSupportAmount,
  resolveAboutMeProfile,
  resolveSupportSettings,
  type SupportCurrency,
} from '@/config/aboutMe';
import api from '@/utils/api';
import {
  BadgeCheck,
  Coffee,
  Compass,
  HeartHandshake,
  MousePointerClick,
  Plus,
  Quote,
  RefreshCw,
  Sparkles,
  Target,
} from 'lucide-react';
import type { DesktopCtx } from '@/apps/config';
import { getSetting, setSetting } from '@/utils/idb';
import { Message } from '@arco-design/web-react';
import { getRandomFallbackIcon } from '@/utils/fallbackIcons';
import { useDesktop } from '@/apps/Desktop/DesktopStore';
import { useGlobalAppWindow } from '@/store/GlobalAppWindowStore';
import NavCascaderPicker from '@/components/NavCascaderPicker';
import type { NavItem } from '@/types';
import { useSiteSettings } from '@/context/SiteSettingsContext';

const creatorHighlights = [
  {
    title: 'Useful tools',
    description: 'Curated over noisy.',
    Icon: Compass,
  },
  {
    title: 'Desktop feel',
    description: 'Playful without friction.',
    Icon: MousePointerClick,
  },
  {
    title: 'Small updates',
    description: 'Improved from real use.',
    Icon: RefreshCw,
  },
];

function getProfileInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return 'DN';
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export default function SettingsApp({ ctx }: { ctx: DesktopCtx }) {
  const { state } = useDesktop();
  const { siteSettings } = useSiteSettings();
  const globalWindow = useGlobalAppWindow();
  const [active, setActive] = useState<string>('about');
  const [startingCheckoutId, setStartingCheckoutId] = useState<string | null>(null);
  const aboutMeProfile = useMemo(() => resolveAboutMeProfile(siteSettings), [siteSettings]);
  const supportSettings = useMemo(() => resolveSupportSettings(siteSettings), [siteSettings]);
  const profileInitials = useMemo(
    () => getProfileInitials(aboutMeProfile.name),
    [aboutMeProfile.name]
  );
  const [selectedSupportCurrency, setSelectedSupportCurrency] = useState<SupportCurrency>(
    supportSettings.defaultCurrency
  );

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

  useEffect(() => {
    setSelectedSupportCurrency(supportSettings.defaultCurrency);
  }, [supportSettings.defaultCurrency]);

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

  const handleNavSelect = useCallback((nav: NavItem) => {
    setNewName(nav.name);
    setNewUrl(nav.href || 'https://');
    setNewIcon(nav.logo || '');
  }, []);

  const onStartCoffeeCheckout = useCallback(
    async (tierId: string, amount: number, currency: SupportCurrency) => {
      try {
        setStartingCheckoutId(`${currency}:${tierId}`);
        const { url } = await api.createCoffeeCheckoutSession({ amount, currency });
        if (!url) {
          throw new Error('Missing checkout URL');
        }
        window.location.assign(url);
      } catch (error) {
        console.error('Failed to start coffee checkout:', error);
      } finally {
        setStartingCheckoutId(null);
      }
    },
    []
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
  const supportTiers = useMemo(
    () => supportSettings.tiers[selectedSupportCurrency] || [],
    [selectedSupportCurrency, supportSettings.tiers]
  );

  return (
    <div
      className="flex h-full w-full flex-col md:flex-row"
      style={{ color: 'var(--color-foreground)' }}
    >
      {/* Sidebar */}
      <aside
        className="w-full border-b p-2 md:flex md:w-56 md:flex-col md:gap-2 md:border-b-0 md:border-r"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div
          className="px-2 pb-1 pt-2 text-sm font-medium"
          style={{ color: 'var(--color-foreground)' }}
        >
          Settings
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
          <button
            type="button"
            className={`shrink-0 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10 md:px-2 md:py-1 ${active === 'about' ? 'bg-black/5 dark:bg-white/10' : ''}`}
            onClick={() => setActive('about')}
          >
            About Me
          </button>
          <button
            type="button"
            className={`shrink-0 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10 md:px-2 md:py-1 ${active === 'music' ? 'bg-black/5 dark:bg-white/10' : ''}`}
            onClick={() => setActive('music')}
          >
            Music
          </button>
          {/* User apps list */}
          {userApps.map((app) => (
            <button
              key={app.id}
              type="button"
              className={`shrink-0 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10 md:px-2 md:py-1 ${active === app.id ? 'bg-black/5 dark:bg-white/10' : ''}`}
              onClick={() => setActive(app.id)}
              title={app.title}
            >
              {app.title}
            </button>
          ))}
        </div>
        <div
          className="mt-2 border-t pt-2 md:mt-auto"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            type="button"
            className={`inline-flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10 md:justify-start md:px-2 md:py-1 ${active === 'add' ? 'bg-black/5 dark:bg-white/10' : ''}`}
            onClick={() => setActive('add')}
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </aside>

      {/* Content */}
      <section className="min-w-0 flex-1 overflow-auto p-3 md:p-4">
        {active === 'about' && (
          <div className="mx-auto max-w-5xl space-y-4">
            <div className="flex flex-wrap gap-4">
              <section
                className="min-w-0 flex-[27_1_420px] rounded-lg border p-5 md:p-6"
                style={{
                  borderColor: 'var(--color-border)',
                  background:
                    'linear-gradient(145deg, color-mix(in srgb, var(--color-background) 94%, white 6%), color-mix(in srgb, var(--color-primary) 7%, transparent))',
                }}
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border text-2xl font-semibold"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor:
                        'color-mix(in srgb, var(--color-primary) 15%, var(--color-background))',
                    }}
                    aria-hidden="true"
                  >
                    {profileInitials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div
                      className="inline-flex max-w-full items-center gap-2 rounded-md border px-2.5 py-1 text-[11px] font-medium uppercase"
                      style={{
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-foreground)',
                      }}
                    >
                      <Sparkles className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">About the maker</span>
                    </div>

                    <h2 className="mt-4 text-2xl font-semibold leading-tight md:text-3xl">
                      {aboutMeProfile.name}
                    </h2>

                    <div
                      className="mt-3 inline-flex max-w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm"
                      style={{
                        backgroundColor:
                          'color-mix(in srgb, var(--color-primary) 12%, var(--color-background))',
                      }}
                    >
                      <BadgeCheck className="h-4 w-4 shrink-0" />
                      <span className="truncate">{aboutMeProfile.title}</span>
                    </div>

                    <p
                      className="mt-4 max-w-2xl text-base leading-7 md:text-lg"
                      style={{ color: 'var(--color-foreground)' }}
                    >
                      {aboutMeProfile.headline}
                    </p>
                  </div>
                </div>

                <div
                  className="mt-5 border-l-2 pl-4"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="flex items-start gap-3">
                    <Quote className="mt-1 h-4 w-4 shrink-0 opacity-70" />
                    <p
                      className="text-sm leading-6 opacity-80"
                      style={{
                        color: 'var(--color-foreground)',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {aboutMeProfile.bio}
                    </p>
                  </div>
                </div>
              </section>

              <section
                className="min-w-0 flex-[13_1_280px] rounded-lg border p-5 md:p-6"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'color-mix(in srgb, var(--color-background) 96%, transparent)',
                }}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--color-primary) 14%, var(--color-background))',
                  }}
                >
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <div className="mt-5 text-sm font-medium">Why support this project</div>
                <p
                  className="mt-2 text-sm leading-6 opacity-80"
                  style={{
                    color: 'var(--color-foreground)',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {aboutMeProfile.mission}
                </p>
              </section>
            </div>

            <section
              className="rounded-lg border p-4"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'color-mix(in srgb, var(--color-background) 96%, transparent)',
              }}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <Target className="h-4 w-4" />
                Focus
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {creatorHighlights.map(({ title, description, Icon }) => (
                  <div
                    key={title}
                    className="flex min-w-0 items-start gap-3 rounded-lg border p-3"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor:
                        'color-mix(in srgb, var(--color-background) 94%, transparent)',
                    }}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{title}</div>
                      <p
                        className="mt-1 text-xs leading-5 opacity-75"
                        style={{ color: 'var(--color-foreground)' }}
                      >
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {supportSettings.enabled && supportTiers.length > 0 && (
              <div
                className="rounded-lg border p-5 md:p-6"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'color-mix(in srgb, var(--color-background) 96%, transparent)',
                }}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 text-sm font-medium">
                      <Coffee className="h-4 w-4" />
                      Buy me a coffee
                    </div>
                    <p
                      className="mt-2 max-w-2xl text-sm leading-6 opacity-80"
                      style={{ color: 'var(--color-foreground)' }}
                    >
                      Your support helps keep Doggy Nav running and funds thoughtful improvements,
                      new tools, and ongoing care.
                    </p>
                  </div>
                  <div className="text-xs opacity-70" style={{ color: 'var(--color-foreground)' }}>
                    Choose the amount and currency that suit you. You will return here after payment.
                  </div>
                </div>

                {supportSettings.currencies.length > 1 && (
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="text-xs uppercase tracking-[0.2em] opacity-70">Currency</span>
                    {SUPPORT_CURRENCY_OPTIONS.filter((option) =>
                      supportSettings.currencies.includes(option.id)
                    ).map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{
                          borderColor:
                            selectedSupportCurrency === option.id
                              ? 'var(--color-foreground)'
                              : 'var(--color-border)',
                          backgroundColor:
                            selectedSupportCurrency === option.id
                              ? 'var(--color-foreground)'
                              : 'transparent',
                          color:
                            selectedSupportCurrency === option.id
                              ? 'var(--color-background)'
                              : 'var(--color-foreground)',
                        }}
                        onClick={() => setSelectedSupportCurrency(option.id)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {supportTiers.map((tier) => {
                    const checkoutKey = `${tier.currency}:${tier.id}`;
                    const isLoading = startingCheckoutId === checkoutKey;
                    return (
                      <div
                        key={checkoutKey}
                        className="rounded-2xl border p-4"
                        style={{
                          borderColor: 'var(--color-border)',
                          background:
                            'linear-gradient(180deg, color-mix(in srgb, var(--color-background) 90%, transparent), color-mix(in srgb, var(--color-primary) 6%, transparent))',
                        }}
                      >
                        <div className="text-sm font-medium">{tier.label}</div>
                        <div className="mt-2 text-2xl font-semibold">
                          {formatSupportAmount(tier.amount, tier.currency)}
                        </div>
                        <p
                          className="mt-2 text-sm leading-6 opacity-80 md:min-h-12"
                          style={{ color: 'var(--color-foreground)' }}
                        >
                          {tier.description}
                        </p>
                        <button
                          type="button"
                          disabled={!!startingCheckoutId}
                          onClick={() => onStartCoffeeCheckout(tier.id, tier.amount, tier.currency)}
                          className="mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                          style={{
                            backgroundColor: 'var(--color-foreground)',
                            color: 'var(--color-background)',
                          }}
                        >
                          {isLoading ? 'Redirecting...' : `Support with ${tier.label}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

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
                <span>Keep window open when visiting other pages</span>
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
                <span>Keep window open when visiting other pages</span>
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
            <div className="mb-4">
              <NavCascaderPicker
                onSelect={handleNavSelect}
                title="Choose from navigation"
                trigger={
                  <button
                    type="button"
                    className="px-3 py-1.5 text-sm rounded-md border hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-2"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <span>📂</span>
                    <span>Browse navigation</span>
                  </button>
                }
              />
              <span className="ml-2 text-xs" style={{ color: 'var(--color-foreground)' }}>
                or enter details manually below
              </span>
            </div>
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
                <span>Keep window open when visiting other pages</span>
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
