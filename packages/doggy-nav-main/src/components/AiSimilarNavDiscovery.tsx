import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Message } from '@arco-design/web-react';
import { ArrowUpRight, Check, Circle, Clock3, RefreshCw, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/utils/api';
import type { NavItem } from '@/types';
import DoggyImage from '@/components/DoggyImage';
import { getAiDiscoveryFailure, type AiDiscoveryFailure } from '@/utils/aiDiscoveryError';

type AiResult = {
  headline: string;
  summary: string;
  recommendations: Array<{
    name: string;
    url: string;
    description: string;
    reason: string;
    bestFor: string;
    match: number;
    logo?: string;
  }>;
};

export default function AiSimilarNavDiscovery({
  source,
  isAuthenticated,
}: {
  source: NavItem;
  isAuthenticated: boolean;
}) {
  const { t } = useTranslation('translation');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<AiResult | null>(null);
  const [failure, setFailure] = useState<AiDiscoveryFailure | null>(null);

  useEffect(() => {
    if (!loading) return;
    const startedAt = Date.now();
    const timer = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
      1000
    );
    return () => window.clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    if (!open) return;
    const content = document.getElementById('doggy-content-area');
    const previousOverflow = content?.style.overflow;
    if (content) content.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      if (content) content.style.overflow = previousOverflow ?? '';
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
    setResult(null);
    setFailure(null);
  }, [source.id]);

  const discover = async () => {
    if (!isAuthenticated) {
      Message.warning(t('please_login_for_ai_discovery'));
      return;
    }
    setOpen(true);
    setLoading(true);
    setElapsed(0);
    setResult(null);
    setFailure(null);
    try {
      const response = await api.getAiSimilarNav({
        source: { name: source.name, url: source.href },
      });
      if (response.recommendations.length === 0) {
        setFailure('empty');
        return;
      }
      setResult(response);
    } catch (error) {
      setFailure(getAiDiscoveryFailure(error));
    } finally {
      setLoading(false);
    }
  };

  const activeStep = elapsed < 4 ? 0 : elapsed < 9 ? 1 : 2;
  const steps = [
    t('ai_discovery_step_understand'),
    t('ai_discovery_step_compare'),
    t('ai_discovery_step_curate'),
  ];

  return (
    <>
      <button
        type="button"
        onClick={discover}
        className="group inline-flex cursor-pointer items-center rounded-xl border border-theme-border bg-theme-background px-5 py-3 font-semibold text-theme-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-theme-primary hover:shadow-md"
      >
        <Sparkles
          size={17}
          className="mr-2 text-theme-primary transition-transform group-hover:rotate-12"
        />
        {t('ai_find_similar')}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[100] overflow-hidden p-3 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label={t('ai_discovery_close')}
              onClick={() => setOpen(false)}
              className="fixed inset-0 h-full w-full cursor-default"
              style={{
                background:
                  'radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--color-primary) 24%, transparent), rgba(10, 15, 12, .78))',
                backdropFilter: 'blur(18px)',
              }}
            />

            <div className="relative mx-auto flex h-full min-h-0 max-w-6xl items-center justify-center">
              <motion.section
                role="dialog"
                aria-modal="true"
                aria-labelledby="ai-discovery-title"
                initial={{ opacity: 0, y: 28, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                className="relative my-auto flex max-h-full w-full flex-col overflow-hidden rounded-[32px] border border-theme-border bg-theme-background shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div
                  className="sticky top-0 z-10 flex items-center justify-between border-b border-theme-border px-5 py-4 backdrop-blur-xl sm:px-8"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-background) 88%, transparent)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-theme-primary text-theme-primary-foreground">
                      <Sparkles size={17} />
                    </span>
                    <div>
                      <p className="m-0 text-xs font-bold uppercase tracking-[0.18em] text-theme-primary">
                        {t('ai_discovery_eyebrow')}
                      </p>
                      <p className="m-0 mt-0.5 text-xs text-theme-muted-foreground">
                        {t('ai_discovery_powered_by')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label={t('ai_discovery_close')}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-theme-border bg-theme-color text-theme-muted-foreground transition-colors hover:text-theme-foreground"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {loading ? (
                    <div className="grid min-h-[560px] items-center gap-10 px-6 py-12 lg:grid-cols-[.9fr_1.1fr] lg:px-16">
                      <div className="relative mx-auto flex h-56 w-56 items-center justify-center">
                        <div className="absolute inset-0 animate-pulse rounded-full bg-theme-primary/10 motion-reduce:animate-none" />
                        <div className="absolute inset-7 animate-spin rounded-full border border-dashed border-theme-primary/50 motion-reduce:animate-none" />
                        <div className="absolute inset-14 rounded-full bg-theme-primary/15 blur-xl" />
                        <Sparkles className="relative text-theme-primary" size={54} />
                      </div>
                      <div>
                        <h2
                          id="ai-discovery-title"
                          className="m-0 text-3xl font-bold tracking-tight text-theme-foreground sm:text-4xl"
                        >
                          {t('ai_discovery_loading_title')}
                        </h2>
                        <p className="mt-3 max-w-xl text-base leading-relaxed text-theme-muted-foreground">
                          {t('ai_discovery_loading_description')}
                        </p>
                        <div className="mt-8 space-y-3" role="status" aria-live="polite">
                          {steps.map((step, index) => (
                            <div
                              key={step}
                              className="flex items-center gap-3 rounded-2xl border border-theme-border p-4 transition-colors"
                              style={{
                                backgroundColor:
                                  index === activeStep
                                    ? 'color-mix(in srgb, var(--color-primary) 10%, var(--color-card))'
                                    : 'var(--color-card)',
                              }}
                            >
                              {index < activeStep ? (
                                <Check size={18} className="text-theme-primary" />
                              ) : index === activeStep ? (
                                <span className="h-[18px] w-[18px] animate-pulse rounded-full border-[5px] border-theme-primary motion-reduce:animate-none" />
                              ) : (
                                <Circle size={18} className="text-theme-muted-foreground" />
                              )}
                              <span
                                className={
                                  index <= activeStep
                                    ? 'font-semibold text-theme-foreground'
                                    : 'text-theme-muted-foreground'
                                }
                              >
                                {step}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="mt-5 flex items-center gap-2 text-sm text-theme-muted-foreground">
                          <Clock3 size={15} />
                          {t('ai_discovery_seconds', { count: elapsed })}
                        </p>
                      </div>
                    </div>
                  ) : failure ? (
                    <div className="flex min-h-[480px] flex-col items-center justify-center px-6 py-16 text-center">
                      <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-theme-color text-theme-primary">
                        <Sparkles size={32} />
                      </span>
                      <h2
                        id="ai-discovery-title"
                        className="mb-0 mt-7 text-3xl font-bold text-theme-foreground"
                      >
                        {t(`ai_discovery_error_${failure}_title`)}
                      </h2>
                      <p className="mt-3 max-w-md text-theme-muted-foreground">
                        {t(`ai_discovery_error_${failure}_description`)}
                      </p>
                      <button
                        type="button"
                        onClick={discover}
                        className="mt-7 inline-flex items-center rounded-xl bg-theme-primary px-5 py-3 font-semibold text-theme-primary-foreground"
                      >
                        <RefreshCw size={16} className="mr-2" />
                        {t('ai_discovery_retry')}
                      </button>
                    </div>
                  ) : result ? (
                    <div className="px-5 py-8 sm:px-8 sm:py-10">
                      <div className="mx-auto max-w-3xl text-center">
                        <h2
                          id="ai-discovery-title"
                          className="m-0 text-3xl font-bold tracking-tight text-theme-foreground sm:text-5xl"
                        >
                          {result.headline}
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-theme-muted-foreground sm:text-lg">
                          {result.summary}
                        </p>
                      </div>
                      <div className="mt-9 grid gap-4 md:grid-cols-2">
                        {result.recommendations.map(
                          ({ name, url, description, logo, reason, bestFor, match }, index) => (
                            <article
                              key={url}
                              className="group relative overflow-hidden rounded-3xl border border-theme-border bg-theme-color p-5 transition-all hover:-translate-y-1 hover:shadow-xl sm:p-6"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex min-w-0 items-center gap-4">
                                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-theme-border bg-theme-background shadow-sm">
                                    <DoggyImage
                                      logo={logo}
                                      name={name}
                                      width={36}
                                      height={36}
                                      className="h-9 w-9 rounded-lg object-contain"
                                    />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="m-0 text-xs font-bold uppercase tracking-widest text-theme-primary">
                                      #{String(index + 1).padStart(2, '0')}
                                    </p>
                                    <h3 className="m-0 mt-1 truncate text-xl font-bold text-theme-foreground">
                                      {name}
                                    </h3>
                                  </div>
                                </div>
                                <span className="shrink-0 rounded-full bg-theme-primary px-3 py-1 text-xs font-bold text-theme-primary-foreground">
                                  {t('ai_discovery_match', { count: match })}
                                </span>
                              </div>
                              <p className="mt-5 line-clamp-2 text-sm leading-relaxed text-theme-muted-foreground">
                                {description}
                              </p>
                              <div className="mt-5 rounded-2xl border border-theme-border bg-theme-background p-4">
                                <p className="m-0 text-sm font-medium leading-relaxed text-theme-foreground">
                                  {reason}
                                </p>
                                <p className="m-0 mt-2 text-xs font-semibold uppercase tracking-wide text-theme-primary">
                                  {t('ai_discovery_best_for', { value: bestFor })}
                                </p>
                              </div>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-5 inline-flex items-center font-semibold text-theme-primary"
                              >
                                {t('ai_discovery_open')}
                                <ArrowUpRight
                                  size={16}
                                  className="ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                />
                              </a>
                            </article>
                          )
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </motion.section>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
