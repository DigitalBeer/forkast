# Docker Deployment — Unraid Guide

This guide walks you through containerising the Meal Planner app and running it
on your Unraid server so it's always available, even when your PC is off.

**Architecture at a glance**

```
Partner's device
      |
      | (local network or internet)
      v
Unraid server  <——  Docker container (Next.js)
                          |
                          v
                   Supabase Cloud  (always on, no action needed)
                   Stripe Cloud
                   Sentry Cloud
```

---

## Prerequisites

| Tool | Purpose | Get it |
|---|---|---|
| Docker Desktop | Build the image on your PC | [docker.com](https://www.docker.com/products/docker-desktop/) |

No Docker Hub account needed — we transfer the image directly to Unraid via a `.tar` file.

---

## Quick reference — env vars needed

| Variable | Build or Runtime? | Where to find it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Build** | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Build** | Supabase → Settings → API → `anon` key |
| `NEXT_PUBLIC_SENTRY_DSN` | **Build** | Sentry → Settings → Client Keys (DSN) |
| `NEXT_PUBLIC_APP_URL` | **Build** | `http://<unraid-ip>:3000` |
| `SUPABASE_SERVICE_ROLE_KEY` | Runtime | Supabase → Settings → API → `service_role` key |
| `EDGE_SERVICE_ROLE_KEY` | Runtime | (same as above) |
| `STRIPE_SECRET_KEY` | Runtime | Stripe dashboard → Developers → API keys |
| `STRIPE_PRICE_ID` | Runtime | Stripe dashboard → Products |
| `STRIPE_WEBHOOK_SECRET` | Runtime | Stripe dashboard → Developers → Webhooks |

---

## Step 0 — Prepare your environment file (Unraid target)

Copy the example file and fill in your real values:

```
copy .env.docker.example .env.docker
```

Open `.env.docker` and fill in every value. The comments in that file explain
where to find each one.

> **Important — `NEXT_PUBLIC_APP_URL`**: Set this to `http://<your-unraid-ip>:<port>`,
> e.g. `http://192.168.1.50:3000`. You can find your Unraid server's IP in the
> Unraid dashboard header. If you later add a reverse proxy / domain name,
> rebuild the image with the new URL.

## Step 0a — Optional: local Docker testing with auth

If you want to test the Docker image locally **before** deploying to Unraid,
auth flows (login, session cookies) require `NEXT_PUBLIC_APP_URL` to match
your local address (`http://localhost:3000`). The production URL in `.env.docker`
uses HTTPS, which causes browsers to reject `Secure` cookies over plain HTTP.

**Option A — Quick local build (recommended)**

Use the `-Local` switch on the build script. This temporarily overrides
`NEXT_PUBLIC_APP_URL` to `http://localhost:3000` for that build only:

```powershell
.\scripts\build.ps1 -Local
```

> **Warning:** Do not deploy a `-Local` build to Unraid. Rebuild without `-Local`
> when you are ready to deploy.

**Option B — Persistent local override file**

Create `.env.docker.local` from the provided example. Docker Compose loads it
automatically (requires Docker Compose v2.24+):

```powershell
copy .env.docker.local.example .env.docker.local
.\scripts\build.ps1          # reads .env.docker.local automatically
```

> `.env.docker` remains your production source of truth. `.env.docker.local`
> only overrides values for local testing and is ignored by `update-unraid.ps1`.

---

## Step 2 — Build the Docker image

Open **PowerShell** in your project folder (`C:\My Work\Projects\BMAD - Meal Planner`)
and run (replacing the placeholder values with your real ones):

```powershell
docker build `
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co `
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... `
  --build-arg NEXT_PUBLIC_SENTRY_DSN=https://xxxx@oxxxx.ingest.sentry.io/xxxx `
  --build-arg NEXT_PUBLIC_APP_URL=http://192.168.1.50:3000 `
  --build-arg NEXT_PUBLIC_APP_VERSION=0.1.0 `
  -t meal-planner:latest `
  .
```
> **Tip:** Use `scripts/build.ps1` instead — it reads `.env.docker` automatically, validates all build args (including URL format), and tags the image with the version from the `VERSION` file.

The build takes a couple of minutes the first time. Subsequent builds are much
faster thanks to Docker's layer cache.

---

## Step 3 — Export the image to a `.tar` file

```powershell
docker save -o meal-planner.tar meal-planner:latest
```

This creates a `meal-planner.tar` file (~200-400 MB) in your project folder.

---

## Step 4 — Copy the `.tar` to your Unraid server

Choose whichever method works best for you:

**Option A — SMB share (easiest)**  
Open `\\<unraid-ip>` in Windows File Explorer, drop the `.tar` into a share
like `appdata` or `isos`.

**Option B — SCP (secure copy)**  
```powershell
scp meal-planner.tar root@192.168.1.50:/mnt/user/appdata/
```

**Option C — USB stick**  
Copy to a USB drive, plug it into Unraid, use the Unraid file browser.

---

## Step 5 — Load the image on Unraid

Open the **Unraid web terminal** (the `>_` icon in the top-right of the
Unraid dashboard) and run:

```bash
docker load -i /mnt/user/appdata/meal-planner.tar
```

You should see: `Loaded image: meal-planner:latest`

---

## Step 6 — Create the container in Unraid

1. Open the Unraid web UI and go to the **Docker** tab.
2. Make sure **Docker** is enabled (toggle at the top if not).
3. Click **Add Container**.
4. Fill in the form:

| Field | Value |
|---|---|
| **Name** | `meal-planner` |
| **Repository** | `meal-planner:latest` |
| **Network Type** | `bridge` |

5. Click **Add another Path, Port, Variable, Label or Device** and add a port mapping:
   - Config Type: **Port**
   - Host Port: **3000**
   - Container Port: **3000**

6. Add the following **environment variables** (click *Add another Path, Port,
   Variable, Label or Device* for each one):

| Variable | Value (from your `.env.docker`) |
|---|---|
| `NODE_ENV` | `production` |
| `SUPABASE_SERVICE_ROLE_KEY` | *(your service role key)* |
| `EDGE_SERVICE_ROLE_KEY` | *(same value as above)* |
| `STRIPE_SECRET_KEY` | *(your Stripe secret key)* |
| `STRIPE_PRICE_ID` | *(your Stripe price ID)* |
| `STRIPE_WEBHOOK_SECRET` | *(your Stripe webhook secret)* |

> **Why not the NEXT_PUBLIC_ vars here?** Those were baked into the image at
> build time (Step 3), so the container doesn't need them at runtime.

7. Click **Apply**. Unraid will pull the image from Docker Hub and start the
   container.

8. The app will be available at `http://<unraid-ip>:3000`.

---

## Step 7 — Update Supabase auth redirect URLs

Because your app is now running at a new URL, Supabase needs to allow it for
authentication redirects.

1. Open your [Supabase dashboard](https://supabase.com/dashboard).
2. Go to **Authentication > URL Configuration**.
3. Add your Unraid URL to **Redirect URLs**:
   ```
   http://192.168.1.50:3000/**
   ```
4. Also update **Site URL** if you want it to be the primary URL.

---

## Optional — Give it a nicer URL with Nginx Proxy Manager

Instead of sharing `http://192.168.1.50:3000`, you can set up
[Nginx Proxy Manager](https://nginxproxymanager.com/) as another Unraid container
and give the app a hostname like `meals.home` on your local network, or even a
real subdomain with HTTPS if you have a domain.

NPM is available in the Unraid Community Applications store and takes about
10 minutes to set up.

---

## Optional — Access from outside your home network

If your partner needs to access the app when away from home (e.g. on mobile data):

**Option A — Cloudflare Tunnel (recommended, free)**  
No port forwarding needed. Install the `cloudflared` Docker container on Unraid
and create a tunnel via the Cloudflare Zero Trust dashboard. It gives you a
public HTTPS URL for free.

**Option B — Port forwarding**  
Forward port 3000 (or 443 via Nginx Proxy Manager) on your router to your Unraid
server. Pair with a free dynamic DNS service (e.g. DuckDNS) so the URL stays
stable. Rebuild the image with `NEXT_PUBLIC_APP_URL` set to the public URL.

> **Stripe webhooks note:** If Stripe is in use, webhooks also need a publicly
> reachable URL. A Cloudflare Tunnel or port-forwarded domain works for this.
> Update the webhook endpoint in your Stripe dashboard to point to
> `https://your-domain/api/stripe/webhook`.

---

## Updating the app

Whenever you make code changes and want to redeploy:

```powershell
# 1. Rebuild
docker build `
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co `
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... `
  --build-arg NEXT_PUBLIC_SENTRY_DSN=https://xxxx@oxxxx.ingest.sentry.io/xxxx `
  --build-arg NEXT_PUBLIC_APP_URL=http://192.168.1.50:3000 `
  --build-arg NEXT_PUBLIC_APP_VERSION=0.1.0 `
  -t meal-planner:latest `
  .

# 2. Export
docker save -o meal-planner.tar meal-planner:latest

# 3. Copy to Unraid (pick one method)
scp meal-planner.tar root@192.168.1.50:/mnt/user/appdata/

# 4. On Unraid (web terminal):
docker load -i /mnt/user/appdata/meal-planner.tar

# 5. In the Unraid Docker tab, click the container icon → "Force Update"
```

> **Tip:** A `build.ps1` script is included in `scripts/` — it reads from
> `.env.docker` automatically. See the [Automated Build & Deploy](#automated-build--deploy)
> section below.

---

---

## Automated Build & Deploy

The project includes PowerShell scripts that automate the build and deploy process:

### `scripts/build.ps1`

One-command build with validation:

```powershell
# Standard build (reads from .env.docker)
.\scripts\build.ps1

# Force fresh build (no cache)
.\scripts\build.ps1 -NoCache

# Local build with http://localhost:3000 for auth testing
.\scripts\build.ps1 -Local

# Combine flags
.\scripts\build.ps1 -Local -NoCache
```

The script:
1. Reads `.env.docker` for all build arguments
2. Optionally reads `.env.docker.local` for overrides
3. Validates that required variables are present and non-empty
4. Reads version from `VERSION` file
5. Tags the image as both `meal-planner:latest` and `meal-planner:<version>`
6. Reports success or exits with an error

> **Local testing note:** Use `-Local` when testing auth flows locally over HTTP.
> It overrides `NEXT_PUBLIC_APP_URL` to `http://localhost:3000` so that Supabase
> session cookies work correctly.

### `scripts/update-unraid.ps1`

Automates export, transfer, and load to Unraid:

```powershell
# Full deploy: export → transfer → load
.\scripts\update-unraid.ps1 -UnraidHost 192.168.1.50

# Export only (for manual transfer)
.\scripts\update-unraid.ps1 -ExportOnly

# With automatic container restart
.\scripts\update-unraid.ps1 -UnraidHost 192.168.1.50 -RestartContainer
```

### `scripts/deploy-checklist.md`

A pre-deployment checklist to catch common issues before they happen. Review this before every deployment.

---

## Version Tracking

The project uses the `VERSION` file at the project root for version tracking:

- The `VERSION` file contains the current version (e.g., `0.1.0`)
- Docker images are tagged with both `latest` and the specific version
- The `/api/health` endpoint returns the version: `{"status":"ok","version":"0.1.0",...}`
- `build.ps1` reads the version automatically

### Bumping the version

1. Update `VERSION` file (e.g., `0.1.0` → `0.2.0`)
2. Commit the change
3. Build and deploy

### Checking the running version

```bash
# On Unraid
curl http://localhost:3000/api/health
# Response: {"status":"ok","version":"0.1.0","timestamp":"..."}

# Or check Docker images
docker images meal-planner
```

---

## Rollback

If a deployment breaks something, you can quickly roll back:

### Option 1 — Previous .tar file (recommended)

```powershell
# 1. Keep the previous .tar file (update-unraid.ps1 creates meal-planner-vX.Y.Z.tar)

# 2. Load the previous version on Unraid
scp meal-planner-v0.1.0.tar root@192.168.1.50:/tmp/
ssh root@192.168.1.50
  docker load -i /tmp/meal-planner-v0.1.0.tar
  rm /tmp/meal-planner-v0.1.0.tar

# 3. Force Update in Unraid Docker tab
```

### Option 2 — Previous Docker image tag

```bash
# On Unraid, list available images
docker images meal-planner

# Tag a previous version as latest
docker tag meal-planner:0.1.0 meal-planner:latest

# Restart container via Unraid web UI (Force Update)
```

**Rollback should take < 2 minutes** if you kept the previous `.tar` file.

---

## Troubleshooting

### Build Problems

| Symptom | Likely cause | Fix |
|---|---|---|
| Build fails with `MODULE_NOT_FOUND` | Standalone output missing dependencies | Check Dockerfile for manual copies needed. Run `docker compose up` locally first to verify. |
| Sentry build errors | Invalid DSN or missing auth token | Set `SENTRY_AUTH_TOKEN` if source map uploads enabled. Or leave `NEXT_PUBLIC_SENTRY_DSN` empty to skip. |
| CRLF line ending errors | Windows line endings in container scripts | `.gitattributes` enforces LF. Run `git checkout --renormalize .` to fix. |
| Docker cache uses old code | Stale build cache | Run `.\scripts\build.ps1 -NoCache` or `docker builder prune` |
| Build args missing | Missing variables in `.env.docker` | `build.ps1` validates and reports missing args. Copy `.env.docker.example` and fill in values. |
| Build fails on `next build` | Wrong env vars or syntax error | Check the build output for the specific error. Test locally with `npm run build` first. |
| Auth loop after local build | `NEXT_PUBLIC_APP_URL` is HTTPS/remote IP | Use `.\scripts\build.ps1 -Local` for local HTTP testing. See [Step 0a](#step-0a--optional-local-docker-testing-with-auth). |

### Deployment Problems

| Symptom | Likely cause | Fix |
|---|---|---|
| Container exits immediately | Missing runtime env var | Check Unraid logs: `docker logs <container>`. Verify all runtime vars are set in Unraid config. |
| Blank page / auth loop | Supabase redirect URL not added | Add `http://<unraid-ip>:3000/**` to Supabase → Authentication → URL Configuration |
| Constant redirect to login (local Docker) | `Secure` cookie rejected over HTTP | Use `NEXT_PUBLIC_APP_URL=http://localhost:3000` locally. See [Step 0a](#step-0a--optional-local-docker-testing-with-auth). |
| Images not loading | `NEXT_PUBLIC_SUPABASE_URL` wrong at build time | Verify the URL and rebuild. Check `next.config.mjs` `remotePatterns`. |
| 500 errors on API routes | `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` missing | Add the variable in Unraid Docker settings |
| 500 on `/api/profile/preferences` | Remote Supabase missing new columns | Run `.\scripts\push-supabase-migrations.ps1` or `supabase db push` to apply pending migrations. |
| Port 3000 in use | Another service on that port | Change `HOST_PORT` in `.env.docker` (e.g., 3001). Update `NEXT_PUBLIC_APP_URL` accordingly. |
| Health check fails | `/api/health` not responding | Verify endpoint: `curl http://localhost:3000/api/health`. Should return `{"status":"ok",...}` |
| Permission denied | Non-root user can't read files | Dockerfile uses `--chown=nextjs:nodejs`. Verify no runtime writes expected. |
| Image load fails on Unraid | Not enough disk space | Check Unraid Docker vDisk size ≥ 10 GB. Run `docker system prune` to free space. |
| Image load is slow | Large .tar file (first time) | Normal for first load. Subsequent updates are faster. |

### External Access Problems

| Symptom | Likely cause | Fix |
|---|---|---|
| External user can't connect | No public access configured | Set up Cloudflare Tunnel or reverse proxy. See the [Optional — Access from outside](#optional--access-from-outside-your-home-network) section. |
| Auth fails over HTTP | OAuth requires HTTPS | Configure HTTPS via Cloudflare Tunnel or reverse proxy. Update `NEXT_PUBLIC_APP_URL` to `https://`. |
| Stripe webhooks fail | No public endpoint | Configure Stripe webhook URL: `https://your-domain/api/stripe/webhook` |
| Stale content after update | Browser caching | Hard refresh (Ctrl+Shift+R). Next.js uses content-hashed assets automatically. |

### Update Problems

| Symptom | Likely cause | Fix |
|---|---|---|
| Need to re-enter all build args | Forgetting `.env.docker` values | Use `build.ps1` which reads from `.env.docker` automatically |
| Can't tell which version is running | No version tracking | Check `/api/health` endpoint. Use `docker images meal-planner` on Unraid. |
| Can't rollback | No previous image available | Keep previous `.tar` files. Tag images with version numbers. See [Rollback](#rollback). |
| Environment drift | `.env.docker` diverges from Unraid config | Keep `.env.docker.example` as source of truth. Periodically compare with Unraid config. |
