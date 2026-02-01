import type { Page } from "@playwright/test";
import { LevelQuizCardComponent } from "./components/level-quiz-card.component";

/**
 * Page Object Model for Dashboard page
 */
export class DashboardPage {
  readonly levelQuizCard: LevelQuizCardComponent;
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.levelQuizCard = new LevelQuizCardComponent(page);
  }

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

  async goto() {
    await this.page.goto("/dashboard");
    await this.page.waitForLoadState("networkidle");
  }

  async selectQuizLevel(level: string) {
    await this.quizLevelSelect.click();
    await this.page.getByRole("option", { name: level }).click();
  }

  async selectQuizSize(size: string) {
    await this.quizSizeSelect.getByRole("radio", { name: size }).click();
  }
}
