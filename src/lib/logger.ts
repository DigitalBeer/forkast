import * as Sentry from '@sentry/nextjs';

// Sentry is already initialized globally via sentry.{client,server,edge}.config.ts
// (Next.js's Sentry integration loads these automatically), so this file only
// needs to route errors to it -- no separate init here.

function extractSafeDetails(error: unknown): { message: string; code?: string } {
  if (error instanceof Error) {
    return { message: error.message };
  }
  if (error && typeof error === 'object') {
    const e = error as { message?: unknown; code?: unknown };
    return {
      message: typeof e.message === 'string' ? e.message : 'Unknown error',
      code: typeof e.code === 'string' ? e.code : undefined,
    };
  }
  return { message: String(error) };
}

/**
 * Log an error with context. Reports to Sentry in all environments; only
 * echoes to the console outside production. Never logs a raw error object
 * (which, for Supabase errors, can contain query fragments) -- only its
 * message and code.
 */
export function logError(context: string, error: unknown): void {
  const { message, code } = extractSafeDetails(error);

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${context}]`, message, code ? `(code: ${code})` : '');
  }

  Sentry.captureException(error instanceof Error ? error : new Error(message), {
    tags: { context },
    extra: code ? { code } : undefined,
  });
}

/** Report a non-error condition worth tracking (e.g. a recoverable state). */
export function logWarn(context: string, message: string): void {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[${context}]`, message);
  }
  Sentry.captureMessage(message, { level: 'warning', tags: { context } });
}
