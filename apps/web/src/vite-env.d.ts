interface ImportMetaEnv {
  // Base URL of the jobs API, e.g. "http://localhost:4000/api/v1". See .env.example.
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
