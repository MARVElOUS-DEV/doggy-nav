import React, { useMemo, useState } from 'react';

type IframeContainerProps = {
  src: string;
  title?: string;
  allow?: string;
  sandbox?: string;
  referrerPolicy?: React.IframeHTMLAttributes<HTMLIFrameElement>['referrerPolicy'];
  allowFullScreen?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

// Reusable iframe container for loading external apps within a desktop window.
// Uses Tailwind utilities and design-system CSS variables; no hardcoded colors.
export default function IframeContainer({
  src,
  title = 'External App',
  allow = 'fullscreen; autoplay; clipboard-write',
  sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups',
  referrerPolicy = 'no-referrer',
  allowFullScreen = true,
  className,
  style,
}: IframeContainerProps) {
  const [loading, setLoading] = useState(true);
  const key = useMemo(() => src, [src]);

  return (
    <div className={['relative w-full h-full', className].filter(Boolean).join(' ')} style={style}>
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="glass-light dark:glass-dark border rounded-lg px-3 py-2 text-xs flex items-center gap-2"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}
          >
            <span className="inline-block h-4 w-4 border-2 border-theme-border border-t-transparent rounded-full animate-spin" />
            <span>Loading…</span>
          </div>
        </div>
      )}

      <iframe
        key={key}
        src={src}
        title={title}
        className="w-full h-full rounded-b-2xl bg-transparent"
        allow={allow}
        sandbox={sandbox}
        referrerPolicy={referrerPolicy}
        allowFullScreen={allowFullScreen}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
