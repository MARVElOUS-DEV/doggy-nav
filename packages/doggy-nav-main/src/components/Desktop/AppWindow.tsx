import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Rnd, RndResizeCallback, RndDragCallback } from 'react-rnd';
import { AnimatePresence, motion } from 'framer-motion';
import TrafficLights from './TrafficLights';

export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AppWindowProps {
  title?: string;
  open: boolean;
  minimized?: boolean;
  rect: WindowRect;
  onRectChange?: (rect: WindowRect) => void;
  onClose?: () => void;
  onMinimize?: () => void;
  onActivate?: () => void;
  zIndex?: number;
  children?: React.ReactNode;
}

// A desktop-like window with drag/resize and minimal title bar controls.
// Styles rely on theme CSS variables and Tailwind utilities; no hardcoded colors.
export default function AppWindow({
  title = 'App',
  open,
  minimized = false,
  rect,
  onRectChange,
  onClose,
  onMinimize,
  onActivate,
  children,
  zIndex,
}: AppWindowProps) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const [localRect, setLocalRect] = useState<WindowRect>(rect);
  const prevRectRef = useRef<WindowRect | null>(null);
  const [maximized, setMaximized] = useState(false);
  useEffect(() => {
    setLocalRect(rect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rect.x, rect.y, rect.width, rect.height]);

  const onResizeStop: RndResizeCallback = (_e, _dir, ref, _delta, position) => {
    const next: WindowRect = {
      x: position.x,
      y: position.y,
      width: ref.offsetWidth,
      height: ref.offsetHeight,
    };
    setLocalRect(next);
    onRectChange?.(next);
  };

  const onDragStop: RndDragCallback = (_e, d) => {
    const next: WindowRect = { ...localRect, x: d.x, y: d.y };
    setLocalRect(next);
    onRectChange?.(next);
  };

  const variants = useMemo(
    () => ({
      hidden: { opacity: 0, scale: 0.98, y: 20 },
      visible: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.98, y: 12 },
    }),
    []
  );

  if (!isClient) return null;

  return (
    <AnimatePresence>
      {open && !minimized && (
        <motion.div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: zIndex ?? undefined }}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={variants}
        >
          <Rnd
            bounds="window"
            size={{ width: localRect.width, height: localRect.height }}
            position={{ x: localRect.x, y: localRect.y }}
            onResizeStop={onResizeStop}
            onDragStop={onDragStop}
            dragHandleClassName="app-window-title"
            enableResizing={{
              top: true,
              right: true,
              bottom: true,
              left: true,
              topRight: true,
              bottomRight: true,
              bottomLeft: true,
              topLeft: true,
            }}
            className="pointer-events-auto shadow-2xl border rounded-2xl backdrop-blur-xl"
            style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-card-foreground)',
            }}
          >
            {/* Title bar */}
            <div
              className="app-window-title flex items-center justify-between px-3 py-2 border-b rounded-t-2xl select-none"
              style={{ borderColor: 'var(--color-border)' }}
              onMouseDown={onActivate}
            >
              <div className="flex items-center gap-3">
                <TrafficLights
                  onClose={onClose}
                  onMinimize={onMinimize}
                  onMaximize={() => {
                    if (!maximized) {
                      prevRectRef.current = { ...localRect };
                      const margin = 20;
                      const top = 60;
                      const w = Math.max(320, window.innerWidth - margin * 2);
                      const h = Math.max(200, window.innerHeight - top - margin);
                      const next = { x: margin, y: top, width: w, height: h };
                      setLocalRect(next);
                      onRectChange?.(next);
                      setMaximized(true);
                    } else {
                      const prev = prevRectRef.current;
                      if (prev) {
                        setLocalRect(prev);
                        onRectChange?.(prev);
                      }
                      setMaximized(false);
                    }
                  }}
                />
                <div
                  className="ml-1 font-medium text-sm"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  {title}
                </div>
              </div>
              <div className="text-xs px-1" style={{ color: 'var(--color-muted-foreground)' }}>
                Drag the bar to move
              </div>
            </div>

            {/* Content */}
            <div className="w-full h-[calc(100%-40px)] overflow-auto" onMouseDown={onActivate}>
              {children}
            </div>
          </Rnd>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
