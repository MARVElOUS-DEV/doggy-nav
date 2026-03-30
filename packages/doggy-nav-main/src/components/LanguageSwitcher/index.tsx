import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { Button, Dropdown, Menu, Tooltip } from '@arco-design/web-react';
import { Languages } from 'lucide-react';

const SUPPORTED_LOCALES = [
  { value: 'zh', shortLabelKey: 'chinese_short', labelKey: 'chinese' },
  { value: 'en', shortLabelKey: 'english_short', labelKey: 'english' },
] as const;

interface LanguageSwitcherProps {
  variant?: 'icon' | 'compact';
  className?: string;
}

export default function LanguageSwitcher({
  variant = 'icon',
  className = '',
}: LanguageSwitcherProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const currentLocale = router.locale ?? router.defaultLocale ?? 'zh';
  const currentLanguage =
    SUPPORTED_LOCALES.find((locale) => locale.value === currentLocale) ?? SUPPORTED_LOCALES[0];
  const nextLanguage =
    SUPPORTED_LOCALES.find((locale) => locale.value !== currentLanguage.value) ?? currentLanguage;

  const changeLanguage = (locale: (typeof SUPPORTED_LOCALES)[number]['value']) => {
    if (locale === currentLocale) {
      return;
    }

    router.push(
      {
        pathname: router.pathname,
        query: router.query,
      },
      router.asPath,
      { locale }
    );
  };

  if (variant === 'compact') {
    const toggleLabel = `${t('language_switch_to')} ${t(nextLanguage.labelKey)}`;

    return (
      <Tooltip content={toggleLabel}>
        <Button
          className={`app-header-action h-8 min-w-[52px] px-3 !inline-flex items-center justify-center rounded-full text-xs font-semibold ${className}`}
          aria-label={toggleLabel}
          onClick={() => changeLanguage(nextLanguage.value)}
        >
          {t(currentLanguage.shortLabelKey)}
        </Button>
      </Tooltip>
    );
  }

  const languageMenu = (
    <Menu selectedKeys={[currentLanguage.value]}>
      {SUPPORTED_LOCALES.map((locale) => (
        <Menu.Item key={locale.value} onClick={() => changeLanguage(locale.value)}>
          <div className="flex items-center justify-between min-w-[96px] gap-3">
            <span>{t(locale.labelKey)}</span>
            <span className="text-xs text-theme-muted-foreground">{t(locale.shortLabelKey)}</span>
          </div>
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <Tooltip content={t('language')}>
      <Dropdown droplist={languageMenu} trigger="click" position="bl">
        <Button
          className={`app-header-action text-2xl cursor-pointer !flex items-center justify-center w-10 h-10 ${className}`}
          aria-label={t('language')}
          icon={<Languages size={16} className="text-theme-muted-foreground" />}
        />
      </Dropdown>
    </Tooltip>
  );
}
