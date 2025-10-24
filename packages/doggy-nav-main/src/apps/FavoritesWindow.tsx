import React from 'react';

export default function FavoritesWindow() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-foreground)' }}>
        Favorites
      </h2>
      <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
        Your favorite sites and folders will appear here.
      </p>
    </div>
  );
}
