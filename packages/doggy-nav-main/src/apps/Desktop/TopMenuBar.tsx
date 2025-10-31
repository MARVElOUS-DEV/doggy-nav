import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dayjs from 'dayjs';
import MacMenuIcon from '../../../public/app-icons/mac-top-menu.svg';
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
    <div id="desktop-topbar" className="fixed top-0 left-0 right-0 z-[70] pointer-events-none">
      <div className="pointer-events-auto h-8 w-full glass-dark border-t-0 border-l-0 border-r-0 select-none">
        <div className="flex items-center justify-between h-full px-3 sm:px-4">
          {/* Left area (placeholder for future menus) */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              aria-label="Go to Home"
              className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <Image src="/logo-icon.png" alt="Doggy Nav" width={20} height={20} priority />
            </Link>
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
              <MacMenuIcon className="w-3 h-3 md:w-4 md:h-4 text-theme-foreground fill-current" />
            </button>
            <div className="text-xs" style={{ color: 'var(--color-foreground)' }}>
              {now.format('ddd MMM D HH:mm')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
