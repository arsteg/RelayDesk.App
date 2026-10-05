/// <reference types="expo/types" />

// Ambient declaration for the public API base URL injected at build time.
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL?: string;
  }
}
