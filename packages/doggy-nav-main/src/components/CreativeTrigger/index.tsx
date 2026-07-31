import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useAnimation, useReducedMotion, type PanInfo } from 'framer-motion';
import { Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isCreativeTriggerGestureComplete, type CreativeTriggerVariant } from '@/creativeTrigger';

export type CreativeTriggerProps = {
  variant: CreativeTriggerVariant;
  onActivate: () => void | Promise<void>;
  hintRequest: number;
  ariaLabel: string;
};

type TriggerProps = Pick<CreativeTriggerProps, 'onActivate' | 'ariaLabel'> & {
  showHint: boolean;
};

function useActivate(onActivate: CreativeTriggerProps['onActivate']) {
  const activating = useRef(false);

  return useCallback(
    async (before?: () => Promise<unknown>) => {
      if (activating.current) return;
      activating.current = true;
      try {
        await before?.();
        await onActivate();
      } catch (error) {
        console.error('Creative trigger activation failed:', error);
      } finally {
        activating.current = false;
      }
    },
    [onActivate]
  );
}

function keyboardClick(event: React.MouseEvent<HTMLButtonElement>, activate: () => void) {
  if (event.detail === 0) activate();
}

const BULB_WIDTH = 48;
const BASE_ROPE_LENGTH = 100;
const ROPE_ORIGIN_RIGHT = 32;
const ROPE_VIRTUAL_LENGTH = BASE_ROPE_LENGTH + BULB_WIDTH / 2;

