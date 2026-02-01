import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Custom fixtures for authentication
 */
interface AuthFixtures {
  authenticatedPage: Page;
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to sign-in page
    await page.goto("/auth/signin");

    // Wait for form to be ready
    await page.waitForLoadState("networkidle");

    // Perform login using accessible locators (React-compatible)
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByRole("textbox", { name: "Password" }).fill("testpassword123");

    // Click submit and wait for navigation
    await Promise.all([
      page.waitForURL("/dashboard", { timeout: 10000 }),
      page.getByRole("button", { name: /sign in/i }).click(),
    ]);

    // Use the authenticated page
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);

    // No cleanup needed - Playwright creates fresh contexts for each test
  },
});

export { expect };
