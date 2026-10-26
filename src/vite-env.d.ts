/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADSGRAM_BLOCK_ID?: string;
  readonly VITE_BOT_USERNAME?: string;
  readonly VITE_LOCAL_ONLY?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
