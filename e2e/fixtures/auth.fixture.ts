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
    const testEmail = process.env.E2E_USERNAME || "test@example.com";
    const testPassword = process.env.E2E_PASSWORD || "testpassword123";

    await page.goto("/auth/signin");

    await page.waitForLoadState("networkidle");

    await page.getByLabel("Email").fill(testEmail);
    await page.getByRole("textbox", { name: "Password" }).fill(testPassword);

    await Promise.all([
      page.waitForURL("/dashboard", { timeout: 10000 }),
      page.getByRole("button", { name: /sign in/i }).click(),
    ]);

    // Use the authenticated page
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },
});

export { expect };
