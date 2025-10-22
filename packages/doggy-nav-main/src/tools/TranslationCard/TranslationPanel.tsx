import { memo, useState } from 'react';
import { Spin, Button, Message } from '@arco-design/web-react';
import { IconCopy, IconCheck } from '@arco-design/web-react/icon';
import { TranslationPanelProps } from './types';

/**
 * Translation Panel Component
 * Reusable panel for both input and output areas
 */
function TranslationPanel({
  value,
  onChange,
  placeholder,
  readOnly = false,
  maxCharacters = 5000,
  showCharCount = false,
  showCopyButton = false,
  isLoading = false,
  error = null,
  onCopy,
}: TranslationPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value || !onCopy) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      Message.success({
        content: '复制成功！',
        duration: 2000,
      });
      onCopy();

      // Reset copied state after animation
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      Message.error({
        content: '复制失败，请重试',
        duration: 2000,
      });
    }
  };

  const charCount = value.length;
  const isOverLimit = charCount > maxCharacters;

  return (
    <div className="flex flex-col h-full">
      {/* Textarea */}
      <div className="relative flex-1">
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          maxLength={!readOnly ? maxCharacters : undefined}
          className="w-full h-full min-h-[200px] p-4 rounded-lg border resize-none focus:outline-none focus:ring-2 transition-all"
          style={{
            backgroundColor: readOnly
              ? 'color-mix(in srgb, var(--color-muted) 50%, transparent)'
              : 'var(--color-background)',
            borderColor: isOverLimit
              ? 'var(--color-destructive)'
              : 'var(--color-border)',
            color: 'var(--color-foreground)',
            fontFamily: 'inherit',
            fontSize: '0.9375rem',
            lineHeight: '1.6',
          }}
          aria-label={readOnly ? '翻译结果' : '输入待翻译的文本'}
          aria-describedby={showCharCount ? 'char-count' : undefined}
          aria-invalid={error ? 'true' : 'false'}
        />

        {/* Loading Indicator */}
        {isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-lg"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-background) 80%, transparent)',
              backdropFilter: 'blur(2px)',
            }}
          >
            <Spin size={32} />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="absolute inset-0 flex items-center justify-center p-4 rounded-lg"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-background) 90%, transparent)',
            }}
          >
            <div
              className="text-center p-4 rounded-lg"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-destructive) 10%, transparent)',
                color: 'var(--color-destructive)',
              }}
            >
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 px-1">
        {/* Character Count */}
        {showCharCount && (
          <div
            id="char-count"
            className="text-sm"
            style={{
              color: isOverLimit
                ? 'var(--color-destructive)'
                : 'var(--color-muted-foreground)',
            }}
          >
            {charCount} / {maxCharacters}
          </div>
        )}

        {/* Copy Button */}
        {showCopyButton && (
          <Button
            type="text"
            icon={copied ? <IconCheck /> : <IconCopy />}
            onClick={handleCopy}
            disabled={!value || isLoading}
            className={`ml-auto ${copied ? 'animate-[check-bounce_0.3s_ease-in-out]' : ''}`}
            aria-label="复制翻译结果"
            aria-pressed={copied ? 'true' : 'false'}
            style={{
              color: copied ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
            }}
          >
            {copied ? '已复制' : '复制'}
          </Button>
        )}

        {/* Spacer for input panel */}
        {!showCharCount && !showCopyButton && <div />}
      </div>
    </div>
  );
}

export default memo(TranslationPanel);
