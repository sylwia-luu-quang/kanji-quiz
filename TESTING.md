# Testing Guide

This project uses a comprehensive testing strategy with Vitest for unit/component tests and Playwright for E2E tests.

## Table of Contents

- [Unit & Component Tests (Vitest)](#unit--component-tests-vitest)
- [End-to-End Tests (Playwright)](#end-to-end-tests-playwright)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)

## Unit & Component Tests (Vitest)

### Overview

- **Framework**: Vitest with React Testing Library
- **Coverage**: v8 coverage reporting
- **Environment**: jsdom for DOM testing
- **Mocking**: MSW for API mocking, custom Supabase mocks

### Directory Structure

```
tests/
├── setup.ts                 # Global test setup
├── mocks/
│   └── supabase.mock.ts    # Supabase client mocks
└── **/*.test.tsx           # Test files (co-located with source)
```

### Configuration

Test configuration is in `vitest.config.ts`. Key settings:

- **Environment**: jsdom for DOM testing
- **Globals**: `vi`, `describe`, `it`, `expect` available globally
- **Setup**: Runs `tests/setup.ts` before all tests
- **Coverage thresholds**: 70% for lines, functions, branches, statements

## End-to-End Tests (Playwright)

### Overview

- **Framework**: Playwright
- **Browsers**: Chromium (Desktop Chrome)
- **Pattern**: Page Object Model (POM)
- **Features**: Visual regression, trace viewer, auto-waiting

### Directory Structure

```
e2e/
├── fixtures/
│   └── auth.fixture.ts     # Custom test fixtures
├── pages/
│   ├── auth.page.ts        # Auth page objects
│   ├── dashboard.page.ts   # Dashboard page objects
│   └── quiz.page.ts        # Quiz page objects
└── *.spec.ts               # E2E test specs
```

### Configuration

Test configuration is in `playwright.config.ts`. Key settings:

- **Base URL**: http://localhost:4321 (configurable via BASE_URL env var)
- **Web Server**: Auto-starts dev server before tests
- **Retries**: 2 retries in CI, 0 locally
- **Reporters**: HTML report and list reporter

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Run E2E tests in debug mode
npm run test:e2e:debug
```

### Run All Tests

```bash
# Run all tests (unit + E2E)
npm run test:all
```

## Writing Tests

### Unit Tests Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<MyComponent onClick={handleClick} />);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Component Tests with Mocks

```typescript
import { vi } from "vitest";
import { createMockSupabaseClient } from "@/tests/mocks/supabase.mock";

vi.mock("@/db/supabase.client", () => ({
  supabase: createMockSupabaseClient(),
}));

describe("Component with Supabase", () => {
  it("should fetch data", async () => {
    // Test implementation
  });
});
```

### E2E Tests Example

```typescript
import { test, expect } from "@/e2e/fixtures/auth.fixture";
import { DashboardPage } from "@/e2e/pages/dashboard.page";

test.describe("Dashboard", () => {
  test("should create a quiz", async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();

    await dashboard.createAndStartQuiz("N5", "10");

    await expect(authenticatedPage).toHaveURL(/\/quiz\/[a-z0-9-]+/);
  });
});
```

### Page Object Model Example

```typescript
// e2e/pages/my-page.page.ts
import { Page } from "@playwright/test";

export class MyPage {
  constructor(private page: Page) {}

  // Locators
  get myButton() {
    return this.page.locator('button[data-testid="my-button"]');
  }

  // Actions
  async goto() {
    await this.page.goto("/my-page");
  }

  async clickButton() {
    await this.myButton.click();
  }
}
```

## Best Practices

### Unit Tests

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Use descriptive test names**: `it('should display error when email is invalid')`
3. **Test user behavior, not implementation**: Use Testing Library queries
4. **Mock external dependencies**: Use `vi.mock()` for modules, MSW for APIs
5. **Keep tests focused**: One assertion per test when possible
6. **Use setup files**: Put reusable mocks in `tests/mocks/`

### E2E Tests

1. **Use Page Object Model**: Encapsulate page interactions in page objects
2. **Use data-testid**: Add `data-testid` attributes for reliable element selection
3. **Leverage auto-waiting**: Playwright waits automatically for elements
4. **Test user journeys**: Focus on complete workflows, not individual actions
5. **Use fixtures**: Create reusable test setups (see `auth.fixture.ts`)
6. **Visual regression**: Use `expect(page).toHaveScreenshot()` for visual checks
7. **Debug with traces**: Use `--debug` flag or trace viewer for failures

### General

1. **Run tests before committing**: Use `npm run test:all`
2. **Maintain coverage**: Keep coverage above 70%
3. **Update tests with features**: Write tests alongside new features
4. **Use TypeScript**: Leverage type safety in tests
5. **Review test reports**: Check HTML reports for detailed results

## Troubleshooting

### Vitest Issues

- **Tests not found**: Check `include` pattern in `vitest.config.ts`
- **Module resolution**: Verify `@/` alias in `tsconfig.json` and `vitest.config.ts`
- **jsdom errors**: Ensure `environment: 'jsdom'` in config

### Playwright Issues

- **Browser not installed**: Run `npx playwright install chromium`
- **Base URL wrong**: Set `BASE_URL` environment variable
- **Timeouts**: Increase timeout in `playwright.config.ts`
- **Flaky tests**: Use `test.fail()` or increase retries

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
