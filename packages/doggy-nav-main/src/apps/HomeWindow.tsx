import React from 'react';

export default function HomeWindow() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-foreground)' }}>
        Welcome to Desktop
      </h2>
      <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
        This is a macOS-like desktop surface implemented with the main project stack (Next.js + Tailwind).
      </p>
    </div>
  );
}
