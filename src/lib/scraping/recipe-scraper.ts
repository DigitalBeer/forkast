/**
 * Recipe Scraper - Main Entry Point
 * Coordinates parsing strategies and provides a unified interface for recipe extraction
 */

import { parseSchemaOrgRecipe } from './parsers/schema-org';
import { parseHtmlFallback } from './parsers/html-fallback';
import type { ScrapingResult, ScrapedRecipe } from './types';
import { ScrapingErrorCode, ScrapingErrorMessages } from './types';

// User-Agents to avoid being blocked by recipe sites
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

/**
 * Validates URL format and prevents SSRF
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

    const hostname = url.hostname.toLowerCase();
    
    // Block loopback and local hostnames
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]' ||
      hostname.endsWith('.local')
    ) {
      return false;
    }

    // Block common cloud metadata services
    if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
      return false;
    }

    // Block private IP ranges (simple check for IPv4 only for now)
    // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    if (
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname))
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Scrapes recipe data from a URL
 * Tries schema.org JSON-LD first, then falls back to HTML parsing
 */
export async function scrapeRecipe(url: string): Promise<ScrapingResult> {
  // Validate URL and prevent SSRF
  if (!isValidUrl(url)) {
    return {
      success: false,
      error: {
        code: ScrapingErrorCode.INVALID_URL,
        message: ScrapingErrorMessages[ScrapingErrorCode.INVALID_URL],
      },
    };
  }

  try {
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    
    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      // Timeout to prevent hanging connections
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: ScrapingErrorCode.NETWORK_ERROR,
          message: `Failed to fetch page: ${response.status} ${response.statusText}`,
        },
      };
    }

    const html = await response.text();
    
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
