# Deploying

The setup the config is written for: the web app on **Vercel** (Hobby plan), the API with its 6-hourly import on **Fly.io**, and PostgreSQL on **Neon** (Free plan). Vercel rewrites `/api/*` to the Fly app, so the browser sees one origin and the session cookie stays first-party. Secrets live on each platform, never in the repo.

Not deployed yet. First deploy, one time:

1. **Neon:** create a project in AWS us-east-1 (N. Virginia). Copy the **direct** (not pooled) connection string; it ends with `sslmode=require`.
2. **Fly.io:** install `flyctl`, then from the repository root:
   ```bash
   fly auth login
   fly apps create fredericton-grad-jobs-api      # if taken, pick another name and update fly.toml and apps/web/vercel.json
   fly secrets set DATABASE_URL="<Neon connection string>" \
     JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" \
     CORS_ORIGIN="https://<your-vercel-project>.vercel.app"
   fly deploy
   ```
   The first start applies the migrations to Neon. The board is empty until the first import, so run it once instead of waiting 6 hours: `fly ssh console -C "node dist/ingest.js"`. Check `https://fredericton-grad-jobs-api.fly.dev/api/v1/health` returns `{"status":"ok","database":"ok"}`.
3. **Vercel:** import the GitHub repository, set **Root Directory** to `apps/web`, keep the other settings (they come from `apps/web/vercel.json`) and deploy. Open the `.vercel.app` URL. If it differs from the `CORS_ORIGIN` you set, run `fly secrets set CORS_ORIGIN=<it>`.
4. **Deploy on every merge:** Vercel deploys `main` by itself. For the API, create a token with `fly tokens create deploy`, add it in GitHub (Settings, Secrets and variables, Actions) as the secret `FLY_API_TOKEN`, and add the variable `DEPLOY_API` = `true`. From then on, every push to `main` that passes CI runs `fly deploy`.
5. **Check `TRUST_PROXY`** (the number of proxies in front of the API; `fly.toml` sets 2, for Vercel and Fly). Login is limited to 20 attempts per client per 15 minutes, which makes it testable:
   ```bash
   for i in $(seq 1 21); do curl -s -o /dev/null -w "%{http_code} " -X POST https://<your-app>.vercel.app/api/v1/auth/login \
     -H "Content-Type: application/json" -H "X-Forwarded-For: 198.51.100.$i" -d "{\"email\":\"probe$i@example.com\",\"password\":\"wrong-password\"}"; done
   ```
   The last code must be `429`. If every code is `401`, the faked header is being trusted: lower `TRUST_PROXY` by 1. Then, within 15 minutes, try one login from another network (a phone hotspot). It must get `401`, not `429`; if it gets `429`, everyone shares one limit: raise `TRUST_PROXY` by 1. Change it with `fly secrets set TRUST_PROXY=<n>` or in `fly.toml`.

Costs (checked 27 October 2026): Vercel Hobby and Neon Free are $0 within their limits (Vercel Hobby is for non-commercial use). Fly.io has no free tier for new organizations; one always-on shared-cpu-1x machine with 512 MB is listed at $3.69/month, plus $0.02/GB of outbound traffic in North America.
