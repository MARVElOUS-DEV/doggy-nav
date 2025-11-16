import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { IconCloseCircle } from '@arco-design/web-react/icon';
import { Link as ArcoLink } from '@arco-design/web-react';
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
      setCurrentIndex(prevIndex => (prevIndex + 1) % announcements.length);
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
    setCurrentIndex(prevIndex => (prevIndex + 1) % announcements.length);
    scheduleAutoRotate();
  };

  const goToPrev = () => {
    clearTimers();
    setCurrentIndex(prevIndex =>
      prevIndex === 0 ? announcements.length - 1 : prevIndex - 1
    );
    scheduleAutoRotate();
  };

  if (!show || announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];

  return (
    <div className="bg-theme-background border border-theme-border rounded-lg p-3 text-sm relative overflow-hidden shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between min-h-[40px] gap-2">
        <div className="flex items-center flex-1 w-full min-h-[24px]">
          <div className="flex items-center w-full">
            <span className="mr-2 text-theme-primary text-lg">📢</span>
            <div className="flex flex-wrap items-center flex-1 text-wrap break-words">
              <span className="mr-1">{currentAnnouncement.text}</span>
              {currentAnnouncement.link && (
                <Link
                  className="text-theme-primary hover:opacity-90 font-medium hover:underline whitespace-nowrap"
                  href={currentAnnouncement.link.href}
                  target={currentAnnouncement.link.target || '_self'}
                  rel={currentAnnouncement.link.target === '_blank' ? 'noopener noreferrer' : undefined}
                >
                  {currentAnnouncement.link.text}
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center space-x-1">
            {/* Navigation controls - hidden on small screens to save space */}
            {announcements.length > 1 && (
              <>
                <button
                  onClick={goToPrev}
                  className="text-theme-muted-foreground hover:text-theme-foreground p-1 rounded-full hover:bg-theme-muted transition-colors sm:hidden"
                  aria-label="Previous announcement"
                >
                  ‹
                </button>
                <div className="flex space-x-1 sm:hidden">
                  {announcements.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        clearTimers();
                        setCurrentIndex(index);
                        scheduleAutoRotate();
                      }}
                      className={`w-2 h-2 rounded-full ${
                        index === currentIndex ? 'bg-theme-primary' : ''
                      }`}
                      aria-label={`Go to announcement ${index + 1}`}
                    />
                  ))}
                </div>
                <button
                  onClick={goToNext}
                  className="text-theme-muted-foreground hover:text-theme-foreground p-1 rounded-full hover:bg-theme-muted transition-colors sm:hidden"
                  aria-label="Next announcement"
                >
                  ›
                </button>

                {/* Show full controls on larger screens */}
                <div className="hidden sm:flex items-center space-x-1">
                  <button
                    onClick={goToPrev}
                    className="text-theme-muted-foreground hover:text-theme-foreground p-1 rounded-full hover:bg-theme-muted transition-colors"
                    aria-label="Previous announcement"
                  >
                    ▲
                  </button>
                  <div className="flex space-x-1">
                    {announcements.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          clearTimers();
                          setCurrentIndex(index);
                          scheduleAutoRotate();
                        }}
                        className={`w-2 h-2 rounded-full ${
                          index === currentIndex ? 'bg-theme-primary' : ''
                        }`}
                        aria-label={`Go to announcement ${index + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={goToNext}
                    className="text-theme-muted-foreground hover:text-theme-foreground p-1 rounded-full hover:bg-theme-muted transition-colors"
                    aria-label="Next announcement"
                  >
                    ▼
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Close button */}
          <ArcoLink
            icon={<IconCloseCircle className="text-theme-muted-foreground hover:text-theme-foreground ml-1"/>}
            onClick={() => setShow(false)}
            className="ml-1"
            aria-label="Hide announcements"
          />
        </div>
      </div>

      {/* Progress indicator - full width on mobile */}
      {announcements.length > 1 && (
        <div className="mt-2 sm:mt-2">
          <div className="w-full bg-theme-muted rounded-full h-1">
            <div
              className="bg-theme-primary h-1 rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${(1 / announcements.length) * 100}%`,
                marginLeft: `${(currentIndex / announcements.length) * 100}%`
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}