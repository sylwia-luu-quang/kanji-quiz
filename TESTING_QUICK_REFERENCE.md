# Testing Quick Reference

## Quick Commands

```bash
# Unit Tests
npm test                  # Run all unit tests
npm run test:watch        # Watch mode
npm run test:ui           # Interactive UI
npm run test:coverage     # With coverage

# E2E Tests
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Interactive UI
npm run test:e2e:headed   # See browser
npm run test:e2e:debug    # Debug mode

# All Tests
npm run test:all          # Run everything
```

## File Locations

```
Unit Tests:    tests/**/*.test.{ts,tsx}
E2E Tests:     e2e/**/*.spec.ts
Mocks:         tests/mocks/
Page Objects:  e2e/pages/
Fixtures:      e2e/fixtures/
```

## Common Patterns

### Unit Test Template

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

describe("Component", () => {
  it("should do something", () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature", () => {
  test("should do something", async ({ page }) => {
    await page.goto("/path");
    // Test implementation
  });
});
```

## Debugging

### Unit Tests

```bash
# Run specific test
npm test -- path/to/test.test.ts

# Run tests matching pattern
npm test -- -t "test name pattern"

# Debug in VS Code
# Set breakpoint → F5 → Select "Vitest"
```

### E2E Tests

```bash
# Debug specific test
npx playwright test --debug path/to/test.spec.ts

# Run specific test
npx playwright test path/to/test.spec.ts

# Open last HTML report
npx playwright show-report
```

## Coverage Reports

```bash
# Generate coverage
npm run test:coverage

# View HTML report
open coverage/index.html
```

## VS Code Integration

Install recommended extensions:

- Vitest (`vitest.explorer`)
- Playwright Test for VS Code (`ms-playwright.playwright`)

## Common Issues

### Vitest

- **Import errors**: Check `@/` alias in `vitest.config.ts`
- **DOM not available**: Ensure `environment: 'jsdom'`
- **Mocks not working**: Check mock factory is at top level

### Playwright

- **Browser not found**: `npx playwright install chromium`
- **Timeout**: Increase in `playwright.config.ts` or use `test.setTimeout()`
- **Flaky test**: Add `test.fail()` or use `waitForLoadState()`

## Best Practices

✅ **Do:**

- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Test user behavior, not implementation
- Use Page Object Model for E2E
- Add `data-testid` for reliable selectors

❌ **Don't:**

- Test implementation details
- Use arbitrary timeouts
- Repeat setup code (use fixtures)
- Skip tests without good reason
- Commit failing tests

## Resources

- [Full Testing Guide](./TESTING.md)
- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
