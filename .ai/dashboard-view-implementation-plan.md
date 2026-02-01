# View Implementation Plan Dashboard

## 1. Overview

The Dashboard view is the authenticated hub where users start level-based or need-review quizzes, manage their need-review list, and review completed quiz history with expandable details.

## 2. View Routing

Route: `/dashboard`

## 3. Component Structure

- `DashboardPage` (Astro page)
- `DashboardLayout`
- `DashboardHeader`
- `QuizCreationSection`
- `LevelQuizCard`
- `NeedReviewQuizCard`
- `NeedReviewListSection`
- `NeedReviewList`
- `NeedReviewListItem`
- `NeedReviewPagination`
- `HistorySection`
- `HistoryList`
- `HistoryItemAccordion`
- `HistoryPagination`
- `InlineAlert`
- `SectionSkeleton`

## 4. Component Details

### `DashboardPage` (Astro)

- Component description: Page entry that wires layout, loads React island, and sets SEO title.
- Main elements: `Layout.astro`, `main`, `DashboardLayout` React island.
- Handled events: none (delegates to React).
- Handled validation: none.
- Types: none.
- Props: none.

### `DashboardLayout`

- Component description: Orchestrates data fetching and state, passes props to sections.
- Main elements: container `div`, `DashboardHeader`, `QuizCreationSection`, `NeedReviewListSection`, `HistorySection`.
- Handled events: initial load effects, refresh handlers for lists.
- Handled validation: global view readiness (loading/error states).
- Types: `NeedReviewListResponseDTO`, `QuizListResponseDTO`, `CreateQuizCommandDTO`, `DashboardViewState`.
- Props: none.

### `DashboardHeader`

- Component description: Persistent header showing user email and logout button.
- Main elements: `header`, user email text, `Button` for logout.
- Handled events: logout click.
- Handled validation: none.
- Types: `UserHeaderVM`.
- Props: `email: string`, `onLogout: () => void`.

### `QuizCreationSection`

- Component description: Hosts two cards for quiz setup and start actions.
- Main elements: `section`, grid of `LevelQuizCard` and `NeedReviewQuizCard`.
- Handled events: forwards start actions to parent.
- Handled validation: section-level disabling if data unavailable.
- Types: `LevelQuizFormState`, `NeedReviewQuizFormState`.
- Props: `levelForm`, `needReviewForm`, `onStartLevelQuiz`, `onStartNeedReviewQuiz`.

### `LevelQuizCard`

- Component description: Level-based quiz configuration and start.
- Main elements: `Card`, `Select` for level, `RadioGroup` or `ToggleGroup` for question count (10/20/50), `Button`.
- Handled events: `onLevelChange`, `onQuestionCountChange`, `onStart`.
- Handled validation:
  - `level` required and must be one of N5–N1.
  - `question_count` required and must be 10, 20, or 50.
  - Disable Start while invalid or submitting.
  - Surface `INSUFFICIENT_KANJI` API error as inline message.
- Types: `LevelQuizFormState`, `CreateQuizCommandDTO`, `QuizWithQuestionsDTO`, `ErrorResponseDTO`.
- Props: `formState`, `onChange`, `onSubmit`, `errorMessage`, `isSubmitting`.

### `NeedReviewQuizCard`

- Component description: Need-review quiz configuration and start.
- Main elements: `Card`, `RadioGroup` for question count, availability text, `Button`.
- Handled events: `onQuestionCountChange`, `onStart`.
- Handled validation:
  - `question_count` required and must be 10, 20, or 50.
  - Must be `<= availableNeedReviewCount` (from need-review list total).
  - Disable Start if no available items, invalid count, or submitting.
  - Surface `INSUFFICIENT_KANJI` error inline.
- Types: `NeedReviewQuizFormState`, `NeedReviewAvailabilityVM`, `CreateQuizCommandDTO`, `ErrorResponseDTO`.
- Props: `formState`, `availableCount`, `onChange`, `onSubmit`, `errorMessage`, `isSubmitting`.

### `NeedReviewListSection`

