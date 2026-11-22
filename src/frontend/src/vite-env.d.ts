/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base path (or absolute URL) of the API Gateway used by the browser. */
  readonly VITE_API_BASE_URL?: string
  /** Local-development proxy target for `/api` requests. */
  readonly VITE_DEV_PROXY_TARGET?: string
  /** Dev server port used when Aspire does not inject `PORT`. */
  readonly VITE_DEV_SERVER_PORT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
