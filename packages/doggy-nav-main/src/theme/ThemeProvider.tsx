import { type ReactNode, useEffect, useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { customThemeColorsAtom, themeAtom, themeModeAtom, themePaletteAtom } from '@/store/store';
import {
  customThemeProperties,
  normalizeThemePreferences,
  resolveTheme,
  THEME_STORAGE_KEY,
} from './theme';

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useAtom(themeModeAtom);
  const [palette, setPalette] = useAtom(themePaletteAtom);
  const [custom, setCustom] = useAtom(customThemeColorsAtom);
  const setTheme = useSetAtom(themeAtom);
  const [systemDark, setSystemDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = () => setSystemDark(media.matches);
    updateSystemTheme();
    media.addEventListener('change', updateSystemTheme);

    let stored: unknown;
    try {
      stored = JSON.parse(window.localStorage.getItem(THEME_STORAGE_KEY) || 'null');
    } catch {
      stored = null;
    }
    const preferences = normalizeThemePreferences(stored, window.localStorage.getItem('theme'));
    setMode(preferences.mode);
    setPalette(preferences.palette);
    setCustom(preferences.custom);
    setReady(true);

    return () => media.removeEventListener('change', updateSystemTheme);
  }, [setCustom, setMode, setPalette]);

  useEffect(() => {
    if (!ready) return;

    const resolved = resolveTheme(mode, systemDark);
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.dataset.theme = palette;
    Object.entries(customThemeProperties(custom)).forEach(([name, value]) =>
      root.style.setProperty(name, value)
    );
    if (resolved === 'dark') {
      document.body.setAttribute('arco-theme', 'dark');
    } else {
      document.body.removeAttribute('arco-theme');
    }
    setTheme(resolved);
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ mode, palette, custom }));
    window.localStorage.setItem('theme', resolved);
  }, [custom, mode, palette, ready, setTheme, systemDark]);

  return children;
}
