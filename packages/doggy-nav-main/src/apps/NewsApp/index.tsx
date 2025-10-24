import { useEffect, useMemo, useState } from 'react';
import axios from '@/utils/axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { motion } from 'framer-motion';
import { MessageSquare, ThumbsUp } from 'lucide-react';
import Image from 'next/image';

dayjs.extend(relativeTime);

type NewsItem = {
  id: string;
  title: string;
  url: string | null;
  domain: string | null;
  points?: number;
  comments?: number;
  author?: string;
  createdAt?: string;
};

export default function NewsApp() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await axios.get('/api/news');
        if (!canceled) setItems(((resp as any)?.items || []) as NewsItem[]);
      } catch (e: any) {
        if (!canceled) setError(e?.message || 'Failed to load news');
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  const variants = useMemo(
    () => ({ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }),
    []
  );

  return (
    <div className="w-full h-full overflow-auto" style={{ background: 'transparent' }}>
      {error && (
        <div
          className="m-3 p-3 rounded-lg border text-sm"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-destructive)' }}
        >
          {error}
        </div>
      )}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl border animate-pulse"
              style={{
                background: 'color-mix(in srgb, var(--color-muted) 15%, transparent)',
                borderColor: 'var(--color-border)',
              }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {items.map((it, idx) => (
            <motion.a
              href={it.url || '#'}
              target={it.url ? '_blank' : undefined}
              rel="noopener noreferrer"
              key={it.id}
              className="group block rounded-xl border p-4 hover:shadow-lg transition-shadow"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
              initial="hidden"
              animate="visible"
              transition={{ delay: idx * 0.03 }}
              variants={variants}
            >
              <div className="flex items-start gap-3">
                {/* Favicon or placeholder */}
                <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-theme-muted">
                  {it.domain ? (
                    // Using duckduckgo icons for favicons
                    <Image
                      src={`https://icons.duckduckgo.com/ip3/${it.domain}.ico`}
                      alt=""
                      className="w-6 h-6"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      N/A
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-medium text-base group-hover:underline"
                    style={{ color: 'var(--color-foreground)' }}
                  >
                    {it.title}
                  </div>
                  <div
                    className="mt-1 flex items-center gap-2 text-xs"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    {it.domain && (
                      <span
                        className="px-2 py-0.5 rounded-full border"
                        style={{ borderColor: 'var(--color-border)' }}
                      >
                        {it.domain}
                      </span>
                    )}
                    {it.createdAt && <span>{dayjs(it.createdAt).fromNow()}</span>}
                  </div>
                  <div
                    className="mt-2 flex items-center gap-4 text-xs"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    {typeof it.points === 'number' && (
                      <span className="inline-flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5" /> {it.points}
                      </span>
                    )}
                    {typeof it.comments === 'number' && (
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> {it.comments}
                      </span>
                    )}
                    {it.author && <span>by {it.author}</span>}
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </div>
  );
}
