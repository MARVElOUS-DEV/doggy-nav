export const THEME_STORAGE_KEY = 'doggy-theme-preferences';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemePalette = 'editorial' | 'classic' | 'custom';
export type ResolvedTheme = 'light' | 'dark';

export type CustomThemeColors = {
  light: { background: string; primary: string };
  dark: { background: string; primary: string };
};

export type ThemePreferences = {
  mode: ThemeMode;
  palette: ThemePalette;
  custom: CustomThemeColors;
};

export const defaultCustomTheme = (): CustomThemeColors => ({
  light: { background: '#f6f3ec', primary: '#304638' },
  dark: { background: '#11130f', primary: '#dce8d8' },
});

const isHexColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

const readColor = (value: unknown, fallback: string) => (isHexColor(value) ? value : fallback);

export function normalizeThemePreferences(
  value: unknown,
  legacyTheme?: string | null
): ThemePreferences {
  const fallback = defaultCustomTheme();
  const stored = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const custom =
    stored.custom && typeof stored.custom === 'object'
      ? (stored.custom as Record<string, unknown>)
      : {};
  const light =
    custom.light && typeof custom.light === 'object'
      ? (custom.light as Record<string, unknown>)
      : {};
  const dark =
    custom.dark && typeof custom.dark === 'object' ? (custom.dark as Record<string, unknown>) : {};

  return {
    mode:
      stored.mode === 'light' || stored.mode === 'dark' || stored.mode === 'system'
        ? stored.mode
        : legacyTheme === 'light' || legacyTheme === 'dark'
          ? legacyTheme
          : 'system',
    palette:
      stored.palette === 'editorial' || stored.palette === 'classic' || stored.palette === 'custom'
        ? stored.palette
        : 'editorial',
    custom: {
      light: {
        background: readColor(light.background, fallback.light.background),
        primary: readColor(light.primary, fallback.light.primary),
      },
      dark: {
        background: readColor(dark.background, fallback.dark.background),
        primary: readColor(dark.primary, fallback.dark.primary),
      },
    },
  };
}

export const resolveTheme = (mode: ThemeMode, systemDark: boolean): ResolvedTheme =>
  mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

const luminance = (hex: string) => {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

export const contrastRatio = (first: string, second: string) => {
  const [bright, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (bright + 0.05) / (dark + 0.05);
};

export type CustomThemeError =
  'light_background' | 'light_primary' | 'dark_background' | 'dark_primary' | null;

export function validateCustomTheme(colors: CustomThemeColors): CustomThemeError {
  if (contrastRatio(colors.light.background, '#20231d') < 4.5) return 'light_background';
  if (contrastRatio(colors.light.primary, '#ffffff') < 4.5) return 'light_primary';
  if (contrastRatio(colors.dark.background, '#f4f0e8') < 4.5) return 'dark_background';
  if (contrastRatio(colors.dark.primary, '#11130f') < 4.5) return 'dark_primary';
  return null;
}

export const customThemeProperties = (colors: CustomThemeColors) => ({
  '--custom-background-light': colors.light.background,
  '--custom-primary-light': colors.light.primary,
  '--custom-background-dark': colors.dark.background,
  '--custom-primary-dark': colors.dark.primary,
});
