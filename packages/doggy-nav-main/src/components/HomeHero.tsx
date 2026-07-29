import { Carousel } from '@arco-design/web-react';
import type { CarouselHandle } from '@arco-design/web-react/es/Carousel/interface';
import Link from 'next/link';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useSiteSettings } from '@/context/SiteSettingsContext';

interface HomeHeroProps {
  isAuthenticated: boolean;
  onSearch: () => void;
  onTryDesktop: () => void;
}

export default function HomeHero({ isAuthenticated, onSearch, onTryDesktop }: HomeHeroProps) {
  const { t } = useTranslation('translation');
  const { siteSettings } = useSiteSettings();
  const carousel = useRef<CarouselHandle>(null);
  const root = useRef<HTMLDivElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const slides = useMemo(
    () =>
      (siteSettings?.heroSlides || [])
        .filter((slide) => slide.active)
        .toSorted((a, b) => a.order - b.order),
    [siteSettings?.heroSlides]
  );
  const count = slides.length + 1;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    root.current?.querySelectorAll('video').forEach((video) => {
      const shouldPlay = !reducedMotion && Number(video.dataset.slideIndex) === activeIndex;
      if (shouldPlay) {
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    });
  }, [activeIndex, reducedMotion]);

  const goTo = (index: number) => {
    const target = (index + count) % count;
    carousel.current?.goto({
      index: target,
      isNegative: target < activeIndex,
      isManual: true,
      resetAutoPlayInterval: true,
    });
  };

  const startSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    swipeStart.current = { x: event.clientX, y: event.clientY };
  };

  const finishSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    suppressClick.current = true;
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 0);
    goTo(activeIndex + (deltaX < 0 ? 1 : -1));
  };

  return (
    <div
      ref={root}
      className="relative"
      style={{ touchAction: 'pan-y' }}
      onPointerDown={startSwipe}
      onPointerUp={finishSwipe}
      onPointerCancel={() => {
        swipeStart.current = null;
      }}
      onClickCapture={(event) => {
        if (!suppressClick.current) return;
        event.preventDefault();
        event.stopPropagation();
      }}
      onDragStart={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          goTo(activeIndex + (event.key === 'ArrowLeft' ? -1 : 1));
        }
      }}
    >
      <Carousel
        carousel={carousel as RefObject<CarouselHandle>}
        className="h-[320px] md:h-[300px]"
        autoPlay={reducedMotion ? false : { interval: 5000, hoverToPause: true }}
        miniRender
        showArrow="never"
        indicatorType="never"
        onChange={setActiveIndex}
      >
        <div>
          <div className="hero-gradient h-[320px] p-8 text-white relative md:h-[300px]">
            <div className="hero-slide-content max-w-3xl mx-auto text-center relative z-10">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {t('curated_website_navigation')}
              </h1>
              <p className="text-xl opacity-90 mb-8">{t('discover_quality_websites')}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={onTryDesktop}
                    className="cursor-pointer bg-theme-background text-theme-primary hover:bg-theme-muted font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    {t('try_goto_desktop')}
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="bg-theme-background text-theme-primary hover:bg-theme-muted font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    {t('login_explore')}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={onSearch}
                  className="cursor-pointer bg-transparent border-2 border-theme-primary hover:bg-theme-background hover:text-theme-primary font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                >
                  {t('search_websites')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {slides.map((slide, index) => (
          <div key={`${slide.order}-${slide.title}-${slide.mediaUrl || ''}`}>
            <div className="hero-gradient relative h-[320px] overflow-hidden text-white md:h-[300px]">
              {slide.mediaType === 'image' && slide.mediaUrl ? (
                // External admin-managed URLs cannot use Next Image without a fixed host allowlist.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slide.mediaUrl}
                  alt=""
                  className={`absolute inset-0 h-full w-full ${
                    slide.mediaFit === 'contain' ? 'object-contain' : 'object-cover'
                  }`}
                />
              ) : null}
              {slide.mediaType === 'video' && slide.mediaUrl ? (
                <video
                  src={slide.mediaUrl}
                  data-slide-index={index + 1}
                  className={`absolute inset-0 h-full w-full ${
                    slide.mediaFit === 'contain' ? 'object-contain' : 'object-cover'
                  }`}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/5" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/15" />
              <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-[#ffffff12] blur-3xl" />
              <div className="hero-slide-content relative z-10 flex h-full items-end px-6 pb-12 pt-8 sm:px-10 md:items-center md:px-14 md:pb-10 lg:px-16">
                <div className="max-w-2xl text-left">
                  <div
                    aria-hidden="true"
                    className="mb-3 flex items-center gap-3 text-xs font-semibold tracking-[0.3em] text-[#ffffffb3]"
                  >
                    <span>{String(index + 2).padStart(2, '0')}</span>
                    <span className="h-px w-12 bg-[#ffffff8c]" />
                  </div>
                  <h2 className="line-clamp-2 max-w-xl text-3xl font-bold leading-tight tracking-tight text-[#fff] drop-shadow-lg md:text-5xl">
                    {slide.title}
                  </h2>
                  {slide.description ? (
                    <p className="mt-3 line-clamp-2 max-w-xl text-base leading-relaxed text-[#ffffffcc] drop-shadow md:text-lg">
                      {slide.description}
                    </p>
                  ) : null}
                  {slide.ctaLabel && slide.ctaHref ? (
                    <a
                      href={slide.ctaHref}
                      className="hero-slide-cta group mt-5 inline-flex items-center gap-3 rounded-full border px-5 py-2.5 text-sm font-semibold shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-md transition-all duration-300"
                    >
                      {slide.ctaLabel}
                      <span
                        aria-hidden="true"
                        className="text-base transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      >
                        ↗
                      </span>
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ))}
      </Carousel>

      {count > 1 ? (
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {Array.from({ length: count }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to hero slide ${index + 1}`}
              aria-current={activeIndex === index ? 'true' : undefined}
              onClick={() => goTo(index)}
              className={`h-2.5 w-2.5 rounded-full ${
                activeIndex === index ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
