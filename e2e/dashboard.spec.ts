import { test, expect } from "./fixtures/auth.fixture";
import { DashboardPage } from "./pages/dashboard.page";

/**
 * Example E2E test demonstrating Playwright setup
 * This uses the authenticated fixture
 */
test.describe("Dashboard Page", () => {
  test("should display the dashboard for authenticated users", async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();

    // Verify the dashboard loaded
    await expect(authenticatedPage).toHaveURL("/dashboard");
    await expect(dashboard.quizLevelSelect).toBeVisible();
    await expect(dashboard.quizSizeSelect).toBeVisible();
  });
});
