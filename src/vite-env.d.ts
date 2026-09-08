/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_JITSI_DOMAIN?: string
  readonly VITE_JITSI_PROTOCOL?: 'http' | 'https'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
