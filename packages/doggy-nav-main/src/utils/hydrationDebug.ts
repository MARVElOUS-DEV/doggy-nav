// utils/hydrationDebug.ts
export const debugHydration = () => {
  if (process.env.NODE_ENV === 'development') {
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0]?.includes?.('Hydration')) {
        console.group('🚨 Hydration Error Debug');
        console.log('Error details:', args);
        console.trace('Stack trace');
        console.groupEnd();
      }
      if (args[0] && typeof args[0] === 'string' && args[0]?.includes('findDOMNode is deprecated')) {
        return; // Suppress this specific warning
      }
      originalError.apply(console, args);
    };
  }
};