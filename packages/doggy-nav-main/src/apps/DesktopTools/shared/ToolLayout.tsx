import type { ReactNode } from 'react';

type ToolLayoutProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function ToolLayout({
  eyebrow,
  title,
  description,
  actions,
  children,
}: ToolLayoutProps) {
  return (
    <div className="flex h-full w-full flex-col" style={{ color: 'var(--color-foreground)' }}>
      <div
        className="border-b px-5 py-4"
        style={{
          borderColor: 'var(--color-border)',
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--color-card) 92%, white 8%) 0%, var(--color-card) 100%)',
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            {eyebrow ? (
              <div
                className="mb-1 text-[11px] font-medium uppercase tracking-[0.24em]"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                {eyebrow}
              </div>
            ) : null}
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              {description}
            </p>
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </div>
      <div className="min-h-0 flex-1 p-5">{children}</div>
    </div>
  );
}
