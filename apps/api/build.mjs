// Production build: bundles the API's TypeScript (and the shared workspace
// package and generated Prisma client it imports) into plain JavaScript in
// dist/. npm packages stay external and are installed in the image.
import { cpSync, readFileSync, rmSync } from "node:fs";
import { build } from "esbuild";

const { dependencies } = JSON.parse(readFileSync("package.json", "utf8"));
// The shared package is TypeScript source, so it is bundled, not required.
const external = Object.keys(dependencies).filter((name) => name !== "@fredericton-grad-jobs/shared");

rmSync("dist", { recursive: true, force: true });
await build({
  entryPoints: {
    index: "src/index.ts",
    seed: "prisma/seed.ts",
    ingest: "src/ingest/cli.ts",
  },
  outdir: "dist",
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  sourcemap: true,
  external: [...external, "@prisma/client/*"],
  logLevel: "info",
});
// The seed reads ./seed-data/jobs.json next to itself.
cpSync("prisma/seed-data", "dist/seed-data", { recursive: true });
