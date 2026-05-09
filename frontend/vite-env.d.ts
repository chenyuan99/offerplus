/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_SUPABASE_URL: string
  readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  readonly NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string
  readonly NEXT_PUBLIC_API_URL: string
  readonly NEXT_PUBLIC_SITE_URL: string
  readonly NEXT_PUBLIC_OPENAI_API_KEY: string
  readonly NEXT_PUBLIC_LOGO_DEV_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
