Frontend – Astro with React for interactive components:

- Astro 5 allows you to build fast, efficient sites and apps with a minimal amount of JavaScript
- React 19 will provide interactivity where it’s needed
- TypeScript 5 for static typing of the code and better IDE support
- Tailwind 4 enables convenient styling of the application
- Shadcn/ui provides a library of accessible React components that we will base the UI on

Backend – Supabase as a comprehensive backend solution:

- Provides a PostgreSQL database
- Provides SDKs in multiple languages that will serve as Backend-as-a-Service
- Is an open-source solution that can be hosted locally or on your own server
- Has built-in user authentication

Testing – Comprehensive testing strategy:

Unit Tests:
- Vitest as the primary testing framework (native Vite integration, fast execution, ESM support)
- Mock Service Worker (MSW) for API mocking in integration tests
- Custom Supabase client mocking for service layer testing
- v8 code coverage reporting

Component Tests:
- React Testing Library for component testing (encourages testing from user perspective)
- Vitest as the test runner
- Tests all components in `src/components/` with focus on user interactions

End-to-End Tests:
- Playwright for E2E testing (cross-browser support, excellent debugging, auto-waiting)
- Tests complete user journeys across Chromium, Firefox, and WebKit
- Page Object Model (POM) pattern for test organization
- Visual regression testing with screenshots
- Network interception and trace viewer for debugging

AI – Communication with models via the Openrouter.ai service:

- Access to a wide range of models (OpenAI, Anthropic, Google and many others), which will allow us to find a solution that ensures high efficiency and low costs
- Allows setting financial limits on API keys

CI/CD and Hosting:

- GitHub Actions for creating CI/CD pipelines
- DigitalOcean for hosting the application via a Docker image