function LightbulbRope({ onActivate, ariaLabel, showHint }: TriggerProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const activate = useActivate(onActivate);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const ropeRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const isActivatingRef = useRef(false);

  const finalBulbQuadrant = useMemo<undefined | 'lt' | 'rt' | 'lb' | 'rb'>(() => {
    if (dragOffset.x < 0 && dragOffset.y < 0) return 'lt';
    if (dragOffset.x < 0 && dragOffset.y > 0) return 'lb';
    if (dragOffset.x > 0 && dragOffset.y > 0) return 'rb';
    if (dragOffset.x > 0 && dragOffset.y < 0) return 'rt';
    return 'lt';
  }, [dragOffset.x, dragOffset.y]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => {
      isActivatingRef.current = false;
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchend', handleEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchend', handleEnd);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, dragOffset]);

  const isCrossingLine = dragOffset.x + startPosRef.current.x > windowWidth - ROPE_ORIGIN_RIGHT;
  const initSwayAngle = useMemo(() => {
    const x = windowWidth - ROPE_ORIGIN_RIGHT - startPosRef.current.x;
    return Math.asin(x / ROPE_VIRTUAL_LENGTH);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowWidth, isDragging]);

  const [swayAngle, ropeLength] = useMemo(() => {
    if (!isDragging) return [0, ROPE_VIRTUAL_LENGTH];

    let x = 0;
    let y = 0;
    if (finalBulbQuadrant === 'lt') {
      x = Math.sin(initSwayAngle) * ROPE_VIRTUAL_LENGTH + Math.abs(dragOffset.x);
      y = Math.cos(initSwayAngle) * ROPE_VIRTUAL_LENGTH - Math.abs(dragOffset.y);
    }
    if (finalBulbQuadrant === 'lb') {
      x = Math.sin(initSwayAngle) * ROPE_VIRTUAL_LENGTH + Math.abs(dragOffset.x);
      y = Math.cos(initSwayAngle) * ROPE_VIRTUAL_LENGTH + Math.abs(dragOffset.y);
    }
    if (finalBulbQuadrant === 'rb') {
      x =
        (isCrossingLine ? -1 : 1) * Math.sin(initSwayAngle) * ROPE_VIRTUAL_LENGTH -
        Math.abs(dragOffset.x);
      y = Math.cos(initSwayAngle) * ROPE_VIRTUAL_LENGTH + Math.abs(dragOffset.y);
    }
    if (finalBulbQuadrant === 'rt') {
      x =
        (isCrossingLine ? -1 : 1) * Math.sin(initSwayAngle) * ROPE_VIRTUAL_LENGTH -
        Math.abs(dragOffset.x);
      y = Math.cos(initSwayAngle) * ROPE_VIRTUAL_LENGTH - Math.abs(dragOffset.y);
    }
    return [Math.atan2(x, y), Math.sqrt(x ** 2 + y ** 2) + BULB_WIDTH / 2];
  }, [finalBulbQuadrant, dragOffset.x, initSwayAngle, dragOffset.y, isDragging, isCrossingLine]);

  const handleMouseDown = (event: React.MouseEvent) => {
    if (isActivatingRef.current) return;
    setIsDragging(true);
    startPosRef.current = { x: event.clientX, y: event.clientY };
    setDragOffset({ x: 0, y: 0 });
    event.preventDefault();
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    if (isActivatingRef.current) return;
    setIsDragging(true);
    startPosRef.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
    setDragOffset({ x: 0, y: 0 });
    event.preventDefault();
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || isActivatingRef.current) return;
    setDragOffset({
      x: clientX - startPosRef.current.x,
      y: clientY - startPosRef.current.y,
    });
  };

  const handleMouseMove = (event: MouseEvent) => handleMove(event.clientX, event.clientY);

  const handleTouchMove = (event: TouchEvent) => {
    if (event.touches.length > 0) {
      handleMove(event.touches[0].clientX, event.touches[0].clientY);
    }
  };

  const handleEnd = () => {
    if (!isDragging || isActivatingRef.current) return;
    setIsDragging(false);

    if (isCreativeTriggerGestureComplete('lightbulb-rope', dragOffset)) {
      isActivatingRef.current = true;
      void activate().finally(() => {
        isActivatingRef.current = false;
      });
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const bulbX = isDragging ? dragOffset.x : 0;
  const bulbY = isDragging ? dragOffset.y + BASE_ROPE_LENGTH : BASE_ROPE_LENGTH;
  const ropeAngleDeg = swayAngle * (180 / Math.PI);

  return (
    <div className="pointer-events-none fixed right-8 top-0 z-50">
      <div
        className={!isDragging && !reduceMotion ? 'animate-sway' : ''}
        style={{ transformOrigin: 'center top' }}
      >
        <div
          ref={ropeRef}
          className="absolute left-1/2 top-0 w-0.5 bg-gradient-to-b from-amber-200 to-amber-400"
          style={{
            height: `${ropeLength}px`,
            transform: `translateX(-50%) rotate(${ropeAngleDeg}deg)`,
            transformOrigin: 'top center',
            transition: isDragging ? 'none' : 'all 0.3s ease-out',
          }}
        >
          <div className="absolute left-1/2 top-1/4 h-8 w-1 -translate-x-1/2 rounded-full bg-amber-300/50" />
          <div className="absolute left-1/2 top-2/3 h-6 w-1 -translate-x-1/2 rounded-full bg-amber-300/50" />
        </div>

        <button
          type="button"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={(event) => keyboardClick(event, () => void activate())}
          aria-label={ariaLabel}
          className={`pointer-events-auto absolute left-1/2 top-0 flex h-12 w-12 cursor-grab touch-none items-center justify-center rounded-full border-2 border-amber-300 bg-gradient-to-br from-amber-200 to-amber-400 shadow-lg transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60 active:cursor-grabbing ${
            isDragging ? 'scale-110' : 'hover:scale-105'
          } ${
            !reduceMotion && isCreativeTriggerGestureComplete('lightbulb-rope', dragOffset)
              ? 'animate-pulse'
              : ''
          }`}
          style={{
            transformOrigin: 'top center',
            transform: `translate(calc(-50% + ${bulbX}px), ${bulbY}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out, scale 0.2s ease-out',
          }}
        >
          {!isDragging && showHint ? (
            <span
              className={`absolute -inset-2 rounded-full ring-4 ring-amber-300/60 ${
                reduceMotion ? '' : 'animate-pulse'
              }`}
            />
          ) : null}
          <span className="absolute left-3 top-2 h-3 w-3 rounded-full bg-white/60 blur-sm" />
          <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-100/80">
            <span className="h-3 w-3 rounded-full bg-amber-300" />
          </span>
          {dragOffset.y > 50 ? (
            <span
              className={`absolute inset-0 rounded-full bg-amber-300/30 blur-lg ${
                reduceMotion ? '' : 'animate-pulse'
              }`}
            />
          ) : null}
        </button>
      </div>

      {(isDragging && dragOffset.y > 30) || showHint ? (
        <p
          className="absolute whitespace-nowrap text-sm font-medium text-amber-700 animate-fade-in-simple"
          style={{
            top: `${(isDragging ? bulbY : BASE_ROPE_LENGTH) + 60}px`,
            left: '50%',
            transform: `translateX(calc(-50% + ${isDragging ? bulbX : 0}px))`,
            transition: 'all 0.1s ease-out',
          }}
        >
          {isDragging && isCreativeTriggerGestureComplete('lightbulb-rope', dragOffset)
            ? t('creative_trigger_lightbulb_release')
            : t('creative_trigger_lightbulb_instruction')}
        </p>
      ) : null}
    </div>
  );
}

function PaperPlane({ onActivate, ariaLabel, showHint }: TriggerProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const controls = useAnimation();
  const activate = useActivate(onActivate);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const ready = isCreativeTriggerGestureComplete('paper-plane', offset);

  const finish = async (info: PanInfo) => {
    setOffset({ x: 0, y: 0 });
    if (!isCreativeTriggerGestureComplete('paper-plane', info.offset)) return;
    await activate(
      reduceMotion
        ? undefined
        : async () => {
            await controls.start({
              x: -145,
              y: 125,
              scale: 0.2,
              opacity: 0,
              rotate: -25,
              transition: { duration: 0.38, ease: 'easeIn' },
            });
            controls.set({ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 });
          }
    );
  };

  return (
    <div className="pointer-events-none fixed bottom-24 right-0 z-50 h-44 w-48">
      <span
        className="absolute right-0 top-0 h-20 w-20 rounded-l-[2rem] border border-r-0 border-theme-border shadow-lg backdrop-blur transition-colors"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--color-card) 94%, var(--color-primary) 6%), color-mix(in srgb, var(--color-background) 88%, var(--color-primary) 12%))',
        }}
      />
      {showHint || offset.y > 10 ? (
        <span className="absolute bottom-3 left-3 h-10 w-10 rounded-full border-2 border-dashed border-theme-primary bg-theme-primary/30 opacity-70 shadow-[0_0_24px_color-mix(in_srgb,var(--color-primary)_35%,transparent)]" />
      ) : null}
      <motion.button
        type="button"
        drag
        dragConstraints={{ left: -120, right: 12, top: -12, bottom: 105 }}
        dragElastic={0.1}
        dragSnapToOrigin
        animate={controls}
        onDrag={(_, info) => setOffset(info.offset)}
        onDragEnd={(_, info) => void finish(info)}
        onClick={(event) => keyboardClick(event, () => void activate())}
        aria-label={ariaLabel}
        className={`pointer-events-auto absolute right-3 top-3 grid h-14 w-14 cursor-grab touch-none place-items-center rounded-2xl border border-theme-border bg-theme-card text-theme-primary shadow-md transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-theme-primary/20 active:cursor-grabbing ${
          ready ? 'ring-4 ring-theme-primary/60' : ''
        }`}
      >
        {showHint ? (
          <span className="absolute -inset-2 animate-pulse rounded-2xl ring-4 ring-theme-primary/60" />
        ) : null}
        <motion.span
          className="relative flex items-center"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, -3, 0, -2, 0],
                  y: [0, -1, 1, -1, 0],
                  rotate: [0, 3, -3, 2, 0],
                }
          }
          transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 1.6 }}
        >
          <Send style={{ transform: 'rotate(-135deg)' }} size={28} aria-hidden="true" />
          <span className="absolute left-7 top-2 h-0.5 w-3 rounded-full bg-theme-primary opacity-70" />
          <span className="absolute left-7 top-4 h-0.5 w-5 rounded-full bg-theme-primary opacity-40" />
        </motion.span>
      </motion.button>
      {showHint || offset.y > 20 ? (
        <p className="absolute right-3 top-20 whitespace-nowrap rounded-full border border-theme-border bg-theme-card px-3 py-1.5 text-sm font-medium text-theme-primary shadow-sm backdrop-blur">
          {ready ? t('creative_trigger_plane_release') : t('creative_trigger_plane_instruction')}
        </p>
      ) : null}
    </div>
  );
}

function PortalSlider({ onActivate, ariaLabel, showHint }: TriggerProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const controls = useAnimation();
  const activate = useActivate(onActivate);
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const portalDistance = (trackRef.current?.clientWidth ?? 208) - 40;
  const ready = isCreativeTriggerGestureComplete('portal-slider', offset, portalDistance);

  const finish = async (info: PanInfo) => {
    setOffset({ x: 0, y: 0 });
    if (!isCreativeTriggerGestureComplete('portal-slider', info.offset, portalDistance)) return;
    await activate(
      reduceMotion
        ? undefined
        : async () => {
            await controls.start({
              x: portalDistance,
              scale: 0.1,
              opacity: 0,
              rotate: 60,
              transition: { duration: 0.32, ease: 'easeIn' },
            });
            controls.set({ x: 0, scale: 1, opacity: 1, rotate: 0 });
          }
    );
  };

  return (
    <div className="relative w-24 sm:w-40 lg:w-52">
      <div
        ref={trackRef}
        className="relative h-10 w-full overflow-hidden rounded-full border border-theme-border transition-colors"
        style={{
          background:
            'radial-gradient(circle at 26% 20%, rgba(56, 189, 248, 0.25), transparent 28%), radial-gradient(circle at 68% 85%, rgba(168, 85, 247, 0.34), transparent 34%), linear-gradient(90deg, color-mix(in srgb, var(--color-card) 52%, #172554 48%), color-mix(in srgb, var(--color-background) 28%, #312e81 72%) 56%, color-mix(in srgb, var(--color-background) 18%, #111827 82%))',
          boxShadow:
            'inset 0 0 18px color-mix(in srgb, var(--color-primary) 14%, transparent), 0 0 18px color-mix(in srgb, var(--color-primary) 20%, transparent)',
        }}
      >
        <motion.span
          className="absolute left-4 top-1.5 h-0.5 w-0.5 rounded-full"
          style={{
            backgroundColor: 'var(--color-foreground)',
            boxShadow:
              '18px 5px 0 color-mix(in srgb, var(--color-foreground) 72%, transparent), 31px -2px 0 color-mix(in srgb, var(--color-primary) 82%, transparent), 42px 8px 0 color-mix(in srgb, var(--color-foreground) 58%, transparent), 58px 1px 0 rgba(255,255,255,.8), 74px 9px 0 rgba(165,243,252,.75), 92px -1px 0 color-mix(in srgb, var(--color-foreground) 68%, transparent), 111px 6px 0 rgba(255,255,255,.65), 132px 0 0 rgba(216,180,254,.85), 151px 9px 0 rgba(255,255,255,.6)',
          }}
          animate={reduceMotion ? undefined : { opacity: [0.55, 1, 0.65] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="absolute bottom-2 left-7 h-1 w-1 rounded-full"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 80%, white)',
            boxShadow:
              '24px -6px 0 -1px rgba(255,255,255,.75), 47px 1px 0 -1px rgba(165,243,252,.8), 69px -8px 0 -1px rgba(255,255,255,.7), 88px -2px 0 -1px rgba(216,180,254,.8), 112px -7px 0 -1px rgba(255,255,255,.65), 136px 0 0 -1px rgba(125,211,252,.75)',
          }}
          animate={reduceMotion ? undefined : { opacity: [1, 0.45, 0.9] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span
          className="absolute left-5 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-cyan-300/80 to-fuchsia-400/70 shadow-[0_0_6px_rgba(103,232,249,0.8)]"
          style={{ width: Math.max(0, offset.x) }}
        />
        <span className="absolute right-0 top-1/2 h-2 w-10 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-fuchsia-300/80 to-transparent blur-[1px]" />
        <motion.span
          aria-hidden="true"
          className="absolute right-0.5 top-0.5 h-9 w-9 rounded-full"
          style={{
            background:
              'conic-gradient(from 20deg, transparent 0 9%, rgba(103,232,249,.9) 18%, white 27%, rgba(232,121,249,.95) 39%, transparent 54%, rgba(167,139,250,.85) 72%, transparent 88%)',
            maskImage: 'radial-gradient(circle, transparent 52%, black 58%)',
            filter: 'drop-shadow(0 0 4px rgba(216,180,254,.9))',
          }}
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
        />
        <motion.span
          aria-hidden="true"
          className="absolute right-1 top-1 h-8 w-8 rounded-full border-r border-t-2 border-cyan-200/80"
          animate={reduceMotion ? undefined : { rotate: -360 }}
          transition={{ duration: 4.6, repeat: Infinity, ease: 'linear' }}
        />
        <span className="absolute right-[9px] top-[9px] h-[22px] w-[22px] rounded-full bg-black shadow-[0_0_7px_2px_rgba(0,0,0,0.95),0_0_12px_rgba(168,85,247,0.75)]" />
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute top-2 text-base opacity-30 blur-[0.3px] drop-shadow-[0_0_5px_rgba(165,243,252,0.9)]"
          animate={
            reduceMotion
              ? { left: '70%' }
              : {
                  left: ['10%', '42%', '72%'],
                  y: [0, -3, 2, 0],
                  rotate: [0, -8, 18, 45],
                  scale: [1, 0.9, 0.6, 0.15],
                  opacity: [0, 0.35, 0.3, 0],
                }
          }
          transition={{ duration: 4.2, repeat: Infinity, repeatDelay: 0.7, ease: 'easeIn' }}
        >
          🧑‍🚀
        </motion.span>
        <motion.button
          type="button"
          drag="x"
          dragConstraints={trackRef}
          dragElastic={0}
          dragSnapToOrigin
          animate={controls}
          onDrag={(_, info) => setOffset(info.offset)}
          onDragEnd={(_, info) => void finish(info)}
          onClick={(event) => keyboardClick(event, () => void activate())}
          aria-label={ariaLabel}
          className={`absolute left-0.5 top-0.5 grid h-9 w-9 cursor-grab touch-none place-items-center rounded-full border border-theme-primary text-base backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary/20 active:cursor-grabbing ${
            ready ? 'ring-2 ring-fuchsia-300' : ''
          }`}
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-card) 72%, var(--color-primary) 28%)',
            boxShadow:
              'inset 0 0 8px color-mix(in srgb, var(--color-background) 45%, transparent), 0 0 12px color-mix(in srgb, var(--color-primary) 55%, transparent)',
          }}
        >
          <motion.span
            aria-hidden="true"
            animate={reduceMotion ? undefined : { y: [-1, 1, -1], rotate: [-4, 4, -4] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            🧑‍🚀
          </motion.span>
        </motion.button>
        {showHint ? (
          <span className="absolute inset-0 animate-pulse rounded-full ring-2 ring-inset ring-cyan-200/80" />
        ) : null}
      </div>
      {showHint || offset.x > 12 ? (
        <p className="absolute right-0 top-full mt-2 whitespace-nowrap rounded-full border border-theme-border bg-theme-card px-3 py-1 text-xs font-medium text-theme-foreground shadow-md backdrop-blur">
          {ready ? t('creative_trigger_portal_release') : t('creative_trigger_portal_instruction')}
        </p>
      ) : null}
    </div>
  );
}

export default function CreativeTrigger({
  variant,
  onActivate,
  hintRequest,
  ariaLabel,
}: CreativeTriggerProps) {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!hintRequest) return;
    setShowHint(true);
    const timer = window.setTimeout(() => setShowHint(false), 3000);
    return () => window.clearTimeout(timer);
  }, [hintRequest]);

  const props = { onActivate, ariaLabel, showHint };
  if (variant === 'paper-plane') return <PaperPlane {...props} />;
  if (variant === 'portal-slider') return <PortalSlider {...props} />;
  return <LightbulbRope {...props} />;
}
