import { test, expect, type Locator, type Page } from '@playwright/test';
import { waitForPageLoad } from './helpers/test-utils';

const SOURCE_MEAL = 'Drag Drop Source Meal';
const TARGET_MEAL = 'Drag Drop Target Meal';

async function mockPlannerSuggestions(page: Page) {
  await page.route('**/api/profile/preferences', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ dietaryPreferences: [] }),
    });
  });

  await page.route('**/functions/v1/get-meal-suggestions', async route => {
    const request = route.request();
    let startDate = '2026-05-18';

    try {
      const body = request.postDataJSON() as { startDate?: string };
      if (body.startDate) startDate = body.startDate;
    } catch {
      // Keep default date for non-JSON requests.
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          date: startDate,
          mealType: 'breakfast',
          meal: {
            id: 'drag-drop-source-meal',
            name: SOURCE_MEAL,
            image_url: '',
            meal_type: 'Breakfast',
            last_prepared: null,
          },
          reason: 'E2E fixture',
        },
        {
          date: startDate,
          mealType: 'lunch',
          meal: {
            id: 'drag-drop-target-meal',
            name: TARGET_MEAL,
            image_url: '',
            meal_type: 'Lunch',
            last_prepared: null,
          },
          reason: 'E2E fixture',
        },
      ]),
    });
  });
}

async function dragTo(page: Page, source: Locator, target: Locator) {
  await expect(source).toBeVisible();
  await expect(target).toBeVisible();

  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error('Unable to resolve drag source or target bounds.');
  }

  const sourceX = sourceBox.x + sourceBox.width / 2;
  const sourceY = sourceBox.y + sourceBox.height / 2;
  const targetX = targetBox.x + targetBox.width / 2;
  const targetY = targetBox.y + targetBox.height / 2;

  await page.mouse.move(sourceX, sourceY);
  await page.mouse.down();
  await page.waitForTimeout(100); // allow react-dnd to register drag start
  await page.mouse.move(sourceX + 5, sourceY + 5); // small initial movement to trigger dragstart
  await page.mouse.move(targetX, targetY, { steps: 20 });
  await page.waitForTimeout(100); // allow react-dnd to process the drop
  await page.mouse.up();
}

async function openPlannerWithFixtures(page: Page) {
  await mockPlannerSuggestions(page);
  await page.goto('/planner');
  await waitForPageLoad(page);
  await expect(
    page.getByRole('heading', { name: 'Weekly Calendar' }),
  ).toBeVisible();
  await expect(page.getByText(SOURCE_MEAL).first()).toBeVisible();
  await expect(page.getByText(TARGET_MEAL).first()).toBeVisible();

  const weekStart = await page.getByTestId('plan-week-start').inputValue();
  const sourceSlot = page.getByTestId(`meal-slot-${weekStart}-Breakfast`);
  const targetSlot = page.getByTestId(`meal-slot-${weekStart}-Lunch`);

  return { sourceSlot, targetSlot };
}

async function seedOccupiedSlots(page: Page) {
  const { sourceSlot, targetSlot } = await openPlannerWithFixtures(page);

  await dragTo(page, page.getByText(SOURCE_MEAL).first(), sourceSlot);
  await expect(sourceSlot).toContainText(SOURCE_MEAL);

  await dragTo(page, page.getByText(TARGET_MEAL).first(), targetSlot);
  await expect(targetSlot).toContainText(TARGET_MEAL);

  return { sourceSlot, targetSlot };
}

test.describe('Drag-and-drop polish', () => {
  test('drag meal to occupied slot, swap, undo, and restore original slots', async ({
    page,
  }) => {
    const { sourceSlot, targetSlot } = await seedOccupiedSlots(page);

    await dragTo(page, sourceSlot.getByText(SOURCE_MEAL), targetSlot);

    await expect(page.getByTestId('drop-confirmation-dialog')).toBeVisible();
    await page.getByTestId('swap-button').click();

    await expect(sourceSlot).toContainText(TARGET_MEAL);
    await expect(targetSlot).toContainText(SOURCE_MEAL);
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: 'Swap done.' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Undo' }).click();

    await expect(sourceSlot).toContainText(SOURCE_MEAL);
    await expect(targetSlot).toContainText(TARGET_MEAL);
  });

  test('drag meal to occupied slot and replace target while source becomes empty', async ({
    page,
  }) => {
    const { sourceSlot, targetSlot } = await seedOccupiedSlots(page);

    await dragTo(page, sourceSlot.getByText(SOURCE_MEAL), targetSlot);

    await expect(page.getByTestId('drop-confirmation-dialog')).toBeVisible();
    await page.getByTestId('replace-button').click();

    await expect(targetSlot).toContainText(SOURCE_MEAL);
    await expect(targetSlot).not.toContainText(TARGET_MEAL);
    await expect(sourceSlot).toContainText('Drop meal here');
    await expect(sourceSlot).not.toContainText(SOURCE_MEAL);
  });

  test('drag meal to occupied slot and press Esc to dismiss with no change', async ({
    page,
  }) => {
    const { sourceSlot, targetSlot } = await seedOccupiedSlots(page);

    await dragTo(page, sourceSlot.getByText(SOURCE_MEAL), targetSlot);

    await expect(page.getByTestId('drop-confirmation-dialog')).toBeVisible();
    await page.keyboard.press('Escape');

    await expect(page.getByTestId('drop-confirmation-dialog')).toBeHidden();
    await expect(sourceSlot).toContainText(SOURCE_MEAL);
    await expect(targetSlot).toContainText(TARGET_MEAL);
  });
});
