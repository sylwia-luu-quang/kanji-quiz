import type { Page } from "@playwright/test";

/**
 * Page Object Model for Authentication pages
 */
export class AuthPage {
  constructor(private page: Page) {}

  // Locators
  get emailInput() {
    return this.page.getByRole("textbox", { name: "Email" });
  }

  get passwordInput() {
    return this.page.getByRole("textbox", { name: "Password", exact: true });
  }

  get submitButton() {
    return this.page.getByRole("button", { name: /sign (in|up)/i });
  }

  get errorMessage() {
    return this.page.locator('[data-testid="error-message"]');
  }

  get signInLink() {
    return this.page.locator('a:has-text("Sign in")');
  }

  get signUpLink() {
    return this.page.locator('a:has-text("Sign up")');
  }

  // Actions
  async gotoSignIn() {
    await this.page.goto("/auth/signin");
    await this.page.waitForLoadState("networkidle");
  }

  async gotoSignUp() {
    await this.page.goto("/auth/signup");
    await this.page.waitForLoadState("networkidle");
  }

  async signIn(email: string, password: string) {
    await this.gotoSignIn();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async signUp(email: string, password: string) {
    await this.gotoSignUp();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage() {
    return this.errorMessage.textContent();
  }
}
