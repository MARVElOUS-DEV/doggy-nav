import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const router = useRouter();
  const { i18n } = useTranslation();

  const changeLanguage = (locale: string) => {
    router.push(router.pathname, router.asPath, { locale });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => changeLanguage('zh')}
        className={`px-2 py-1 text-sm rounded ${
          router.locale === 'zh' ? 'bg-blue-500 text-white' : 'text-gray-500'
        }`}
      >
        中文
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 text-sm rounded ${
          router.locale === 'en' ? 'bg-blue-500 text-white' : 'text-gray-500'
        }`}
      >
        English
      </button>
    </div>
  );
}