- Component description: Paginated list of need-review kanji with inline remove actions and a Start Quiz shortcut.
- Main elements: `section`, header with count, `NeedReviewList`, `NeedReviewPagination`, optional `Button` for start.
- Handled events: remove item, pagination change, start quiz shortcut.
- Handled validation:
  - Disable remove while deleting.
  - Start shortcut disabled if form invalid or no available items.
- Types: `NeedReviewListItemVM`, `PaginationState`, `NeedReviewQuizFormState`.
- Props: `items`, `pagination`, `onRemove`, `onPaginate`, `onStartNeedReviewQuiz`, `isLoading`.

### `NeedReviewList`

- Component description: Renders list or empty state.
- Main elements: `ul`, `NeedReviewListItem`, empty placeholder.
- Handled events: none (child handles remove).
- Handled validation: none.
- Types: `NeedReviewListItemVM`.
- Props: `items`, `onRemove`, `isLoading`.

### `NeedReviewListItem`

- Component description: Single need-review row with kanji info and remove action.
- Main elements: `li`, kanji character, readings/meanings, `Button` remove.
- Handled events: `onRemove(kanjiId)`.
- Handled validation: disable button while deleting.
- Types: `NeedReviewListItemVM`.
- Props: `item`, `onRemove`, `isDeleting`.

### `NeedReviewPagination`

- Component description: Pagination controls for need-review list.
- Main elements: `nav`, previous/next buttons, status text.
- Handled events: `onNext`, `onPrev`.
- Handled validation:
  - Disable prev when `offset === 0`.
  - Disable next when `offset + limit >= total`.
- Types: `PaginationState`.
- Props: `pagination`, `onChange`.

### `HistorySection`

- Component description: Completed quiz history with expandable details and pagination.
- Main elements: `section`, `HistoryList`, `HistoryPagination`, "Show 10 more" button.
- Handled events: pagination change, expand/collapse.
- Handled validation: none.
- Types: `HistoryItemVM`, `PaginationState`.
- Props: `items`, `pagination`, `onPaginate`, `isLoading`.

### `HistoryList`

- Component description: Renders history or empty state.
- Main elements: `Accordion`, `HistoryItemAccordion`, empty placeholder.
- Handled events: none (child handles expand).
- Handled validation: none.
- Types: `HistoryItemVM`.
- Props: `items`, `isLoading`.

### `HistoryItemAccordion`

- Component description: Expandable summary + details of a completed quiz.
- Main elements: `AccordionItem`, summary row with badges, details list.
- Handled events: expand/collapse.
- Handled validation: none.
- Types: `HistoryItemVM`.
- Props: `item`.

### `InlineAlert`

- Component description: Reusable inline error or info message.
- Main elements: `div` with `role="status"` or `role="alert"`.
- Handled events: optional dismiss.
- Handled validation: none.
- Types: `InlineAlertVM`.
- Props: `variant`, `message`, `onDismiss`.

### `SectionSkeleton`

- Component description: Skeleton loader for each section during data load.
- Main elements: `Skeleton` blocks.
- Handled events: none.
- Handled validation: none.
- Types: none.
- Props: `variant`.

## 5. Types

### Existing DTOs (from `src/types.ts`)

- `CreateQuizCommandDTO`
- `QuizWithQuestionsDTO`
- `QuizListResponseDTO`
- `QuizListItemDTO`
- `NeedReviewListResponseDTO`
- `NeedReviewDTO`
- `JLPTLevel`
- `QuizStatus`
- `ErrorResponseDTO`
- `PaginationDTO`

### New ViewModel Types

- `DashboardViewState`
  - `levelForm: LevelQuizFormState`
  - `needReviewForm: NeedReviewQuizFormState`
  - `needReviewList: NeedReviewListItemVM[]`
  - `historyList: HistoryItemVM[]`
  - `needReviewPagination: PaginationState`
  - `historyPagination: PaginationState`
  - `loading: { needReview: boolean; history: boolean }`
  - `errors: { needReview?: string; history?: string; levelQuiz?: string; needReviewQuiz?: string }`
- `LevelQuizFormState`
  - `level: JLPTLevel | ""`
  - `questionCount: 10 | 20 | 50 | null`
  - `isSubmitting: boolean`
- `NeedReviewQuizFormState`
  - `questionCount: 10 | 20 | 50 | null`
  - `availableCount: number`
  - `isSubmitting: boolean`
