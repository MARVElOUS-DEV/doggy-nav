import { memo } from 'react';
import { Select, Button } from '@arco-design/web-react';
import { IconSwap } from '@arco-design/web-react/icon';
import { LanguageSelectorProps, Language } from './types';

const Option = Select.Option;

/**
 * Supported languages for translation
 */
export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

/**
 * Language Selector Component
 * Provides dropdowns for source and target language selection with swap functionality
 */
function LanguageSelector({
  sourceLang,
  targetLang,
  onSourceLangChange,
  onTargetLangChange,
  onSwapLanguages,
}: LanguageSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
      {/* Source Language Selector */}
      <div className="flex-1 w-full">
        <Select
          value={sourceLang}
          onChange={onSourceLangChange}
          className="w-full"
          placeholder="选择源语言"
          aria-label="选择源语言"
          aria-required="true"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Option key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </span>
            </Option>
          ))}
        </Select>
      </div>

      {/* Swap Button */}
      <Button
        type="text"
        icon={<IconSwap />}
        onClick={onSwapLanguages}
        className="flex-shrink-0"
        aria-label="交换源语言和目标语言"
        style={{
          color: 'var(--color-primary)',
        }}
      />

      {/* Target Language Selector */}
      <div className="flex-1 w-full">
        <Select
          value={targetLang}
          onChange={onTargetLangChange}
          className="w-full"
          placeholder="选择目标语言"
          aria-label="选择目标语言"
          aria-required="true"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Option key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </span>
            </Option>
          ))}
        </Select>
      </div>
    </div>
  );
}

export default memo(LanguageSelector);
