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

    // Wait for the page to be fully loaded
    await authenticatedPage.waitForLoadState("networkidle");
  });

  test("should allow selecting JLPT level and question count", async () => {
    const { levelQuizCard } = dashboardPage;

    // Step 1: Select JLPT level
    await levelQuizCard.selectJLPTLevel("N5");
    await expect(levelQuizCard.jlptLevelSelect).toContainText("N5");

    // Step 2: Select number of questions
    await levelQuizCard.selectQuestionCount(10);

    // Verify the radio button is checked
    const selectedRadio = levelQuizCard.getQuestionCountOption(10);
    await expect(selectedRadio).toHaveAttribute("data-state", "checked");

    // Step 3: Verify Start Quiz button is enabled
    await expect(levelQuizCard.startButton).toBeEnabled();
  });

  test("should disable Start Quiz button when form is incomplete", async () => {
    const { levelQuizCard } = dashboardPage;

    // Initially, button should be disabled (no selections made)
    await expect(levelQuizCard.startButton).toBeDisabled();

    // Select only JLPT level
    await levelQuizCard.selectJLPTLevel("N3");

    // Button should still be disabled (question count not selected)
    await expect(levelQuizCard.startButton).toBeDisabled();

    // Select question count
    await levelQuizCard.selectQuestionCount(20);

    // Now button should be enabled
    await expect(levelQuizCard.startButton).toBeEnabled();
  });

  test("should complete full quiz configuration flow", async () => {
    const { levelQuizCard } = dashboardPage;

    // Use the combined action method
    await levelQuizCard.configureAndStartQuiz("N2", 50);

    // After clicking Start Quiz, we should navigate to quiz page
    // (Adjust the assertion based on actual navigation behavior)
    await expect(dashboardPage.page).toHaveURL(/\/quiz\/\d+/);
  });

  test("should allow changing selections before starting quiz", async () => {
    const { levelQuizCard } = dashboardPage;

    // Initial selection
    await levelQuizCard.selectJLPTLevel("N5");
    await levelQuizCard.selectQuestionCount(10);

    // Change selections
    await levelQuizCard.selectJLPTLevel("N1");
    await expect(levelQuizCard.jlptLevelSelect).toContainText("N1");

    await levelQuizCard.selectQuestionCount(50);
    const selectedRadio = levelQuizCard.getQuestionCountOption(50);
    await expect(selectedRadio).toHaveAttribute("data-state", "checked");

    // Button should remain enabled
    await expect(levelQuizCard.startButton).toBeEnabled();
  });

  test("should show loading state when starting quiz", async () => {
    const { levelQuizCard } = dashboardPage;

    // Configure quiz
    await levelQuizCard.selectJLPTLevel("N4");
    await levelQuizCard.selectQuestionCount(20);

    // Click start button
    await levelQuizCard.startButton.click();

    // Button text should change to "Starting..."
    await expect(levelQuizCard.startButton).toHaveText("Starting...");
  });

  test("should display error message when quiz creation fails", async ({ authenticatedPage }) => {
    const { levelQuizCard } = dashboardPage;

    // Mock API failure (adjust based on your API structure)
    await authenticatedPage.route("**/api/quizzes", (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: "Failed to create quiz" }),
      });
    });

    // Configure and start quiz
    await levelQuizCard.selectJLPTLevel("N3");
    await levelQuizCard.selectQuestionCount(10);
    await levelQuizCard.startButton.click();

    // Verify error message is displayed
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
