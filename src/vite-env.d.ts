/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Django API, e.g. https://api.rynexnative.com */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
