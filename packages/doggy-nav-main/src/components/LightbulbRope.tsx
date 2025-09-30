import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAtomValue } from 'jotai';
import { authStateAtom } from '@/store/store';

const LightbulbRope = () => {
  const router = useRouter();
  const authState = useAtomValue(authStateAtom);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const ropeRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
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
      router.push('/favorites');
    } else {
      // Animate back to original position
      setDragOffset({ x: 0, y: 0 });
    }
  };


  // Calculate bulb position based on mode
  const bulbX = isDragging ? dragOffset.x : 0;
  const bulbY = isDragging ? dragOffset.y + 100 : 100;  // Add base length to drag offset

  // Calculate rope length (distance from origin to bulb)
  const ropeLength = Math.sqrt(bulbX * bulbX + bulbY * bulbY);
  // Rope angle from vertical: positive X = clockwise rotation
  const ropeAngle = Math.atan2(bulbX, bulbY) * (180 / Math.PI);

  return (
    <div className="fixed top-0 right-8 z-50 pointer-events-none">
      {/* Swaying container - only when not dragging */}
      <div className={`${!isDragging ? 'animate-sway' : ''}`} style={{ transformOrigin: 'center top' }}>
        {/* Rope - always connects from origin (0,0) to bulb position */}
        <div
          ref={ropeRef}
          className="absolute top-0 left-1/2 w-0.5 bg-gradient-to-b from-amber-200 to-amber-400"
          style={{
            height: `${ropeLength}px`,
            transform: `translateX(-50%) rotate(${ropeAngle}deg)`,
            transformOrigin: 'top center',
            transition: isDragging ? 'none' : 'all 0.3s ease-out'
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
            transform: `translate(calc(-50% + ${bulbX}px), ${bulbY}px)`,
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
            transition: 'all 0.1s ease-out'
          }}
        >
          {dragOffset.y > 100 ? '松开前往收藏页面' : '继续下拉前往收藏页面'}
        </div>
      )}
    </div>
  );
};

export default LightbulbRope;