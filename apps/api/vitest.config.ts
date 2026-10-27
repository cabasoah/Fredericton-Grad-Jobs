import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // `npm run coverage` runs both projects, so routes are measured through
    // the integration tests (needs the db container).
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/generated/**", "src/**/*.test.ts", "src/test/**"],
      reporter: ["text", "text-summary", "html"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.int.test.ts"],
        },
      },
      {
        // Needs Postgres (docker compose up -d db). Uses a separate
        // <database>_test database, created and migrated by the setup.
        extends: true,
        test: {
          name: "integration",
          include: ["src/**/*.int.test.ts"],
          globalSetup: ["src/test/integrationSetup.ts"],
          fileParallelism: false,
        },
      },
    ],
  },
});
