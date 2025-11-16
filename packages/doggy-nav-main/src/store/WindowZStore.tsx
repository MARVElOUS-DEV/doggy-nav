import React, { createContext, useContext, useMemo, useRef } from 'react';

type WindowZContextValue = {
  getNextZ: () => number;
};

const WindowZContext = createContext<WindowZContextValue | undefined>(undefined);

export function WindowZProvider({ children }: { children: React.ReactNode }) {
  const counterRef = useRef(50);

  const value: WindowZContextValue = useMemo(
    () => ({
      getNextZ: () => {
        counterRef.current += 1;
        return counterRef.current;
      },
    }),
    []
  );

  return <WindowZContext.Provider value={value}>{children}</WindowZContext.Provider>;
}

export function useWindowZ() {
  const ctx = useContext(WindowZContext);
  if (!ctx) {
    throw new Error('useWindowZ must be used within WindowZProvider');
  }
  return ctx;
}
