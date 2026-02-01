import { test, expect } from "@playwright/test";
import { AuthPage } from "./pages/auth.page";

/**
 * Example E2E test for authentication flow
 */
test.describe("Authentication", () => {
  test("should display sign in page", async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoSignIn();

    // Verify page elements
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();
    await expect(authPage.submitButton).toBeVisible();
  });

  test("should display sign up page", async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoSignUp();

    // Verify page elements
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();
    await expect(authPage.submitButton).toBeVisible();
  });

  test("should navigate between sign in and sign up", async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoSignIn();

    // Navigate to sign up
    await authPage.signUpLink.click();
    await expect(page).toHaveURL("/auth/signup");

    // Navigate back to sign in
    await authPage.signInLink.click();
    await expect(page).toHaveURL("/auth/signin");
  });
});
