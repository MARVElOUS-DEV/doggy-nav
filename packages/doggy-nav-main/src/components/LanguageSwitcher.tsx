import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '@arco-design/web-react';

export default function LanguageSwitcher() {
  const router = useRouter();
  const { t } = useTranslation();

  const toggleLanguage = () => {
    const newLocale = router.locale === 'zh' ? 'en' : 'zh';
    router.push(router.pathname, router.asPath, { locale: newLocale });
  };

  const currentLang = router.locale === 'zh' ? 'CN' : 'EN';
  const nextLang = router.locale === 'zh' ? 'English' : '中文';

  return (
    <Tooltip content={`Switch to ${nextLang}`}>
      <button
        onClick={toggleLanguage}
        className="p-2 rounded-full hover:bg-theme-muted transition-colors flex items-center justify-center min-w-[40px]"
        aria-label={`Switch to ${nextLang}`}
      >
        <span className="text-sm font-medium text-theme-muted-foreground">
          {currentLang}
        </span>
      </button>
    </Tooltip>
  );
}