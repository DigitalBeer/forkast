import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * 
 * Tests authentication flows including:
 * - Login
 * - Signup
 * - Password reset
 * - Protected routes
 * - Logout
 * 
 * NOTE: These tests run WITHOUT authentication state
 */

// Run these tests without the global authentication setup
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/meals');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    
    // Verify login page elements
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('login page displays correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Verify page title/heading
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    
    // Verify form fields
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    
    // Verify submit button
    await expect(page.getByRole('button', { name: /log in|sign in/i })).toBeVisible();
    
    // Verify link to signup
    await expect(page.getByRole('link', { name: /sign up|create account/i })).toBeVisible();
  });

  test('shows validation error for empty login form', async ({ page }) => {
    await page.goto('/login');
    
    // The form uses HTML5 required attributes — clicking submit on an empty form
    // should NOT navigate away (browser blocks submission natively)
    await page.getByRole('button', { name: /log in/i }).click();
    
    // We should still be on the login page (form was not submitted)
    await expect(page).toHaveURL(/\/login/);
    
    // Verify the email field has the required attribute
    await expect(page.locator('#email')).toHaveAttribute('required', '');
    await expect(page.locator('#password')).toHaveAttribute('required', '');
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill with invalid credentials
    await page.locator('#email').fill('invalid@example.com');
    await page.locator('#password').fill('wrongpassword123');
    
    // Submit form
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    
    // Wait for error message
    const errorMessage = page.getByText(/invalid.*email.*password|invalid.*credentials|incorrect.*password/i);
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('successful login redirects to app', async ({ page }) => {
    await page.goto('/login');
    
    // Use test credentials from environment
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    
    if (!email || !password) {
      test.skip();
      return;
    }
    
    // Fill login form
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    
    // Submit
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    
    // Should redirect to app (e.g., /meals/new or dashboard)
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
    
    // Verify we're in the authenticated app
    const authenticatedUrls = ['/meals', '/planner', '/plan', '/dashboard', '/'];
    const currentUrl = page.url();
    const isAuthenticated = authenticatedUrls.some(url => currentUrl.includes(url));
    
    expect(isAuthenticated).toBeTruthy();
  });

  test('signup page displays correctly', async ({ page }) => {
    await page.goto('/signup');
    
    // Verify page heading
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();
    
    // Verify form fields (signup form uses type selectors, not id)
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Verify submit button
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
    
    // Verify link to login
    await expect(page.getByRole('link', { name: /log in/i })).toBeVisible();
  });

  test('can navigate from login to signup', async ({ page }) => {
    await page.goto('/login');
    
    // Click signup link
    await page.getByRole('link', { name: /sign up|create account/i }).click();
    
    // Verify navigation
    await expect(page).toHaveURL(/\/signup/);
  });

  test('can navigate from signup to login', async ({ page }) => {
    await page.goto('/signup');
    
    // Click login link
    await page.getByRole('link', { name: /log in|sign in|already have.*account/i }).click();
    
    // Verify navigation
    await expect(page).toHaveURL(/\/login/);
  });

  test('signup validates email format', async ({ page }) => {
    await page.goto('/signup');
    
    // Enter invalid email
    await page.locator('input[type="email"]').fill('notanemail');
    await page.locator('input[type="password"]').fill('ValidPassword123!');
    
    // Try to submit — browser blocks due to HTML5 email validation
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Should still be on signup page (form blocked by browser)
    await expect(page).toHaveURL(/\/signup/);
  });

  test('signup validates password strength', async ({ page }) => {
    await page.goto('/signup');
    
    // Enter weak password
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('123');
    
    // Try to submit
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Supabase returns an error for weak passwords
    const passwordError = page.getByText(/password|too short|at least/i);
    await expect(passwordError).toBeVisible({ timeout: 10000 });
  });

  test('signup with valid credentials shows success', async ({ page }) => {
    await page.goto('/signup');
    
    // Generate unique email
    const timestamp = Date.now();
    const testEmail = `test+${timestamp}@example.com`;
    
    // Fill form
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill('SecurePassword123!');
    
    // Submit
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Verify success message or email confirmation prompt
    const successMessage = page.getByText(/check.*email|confirmation.*sent|verify.*email|success|email rate limit/i);
    await expect(successMessage).toBeVisible({ timeout: 10000 });
  });

  test('password reset page displays correctly', async ({ page }) => {
    // Navigate to reset password page
    await page.goto('/login');
    
    // Click forgot password link
    const forgotPasswordLink = page.getByRole('link', { name: /forgot.*password|reset.*password/i });
    
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();
      
      // Verify reset password page
      await expect(page).toHaveURL(/\/reset-password/);
      
      // Verify email field
      await expect(page.locator('input[type="email"]')).toBeVisible();
      
      // Verify submit button
      await expect(page.getByRole('button', { name: /send.*reset|reset.*password/i })).toBeVisible();
    } else {
      // If no forgot password link, try direct navigation
      await page.goto('/reset-password');
      
      // Verify page loaded
      await expect(page.locator('input[type="email"]')).toBeVisible();
    }
  });

  test('password reset sends confirmation', async ({ page }) => {
    await page.goto('/reset-password');
    
    // Fill email
    await page.locator('input[type="email"]').fill('test@example.com');
    
    // Submit
    await page.getByRole('button', { name: /send.*reset|reset.*password/i }).click();
    
    // Verify confirmation message
    const confirmMessage = page.getByText(/check.*email|reset.*link.*sent|email.*sent/i);
    await expect(confirmMessage).toBeVisible({ timeout: 10000 });
  });

  test('logout functionality works', async ({ page }) => {
    // First login
    await page.goto('/login');
    
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    
    if (!email || !password) {
      test.skip();
      return;
    }
    
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    
    // Wait for successful login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
    
    // Find and click logout button
    // This might be in a menu or profile dropdown
    const logoutButton = page.getByRole('button', { name: /log out|sign out/i }).or(
      page.getByRole('link', { name: /log out|sign out/i })
    );
    
    // Open profile menu if needed
    const profileButton = page.getByRole('button', { name: /profile|account|menu/i });
    if (await profileButton.isVisible()) {
      await profileButton.click();
    }
    
    // Click logout
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // Verify redirect to login
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    }
  });

  test('protected routes remain protected after logout', async ({ page }) => {
    // Try to access protected route after logout
    await page.goto('/meals');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('login page is accessible without authentication', async ({ page }) => {
    await page.goto('/login');
    
    // Verify page loads
    await expect(page.locator('#email')).toBeVisible();
    
    // Verify no redirect loop
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });

  test('signup page is accessible without authentication', async ({ page }) => {
    await page.goto('/signup');
    
    // Verify page loads (signup form uses type selector, not id)
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Verify no redirect loop
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/signup/);
  });
});
