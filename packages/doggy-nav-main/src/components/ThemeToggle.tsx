import { useEffect, useMemo } from 'react';
import { Button, Tooltip } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import { themeAtom } from '@/store/store';

export default function ThemeToggle() {
  const { t } = useTranslation('translation');
  const [theme, setTheme] = useAtom(themeAtom);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const savedTheme = window.localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
      setTheme(savedTheme);
    } else if (systemPrefersDark) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, [setTheme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.setAttribute('arco-theme', 'dark');
    } else {
      root.classList.remove('dark');
      document.body.removeAttribute('arco-theme');
    }

    window.localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const tooltipContent = useMemo(
    () => (theme === 'light' ? t('switch_to_dark_mode') : t('switch_to_light_mode')),
    [theme, t]
  );

  return (
    <Tooltip content={tooltipContent}>
      <Button
        onClick={toggleTheme}
        className="app-header-action theme-toggle-btn w-10 h-10 !flex items-center justify-center"
        aria-label={tooltipContent}
        icon={
          theme === 'light' ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 m-auto" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 m-auto" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        )
        }
      />
    </Tooltip>
  );
}