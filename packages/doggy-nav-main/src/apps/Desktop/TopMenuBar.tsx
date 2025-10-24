import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Menu } from 'lucide-react';

interface TopMenuBarProps {
  onMenuClick?: () => void;
}

// Minimal macOS-like top menu bar for the desktop-style favorites page.
// Uses design-system driven Tailwind tokens (glass, borders, theme vars) and supports dark mode.
export default function TopMenuBar({ onMenuClick }: TopMenuBarProps) {
  const [now, setNow] = useState(() => dayjs());

  useEffect(() => {
    // Update time every 30s to keep minutes in sync without excess renders
    const id = setInterval(() => setNow(dayjs()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[70] pointer-events-none">
      <div className="pointer-events-auto h-10 w-full bg-glass-light backdrop-blur-glass-lg backdrop-saturate-150 border-b border-glass-border select-none">
        <div className="flex items-center justify-between h-full px-3 sm:px-4">
          {/* Left area (placeholder for future menus) */}
          <div className="flex items-center gap-2">
            {/* Keep minimal per request; no hardcoded colors */}
          </div>
          {/* Right area: time + menu */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Menu"
              onClick={onMenuClick}
              className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {now.format('ddd MMM D HH:mm')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
