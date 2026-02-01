import type { Page } from "@playwright/test";

/**
 * Page Object Model for Dashboard page
 */
export class DashboardPage {
  constructor(private page: Page) {}

  // Locators
  get quizLevelSelect() {
    return this.page.getByRole("combobox", { name: /jlpt level/i });
  }

  get quizSizeSelect() {
    return this.page.getByRole("radiogroup").first();
  }

  get startQuizButton() {
    return this.page.getByRole("button", { name: /start.*quiz/i }).first();
  }

  get historySection() {
    return this.page.locator('[data-testid="history-section"]');
  }

  get needReviewSection() {
    return this.page.locator('[data-testid="need-review-section"]');
  }

  get needReviewToggle() {
    return this.page.locator('button:has-text("Show Only Need Review")');
  }

  // Actions
  async goto() {
    await this.page.goto("/dashboard");
    await this.page.waitForLoadState("networkidle");
  }

  async selectQuizLevel(level: string) {
    // Click the combobox to open the dropdown
    await this.quizLevelSelect.click();
    // Select the option from the dropdown
    await this.page.getByRole("option", { name: level }).click();
  }

  async selectQuizSize(size: string) {
    // Scope to the first radiogroup (Level Quiz section)
    await this.quizSizeSelect.getByRole("radio", { name: size }).click();
  }
}
