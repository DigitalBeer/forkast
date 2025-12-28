import { test, expect, type Page } from '@playwright/test';

// Helpers
interface EdgeReqBody {
  startDate?: string;
  filters?: {
    mealTypes?: string[];
    dietaryTypes?: string[];
  };
  skipCache?: boolean;
}

function captureEdgeFunctionRequests(page: Page) {
  const calls: EdgeReqBody[] = [];
  let routeInstalled = false;
  return {
    calls,
    async install(routeOnce = false) {
      if (routeInstalled) return;
      routeInstalled = true;
      await page.route('**/functions/v1/get-meal-suggestions', async (route) => {
        const req = route.request();
        const body: EdgeReqBody = (() => {
          try {
            return req.postDataJSON() as EdgeReqBody;
          } catch {
            return {} as EdgeReqBody;
          }
        })();
        calls.push(body);

        // Fulfill based on whether filters are present
        const isFiltered = body && body.filters && (body.filters.dietaryTypes?.length || body.filters.mealTypes?.length);
        if (!isFiltered) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
              { id: '10', name: 'Spaghetti Bolognese', image_url: '' },
              { id: '11', name: 'Chicken Curry', image_url: '' },
            ]),
          });
          return;
        }

        // Basic filtered suggestions (Edge Function filtered response shape)
        const startDate = body.startDate || '2025-01-01';
        const mealTypes = body.filters?.mealTypes?.length ? body.filters.mealTypes : ['dinner'];
        const suggestions = mealTypes.map((mt, i) => ({
          date: startDate,
          mealType: mt,
          meal: {
            id: `${100 + i}`,
            name: body.filters?.dietaryTypes?.includes('vegetarian')
              ? `Veg Option ${i + 1}`
              : `Meal Option ${i + 1}`,
            image_url: '',
            tags: body.filters?.dietaryTypes ?? [],
            last_prepared: null,
          },
          reason: 'Matches filters',
        }));

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(suggestions),
        });
        if (routeOnce) await page.unroute('**/functions/v1/get-meal-suggestions');
      });
    },
  };
}

// NOTE: Tests rely on globalSetup auth and .env as configured in playwright.config.ts
// Base URL is http://localhost:3001 per config.

test.describe('Plan page filtering (E2E)', () => {
  test('applies dietary filter, updates URL, and includes filters in Edge request', async ({ page }) => {
    const ef = captureEdgeFunctionRequests(page);
    await ef.install();

    await page.goto('/planner');
    await expect(page.getByRole('heading', { name: 'Meal Suggestions' })).toBeVisible();

    // Click vegetarian filter
    await page.getByRole('button', { name: 'vegetarian' }).click();

    // URL should include dietary
    await expect(page).toHaveURL(/dietary=vegetarian/);

    // A filtered request should be made including dietaryTypes
    await expect.poll(() => {
      const match = ef.calls.find((b) => Array.isArray(b?.filters?.dietaryTypes) && b.filters.dietaryTypes.includes('vegetarian'));
      return !!match;
    }, { timeout: 10_000 }).toBe(true);

    // Clear Filters button visible now
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible();
  });

  test('applies meal type filter, updates URL, and includes mealTypes in Edge request', async ({ page }) => {
    const ef = captureEdgeFunctionRequests(page);
    await ef.install();

    await page.goto('/planner');
    await expect(page.getByRole('heading', { name: 'Meal Suggestions' })).toBeVisible();

    // Select Lunch
    await page.getByRole('button', { name: 'Lunch' }).click();

    // URL should include meals=lunch
    await expect(page).toHaveURL(/meals=lunch/);

    // Edge request should include mealTypes ["lunch"]
    await expect.poll(() => {
      const match = ef.calls.find((b) => Array.isArray(b?.filters?.mealTypes) && b.filters.mealTypes.length === 1 && b.filters.mealTypes[0] === 'lunch');
      return !!match;
    }, { timeout: 10_000 }).toBe(true);
  });

  test('clear filters resets URL and UI state', async ({ page }) => {
    const ef = captureEdgeFunctionRequests(page);
    await ef.install();

    await page.goto('/planner?dietary=vegan&meals=breakfast');
    await expect(page.getByRole('heading', { name: 'Meal Suggestions' })).toBeVisible({ timeout: 10000 });

    // Ensure a filtered call happened first
    await expect.poll(() => ef.calls.some((b) => b?.filters)).toBeTruthy();

    // Clear filters
    await page.getByRole('button', { name: 'Clear filters' }).click();

    // URL should be clean (no dietary or meals params)
    await expect(page).not.toHaveURL(/(dietary=|meals=)/);

    // Clear button should disappear (filters are cleared)
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeHidden();
    
    // All meal type buttons should be active (default state)
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
  });

  test('restores filters from URL on initial load', async ({ page }) => {
    const ef = captureEdgeFunctionRequests(page);
    await ef.install();

    await page.goto('/planner?dietary=vegetarian,gluten-free&meals=lunch');

    // Expect a filtered call with both dietaryTypes and mealTypes
    await expect.poll(() => {
      const match = ef.calls.find((b) => {
        const d = b?.filters?.dietaryTypes || [];
        const m = b?.filters?.mealTypes || [];
        return Array.isArray(d) && d.includes('vegetarian') && d.includes('gluten-free') && Array.isArray(m) && m.length === 1 && m[0] === 'lunch';
      });
      return !!match;
    }, { timeout: 10_000 }).toBe(true);

    // Clear Filters should be visible since filters are active
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible();
  });
});
