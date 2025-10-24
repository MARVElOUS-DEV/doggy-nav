import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAtomValue } from 'jotai';
import { authStateAtom } from '@/store/store';
import { useTranslation } from 'react-i18next';

// Constants
const BULB_WIDTH = 48; // 3rem (w-12 in Tailwind)
const BASE_ROPE_LENGTH = 100;
const ROPE_Origin_Right = 32; // right-8
const ROPE_VIR_LEN = BASE_ROPE_LENGTH + BULB_WIDTH / 2; // Distance to bulb center
const LightbulbRope = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const authState = useAtomValue(authStateAtom);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const ropeRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const isNavigatingRef = useRef(false);

  const finalBulbQuadrant = useMemo<undefined | 'lt' | 'rt' | 'lb' | 'rb'>(() => {
    if (dragOffset.x < 0 && dragOffset.y < 0) return 'lt';
    if (dragOffset.x < 0 && dragOffset.y > 0) return 'lb';
    if (dragOffset.x > 0 && dragOffset.y > 0) return 'rb';
    if (dragOffset.x > 0 && dragOffset.y < 0) return 'rt';
    return 'lt';
  }, [dragOffset.x, dragOffset.y]);
  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      isNavigatingRef.current = false;
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Set up event listeners
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

  const isCrossingLine = dragOffset.x + startPosRef.current.x > windowWidth - ROPE_Origin_Right;
  const initSwayAngle = useMemo(() => {
    // Only consider the initial state where the bulb is to the left of the vertical line
    const x = windowWidth - ROPE_Origin_Right - startPosRef.current.x;
    return Math.asin(x / ROPE_VIR_LEN);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowWidth, isDragging]);

  const [swayAngle, ropeLength] = useMemo(() => {
    if (isDragging) {
      let x, y;
      if (finalBulbQuadrant === 'lt') {
        x = Math.sin(initSwayAngle) * ROPE_VIR_LEN + Math.abs(dragOffset.x);
        y = Math.cos(initSwayAngle) * ROPE_VIR_LEN - Math.abs(dragOffset.y);
      }
      if (finalBulbQuadrant === 'lb') {
        x = Math.sin(initSwayAngle) * ROPE_VIR_LEN + Math.abs(dragOffset.x);
        y = Math.cos(initSwayAngle) * ROPE_VIR_LEN + Math.abs(dragOffset.y);
      }
      if (finalBulbQuadrant === 'rb') {
        x =
          (isCrossingLine ? -1 : 1) * Math.sin(initSwayAngle) * ROPE_VIR_LEN -
          Math.abs(dragOffset.x);
        y = Math.cos(initSwayAngle) * ROPE_VIR_LEN + Math.abs(dragOffset.y);
      }
      if (finalBulbQuadrant === 'rt') {
        x =
          (isCrossingLine ? -1 : 1) * Math.sin(initSwayAngle) * ROPE_VIR_LEN -
          Math.abs(dragOffset.x);
        y = Math.cos(initSwayAngle) * ROPE_VIR_LEN - Math.abs(dragOffset.y);
      }
      return [Math.atan2(x, y), Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) + BULB_WIDTH / 2];
    } else {
      return [0, ROPE_VIR_LEN];
    }
  }, [finalBulbQuadrant, dragOffset.x, initSwayAngle, dragOffset.y, isDragging, isCrossingLine]);

  // Only show for authenticated users
  if (!authState.isAuthenticated) {
    return null;
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isNavigatingRef.current) return;

    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    setDragOffset({ x: 0, y: 0 });

    // Prevent text selection during drag
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isNavigatingRef.current) return;

    setIsDragging(true);
    startPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setDragOffset({ x: 0, y: 0 });

    // Prevent scrolling during drag
    e.preventDefault();
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || isNavigatingRef.current) return;

    const offsetX = clientX - startPosRef.current.x;
    const offsetY = clientY - startPosRef.current.y;

    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleEnd = () => {
    if (!isDragging || isNavigatingRef.current) return;

    setIsDragging(false);

    // If dragged more than 100px downward (Y-axis), navigate to favorites
    if (dragOffset.y > 100) {
      isNavigatingRef.current = true;
      router.push('/desktop');
    } else {
      // Animate back to original position
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Calculate bulb position based on mode
  const bulbX = isDragging ? dragOffset.x : 0;
  const bulbY = isDragging ? dragOffset.y + BASE_ROPE_LENGTH : BASE_ROPE_LENGTH;

  const ropeAngleDeg = swayAngle * (180 / Math.PI);

  // Rope angle from vertical: positive X = clockwise rotation

  return (
    <div className="fixed top-0 right-8 z-50 pointer-events-none">
      {/* Swaying container - only when not dragging */}
      <div
        className={`${!isDragging ? 'animate-sway' : ''}`}
        style={{ transformOrigin: 'center top' }}
      >
        {/* Rope - always connects from origin (0,0) to bulb position */}
        <div
          ref={ropeRef}
          className="absolute top-0 left-1/2 w-0.5 bg-gradient-to-b from-amber-200 to-amber-400"
          style={{
            height: `${ropeLength}px`,
            transform: `translateX(-50%) rotate(${ropeAngleDeg}deg)`,
            transformOrigin: 'top center',
            transition: isDragging ? 'none' : 'all 0.3s ease-out',
          }}
        >
          {/* Small rope details */}
          <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-amber-300/50 rounded-full"></div>
          <div className="absolute top-2/3 left-1/2 transform -translate-x-1/2 w-1 h-6 bg-amber-300/50 rounded-full"></div>
        </div>

        {/* Lightbulb - positioned at the end of the rope */}
        <div
          className={`absolute top-0 left-1/2 pointer-events-auto cursor-grab active:cursor-grabbing w-12 h-12 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 border-2 border-amber-300 shadow-lg flex items-center justify-center transition-all duration-300 ${
            isDragging ? 'scale-110' : 'hover:scale-105'
          } ${dragOffset.y > 100 ? 'animate-pulse' : ''}`}
          style={{
            transformOrigin: 'top center',
            transform: `translate(calc(-50% + ${bulbX}px), ${bulbY}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out, scale 0.2s ease-out',
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Bulb shine effect */}
          <div className="absolute top-2 left-3 w-3 h-3 bg-white/60 rounded-full blur-sm"></div>

          {/* Bulb center glow */}
          <div className="w-6 h-6 rounded-full bg-amber-100/80 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-amber-300"></div>
          </div>

          {/* Glow effect when dragged */}
          {dragOffset.y > 50 && (
            <div className="absolute inset-0 rounded-full bg-amber-300/30 blur-lg animate-pulse"></div>
          )}
        </div>
      </div>

      {/* Instruction text when dragging */}
      {isDragging && dragOffset.y > 30 && (
        <div
          className="absolute text-amber-700 text-sm font-medium whitespace-nowrap animate-fade-in-simple"
          style={{
            top: `${bulbY + 60}px`,
            left: '50%',
            transform: `translateX(calc(-50% + ${bulbX}px))`,
            transition: 'all 0.1s ease-out',
          }}
        >
          {dragOffset.y > 100 ? t('release_to_go_to_favorites') : t('pull_down_to_go_to_favorites')}
        </div>
      )}
    </div>
  );
};

export default LightbulbRope;
