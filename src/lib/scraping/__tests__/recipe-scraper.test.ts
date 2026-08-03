/**
 * Tests for the recipe scraper's SSRF guard and fetch pipeline.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { lookupMock } = vi.hoisted(() => ({ lookupMock: vi.fn() }));

vi.mock('node:dns', () => ({
  default: {
    promises: {
      lookup: lookupMock,
    },
  },
}));

import { isValidUrl, scrapeRecipe } from '../recipe-scraper';
import { ScrapingErrorCode } from '../types';

describe('isValidUrl', () => {
  beforeEach(() => {
    lookupMock.mockReset();
    lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
  });

  it('rejects non-http(s) protocols', async () => {
    expect(await isValidUrl('ftp://example.com')).toBe(false);
    expect(await isValidUrl('file:///etc/passwd')).toBe(false);
  });

  it('rejects loopback and local hostnames', async () => {
    expect(await isValidUrl('http://localhost/')).toBe(false);
    expect(await isValidUrl('http://foo.localhost/')).toBe(false);
    expect(await isValidUrl('http://foo.local/')).toBe(false);
    expect(await isValidUrl('http://127.0.0.1/')).toBe(false);
  });

  it('rejects the cloud metadata address', async () => {
    expect(await isValidUrl('http://169.254.169.254/')).toBe(false);
    expect(await isValidUrl('http://metadata.google.internal/')).toBe(false);
  });

  it('rejects RFC1918 private ranges', async () => {
    expect(await isValidUrl('http://10.0.0.5/')).toBe(false);
    expect(await isValidUrl('http://192.168.1.1/')).toBe(false);
    expect(await isValidUrl('http://172.16.0.1/')).toBe(false);
    expect(await isValidUrl('http://172.31.255.255/')).toBe(false);
    expect(await isValidUrl('http://172.32.0.1/')).toBe(true); // just outside the /12
  });

  it('rejects 0.0.0.0 and CGNAT space', async () => {
    expect(await isValidUrl('http://0.0.0.0/')).toBe(false);
    expect(await isValidUrl('http://100.64.0.1/')).toBe(false);
  });

  it('rejects decimal/octal/hex loopback literals (normalized by the URL parser)', async () => {
    expect(await isValidUrl('http://2130706433/')).toBe(false); // 127.0.0.1 as decimal
    expect(await isValidUrl('http://0177.0.0.1/')).toBe(false); // 127.0.0.1 as octal
    expect(await isValidUrl('http://0x7f.0.0.1/')).toBe(false); // 127.0.0.1 as hex
  });

  it('rejects IPv6 loopback and IPv4-mapped private addresses', async () => {
    expect(await isValidUrl('http://[::1]/')).toBe(false);
    expect(await isValidUrl('http://[::ffff:127.0.0.1]/')).toBe(false);
    expect(await isValidUrl('http://[::ffff:169.254.169.254]/')).toBe(false);
  });

  it('accepts a normal public hostname that resolves to a public IP', async () => {
    lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    expect(await isValidUrl('https://example.com/recipe')).toBe(true);
  });

  it('rejects a public-looking hostname that resolves to a private IP', async () => {
    lookupMock.mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);
    expect(await isValidUrl('https://sneaky.example.com/')).toBe(false);
  });

  it('rejects a hostname when any resolved address is private', async () => {
    lookupMock.mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '10.0.0.1', family: 4 },
    ]);
    expect(await isValidUrl('https://multi-homed.example.com/')).toBe(false);
  });

  it('rejects when DNS resolution fails', async () => {
    lookupMock.mockRejectedValue(new Error('ENOTFOUND'));
    expect(await isValidUrl('https://does-not-exist.invalid/')).toBe(false);
  });
});

describe('scrapeRecipe', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    lookupMock.mockReset();
    lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('rejects a redirect to a blocked address', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: 'http://169.254.169.254/latest/meta-data' },
      }),
    );

    const result = await scrapeRecipe('https://example.com/recipe');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe(ScrapingErrorCode.INVALID_URL);
  });

  it('rejects a non-HTML response', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const result = await scrapeRecipe('https://example.com/recipe.json');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe(ScrapingErrorCode.PARSING_FAILED);
  });

  it('rejects a response exceeding the size cap', async () => {
    const hugeBody = 'x'.repeat(3 * 1024 * 1024); // 3MB > 2MB cap
    global.fetch = vi.fn().mockResolvedValue(
      new Response(hugeBody, {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    );

    const result = await scrapeRecipe('https://example.com/recipe');
    expect(result.success).toBe(false);
    expect(result.error?.message).toMatch(/size/i);
  });

  it('follows a valid redirect and parses the final page', async () => {
    const html = `
      <html><head><script type="application/ld+json">
        {"@type":"Recipe","name":"Redirected Recipe","recipeIngredient":["1 egg"],"recipeInstructions":"Cook it"}
      </script></head></html>
    `;

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 301,
          headers: { location: 'https://final.example.com/recipe' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(html, {
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
      );

    const result = await scrapeRecipe('https://example.com/recipe');
    expect(result.success).toBe(true);
    expect(result.recipe?.name).toBe('Redirected Recipe');
  });
});
