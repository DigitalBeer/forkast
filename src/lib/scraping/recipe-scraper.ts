/**
 * Recipe Scraper - Main Entry Point
 * Coordinates parsing strategies and provides a unified interface for recipe extraction
 */

import dns from 'node:dns';
import net from 'node:net';
import { parseSchemaOrgRecipe } from './parsers/schema-org';
import { parseHtmlFallback } from './parsers/html-fallback';
import type { ScrapingResult, ScrapedRecipe, ScrapingError } from './types';
import { ScrapingErrorCode, ScrapingErrorMessages } from './types';

// User-Agents to avoid being blocked by recipe sites
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_REDIRECTS = 3;

/**
 * Checks a single resolved (or literal) IP address against private/reserved
 * ranges: loopback, RFC1918 private space, link-local (incl. cloud metadata
 * at 169.254.169.254), CGNAT, and unspecified/broadcast addresses.
 */
function isBlockedIp(ip: string): boolean {
  if (ip.includes(':')) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) return true;

    // IPv4-mapped IPv6, dotted form: ::ffff:a.b.c.d
    const dotted = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (dotted) return isBlockedIp(dotted[1]);

    // IPv4-mapped IPv6, canonical hex form: ::ffff:xxxx:xxxx
    const hexMapped = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hexMapped) {
      const hi = parseInt(hexMapped[1], 16);
      const lo = parseInt(hexMapped[2], 16);
      const a = (hi >> 8) & 0xff;
      const b = hi & 0xff;
      const c = (lo >> 8) & 0xff;
      const d = lo & 0xff;
      return isBlockedIp(`${a}.${b}.${c}.${d}`);
    }

    return false;
  }

  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(n => Number.isNaN(n) || n < 0 || n > 255)) {
    return false;
  }
  const [a, b] = parts;

  if (a === 127) return true; // loopback 127.0.0.0/8
  if (a === 0) return true; // "this network" 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 (link-local, cloud metadata)
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (CGNAT)

  return false;
}

/**
 * Validates URL format and prevents SSRF.
 *
 * This resolves the hostname and checks every returned address, closing the
 * gap where a public-looking domain resolves to a private IP. It does not
 * pin the connection to the validated address, so a DNS answer that changes
 * between this check and the actual `fetch` (classic TOCTOU/rebinding) is
 * still possible in theory. Full protection needs a custom fetch dispatcher
 * that connects to the already-resolved IP; not implemented here.
 */
export async function isValidUrl(urlString: string): Promise<boolean> {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

    const hostname = url.hostname.toLowerCase();
    const bareHost =
      hostname.startsWith('[') && hostname.endsWith(']')
        ? hostname.slice(1, -1)
        : hostname;

    if (
      bareHost === 'localhost' ||
      bareHost.endsWith('.localhost') ||
      bareHost.endsWith('.local') ||
      bareHost === 'metadata.google.internal'
    ) {
      return false;
    }

    if (net.isIP(bareHost)) {
      return !isBlockedIp(bareHost);
    }

    try {
      const addresses = await dns.promises.lookup(bareHost, { all: true });
      if (addresses.length === 0) return false;
      return !addresses.some(a => isBlockedIp(a.address));
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}

async function readBodyWithLimit(
  response: Response,
  limit: number,
): Promise<string | null> {
  const reader = response.body?.getReader();
  if (!reader) {
    // Environments without a streamable body (shouldn't happen for http/https
    // fetch responses) — fall back to reading it all at once.
    return response.text();
  }

  const decoder = new TextDecoder();
  let result = '';
  let total = 0;
  let chunk = await reader.read();

  while (!chunk.done) {
    total += chunk.value.byteLength;
    if (total > limit) {
      await reader.cancel();
      return null;
    }
    result += decoder.decode(chunk.value, { stream: true });
    chunk = await reader.read();
  }
  result += decoder.decode();
  return result;
}

async function fetchHtmlWithSsrfGuard(
  initialUrl: string,
): Promise<{ html: string } | { error: ScrapingError }> {
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  let currentUrl = initialUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!(await isValidUrl(currentUrl))) {
      return {
        error: {
          code: ScrapingErrorCode.INVALID_URL,
          message: ScrapingErrorMessages[ScrapingErrorCode.INVALID_URL],
        },
      };
    }

    const response = await fetch(currentUrl, {
      headers: {
        'User-Agent': userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(10000),
      redirect: 'manual',
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        return {
          error: {
            code: ScrapingErrorCode.NETWORK_ERROR,
            message: 'Redirect response had no Location header',
          },
        };
      }
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    if (!response.ok) {
      return {
        error: {
          code: ScrapingErrorCode.NETWORK_ERROR,
          message: `Failed to fetch page: ${response.status} ${response.statusText}`,
        },
      };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
      return {
        error: {
          code: ScrapingErrorCode.PARSING_FAILED,
          message: ScrapingErrorMessages[ScrapingErrorCode.PARSING_FAILED],
        },
      };
    }

    const html = await readBodyWithLimit(response, MAX_RESPONSE_BYTES);
    if (html === null) {
      return {
        error: {
          code: ScrapingErrorCode.NETWORK_ERROR,
          message: 'Response exceeded the maximum allowed size',
        },
      };
    }

    return { html };
  }

  return {
    error: {
      code: ScrapingErrorCode.NETWORK_ERROR,
      message: 'Too many redirects',
    },
  };
}

/**
 * Scrapes recipe data from a URL
 * Tries schema.org JSON-LD first, then falls back to HTML parsing
 */
export async function scrapeRecipe(url: string): Promise<ScrapingResult> {
  try {
    const fetched = await fetchHtmlWithSsrfGuard(url);
    if ('error' in fetched) {
      return { success: false, error: fetched.error };
    }
    const { html } = fetched;

    // Try schema.org JSON-LD first (preferred, more reliable)
    let recipe: ScrapedRecipe | null = parseSchemaOrgRecipe(html, url);

    // Fall back to HTML parsing if no JSON-LD found
    if (!recipe) {
      recipe = parseHtmlFallback(html, url);
    }

    if (recipe) {
      return {
        success: true,
        recipe,
      };
    }

    // Could not extract recipe data
    return {
      success: false,
      error: {
        code: ScrapingErrorCode.PARSING_FAILED,
        message: ScrapingErrorMessages[ScrapingErrorCode.PARSING_FAILED],
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return {
        success: false,
        error: {
          code: ScrapingErrorCode.NETWORK_ERROR,
          message: 'Request timed out. The site might be slow or blocked.',
        },
      };
    }

    console.error('Recipe scraping error:', error);
    return {
      success: false,
      error: {
        code: ScrapingErrorCode.NETWORK_ERROR,
        message: error instanceof Error ? error.message : ScrapingErrorMessages[ScrapingErrorCode.NETWORK_ERROR],
      },
    };
  }
}

// Re-export types for convenience
export type { ScrapedRecipe, ScrapingResult, ScrapingError } from './types';
export { ScrapingErrorCode, ScrapingErrorMessages } from './types';
