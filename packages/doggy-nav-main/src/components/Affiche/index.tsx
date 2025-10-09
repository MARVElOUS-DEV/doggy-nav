import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { IconCloseCircle } from '@arco-design/web-react/icon';
import { Link as ArcoLink } from '@arco-design/web-react';

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
  const [show, setShow] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Announcement data - can be fetched from API in the future
  const announcements: Announcement[] = [
    {
      id: 'suggest',
      text: '如果您有建议，请',
      link: {
        href: 'https://github.com/MARVElOUS-DEV/doggy-nav',
        text: '前往提交',
        target: '_blank'
      },
    },
    {
      id: 'issue',
      text: '支持提交网站带个人信息了，欢迎大家提交网站',
      link: {
        href: '/recommend',
        text: '去提交'
      },
    },
    {
      id: 'new-feature',
      text: '新功能上线：现在可以收藏喜欢的网站了！',
      link: {
        href: '/login',
        text: '立即体验'
      },
    }
  ];

  // Auto-rotate announcements
  useEffect(() => {
    if (announcements.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % announcements.length);
    }, 5000); // Change every 5 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [announcements.length]);

  // Handle manual navigation
  const goToNext = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setCurrentIndex(prevIndex => (prevIndex + 1) % announcements.length);
    // Reset auto-rotate after manual interaction
    setTimeout(() => {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % announcements.length);
      }, 5000);
    }, 10000); // Wait 10 seconds before resuming auto-rotate
  };

  const goToPrev = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setCurrentIndex(prevIndex =>
      prevIndex === 0 ? announcements.length - 1 : prevIndex - 1
    );
    // Reset auto-rotate after manual interaction
    setTimeout(() => {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % announcements.length);
      }, 5000);
    }, 10000); // Wait 10 seconds before resuming auto-rotate
  };

  if (!show || announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];

  return (
    <div className="bg-theme-card border border-theme-border rounded-lg p-3 text-sm relative overflow-hidden shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between min-h-[40px] gap-2">
        <div className="flex items-center flex-1 w-full min-h-[24px]">
          <div className="flex items-center w-full">
            <span className="mr-2 text-theme-primary text-lg">📢</span>
            <span className="mr-2 flex-1 text-wrap break-words">{currentAnnouncement.text}</span>
            {currentAnnouncement.link && (
              <Link
                className="text-theme-primary hover:opacity-90 font-medium hover:underline whitespace-nowrap ml-1"
                href={currentAnnouncement.link.href}
                target={currentAnnouncement.link.target || '_self'}
                rel={currentAnnouncement.link.target === '_blank' ? 'noopener noreferrer' : undefined}
              >
                {currentAnnouncement.link.text}
              </Link>
            )}
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
                        if (intervalRef.current) clearInterval(intervalRef.current);
                        setCurrentIndex(index);
                        // Resume auto-rotate after a delay
                        setTimeout(() => {
                          intervalRef.current = setInterval(() => {
                            setCurrentIndex(prevIndex => (prevIndex + 1) % announcements.length);
                          }, 5000);
                        }, 10000);
                      }}
                      className={`w-2 h-2 rounded-full ${
                        index === currentIndex ? 'bg-theme-primary' : 'bg-theme-border'
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
                          if (intervalRef.current) clearInterval(intervalRef.current);
                          setCurrentIndex(index);
                          // Resume auto-rotate after a delay
                          setTimeout(() => {
                            intervalRef.current = setInterval(() => {
                              setCurrentIndex(prevIndex => (prevIndex + 1) % announcements.length);
                            }, 5000);
                          }, 10000);
                        }}
                        className={`w-2 h-2 rounded-full ${
                          index === currentIndex ? 'bg-theme-primary' : 'bg-theme-border'
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