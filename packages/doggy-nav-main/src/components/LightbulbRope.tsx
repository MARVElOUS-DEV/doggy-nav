import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAtomValue } from 'jotai';
import { authStateAtom } from '@/store/store';

const LightbulbRope = () => {
  const router = useRouter();
  const authState = useAtomValue(authStateAtom);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const ropeRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const isNavigatingRef = useRef(false);
  
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

  // Reset navigation flag when component unmounts
  useEffect(() => {
    return () => {
      isNavigatingRef.current = false;
    };
  }, []);

  // Only show for authenticated users
  if (!authState.isAuthenticated) {
    return null;
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isNavigatingRef.current) return;

    setIsDragging(true);
    startYRef.current = e.clientY;
    setDragOffset(0);

    // Prevent text selection during drag
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isNavigatingRef.current) return;

    setIsDragging(true);
    startYRef.current = e.touches[0].clientY;
    setDragOffset(0);

    // Prevent scrolling during drag
    e.preventDefault();
  };

  const handleMove = (clientY: number) => {
    if (!isDragging || isNavigatingRef.current) return;

    const currentOffset = clientY - startYRef.current;
    // Only allow downward dragging
    setDragOffset(Math.max(0, currentOffset));
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientY);
    }
  };

  const handleEnd = () => {
    if (!isDragging || isNavigatingRef.current) return;

    setIsDragging(false);

    // If dragged more than 100px, navigate to favorites
    if (dragOffset > 100) {
      isNavigatingRef.current = true;
      router.push('/favorites');
    } else {
      // Animate back to original position
      setDragOffset(0);
    }
  };


  return (
    <div className="fixed top-0 right-8 z-50 pointer-events-none">
      {/* Swaying container */}
      <div className={`${!isDragging ? 'animate-sway' : ''}`} style={{ transformOrigin: 'center top' }}>
        {/* Rope */}
        <div
          ref={ropeRef}
          className="w-0.5 bg-gradient-to-b from-amber-200 to-amber-400 mx-auto relative"
          style={{
            height: `${100 + dragOffset}px`,
            transition: isDragging ? 'none' : 'height 0.3s ease-out'
          }}
        >
          {/* Small rope details */}
          <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-amber-300/50 rounded-full"></div>
          <div className="absolute top-2/3 left-1/2 transform -translate-x-1/2 w-1 h-6 bg-amber-300/50 rounded-full"></div>
        </div>

        {/* Lightbulb */}
        <div
          className={`pointer-events-auto cursor-grab active:cursor-grabbing w-12 h-12 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 border-2 border-amber-300 shadow-lg relative flex items-center justify-center transition-all duration-300 ${
            isDragging ? 'scale-110' : 'hover:scale-105'
          } ${dragOffset > 100 ? 'animate-pulse' : ''}`}
          style={{
            transform: `translateY(${dragOffset}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out, scale 0.2s ease-out'
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
        {dragOffset > 50 && (
          <div className="absolute inset-0 rounded-full bg-amber-300/30 blur-lg animate-pulse"></div>
        )}
      </div>
    </div>

      {/* Instruction text when dragging */}
      {isDragging && dragOffset > 30 && (
        <div
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 text-amber-700 text-sm font-medium whitespace-nowrap animate-fade-in-simple"
          style={{
            transform: `translateX(-50%) translateY(${dragOffset}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          {dragOffset > 100 ? '松开前往收藏页面' : '继续下拉前往收藏页面'}
        </div>
      )}
    </div>
  );
};

export default LightbulbRope;