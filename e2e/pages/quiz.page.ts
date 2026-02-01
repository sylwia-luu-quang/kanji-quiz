import type { Page } from "@playwright/test";

/**
 * Page Object Model for Quiz page
 */
export class QuizPage {
  constructor(private page: Page) {}

  // Locators
  get kanjiDisplay() {
    return this.page.locator('[data-testid="kanji-display"]');
  }

  get questionPrompt() {
    return this.page.locator('[data-testid="question-prompt"]');
  }

  get answerInput() {
    return this.page.locator('input[type="text"][name="answer"]');
  }

  get submitButton() {
    return this.page.locator('button:has-text("Submit")');
  }

  get nextButton() {
    return this.page.locator('button:has-text("Next Question")');
  }

  get abandonButton() {
    return this.page.locator('button:has-text("Abandon Quiz")');
  }

  get progressIndicator() {
    return this.page.locator('[data-testid="progress-indicator"]');
  }

  get correctnessIndicator() {
    return this.page.locator('[data-testid="correctness-indicator"]');
  }

  get completionModal() {
    return this.page.locator('[data-testid="completion-modal"]');
  }

  get finalScore() {
    return this.page.locator('[data-testid="final-score"]');
  }

  get returnToDashboardButton() {
    return this.page.locator('button:has-text("Return to Dashboard")');
  }

  // Actions
  async goto(quizId: string) {
    await this.page.goto(`/quiz/${quizId}`);
    await this.page.waitForLoadState("networkidle");
  }

  async submitAnswer(answer: string) {
    await this.answerInput.fill(answer);
    await this.submitButton.click();
  }

  async goToNextQuestion() {
    await this.nextButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  async abandonQuiz() {
    await this.abandonButton.click();
    // Confirm in dialog
    await this.page.locator('button:has-text("Confirm")').click();
  }

  async completeQuizWithAnswers(answers: string[]) {
    for (const answer of answers) {
      await this.submitAnswer(answer);
      const hasNext = await this.nextButton.isVisible({ timeout: 1000 }).catch(() => false);
      if (hasNext) {
        await this.goToNextQuestion();
      }
    }
  }

  async getQuizProgress() {
    const progressText = await this.progressIndicator.textContent();
    return progressText || "";
  }

  async returnToDashboard() {
    await this.returnToDashboardButton.click();
    await this.page.waitForURL("/dashboard");
  }
}
