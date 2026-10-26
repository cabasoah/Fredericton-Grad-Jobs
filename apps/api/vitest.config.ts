import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
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
