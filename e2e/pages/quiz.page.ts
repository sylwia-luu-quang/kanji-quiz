import type { Page } from "@playwright/test";

/**
 * Page Object Model for Quiz page
 */
export class QuizPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Locators
  get kanjiDisplay() {
    return this.page.getByTestId("kanji-display");
  }

  get questionPrompt() {
    return this.page.getByTestId("question-prompt");
  }

  get answerInput() {
    return this.page.getByTestId("answer-input");
  }

  get submitButton() {
    return this.page.getByTestId("submit-answer-button");
  }

  get nextButton() {
    return this.page.getByTestId("next-question-button");
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
    return this.page.getByTestId("completion-modal");
  }

  get scorePercentage() {
    return this.page.getByTestId("score-percentage");
  }

  get scoreSummary() {
    return this.page.getByTestId("score-summary");
  }

  get returnToDashboardButton() {
    return this.page.getByTestId("return-to-dashboard-button");
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

  async answerCurrentQuestion(answer: string) {
    await this.answerInput.waitFor({ state: "visible" });
    await this.answerInput.fill(answer);
    await this.submitButton.click();

    await this.nextButton.waitFor({ state: "visible", timeout: 10000 });
  }

  async proceedToNextQuestion() {
    // Hide Astro dev toolbar if it exists (workaround for blocking clicks)
    await this.page.evaluate(() => {
      const toolbar = document.querySelector("astro-dev-toolbar");
      if (toolbar) {
        (toolbar as HTMLElement).style.display = "none";
      }
    });

    await this.nextButton.waitFor({ state: "visible", timeout: 10000 });

    await this.page.waitForFunction(
      () => {
        const button = document.querySelector('[data-testid="next-question-button"]') as HTMLButtonElement;
        return button && !button.disabled && button.textContent && button.textContent.trim().length > 0;
      },
      { timeout: 10000 }
    );

    const buttonText = await this.nextButton.textContent();
    const isFinishButton = buttonText?.includes("Finish");

    await this.nextButton.click({ timeout: 10000 });

    if (isFinishButton) {
      await this.completionModal.waitFor({ state: "visible", timeout: 30000 });
    } else {
      await this.kanjiDisplay.waitFor({ state: "visible", timeout: 10000 });
    }
  }

  async completeQuiz(answers: string[]) {
    for (const answer of answers) {
      await this.answerCurrentQuestion(answer);
      await this.proceedToNextQuestion();
    }
  }

  async getScoreFromModal() {
    const scoreText = await this.scorePercentage.textContent();
    return scoreText?.replace("%", "") || "0";
  }

  async closeModalAndReturnToDashboard() {
    await this.returnToDashboardButton.click();
    await this.page.waitForURL("/dashboard");
  }
}
