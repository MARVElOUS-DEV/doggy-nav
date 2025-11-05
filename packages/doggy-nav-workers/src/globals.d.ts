// Type declaration for crypto in globalThis
declare global {
  var globalThis: typeof globalThis & {
    crypto: {
      getRandomValues?: (array: any) => any;
    } & Crypto;
  };
}

export {};
