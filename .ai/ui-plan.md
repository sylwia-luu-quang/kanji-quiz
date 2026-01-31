# UI Architecture for Kanji Quiz

## 1. UI Structure Overview

Kanji Quiz uses a dashboard-centric architecture for short, repeatable practice sessions. Authenticated users land on a single Dashboard hub with three stacked sections (Quiz Creation, Need Review List, History). The Quiz experience is a focused, full-screen flow with minimal chrome and sequential questions. Authentication is handled via dedicated sign-in and sign-up pages. Persistent header navigation appears across authenticated views to show user identity and logout access.

Key requirements from the PRD:
- Level-based quiz configuration (level N5–N1, question count 10/20/50) with validation for insufficient kanji.
- Sequential quiz flow with single kanji, immediate feedback, and per-question hit/miss tracking.
- Need review marking and a dedicated quiz mode from the marked list.
- Basic history list and detail view of completed quizzes.
- Email/password authentication with secure session handling.
- Performance target: initial quiz screen load < 5 seconds on 3G.
- Minimal PII and secure handling of auth and errors.

Main API endpoints and purposes:
- `GET /api/kanji` + `GET /api/kanji/:id`: Kanji data for quiz creation validation and details.
- `POST /api/quizzes`: Create new quiz (level or need-review).
- `GET /api/quizzes`: History list (completed quizzes).
- `GET /api/quizzes/:id`: Quiz detail/resume and history detail.
- `PATCH /api/quizzes/:quizId/questions/:questionId`: Submit answer and receive feedback.
- `POST /api/quizzes/:id/complete`: Complete quiz and compute score.
- `PATCH /api/quizzes/:id/abandon`: Abandon in-progress quiz.
- `GET /api/need-reviews`: Need review list data.
- `POST /api/need-reviews`: Add kanji to need review.
- `DELETE /api/need-reviews/:kanjiId`: Remove kanji from need review.

Global UX, accessibility, and security principles:
- Keyboard-first navigation with visible focus states and predictable tab order.
- Clear inline validation with aria-live announcements; toast notifications for transient errors; modal dialogs for critical auth errors.
- Route guards on authenticated views; generic auth error messaging to avoid account enumeration.
- Data minimized to email and quiz history; consistent loading and empty states to reduce confusion.

## 2. View List

### Landing / Redirect
- View name: Landing Redirect
- View path: `/`
- Main purpose: Route users to `/dashboard` when authenticated or `/auth/signin` when not.
- Key information to display: Minimal (optional brief loading state).
- Key view components: Auth session check; lightweight loading indicator.
- UX/accessibility/security considerations: Avoid flashing protected content; preserve intended destination for post-login redirect.
- API compatibility: Uses Supabase auth session; no REST endpoints.
- Mapped requirements/user stories: US-002, US-015 (session correctness).

### Authentication: Sign In
- View name: Sign In
- View path: `/auth/signin`
- Main purpose: Authenticate returning users.
- Key information to display: Email, password, submit state, link to sign-up.
- Key view components: Centered auth card; email/password inputs; password visibility toggle; inline validation; submit button.
- UX/accessibility/security considerations: Generic error messaging for invalid credentials; keyboard submit; aria-live error region; no account existence disclosure.
- API compatibility: Supabase `signInWithPassword` (auth SDK).
- Mapped requirements/user stories: US-002, US-015.
- Edge/error states: Invalid credentials; network timeouts; session already active (redirect).

### Authentication: Sign Up
- View name: Sign Up
- View path: `/auth/signup`
- Main purpose: Register new users.
- Key information to display: Email, password, confirmation, password strength indicator.
- Key view components: Centered auth card; password visibility toggle; inline validation; submit button; link to sign-in.
- UX/accessibility/security considerations: Strong password feedback; aria-live errors; protect against password leakage via masked input and clipboard rules.
- API compatibility: Supabase `signUp` (auth SDK).
- Mapped requirements/user stories: US-001.
- Edge/error states: Email already in use; weak password; network errors.

### Dashboard (Authenticated Hub)
- View name: Dashboard
- View path: `/dashboard`
- Main purpose: Central hub for quiz creation, need review list, and history.
- Key information to display: Quiz creation controls, need review list with counts, history list.
- Key view components:
  - Persistent header showing user email and logout button.
  - Quiz Creation section: two side-by-side cards (Level-Based Quiz, Need Review Quiz) with inline validation and disabled states.
  - Need Review List section: paginated list, “Start Quiz” button, inline remove actions.
  - History section: accordion of completed quizzes with summary badges and expandable details; “Show 10 more” pagination.
  - Skeleton loaders for each section during data load.
- UX/accessibility/security considerations: Clear validation errors (e.g., insufficient kanji); disabled start buttons until valid; pagination with accessible labels; aria-live for updates; role="status" for loading states.
- API compatibility:
  - `GET /api/need-reviews` for list and availability.
  - `GET /api/quizzes?status=completed` for history.
  - `POST /api/quizzes` to start a quiz.
  - `GET /api/kanji?level=` for availability checks (or API validation error handling).
- Mapped requirements/user stories: US-003, US-004, US-005, US-009, US-010, US-012, US-015, US-016.
- Edge/error states: Need review list empty; insufficient kanji for level; history empty; API errors (toast + retry).

