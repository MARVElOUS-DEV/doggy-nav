export type Position = { x: number; y: number };

export const FOLDER_DEFAULT_SIZE = { width: 900, height: 500 } as const;
export const BOOKMARK_SIZE = { width: 240, height: 60 } as const;

// Bookmark grid & pagination constants (must stay in sync with layout.ts)
export const BOOKMARK_GRID_COLS = 3;
export const BOOKMARK_GRID_COL_GAP = 16;
export const BOOKMARK_GRID_ROW_GAP = 12;
export const BOOKMARK_GRID_TOP = 80;
export const PADDING = 20;

export const MAX_BOOKMARK_ROWS = Math.max(
  1,
  Math.floor(
    (FOLDER_DEFAULT_SIZE.height - BOOKMARK_GRID_TOP - PADDING) /
      (BOOKMARK_SIZE.height + BOOKMARK_GRID_ROW_GAP)
  )
);
export const BOOKMARKS_PER_PAGE = BOOKMARK_GRID_COLS * MAX_BOOKMARK_ROWS;
