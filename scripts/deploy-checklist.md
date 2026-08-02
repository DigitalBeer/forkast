# Pre-Deployment Checklist

Use this checklist before deploying the Meal Planner Docker image to Unraid.

---

## 1. Build-Time Environment Variables

Verify all required build-time variables are set in `.env.docker`:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (e.g., `https://xxx.supabase.co`)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous/public key
- [ ] `NEXT_PUBLIC_APP_URL` — App's public URL (e.g., `http://192.168.1.50:3000`)
- [ ] `NEXT_PUBLIC_APP_VERSION` — Version string (read from `VERSION` file automatically)
- [ ] `NEXT_PUBLIC_SENTRY_DSN` — Sentry DSN (optional — leave blank to skip)

**Validation:** Run `.\scripts\build.ps1` — it will validate these before building.

---

## 2. Runtime Environment Variables

These are set in the Unraid Docker container configuration (not baked into the image):

- [ ] `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (secret!)
- [ ] `EDGE_SERVICE_ROLE_KEY` — Edge function auth key
- [ ] `STRIPE_SECRET_KEY` — Stripe API key (if using payments)
- [ ] `STRIPE_PRICE_ID` — Stripe subscription price ID (if using payments)
- [ ] `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret (if using webhooks)

---

## 3. Supabase Configuration

- [ ] **Redirect URLs** — Add your Unraid URL to Supabase → Authentication → URL Configuration → Redirect URLs:
  - `http://<unraid-ip>:3000`
  - `http://<unraid-ip>:3000/**`
  - If using HTTPS/domain, add `https://<domain>/**` too
- [ ] **Site URL** — Set Site URL in Supabase to match `NEXT_PUBLIC_APP_URL`

---

## 4. Network & Access

- [ ] **Port 3000** not in use on Unraid (check with `netstat -tlnp | grep 3000` or Unraid Docker tab)
- [ ] **Local access confirmed** — App reachable at `http://<unraid-ip>:3000`
- [ ] **External access** (if needed) — Cloudflare Tunnel or reverse proxy configured
- [ ] **HTTPS** (if using external access) — TLS termination configured

---

## 5. Unraid Docker Settings

- [ ] Docker vDisk size ≥ 10 GB (check Unraid → Settings → Docker)
- [ ] Sufficient disk space for `.tar` image transfer
- [ ] Previous container stopped/removed (if updating)

---

## 6. Health Check Verification

- [ ] `docker exec <container> wget -qO- http://localhost:3000/api/health` returns `{"status":"ok",...}`
- [ ] Unraid Docker tab shows container as "running" (green)

---

## 7. Post-Deployment

- [ ] Authentication flow works (login/signup)
- [ ] Core app features load correctly
- [ ] Sentry captures errors (if configured)
- [ ] Image version matches expected version