### Quiz Experience
- View name: Quiz
- View path: `/quiz/[id]`
- Main purpose: Conduct a single quiz session with sequential questions and immediate feedback.
- Key information to display: Kanji character (large), progress indicator, question prompt, input, feedback, need review toggle.
- Key view components:
  - Header with “Abandon Quiz” button and confirmation dialog.
  - Progress indicator (bar + “Question X of Y”).
  - Kanji display (120px desktop, responsive down on mobile).
  - Input area:
    - Reading questions: WanaKana-enabled input with IME mode, hint text.
    - Meaning questions: plain input with placeholder.
  - Submit button; feedback section with correctness, correct answers, prominent need review checkbox.
  - Next Question button; completion modal at end with score and counts.
- UX/accessibility/security considerations: No backward navigation to previous questions; focus management between submit/next; aria-live for feedback; confirmation modal for abandon; prevent double submissions.
- API compatibility:
  - `GET /api/quizzes/:id` to load/resume.
  - `PATCH /api/quizzes/:quizId/questions/:questionId` to submit answer.
  - `POST /api/quizzes/:id/complete` to finish.
  - `PATCH /api/quizzes/:id/abandon` to abandon.
  - `POST /api/need-reviews` / `DELETE /api/need-reviews/:kanjiId` for toggles.
- Mapped requirements/user stories: US-006, US-007, US-008, US-009, US-011, US-014, US-017.
- Edge/error states: Question already answered; quiz already completed; lost session (re-fetch); invalid input (non-kana); network failures during answer submit (retry toast).

### History Detail (Embedded in Dashboard)
- View name: History Detail (Accordion Item)
- View path: `/dashboard` (embedded)
- Main purpose: Show per-quiz question results and answers.
- Key information to display: Kanji, correctness, user answer, correct answers, quiz metadata.
- Key view components: Accordion item with summary badges; expanded list of question results; “Show 10 more” pagination.
- UX/accessibility/security considerations: Expand/collapse with keyboard; readable badges with color + text; avoid data overload via pagination.
- API compatibility: `GET /api/quizzes/:id` for quiz detail.
- Mapped requirements/user stories: US-012, US-013, US-011 (summary context).
- Edge/error states: Quiz not found; unauthorized; empty result set.

### Global Error and Empty States (System Surfaces)
- View name: Error Boundary / Not Found / Empty States
- View path: Global (applies to all views)
- Main purpose: Provide consistent recovery for unhandled errors and missing data.
- Key information to display: Friendly error message, retry, and navigation options.
- Key view components: Error boundary fallback page; toast system; modal for critical auth failures; skeleton loaders and text-only empty states with emoji.
- UX/accessibility/security considerations: Avoid exposing stack traces; aria-live for error messages; retry actions in toasts.
- API compatibility: Reflects all API error responses (validation, unauthorized, not found).
- Mapped requirements/user stories: US-016.

## 3. User Journey Map

Primary journey: First-time quiz completion
1. User lands on `/` and is routed to `/auth/signup`.
2. User signs up, then auto-redirects to `/dashboard`.
3. User selects level and question count in Level-Based Quiz card.
4. User starts quiz (`POST /api/quizzes`) and navigates to `/quiz/[id]`.
5. User answers questions sequentially, receives immediate feedback, and optionally toggles need review.
6. After final question, completion modal shows score; user closes modal and returns to `/dashboard`.
7. History updates with the completed quiz; need review list reflects any marked kanji.

Secondary journey: Need review focused practice
1. User opens `/dashboard`, sees need review list.
2. User starts a Need Review quiz with available count.
3. Quiz proceeds as above; completion returns to dashboard.

Secondary journey: History exploration
1. User expands a history accordion item.
2. UI loads quiz details and displays per-question results.

Recovery journey: Abandon quiz
1. User clicks “Abandon Quiz” in header.
2. Confirmation dialog appears; on confirm, quiz is abandoned and user returns to dashboard.

## 4. Layout and Navigation Structure

- Route-based navigation with distinct URLs: `/dashboard`, `/quiz/[id]`, `/auth/signin`, `/auth/signup`.
- Persistent header in authenticated views:
  - Left: app title/logo.
  - Right: user email, logout action (MVP).
- Dashboard uses vertical stacking of three sections; quiz creation cards are side-by-side on desktop and stacked on mobile.
- The quiz view minimizes navigation to prevent accidental exits; only “Abandon Quiz” is provided in header.
- Authentication pages are centered single-card layouts with focused flow and clear links between sign-in and sign-up.

## 5. Key Components

- `Header`: Persistent navigation with auth status and logout.
- `QuizCreationCard`: Level-based and need-review quiz forms with inline validation.
- `NeedReviewList`: Paginated list with remove action and “Start Quiz” CTA.
- `HistoryAccordion`: Collapsed summary + expandable details with pagination.
- `ProgressIndicator`: Visual + numeric progress.
- `QuizQuestion`: Kanji display, prompt, input controls.
- `FeedbackSection`: Correct/incorrect display, correct answers, need review toggle.
- `NeedReviewToggle`: Labeled checkbox shown pre-answer and post-answer.
- `CompletionModal`: Quiz summary statistics and return-to-dashboard action.
- `ConfirmationDialog`: Abandon quiz confirmation.
- `ToastSystem`: Transient errors with retry actions.
- `SkeletonLoader`: Layout-matched loading states.
- `GlobalErrorBoundary`: Safe fallback with recovery guidance.
