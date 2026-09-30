interface ImportMetaEnv {
  /** Base URL of book-api, without a trailing slash. Defaults to http://localhost:8080. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
