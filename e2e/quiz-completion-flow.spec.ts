import { test, expect } from "./fixtures/auth.fixture";
import { DashboardPage } from "./pages/dashboard.page";
import { QuizPage } from "./pages/quiz.page";

/**
 * E2E Test for Complete Quiz Flow
 *
 * Tests the full quiz lifecycle:
 * 1. Configure quiz on dashboard (select level and question count)
 * 2. Start quiz and navigate to quiz page
 * 3. Answer all questions
 * 4. Complete quiz and verify completion modal appears
 * 5. Return to dashboard
 */

test.describe("Complete Quiz Flow", () => {
  test("should complete full quiz lifecycle from configuration to completion", async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    await dashboardPage.goto();

    await dashboardPage.levelQuizCard.configureAndStartQuiz("N5", 1);

    await expect(authenticatedPage).toHaveURL(/\/quiz\/\d+/);

    const quizPage = new QuizPage(authenticatedPage);

    await expect(quizPage.kanjiDisplay).toBeVisible();
    await expect(quizPage.questionPrompt).toBeVisible();

    await quizPage.answerCurrentQuestion("test");
    await expect(quizPage.nextButton).toBeVisible();
    await quizPage.proceedToNextQuestion();

    await quizPage.answerCurrentQuestion("test");
    await expect(quizPage.nextButton).toBeVisible();
    await quizPage.proceedToNextQuestion();

    await expect(quizPage.completionModal).toBeVisible();
    await expect(quizPage.completionModal).toContainText("Quiz Complete!");

    await expect(quizPage.scorePercentage).toBeVisible();
    await expect(quizPage.scoreSummary).toBeVisible();

    await quizPage.closeModalAndReturnToDashboard();

    await expect(authenticatedPage).toHaveURL("/dashboard");
    await expect(dashboardPage.levelQuizCard.container).toBeVisible();
  });

  test("should complete multi-question quiz and show correct score", async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    await dashboardPage.goto();

    await dashboardPage.levelQuizCard.configureAndStartQuiz("N5", 10);

    await expect(authenticatedPage).toHaveURL(/\/quiz\/\d+/);

    const quizPage = new QuizPage(authenticatedPage);

    for (let i = 0; i < 20; i++) {
      await expect(quizPage.kanjiDisplay).toBeVisible();

      await quizPage.answerCurrentQuestion("test");

      await expect(quizPage.nextButton).toBeVisible();

      await quizPage.proceedToNextQuestion();
    }

    await expect(quizPage.completionModal).toBeVisible();
    await expect(quizPage.scorePercentage).toBeVisible();
    await expect(quizPage.scoreSummary).toBeVisible();

    const scoreSummaryText = await quizPage.scoreSummary.textContent();
    expect(scoreSummaryText).toContain("out of 20 correct");

    await quizPage.closeModalAndReturnToDashboard();

    await expect(authenticatedPage).toHaveURL("/dashboard");
  });

  test("should show encouragement message in completion modal", async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    await dashboardPage.goto();

    await dashboardPage.levelQuizCard.configureAndStartQuiz("N5", 1);
    await expect(authenticatedPage).toHaveURL(/\/quiz\/\d+/);

    const quizPage = new QuizPage(authenticatedPage);

    await quizPage.answerCurrentQuestion("test");
    await quizPage.proceedToNextQuestion();
    await quizPage.answerCurrentQuestion("test");
    await quizPage.proceedToNextQuestion();

    await expect(quizPage.completionModal).toBeVisible();

    const modalText = await quizPage.completionModal.textContent();
    expect(modalText).toBeTruthy();
    expect(modalText).toContain("Quiz Complete!");
  });

  test("should work with different JLPT levels", async ({ authenticatedPage }) => {
    const levels: ("N5" | "N4" | "N3" | "N2" | "N1")[] = ["N5", "N3", "N1"];

    for (const level of levels) {
      const dashboardPage = new DashboardPage(authenticatedPage);
      await dashboardPage.goto();

      await dashboardPage.levelQuizCard.configureAndStartQuiz(level, 1);

      await expect(authenticatedPage).toHaveURL(/\/quiz\/\d+/);

      const quizPage = new QuizPage(authenticatedPage);
      await quizPage.answerCurrentQuestion("test");
      await quizPage.proceedToNextQuestion();
      await quizPage.answerCurrentQuestion("test");
      await quizPage.proceedToNextQuestion();

      await expect(quizPage.completionModal).toBeVisible();

      await quizPage.closeModalAndReturnToDashboard();
      await expect(authenticatedPage).toHaveURL("/dashboard");
    }
  });

  test("should display score percentage correctly", async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    await dashboardPage.goto();

    await dashboardPage.levelQuizCard.configureAndStartQuiz("N5", 1);
    await expect(authenticatedPage).toHaveURL(/\/quiz\/\d+/);

    const quizPage = new QuizPage(authenticatedPage);

    await quizPage.answerCurrentQuestion("test");
    await quizPage.proceedToNextQuestion();

    await quizPage.answerCurrentQuestion("test");
    await quizPage.proceedToNextQuestion();

    await expect(quizPage.completionModal).toBeVisible();
    const scoreText = await quizPage.scorePercentage.textContent();

    expect(scoreText).toMatch(/^\d{1,3}%$/);

    await quizPage.closeModalAndReturnToDashboard();
  });
});
