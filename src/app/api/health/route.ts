import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Docker container healthchecks.
 * Returns 200 OK with status, version, timestamp, and runtime checks.
 *
 * Used by docker-compose.yml healthcheck:
 *   wget -qO- http://localhost:3000/api/health || exit 1
 *
 * Version is sourced from the VERSION file read at build time
 * and embedded as NEXT_PUBLIC_APP_VERSION, or falls back to '0.1.0'.
 *
 * Runtime checks verify that critical environment variables are present.
 * If any check fails, returns 503 Service Unavailable so the container
 * is marked unhealthy and can be restarted automatically.
 */
export async function GET() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0';

  const checks = {
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  const allHealthy = Object.values(checks).every(Boolean);

  return NextResponse.json(
    {
      status: allHealthy ? 'ok' : 'degraded',
      version,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allHealthy ? 200 : 503 },
  );
}
