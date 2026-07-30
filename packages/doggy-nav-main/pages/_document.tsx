import { Html, Head, Main, NextScript } from 'next/document';
import { defaultCustomTheme, THEME_STORAGE_KEY } from '@/theme/theme';

const themeBootScript = `(() => {
  try {
    const defaults = ${JSON.stringify(defaultCustomTheme())};
    const stored = JSON.parse(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}) || 'null') || {};
    const legacy = localStorage.getItem('theme');
    const mode = ['light', 'dark', 'system'].includes(stored.mode)
      ? stored.mode
      : ['light', 'dark'].includes(legacy) ? legacy : 'system';
    const palette = ['editorial', 'classic', 'custom'].includes(stored.palette)
      ? stored.palette
      : 'editorial';
    const dark = mode === 'dark' ||
      (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    const color = (value, fallback) =>
      typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
    const custom = stored.custom || {};
    const light = custom.light || {};
    const darkColors = custom.dark || {};
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.dataset.theme = palette;
    root.style.setProperty('--custom-background-light', color(light.background, defaults.light.background));
    root.style.setProperty('--custom-primary-light', color(light.primary, defaults.light.primary));
    root.style.setProperty('--custom-background-dark', color(darkColors.background, defaults.dark.background));
    root.style.setProperty('--custom-primary-dark', color(darkColors.primary, defaults.dark.primary));
  } catch {}
})();`;

export default function Document() {
  return (
    <Html lang="zh-CN">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
