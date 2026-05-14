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
| Docker Hub account | Host the image so Unraid can pull it | [hub.docker.com](https://hub.docker.com/) |

---

## Step 1 — Prepare your environment file

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

---

## Step 2 — Log in to Docker Hub on your PC

```
docker login
```

---

## Step 3 — Build the Docker image

Run this from the project root (where the `Dockerfile` lives).
Replace `yourusername` with your Docker Hub username.

```
docker build ^
  --build-arg NEXT_PUBLIC_SUPABASE_URL=<your-value> ^
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-value> ^
  --build-arg NEXT_PUBLIC_SENTRY_DSN=<your-value> ^
  --build-arg NEXT_PUBLIC_APP_URL=http://192.168.1.50:3000 ^
  -t yourusername/meal-planner:latest ^
  .
```

> **Tip:** If you have Docker Compose installed you can use the easier shorthand
> which reads all the values from `.env.docker` automatically:
>
> ```
> docker compose --env-file .env.docker build
> docker tag meal-planner:latest yourusername/meal-planner:latest
> ```

The build takes a few minutes the first time (it compiles the whole Next.js app).
Subsequent builds are much faster thanks to Docker's layer cache.

---

## Step 4 — Test locally (optional but recommended)

Before pushing, verify the container works on your PC:

```
docker compose --env-file .env.docker up
```

Then open `http://localhost:3000` in your browser. If everything looks good,
stop it with `Ctrl+C`.

---

## Step 5 — Push the image to Docker Hub

```
docker push yourusername/meal-planner:latest
```

---

## Step 6 — Add the container in Unraid

1. Open the Unraid web UI and go to the **Docker** tab.
2. Make sure **Docker** is enabled (toggle at the top if not).
3. Click **Add Container**.
4. Fill in the form:

| Field | Value |
|---|---|
| **Name** | `meal-planner` |
| **Repository** | `yourusername/meal-planner:latest` |
| **Network Type** | `bridge` |
| **Port Mapping** | Host: `3000` → Container: `3000` (TCP) |

5. Scroll down to **Extra Parameters** and leave it blank.

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

Whenever you make changes to the code:

```
# 1. Rebuild
docker build ^
  --build-arg NEXT_PUBLIC_SUPABASE_URL=<your-value> ^
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-value> ^
  --build-arg NEXT_PUBLIC_SENTRY_DSN=<your-value> ^
  --build-arg NEXT_PUBLIC_APP_URL=http://192.168.1.50:3000 ^
  -t yourusername/meal-planner:latest ^
  .

# 2. Push
docker push yourusername/meal-planner:latest

# 3. In Unraid — Docker tab — click the container's icon and choose "Update"
#    (or "Force Update" to pull even if the tag hasn't changed)
```

> **Tip:** Consider tagging releases with a version number
> (e.g. `yourusername/meal-planner:v1.0.1`) so you can easily roll back.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Container exits immediately | Missing runtime env var | Check Unraid logs (click the container icon > Logs) |
| Blank page / auth loop | Supabase redirect URL not added | See Step 7 |
| Images not loading | `NEXT_PUBLIC_SUPABASE_URL` wrong at build time | Rebuild the image |
| 500 errors on API routes | `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` missing | Add the variable in Unraid Docker settings |
