import { useState, useEffect, useCallback, useRef, createElement } from 'react';
import api from '@/utils/axios';
import axios from 'axios';
import { TranslationCardProps } from './types';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import LanguageSelector from './LanguageSelector';
import TranslationPanel from './TranslationPanel';

/**
 * Translation Card Tool
 * A beautiful card-style translation tool with left-right panel layout
 */
export default function TranslationCard({
  className = '',
  defaultSourceLang = 'zh',
  defaultTargetLang = 'en',
  maxCharacters = 5000,
}: TranslationCardProps) {
  // State management
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Language preferences with localStorage persistence
  const [sourceLang, setSourceLang] = useLocalStorage('translation-source-lang', defaultSourceLang);
  const [targetLang, setTargetLang] = useLocalStorage('translation-target-lang', defaultTargetLang);

  // Debounce source text to avoid excessive API calls
  const debouncedSourceText = useDebounce(sourceText, 800);

  // AbortController ref for canceling pending requests
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Perform translation API call
   */
  const translateText = useCallback(async (text: string, source: string, target: string) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsTranslating(true);
    setError(null);

    try {
      const data = await api.post(
        '/api/translate',
        {
          text,
          sourceLang: source,
          targetLang: target,
        },
        {
          signal: controller.signal,
        }
      );

      setTranslatedText((data as any)?.translatedText || '');
    } catch (err: unknown) {
      // Ignore abort/cancel errors
      if (axios.isCancel(err) || (typeof err === 'object' && (err as any)?.code === 'ERR_CANCELED')) {
        return;
      }

      console.error('Translation error:', err);

      if (axios.isAxiosError(err)) {
        const msg = (err.response as any)?.data?.message || err.message || '翻译失败，请重试';
        setError(msg);
      } else if (err instanceof Error) {
        setError(err.message || '发生未知错误，请重试');
      } else {
        setError('发生未知错误，请重试');
      }
    } finally {
      setIsTranslating(false);
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Handle language swap
   */
  const handleSwapLanguages = useCallback(() => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    // Also swap the text
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  }, [sourceLang, targetLang, sourceText, translatedText, setSourceLang, setTargetLang]);

  /**
   * Trigger translation when debounced text or languages change
   */
  useEffect(() => {
    // Clear output if input is empty
    if (!debouncedSourceText.trim()) {
      setTranslatedText('');
      setError(null);
      return;
    }

    // Perform translation
    translateText(debouncedSourceText, sourceLang, targetLang);
  }, [debouncedSourceText, sourceLang, targetLang, translateText]);

  /**
   * Cleanup: cancel pending requests on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Workaround for React 19 RC type mismatches in this package
  const LanguageSelectorAny = LanguageSelector as any;
  const TranslationPanelAny = TranslationPanel as any;

  return (
    <div
      className={`rounded-2xl shadow-xl border overflow-hidden transition-all duration-300 ${className}`}
      style={{
        backgroundColor: 'var(--color-card)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-card-foreground)',
      }}
    >
      {/* Header with Language Selectors */}
      <div
        className="p-6 border-b"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'color-mix(in srgb, var(--color-muted) 30%, transparent)',
        }}
      >
        {createElement(LanguageSelectorAny, {
          sourceLang,
          targetLang,
          onSourceLangChange: setSourceLang,
          onTargetLangChange: setTargetLang,
          onSwapLanguages: handleSwapLanguages,
        })}
      </div>

      {/* Translation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* Input Panel */}
        <div
          className="p-6 border-b md:border-b-0 md:border-r"
          style={{
            borderColor: 'var(--color-border)',
          }}
        >
          {createElement(TranslationPanelAny, {
            value: sourceText,
            onChange: setSourceText,
            placeholder: '输入需要翻译的文本...',
            maxCharacters,
            showCharCount: true,
          })}
        </div>

        {/* Output Panel */}
        <div className="p-6">
          {createElement(TranslationPanelAny, {
            value: translatedText,
            placeholder: '翻译结果将显示在这里...',
            readOnly: true,
            showCopyButton: true,
            isLoading: isTranslating,
            error,
            onCopy: () => {},
          })}
        </div>
      </div>
    </div>
  );
}
