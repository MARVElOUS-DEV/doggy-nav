import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export function LoadingSpinner({ className = 'h-12 w-12' }: { className?: string }) {
  return (
    <span
      className={`block animate-spin rounded-full border-b-2 motion-reduce:animate-none ${className}`}
      style={{
        borderColor: 'color-mix(in srgb, var(--color-primary) 70%, transparent)',
        borderTopColor: 'transparent',
      }}
      aria-hidden="true"
    />
  );
}

export function LoadingIndicator({
  className = '',
  label,
  description,
  spinnerClassName,
}: {
  className?: string;
  label?: ReactNode;
  description?: ReactNode;
  spinnerClassName?: string;
}) {
  const { t } = useTranslation('translation');
  const resolvedLabel = label === undefined ? t('loading') : label;

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="text-center">
        <LoadingSpinner
          className={`mx-auto ${resolvedLabel ? 'mb-4' : ''} ${spinnerClassName ?? 'h-12 w-12'}`}
        />
        {resolvedLabel ? (
          <p className="text-theme-muted-foreground transition-colors">{resolvedLabel}</p>
        ) : null}
        {description ? (
          <p className="mt-2 text-theme-muted-foreground transition-colors">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function PageLoading() {
  return (
    <LoadingIndicator className="fixed inset-0 z-[1000] min-h-screen bg-theme-background" />
  );
}
