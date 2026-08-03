import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ChevronRight, Megaphone, X } from 'lucide-react';
import api from '@/utils/api';
import type { Affiche as AfficheItem } from '@/types';

// Define the announcement type
type Announcement = {
  id: string;
  text: string;
  link?: {
    href: string;
    text: string;
    target?: '_blank' | '_self';
  };
};

export default function Affiche() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [show, setShow] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-rotate announcements
  const clearTimers = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  };

  const startAutoRotate = () => {
    if (announcements.length <= 1) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % announcements.length);
    }, 5000);
  };

  const scheduleAutoRotate = () => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = setTimeout(() => {
      startAutoRotate();
    }, 10000);
  };

  useEffect(() => {
    if (announcements.length <= 1) return;

    startAutoRotate();

    return () => {
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcements.length]);

  useEffect(() => {
    let cancelled = false;

    const fetchAffiches = async () => {
      try {
        const items: AfficheItem[] = await api.getActiveAffiches();
        if (cancelled) return;
        const mapped: Announcement[] = (items || []).map((item) => ({
          id: item.id,
          text: item.text,
          link:
            item.linkHref && (item.linkText || item.linkHref)
              ? {
                  href: item.linkHref,
                  text: item.linkText || item.linkHref,
                  target: (item.linkTarget as '_blank' | '_self' | undefined) || '_self',
                }
              : undefined,
        }));
        setAnnouncements(mapped);
        setCurrentIndex(0);
      } catch (err) {
        // Fallback: hide banner on error
        // eslint-disable-next-line no-console
        console.error('Failed to load affiche announcements', err);
      }
    };

    fetchAffiches();

    return () => {
      cancelled = true;
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle manual navigation
  const goToNext = () => {
    clearTimers();
    setCurrentIndex((prevIndex) => (prevIndex + 1) % announcements.length);
    scheduleAutoRotate();
  };

  const goToPrev = () => {
    clearTimers();
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? announcements.length - 1 : prevIndex - 1));
    scheduleAutoRotate();
  };

  if (!show || announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-theme-border bg-theme-card shadow-[0_14px_40px_rgba(15,23,42,0.08)]"
      aria-label="Announcements"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute -left-12 -top-16 h-40 w-40 rounded-full"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 right-20 h-36 w-36 rounded-full"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 7%, transparent)' }}
      />

      <div className="relative flex min-h-[88px] items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6">
        <div
          className="flex h-11 w-11 flex-none items-center justify-center rounded-xl text-theme-primary shadow-sm sm:h-12 sm:w-12"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, var(--color-card))',
            border: '1px solid color-mix(in srgb, var(--color-primary) 20%, var(--color-border))',
          }}
        >
          <Megaphone className="h-5 w-5" aria-hidden="true" />
        </div>

        <div key={currentAnnouncement.id} className="min-w-0 flex-1 animate-fade-in-simple">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-theme-primary">
              Announcement
            </span>
            {announcements.length > 1 && (
              <span className="text-[10px] tabular-nums text-theme-muted-foreground">
                {String(currentIndex + 1).padStart(2, '0')} /{' '}
                {String(announcements.length).padStart(2, '0')}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-6 text-theme-foreground sm:text-[15px]">
            <span className="break-words">{currentAnnouncement.text}</span>
            {currentAnnouncement.link && (
              <Link
                className="inline-flex items-center gap-1 font-semibold text-theme-primary transition-opacity hover:opacity-75 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary/60"
                href={currentAnnouncement.link.href}
                target={currentAnnouncement.link.target || '_self'}
                rel={
                  currentAnnouncement.link.target === '_blank' ? 'noopener noreferrer' : undefined
                }
              >
                {currentAnnouncement.link.text}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-none items-center gap-1">
          {announcements.length > 1 && (
            <div className="mr-1 flex items-center rounded-full border border-theme-border bg-theme-background p-1 shadow-sm">
              <button
                type="button"
                onClick={goToPrev}
                className="flex h-7 w-7 items-center justify-center rounded-full text-theme-muted-foreground transition-colors hover:bg-theme-muted hover:text-theme-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary/60"
                aria-label="Previous announcement"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={goToNext}
                className="flex h-7 w-7 items-center justify-center rounded-full text-theme-muted-foreground transition-colors hover:bg-theme-muted hover:text-theme-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary/60"
                aria-label="Next announcement"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShow(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-theme-muted-foreground transition-colors hover:bg-theme-muted hover:text-theme-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary/60"
            aria-label="Hide announcements"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {announcements.length > 1 && (
        <div
          className="absolute inset-x-0 bottom-0 flex h-0.5 gap-1 bg-theme-muted"
          aria-hidden="true"
        >
          {announcements.map((announcement, index) => (
            <span
              key={announcement.id}
              className={`h-full flex-1 transition-colors duration-300 ${
                index === currentIndex ? 'bg-theme-primary' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