- `NeedReviewListItemVM`
  - `id: number`
  - `kanjiId: number`
  - `character: string`
  - `level: JLPTLevel`
  - `readings: string[]`
  - `meanings: string[]`
  - `createdAt: string`
- `HistoryItemVM`
  - `id: number`
  - `type: "level" | "need_review"`
  - `level?: JLPTLevel | null`
  - `questionCount: number`
  - `scorePercent: number | null`
  - `createdAt: string`
  - `completedAt: string | null`
- `PaginationState`
  - `limit: number`
  - `offset: number`
  - `total: number`
- `InlineAlertVM`
  - `variant: "error" | "info"`
  - `message: string`
- `UserHeaderVM`
  - `email: string`

## 6. State Management

- Use local React state in `DashboardLayout` with `useState` and `useEffect` for initial data load.
- Custom hooks:
  - `useNeedReviewList({ limit, offset })`: fetches list, exposes `data`, `loading`, `error`, and `refresh`.
  - `useQuizHistory({ limit, offset })`: fetches completed quizzes with `status=completed`.
  - `useStartQuiz()`: wraps POST `/api/quizzes` and handles pending state and error parsing.
- Maintain separate pagination state for need-review list and history list.
- Store form states for both quiz cards and update in controlled inputs.

## 7. API Integration

- `GET /api/need-reviews?limit=&offset=`
  - Response: `NeedReviewListResponseDTO`
  - Action: populate need-review list + `availableCount` from `pagination.total`.
- `DELETE /api/need-reviews/:kanjiId`
  - Response: `204 No Content`
  - Action: optimistic remove list item, adjust `total`, then refetch on failure.
- `GET /api/quizzes?status=completed&limit=&offset=`
  - Response: `QuizListResponseDTO`
  - Action: populate history list (US-014: incomplete not shown).
- `POST /api/quizzes`
  - Request: `CreateQuizCommandDTO`
  - Response: `QuizWithQuestionsDTO`
  - Action: on success, navigate to `/quiz/[id]` using returned `id`.

## 8. User Interactions

- Select level (N5–N1) and question count; Start creates level quiz and routes to `/quiz/[id]`.
- Select question count for need-review quiz; Start creates need-review quiz and routes to `/quiz/[id]`.
- Remove a kanji from need-review list; row disappears and count updates.
- Paginate need-review list using next/prev controls.
- Expand a history item to view summary details.
- Click "Show 10 more" to append next page of history results.

## 9. Conditions and Validation

- Level quiz:
  - `level` required and must be `JLPTLevel`.
  - `question_count` required and must be 10/20/50.
  - Disable Start unless valid.
- Need-review quiz:
  - `question_count` required and must be 10/20/50.
  - `question_count <= availableCount` (from need-review list total).
  - Disable Start if invalid or `availableCount === 0`.
- Pagination:
  - `limit` between 1 and 100.
  - `offset >= 0`.
  - Disable pagination controls based on `offset` and `total`.
- History list:
  - Use `status=completed` to satisfy US-014.

## 10. Error Handling

- Show inline alert on section-level load errors (need-review/history).
- Show inline validation error on quiz card when POST returns `VALIDATION_ERROR` or `INSUFFICIENT_KANJI`.
- Show toast or inline alert on DELETE failure and rollback optimistic update.
- Handle empty states with friendly messaging for need-review list and history.
- Use `aria-live` or `role="status"` for loading and error updates.

## 11. Implementation Steps

1. Create `src/pages/dashboard.astro` that renders `Layout.astro` and mounts `DashboardLayout`.
2. Build `DashboardLayout` React component with state, effects, and data hooks.
3. Implement `QuizCreationSection`, `LevelQuizCard`, and `NeedReviewQuizCard` with controlled inputs and validation.
4. Implement `NeedReviewListSection` with list, remove action, and pagination.
5. Implement `HistorySection` with accordion list and pagination/"Show 10 more".
6. Add `InlineAlert` and `SectionSkeleton` utilities and wire loading/error states.
7. Add API helper functions or hooks for fetch calls and error mapping to UI.
8. Verify interactions against user stories (US-003/004/005/010/012/013/014) and adjust UI states for edge cases.
