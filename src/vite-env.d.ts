/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'local'(기본) 또는 'supabase' */
  readonly VITE_DATA_BACKEND?: 'local' | 'supabase';
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
