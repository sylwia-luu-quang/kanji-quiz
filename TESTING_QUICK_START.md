# Getting Started with Testing - 5 Minute Guide

## Quick Start

### 1. Run Example Tests (30 seconds)

```bash
# Unit tests
npm test

# E2E tests (lists available tests)
npx playwright test --list
```

### 2. Watch a Test Run (1 minute)

```bash
# Open Vitest UI
npm run test:ui

# Your browser will open with an interactive test runner
# Click on tests to see results, coverage, and more
```

### 3. Write Your First Test (3 minutes)

#### Create a Unit Test

Create `src/lib/utils.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  it("should merge class names", () => {
    const result = cn("text-red-500", "bg-blue-500");
    expect(result).toContain("text-red-500");
    expect(result).toContain("bg-blue-500");
  });
});
```

Run it:

```bash
npm test -- utils.test.ts
```

#### Create an E2E Test

Create `e2e/homepage.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Kanji Quiz/);
});
```

Run it:

```bash
npm run test:e2e -- homepage.spec.ts
```

## Essential Commands

```bash
# Unit Tests
npm test                    # Run all
npm run test:watch          # Watch mode
npm run test:ui             # Interactive UI
npm run test:coverage       # With coverage

# E2E Tests
npm run test:e2e            # Run all
npm run test:e2e:headed     # See browser
npm run test:e2e:debug      # Debug mode

# Both
npm run test:all            # Everything
```

## Where to Put Tests

```
Unit Tests:
  - Next to source: src/components/Button.test.tsx
  - Or in tests/: tests/components/Button.test.tsx

E2E Tests:
  - Always in e2e/: e2e/user-journey.spec.ts
```

## Common Patterns

### Testing a Component

```typescript
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MyButton } from './MyButton';

test('button clicks work', async () => {
  const user = userEvent.setup();
  const handleClick = vi.fn();

  render(<MyButton onClick={handleClick}>Click me</MyButton>);

  await user.click(screen.getByRole('button'));

  expect(handleClick).toHaveBeenCalled();
});
```

### Testing an API Route

```typescript
import { expect, test } from "vitest";

test("GET /api/kanji returns kanji", async () => {
  const response = await fetch("http://localhost:4321/api/kanji");
  expect(response.ok).toBe(true);

  const data = await response.json();
  expect(data).toHaveProperty("kanji");
});
```

### Testing a User Flow (E2E)

```typescript
import { test, expect } from "@playwright/test";

test("user can sign in", async ({ page }) => {
  await page.goto("/auth/signin");

  await page.fill('input[type="email"]', "test@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL("/dashboard");
});
```

## Tips

1. **Use descriptive test names**: "should redirect to dashboard after login" ✅ vs "test login" ❌

2. **Follow AAA pattern**:

   ```typescript
   // Arrange - set up test data
   const user = userEvent.setup();

   // Act - perform action
   await user.click(button);

   // Assert - check result
   expect(callback).toHaveBeenCalled();
   ```

3. **Use Page Objects for E2E**:

   ```typescript
   // Good ✅
   const dashboard = new DashboardPage(page);
   await dashboard.createQuiz("N5", "10");

   // Less maintainable ❌
   await page.click(".level-select");
   await page.click('option:has-text("N5")');
   // ...
   ```

4. **Mock external dependencies**:

   ```typescript
   vi.mock("@/db/supabase.client", () => ({
     supabase: createMockSupabaseClient(),
   }));
   ```

5. **Check coverage regularly**:
   ```bash
   npm run test:coverage
   open coverage/index.html
   ```

## Debugging

### Unit Tests Not Running?

```bash
# Check test is included
npm test -- --reporter=verbose

# Check for syntax errors
npm run lint
```

### E2E Tests Failing?

```bash
# Run in headed mode to see what's happening
npm run test:e2e:headed

# Debug step-by-step
npm run test:e2e:debug
```

### Need Help?

- See `TESTING.md` for comprehensive guide
- See `TESTING_QUICK_REFERENCE.md` for commands
- Check example tests in `tests/` and `e2e/`

## That's It! 🎉

You're ready to start testing. The key is to:

1. Write tests as you write code
2. Run tests before committing
3. Aim for good coverage of critical paths
4. Use Page Objects for E2E tests

Happy testing! 🧪
