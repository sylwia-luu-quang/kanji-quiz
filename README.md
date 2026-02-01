# Kanji Quiz

![Node.js version](https://img.shields.io/badge/node-22.14.0-blue)
![License](https://img.shields.io/badge/license-TBD-lightgrey)

> Quick, repeatable kanji practice for JLPT levels N5–N1

## Table of Contents

1. [Project Description](#project-description)
2. [Tech Stack](#tech-stack)
3. [Getting Started Locally](#getting-started-locally)
4. [Available Scripts](#available-scripts)
5. [Testing](#testing)
6. [Project Scope](#project-scope)
7. [Project Status](#project-status)
8. [License](#license)

## Project Description

Kanji Quiz is a web application that helps Japanese-language learners prepare for the JLPT by delivering fast, focused kanji quizzes. Users pick a JLPT level (N5–N1) and question count, answer **reading** and **meaning** prompts, receive immediate feedback, and can flag kanji for later review. Minimal personal data is stored—just an email address for authentication and quiz-related stats.

## Tech Stack

- **Frontend**: [Astro](https://astro.build/) 5 + [React](https://react.dev/) 19 (TypeScript 5)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 4, [Shadcn/ui](https://ui.shadcn.com/)
- **Backend-as-a-Service**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- **Testing**:
  - **Unit Tests**: [Vitest](https://vitest.dev/) (testing framework with native Vite integration)
  - **Component Tests**: [React Testing Library](https://testing-library.com/react) + Vitest
  - **E2E Tests**: [Playwright](https://playwright.dev/) (cross-browser testing)
- **CI/CD & Hosting**: GitHub Actions → Docker → DigitalOcean
- **AI integrations**: OpenRouter.ai for model access (optional stretch)

### Key Runtime Dependencies (excerpt)

```jsonc
{
  "@astrojs/react": "^4.3.1",
  "react": "^19.1.1",
  "tailwindcss": "^4.1.13",
}
```

> See `package.json` for the full list.

## Getting Started Locally

### Prerequisites

- **Node.js 22.14.0** (see `.nvmrc`)
- **npm** ≥ 10 or **pnpm** / **yarn**

### Installation

```bash
# 1. Clone the repository
$ git clone https://github.com/<your-org>/kanji-quiz.git
$ cd kanji-quiz

# 2. Install dependencies
$ npm install
# or
$ pnpm install

# 3. Start the development server
$ npm run dev
```

The site will be available at `http://localhost:3000` by default.

> **Note**: To connect to a real Supabase instance, configure the required environment variables (e.g. `SUPABASE_URL`, `SUPABASE_ANON_KEY`). For local prototyping, the app will still run with mocked data until backend wiring is completed.

## Available Scripts

The following npm scripts are defined in `package.json`:

| Script            | Purpose                                                      |
| ----------------- | ------------------------------------------------------------ |
| `dev`             | Run Astro in development mode with hot reload                |
| `build`           | Build the static site for production                         |
| `preview`         | Serve the built site locally to preview the production build |
| `astro`           | Direct access to the Astro CLI                               |
| `lint`            | Lint all source files with ESLint                            |
| `lint:fix`        | Lint and automatically fix issues                            |
| `format`          | Format files using Prettier                                  |
| `test`            | Run unit tests with Vitest                                   |
| `test:ui`         | Run unit tests with Vitest UI                                |
| `test:watch`      | Run unit tests in watch mode                                 |
| `test:coverage`   | Run unit tests with coverage report                          |
| `test:e2e`        | Run end-to-end tests with Playwright                         |
| `test:e2e:ui`     | Run E2E tests with Playwright UI                             |
| `test:e2e:headed` | Run E2E tests in headed mode (visible browser)               |
| `test:e2e:debug`  | Run E2E tests in debug mode                                  |
| `test:all`        | Run all tests (unit + E2E)                                   |

Run any script with `npm run <script>` (or your preferred package manager).

## Testing

This project uses a comprehensive testing strategy to ensure code quality and reliability.

### Unit & Component Tests (Vitest)

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### End-to-End Tests (Playwright)

**Prerequisites**: E2E tests require Supabase credentials with service key access for test user setup:

```bash
# Required environment variables
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug
```

### Test Structure

```
tests/               # Unit and component tests
├── setup.ts        # Global test setup
├── mocks/          # Mock utilities
└── *.test.tsx      # Test files

e2e/                # End-to-end tests
├── fixtures/       # Custom Playwright fixtures
├── pages/          # Page Object Models
└── *.spec.ts       # E2E test specs
```

For detailed testing guidelines, see [TESTING.md](./TESTING.md).

## Project Scope

**In scope (MVP)**

- Level-based quizzes with immediate feedback
- "Need review" marking & dedicated quiz mode
- Email + password authentication
- Basic history views
- Static JSON kanji dataset

Refer to the [PRD](./.ai/prd.md) for full user stories and acceptance criteria.

## Project Status

The project is currently in the MVP stage and under active development.

## License

This project is licensed under the MIT License.
