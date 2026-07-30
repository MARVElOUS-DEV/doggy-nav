import { useEffect, useState } from 'react';
import { Button, Popover } from '@arco-design/web-react';
import { Monitor, Moon, Palette, RotateCcw, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAtom, useAtomValue } from 'jotai';
import { customThemeColorsAtom, themeAtom, themeModeAtom, themePaletteAtom } from '@/store/store';
import {
  defaultCustomTheme,
  type CustomThemeColors,
  type ThemeMode,
  type ThemePalette,
  validateCustomTheme,
} from '@/theme/theme';

interface ThemeToggleProps {
  variant?: 'icon' | 'compact';
  className?: string;
}

const paletteSwatches: Record<ThemePalette, [string, string, string]> = {
  editorial: ['#f6f3ec', '#304638', '#e2eadf'],
  classic: ['#ffffff', '#165dff', '#8b5cf6'],
  custom: ['var(--custom-background-light)', 'var(--custom-primary-light)', '#d9d9d9'],
};

function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-xs text-theme-muted-foreground">
      <span>{label}</span>
      <span className="flex items-center gap-2 font-mono text-[11px] text-theme-foreground">
        {value.toUpperCase()}
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-7 w-9 cursor-pointer rounded border border-theme-border bg-transparent p-0.5"
        />
      </span>
    </label>
  );
}

export default function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
  const { t } = useTranslation('translation');
  const theme = useAtomValue(themeAtom);
  const [mode, setMode] = useAtom(themeModeAtom);
  const [palette, setPalette] = useAtom(themePaletteAtom);
  const [custom, setCustom] = useAtom(customThemeColorsAtom);
  const [draft, setDraft] = useState(custom);

  useEffect(() => setDraft(custom), [custom]);

  const updateCustom = (
    appearance: keyof CustomThemeColors,
    color: keyof CustomThemeColors['light'],
    value: string
  ) => {
    const next = { ...draft, [appearance]: { ...draft[appearance], [color]: value } };
    setDraft(next);
    if (!validateCustomTheme(next)) {
      setCustom(next);
      setPalette('custom');
    }
  };

  const resetCustom = () => {
    const defaults = defaultCustomTheme();
    setDraft(defaults);
    setCustom(defaults);
    setPalette('custom');
  };

  const modes: Array<{ value: ThemeMode; label: string; icon: typeof Sun }> = [
    { value: 'light', label: t('light_mode'), icon: Sun },
    { value: 'dark', label: t('dark_mode'), icon: Moon },
    { value: 'system', label: t('system_mode'), icon: Monitor },
  ];
  const palettes: Array<{ value: ThemePalette; label: string }> = [
    { value: 'editorial', label: t('editorial_theme') },
    { value: 'classic', label: t('classic_theme') },
    { value: 'custom', label: t('custom_theme') },
  ];
  const customError = validateCustomTheme(draft);

  const panel = (
    <div className="w-[320px] max-w-[calc(100vw-32px)] p-1 text-theme-foreground">
      <div className="mb-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-theme-muted-foreground">
          {t('appearance')}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {modes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className={`flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border text-xs transition-colors ${
                mode === value
                  ? 'border-theme-primary bg-theme-secondary text-theme-secondary-foreground'
                  : 'border-theme-border hover:bg-theme-muted'
              }`}
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-theme-muted-foreground">
          {t('color_theme')}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {palettes.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPalette(value)}
              aria-pressed={palette === value}
              className={`rounded-xl border p-2 text-left text-xs transition-colors ${
                palette === value
                  ? 'border-theme-primary bg-theme-secondary'
                  : 'border-theme-border hover:bg-theme-muted'
              }`}
            >
              <span className="mb-2 flex overflow-hidden rounded-full border border-black/10">
                {paletteSwatches[value].map((color) => (
                  <span key={color} className="h-4 flex-1" style={{ background: color }} />
                ))}
              </span>
              <span className="block truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {palette === 'custom' && (
        <div className="mt-3 rounded-xl border border-theme-border bg-theme-muted p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold">{t('custom_colors')}</span>
            <button
              type="button"
              onClick={resetCustom}
              className="inline-flex items-center gap-1 text-[11px] text-theme-muted-foreground hover:text-theme-foreground"
            >
              <RotateCcw size={12} aria-hidden="true" />
              {t('reset')}
            </button>
          </div>
          <div className="grid gap-2.5">
            <ColorControl
              label={`${t('light_mode')} · ${t('background_color')}`}
              value={draft.light.background}
              onChange={(value) => updateCustom('light', 'background', value)}
            />
            <ColorControl
              label={`${t('light_mode')} · ${t('primary_color')}`}
              value={draft.light.primary}
              onChange={(value) => updateCustom('light', 'primary', value)}
            />
            <ColorControl
              label={`${t('dark_mode')} · ${t('background_color')}`}
              value={draft.dark.background}
              onChange={(value) => updateCustom('dark', 'background', value)}
            />
            <ColorControl
              label={`${t('dark_mode')} · ${t('primary_color')}`}
              value={draft.dark.primary}
              onChange={(value) => updateCustom('dark', 'primary', value)}
            />
          </div>
          {customError && (
            <p className="mt-2 text-[11px] leading-4 text-red-500" role="alert">
              {t('theme_contrast_warning')}
            </p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Popover content={panel} trigger="click" position="br">
      <Button
        className={
          variant === 'compact'
            ? `app-header-action h-8 min-w-[92px] px-3 !inline-flex items-center justify-center rounded-full text-xs font-semibold ${className}`
            : `app-header-action theme-toggle-btn h-10 w-10 !flex items-center justify-center ${className}`
        }
        aria-label={t('open_theme_settings')}
        title={t('open_theme_settings')}
        icon={variant === 'icon' ? <Palette size={18} /> : undefined}
      >
        {variant === 'compact'
          ? `${theme === 'light' ? t('light_mode') : t('dark_mode')} · ${t(`${palette}_theme`)}`
          : null}
      </Button>
    </Popover>
  );
}
