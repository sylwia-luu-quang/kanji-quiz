import { test, expect } from "./fixtures/auth.fixture";
import { DashboardPage } from "./pages/dashboard.page";

/**
 * Example E2E test for Level Quiz Card using Page Object Model
 *
 * This test demonstrates the three-step quiz configuration scenario:
 * 1. Select JLPT level
 * 2. Select number of questions
 * 3. Press Start Quiz button
 */

test.describe("Level Quiz Card - Quiz Configuration Flow", () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    dashboardPage = new DashboardPage(authenticatedPage);
    await dashboardPage.goto();

    await authenticatedPage.waitForLoadState("networkidle");
  });

  test("should allow selecting JLPT level and question count", async () => {
    const { levelQuizCard } = dashboardPage;

    await levelQuizCard.selectJLPTLevel("N5");
    await expect(levelQuizCard.jlptLevelSelect).toContainText("N5");

    await levelQuizCard.selectQuestionCount(10);

    const selectedRadio = levelQuizCard.getQuestionCountOption(10);
    await expect(selectedRadio).toHaveAttribute("data-state", "checked");

    await expect(levelQuizCard.startButton).toBeEnabled();
  });

  test("should disable Start Quiz button when form is incomplete", async () => {
    const { levelQuizCard } = dashboardPage;

    await expect(levelQuizCard.startButton).toBeDisabled();

    await levelQuizCard.selectJLPTLevel("N3");

    await expect(levelQuizCard.startButton).toBeDisabled();

    await levelQuizCard.selectQuestionCount(20);

    await expect(levelQuizCard.startButton).toBeEnabled();
  });

  test("should complete full quiz configuration flow", async () => {
    const { levelQuizCard } = dashboardPage;

    await levelQuizCard.configureAndStartQuiz("N2", 50);

    await expect(dashboardPage.page).toHaveURL(/\/quiz\/\d+/);
  });

  test("should allow changing selections before starting quiz", async () => {
    const { levelQuizCard } = dashboardPage;

    await levelQuizCard.selectJLPTLevel("N5");
    await levelQuizCard.selectQuestionCount(10);

    await levelQuizCard.selectJLPTLevel("N1");
    await expect(levelQuizCard.jlptLevelSelect).toContainText("N1");

    await levelQuizCard.selectQuestionCount(50);
    const selectedRadio = levelQuizCard.getQuestionCountOption(50);
    await expect(selectedRadio).toHaveAttribute("data-state", "checked");

    await expect(levelQuizCard.startButton).toBeEnabled();
  });

  test("should show loading state when starting quiz", async () => {
    const { levelQuizCard } = dashboardPage;

    await levelQuizCard.selectJLPTLevel("N4");
    await levelQuizCard.selectQuestionCount(20);

    await levelQuizCard.startButton.click();

    await expect(levelQuizCard.startButton).toHaveText("Starting...");
  });

  test("should display error message when quiz creation fails", async ({ authenticatedPage }) => {
    const { levelQuizCard } = dashboardPage;

    await authenticatedPage.route("**/api/quizzes", (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: "Failed to create quiz" }),
      });
    });

    await levelQuizCard.selectJLPTLevel("N3");
    await levelQuizCard.selectQuestionCount(10);
    await levelQuizCard.startButton.click();

    await expect(levelQuizCard.errorMessage).toBeVisible();
    const errorText = await levelQuizCard.getErrorMessageText();
    expect(errorText).toBeTruthy();
  });

  test.describe("All JLPT Levels", () => {
    const levels: ("N5" | "N4" | "N3" | "N2" | "N1")[] = ["N5", "N4", "N3", "N2", "N1"];

    for (const level of levels) {
      test(`should allow selecting ${level}`, async () => {
        const { levelQuizCard } = dashboardPage;

        await levelQuizCard.selectJLPTLevel(level);
        await expect(levelQuizCard.jlptLevelSelect).toContainText(level);
      });
    }
  });

  test.describe("All Question Counts", () => {
    const counts: (1 | 10 | 20 | 50)[] = [1, 10, 20, 50];

    for (const count of counts) {
      test(`should allow selecting ${count} questions`, async () => {
        const { levelQuizCard } = dashboardPage;

        await levelQuizCard.selectQuestionCount(count);
        const selectedRadio = levelQuizCard.getQuestionCountOption(count);
        await expect(selectedRadio).toHaveAttribute("data-state", "checked");
      });
    }
  });
});
