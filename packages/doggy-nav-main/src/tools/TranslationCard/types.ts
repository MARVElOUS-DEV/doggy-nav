// Type definitions for Translation Card Tool

/**
 * Supported language definition
 */
export interface Language {
  code: string;
  name: string;
  flag: string;
}

/**
 * Translation API request payload
 */
export interface TranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
}

/**
 * Translation API response
 */
export interface TranslationResponse {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  detectedLang?: string;
}

/**
 * Translation Card main component props
 */
export interface TranslationCardProps {
  className?: string;
  defaultSourceLang?: string;
  defaultTargetLang?: string;
  maxCharacters?: number;
}

/**
 * Language Selector component props
 */
export interface LanguageSelectorProps {
  sourceLang: string;
  targetLang: string;
  onSourceLangChange: (lang: string) => void;
  onTargetLangChange: (lang: string) => void;
  onSwapLanguages: () => void;
}

/**
 * Translation Panel component props
 */
export interface TranslationPanelProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder: string;
  readOnly?: boolean;
  maxCharacters?: number;
  showCharCount?: boolean;
  showCopyButton?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onCopy?: () => void;
}

/**
 * Translation state interface
 */
export interface TranslationState {
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  isTranslating: boolean;
  error: string | null;
}
