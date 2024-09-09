/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API: string;
  readonly VITE_BASE: string;
  readonly VITE_SENTRY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
