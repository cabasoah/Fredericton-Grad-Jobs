# API image. Build from the repo root:
#   docker build -f apps/api/Dockerfile -t fgj-api .
# On start it applies pending migrations, optionally seeds (SEED_ON_START=true),
# then runs the bundled API as the unprivileged "node" user.

FROM node:22-alpine AS build
WORKDIR /app
# Manifests first, so dependency layers are cached until they change.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY apps/api/prisma apps/api/prisma
COPY apps/api/prisma.config.ts apps/api/
RUN npm ci -w apps/api -w packages/shared
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w apps/api

FROM node:22-alpine AS runtime
# Prisma's schema engine (migrate deploy) needs OpenSSL.
RUN apk add --no-cache openssl
ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/api/prisma apps/api/prisma
COPY apps/api/prisma.config.ts apps/api/
# `npm ci -w apps/api --omit=dev` still installs every workspace's packages,
# so trim the manifests to the API's production dependencies (the shared
# package is already bundled into dist/) and install from the same lockfile.
RUN node -e ' \
      const fs = require("fs"); \
      const root = JSON.parse(fs.readFileSync("package.json")); \
      root.workspaces = ["apps/api"]; delete root.devDependencies; \
      fs.writeFileSync("package.json", JSON.stringify(root)); \
      const api = JSON.parse(fs.readFileSync("apps/api/package.json")); \
      delete api.dependencies["@fredericton-grad-jobs/shared"]; delete api.devDependencies; \
      fs.writeFileSync("apps/api/package.json", JSON.stringify(api));' \
  && npm install --omit=dev --omit=peer --no-audit --no-fund \
  && npm cache clean --force
COPY --from=build /app/apps/api/dist apps/api/dist

USER node
WORKDIR /app/apps/api
ENV PORT=4000
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/v1/health" || exit 1
CMD ["sh", "-c", "npx --no-install prisma migrate deploy && if [ \"$SEED_ON_START\" = true ]; then node dist/seed.js; fi && exec node --enable-source-maps dist/index.js"]
