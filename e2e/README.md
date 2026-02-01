# E2E Testing Setup

## Overview

This project uses Playwright for end-to-end testing with a global setup that creates a test user in Supabase before running tests.

## Prerequisites

### Environment Variables

The following environment variables must be set in a `.env` file at the project root:

```bash
# .env file
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Important**: The `SUPABASE_SERVICE_KEY` is the **service role key** (not the anon key). This key has admin privileges and should only be used in secure environments (local development, CI/CD).

### Where to Find Keys

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_KEY`

## How It Works

### Global Setup (`e2e/global-setup.ts`)

Before any tests run, the global setup:

1. Creates a Supabase admin client using the service key
2. Checks if a test user (`test@example.com`) already exists
3. Deletes the existing user if found (for clean slate)
4. Creates a new test user with auto-confirmed email

### Auth Fixture (`e2e/fixtures/auth.fixture.ts`)

Tests that need authentication use the `authenticatedPage` fixture, which:

1. Navigates to the sign-in page
2. Logs in with the pre-seeded test credentials
3. Waits for successful navigation to the dashboard
4. Provides the authenticated page to the test
5. Cleans up by signing out after the test

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (interactive mode)
npm run test:e2e:ui

# Run in headed mode (visible browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug
```

## CI/CD

The GitHub Actions workflow requires the following secrets to be configured:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

Add these in your repository settings under **Settings** → **Secrets and variables** → **Actions**.

## Test User Credentials

The following test user is created automatically:

- **Email**: `test@example.com`
- **Password**: `testpassword123`

This user is recreated on every test run to ensure a clean state.
