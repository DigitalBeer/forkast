import { test, expect } from '@playwright/test';

const waitForPageLoad = async (page) => {
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.waitForLoadState('domcontentloaded'),
  ]);
};

test.describe('Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (['log', 'warning', 'error'].includes(msg.type())) {
        console.log(`[browser ${msg.type()}] ${msg.text()}`);
      }
    });
  });

  test('shows login link when not authenticated', async ({ page, context }) => {
    // Clear auth state to simulate logged-out user
    await context.clearCookies();
    await page.goto('/');
    await waitForPageLoad(page);

    // Should see login link, not profile menu
    const loginLink = page.getByTestId('login-link');
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveText(/Login/);

    // Profile menu button should not be visible
    await expect(page.getByTestId('profile-menu-button')).not.toBeVisible();
  });

  test('shows profile menu when authenticated', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Should see profile menu button (user icon)
    const profileMenuBtn = page.getByTestId('profile-menu-button');
    await expect(profileMenuBtn).toBeVisible();

    // Login link should not be visible
    await expect(page.getByTestId('login-link')).not.toBeVisible();
  });

  test('can navigate to profile page from menu', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Open profile dropdown
    await page.getByTestId('profile-menu-button').click();

    // Click profile link
    await page.getByTestId('profile-link').click();

    // Should navigate to profile page
    await page.waitForURL('**/profile');
    await expect(page.locator('h1')).toHaveText('Profile Settings');
  });

  test('can logout from profile menu', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Open profile dropdown
    await page.getByTestId('profile-menu-button').click();

    // Click logout
    await page.getByTestId('logout-button').click();

    // Should redirect to login page
    await page.waitForURL('**/login');
  });

  test('profile page displays user email (read-only)', async ({ page }) => {
    await page.goto('/profile');
    await waitForPageLoad(page);

    // Email field should be visible and disabled
    const emailInput = page.getByTestId('profile-email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toBeDisabled();
    // Should contain an email format
    const emailValue = await emailInput.inputValue();
    expect(emailValue).toMatch(/@/);
  });

  test('can update display name', async ({ page }) => {
    await page.goto('/profile');
    await waitForPageLoad(page);

    // Update display name
    const fullNameInput = page.getByTestId('profile-fullname');
    await expect(fullNameInput).toBeVisible();
    
    const newName = `Test User ${Date.now()}`;
    await fullNameInput.fill(newName);

    // Save changes
    await page.getByTestId('save-profile-button').click();

    // Should see success message
    await expect(page.getByTestId('profile-success')).toBeVisible();
    await expect(page.getByTestId('profile-success')).toHaveText('Profile updated successfully');
  });

  test('can toggle dietary preferences', async ({ page }) => {
    await page.goto('/profile');
    await waitForPageLoad(page);

    // Click on Vegetarian preference
    const vegetarianBtn = page.getByTestId('dietary-vegetarian');
    await expect(vegetarianBtn).toBeVisible();
    
    // Get initial state
    const initialClass = await vegetarianBtn.getAttribute('class');
    const wasSelected = initialClass?.includes('bg-blue-100');

    // Toggle it
    await vegetarianBtn.click();

    // Verify class changed
    const newClass = await vegetarianBtn.getAttribute('class');
    if (wasSelected) {
      expect(newClass).not.toContain('bg-blue-100');
    } else {
      expect(newClass).toContain('bg-blue-100');
    }

    // Save and verify success
    await page.getByTestId('save-profile-button').click();
    await expect(page.getByTestId('profile-success')).toBeVisible();
  });

  test('can change measurement system preference', async ({ page }) => {
    await page.goto('/profile');
    await waitForPageLoad(page);

    // Find measurement system radios
    const metricRadio = page.getByTestId('measurement-metric');
    const imperialRadio = page.getByTestId('measurement-imperial');

    await expect(metricRadio).toBeVisible();
    await expect(imperialRadio).toBeVisible();

    // Toggle to imperial
    await imperialRadio.click();
    await expect(imperialRadio).toBeChecked();

    // Save changes
    await page.getByTestId('save-profile-button').click();
    await expect(page.getByTestId('profile-success')).toBeVisible();

    // Note: Persistence test skipped - requires DB migration to be applied
    // Once migration is applied, uncomment below to verify persistence:
    // await page.reload();
    // await waitForPageLoad(page);
    // await expect(page.getByTestId('measurement-imperial')).toBeChecked();
  });

  test('shows subscription status and link to account', async ({ page }) => {
    await page.goto('/profile');
    await waitForPageLoad(page);

    // Should show subscription status (Free or Premium)
    const subscriptionText = page.locator('text=/Free Plan|Premium Plan/');
    await expect(subscriptionText).toBeVisible();

    // Should have link to manage subscription
    const manageLink = page.getByTestId('manage-subscription-link');
    await expect(manageLink).toBeVisible();
    await expect(manageLink).toHaveAttribute('href', '/account');
  });

  test('shows change password link', async ({ page }) => {
    await page.goto('/profile');
    await waitForPageLoad(page);

    // Should have change password link
    const changePasswordLink = page.getByTestId('change-password-link');
    await expect(changePasswordLink).toBeVisible();
    await expect(changePasswordLink).toHaveAttribute('href', '/reset-password');
  });

  test('change password link navigates to reset-password page', async ({ page }) => {
    await page.goto('/profile');
    await waitForPageLoad(page);

    // Click change password link
    await page.getByTestId('change-password-link').click();

    // Should navigate to reset-password page
    await page.waitForURL('**/reset-password');
  });

  test('can initiate email change', async ({ page }) => {
    await page.goto('/profile');
    await waitForPageLoad(page);

    // Should see edit email button
    const editEmailBtn = page.getByTestId('edit-email-button');
    await expect(editEmailBtn).toBeVisible();

    // Click edit email button
    await editEmailBtn.click();

    // Should show email edit form
    await expect(page.getByTestId('new-email-input')).toBeVisible();
    await expect(page.getByTestId('cancel-email-button')).toBeVisible();
    await expect(page.getByTestId('save-email-button')).toBeVisible();

    // Enter new email
    const newEmail = 'newemail@example.com';
    await page.getByTestId('new-email-input').fill(newEmail);

    // Save new email
    await page.getByTestId('save-email-button').click();

    // Should show verification message
    await expect(page.locator('text=/Verification link sent/')).toBeVisible();
    
    // Should return to read-only view
    await expect(page.getByTestId('profile-email')).toBeVisible();
    await expect(page.getByTestId('edit-email-button')).toBeVisible();
  });

  test('can cancel email change', async ({ page }) => {
    await page.goto('/profile');
    await waitForPageLoad(page);

    // Start email change
    await page.getByTestId('edit-email-button').click();
    
    // Enter some text
    await page.getByTestId('new-email-input').fill('test@example.com');

    // Cancel edit
    await page.getByTestId('cancel-email-button').click();

    // Should return to read-only view
    await expect(page.getByTestId('profile-email')).toBeVisible();
    await expect(page.getByTestId('edit-email-button')).toBeVisible();
    await expect(page.getByTestId('new-email-input')).not.toBeVisible();
  });

  test('email validation works', async ({ page }) => {
    await page.goto('/profile');
    await waitForPageLoad(page);

    // Start email change
    await page.getByTestId('edit-email-button').click();

    // Try to save without entering email
    await expect(page.getByTestId('save-email-button')).toBeDisabled();

    // Enter invalid email
    await page.getByTestId('new-email-input').fill('invalid-email');
    
    // Save button should be disabled for invalid email
    await expect(page.getByTestId('save-email-button')).toBeDisabled();
  });
});
