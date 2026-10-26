interface ImportMetaEnv {
  // Base URL of the jobs API, e.g. "/api" (proxied by the Vite dev server) or
  // "https://api.example.com". See .env.example.
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
