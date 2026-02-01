import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for LevelQuizCard component
 * Represents the Level Quiz configuration card on the dashboard
 */
export class LevelQuizCardComponent {
  readonly container: Locator;

  constructor(private page: Page) {
    this.container = this.page.locator('[data-slot="card"]').filter({ hasText: "Level Quiz" });
  }

  get jlptLevelSelect() {
    return this.page.getByTestId("level-quiz-jlpt-level-select");
  }

  getLevelOption(level: "N5" | "N4" | "N3" | "N2" | "N1") {
    return this.page.getByTestId(`level-quiz-jlpt-level-${level}`);
  }

  get questionCountGroup() {
    return this.page.getByTestId("level-quiz-question-count-group");
  }

  getQuestionCountOption(count: 1 | 10 | 20 | 50) {
    return this.page.getByTestId(`level-quiz-question-count-${count}`);
  }

  get startButton() {
    return this.page.getByTestId("level-quiz-start-button");
  }

  get errorMessage() {
    return this.page.getByTestId("level-quiz-error-message");
  }

  async selectJLPTLevel(level: "N5" | "N4" | "N3" | "N2" | "N1") {
    await this.jlptLevelSelect.click();
    await this.getLevelOption(level).click();
  }

  async selectQuestionCount(count: 1 | 10 | 20 | 50) {
    await this.getQuestionCountOption(count).click();
  }

  async startQuiz() {
    await this.startButton.click();
  }

  async configureAndStartQuiz(level: "N5" | "N4" | "N3" | "N2" | "N1", questionCount: 1 | 10 | 20 | 50) {
    await this.selectJLPTLevel(level);
    await this.selectQuestionCount(questionCount);
    await this.startQuiz();
  }

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
    return this.jlptLevelSelect.textContent();
  }

  async getSelectedQuestionCount() {
    const checkedRadio = this.questionCountGroup.locator('[data-state="checked"]');
    const label = await checkedRadio.getAttribute("value");
    return label ? parseInt(label) : null;
  }

  async waitForSubmitting() {
    await this.startButton.filter({ hasText: "Starting..." }).waitFor({ state: "visible" });
  }

  async waitForReady() {
    await this.startButton.filter({ hasText: "Start Quiz" }).waitFor({ state: "visible" });
  }
}
