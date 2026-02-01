import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for LevelQuizCard component
 * Represents the Level Quiz configuration card on the dashboard
 */
export class LevelQuizCardComponent {
  readonly container: Locator;

  constructor(private page: Page) {
    // Main container could be identified by card structure or create a data-test-id if needed
    this.container = this.page.locator('[data-slot="card"]').filter({ hasText: "Level Quiz" });
  }

  // Locators for JLPT Level Selection
  get jlptLevelSelect() {
    return this.page.getByTestId("level-quiz-jlpt-level-select");
  }

  getLevelOption(level: "N5" | "N4" | "N3" | "N2" | "N1") {
    return this.page.getByTestId(`level-quiz-jlpt-level-${level}`);
  }

  // Locators for Question Count Selection
  get questionCountGroup() {
    return this.page.getByTestId("level-quiz-question-count-group");
  }

  getQuestionCountOption(count: 1 | 10 | 20 | 50) {
    return this.page.getByTestId(`level-quiz-question-count-${count}`);
  }

  // Locators for Submit and Error
  get startButton() {
    return this.page.getByTestId("level-quiz-start-button");
  }

  get errorMessage() {
    return this.page.getByTestId("level-quiz-error-message");
  }

  // Actions - JLPT Level Selection
  async selectJLPTLevel(level: "N5" | "N4" | "N3" | "N2" | "N1") {
    await this.jlptLevelSelect.click();
    await this.getLevelOption(level).click();
  }

  // Actions - Question Count Selection
  async selectQuestionCount(count: 1 | 10 | 20 | 50) {
    await this.getQuestionCountOption(count).click();
  }

  // Actions - Submit
  async startQuiz() {
    await this.startButton.click();
  }

  // Combined Actions - Complete Quiz Configuration Flow
  async configureAndStartQuiz(level: "N5" | "N4" | "N3" | "N2" | "N1", questionCount: 1 | 10 | 20 | 50) {
    await this.selectJLPTLevel(level);
    await this.selectQuestionCount(questionCount);
    await this.startQuiz();
  }

  // Assertions/Getters
  async isStartButtonEnabled() {
    return this.startButton.isEnabled();
  }

  async isStartButtonDisabled() {
    return this.startButton.isDisabled();
  }

  async getStartButtonText() {
    return this.startButton.textContent();
  }

  async getErrorMessageText() {
    return this.errorMessage.textContent();
  }

  async isErrorMessageVisible() {
    return this.errorMessage.isVisible();
  }

  async getSelectedLevel() {
    // Get the value from the select trigger
    return this.jlptLevelSelect.textContent();
  }

  async getSelectedQuestionCount() {
    // Get the checked radio button value
    const checkedRadio = this.questionCountGroup.locator('[data-state="checked"]');
    const label = await checkedRadio.getAttribute("value");
    return label ? parseInt(label) : null;
  }

  // Wait methods for state changes
  async waitForSubmitting() {
    await this.startButton.filter({ hasText: "Starting..." }).waitFor({ state: "visible" });
  }

  async waitForReady() {
    await this.startButton.filter({ hasText: "Start Quiz" }).waitFor({ state: "visible" });
  }
}
