# View Implementation Plan: Quiz

## 1. Overview
The Quiz view is a full-screen, focused interface for sequential kanji practice. Users answer reading and meaning questions, receive immediate feedback, mark kanji for review, and can abandon or complete the quiz. After completion, a modal displays the final score.

## 2. View Routing
Route: `/quiz/[id]`

## 3. Component Structure
- `QuizPage` (Astro page)
- `QuizContainer`
- `QuizHeader`
- `AbandonButton`
- `ConfirmationDialog`
- `ProgressIndicator`
- `CurrentQuestion`
- `KanjiDisplay`
- `QuestionPrompt`
- `AnswerInput`
- `SubmitButton`
- `FeedbackSection`
- `CorrectnessIndicator`
- `CorrectAnswersList`
- `NeedReviewToggle`
- `NextQuestionButton`
- `CompletionModal`
- `ScoreSummary`
- `ReturnToDashboardButton`

## 4. Component Details

### `QuizPage` (Astro)
- Component description: Page entry that loads quiz server-side, handles auth checks, and mounts React island with initial data.
- Main elements: `Layout.astro`, `main`, `QuizContainer` React island.
- Handled events: none (delegates to React).
- Handled validation: Quiz ID format, user authentication, quiz ownership.
- Types: `QuizWithQuestionsDTO`, `ErrorResponseDTO`.
- Props: none.

### `QuizContainer`
- Component description: Main React component managing quiz state, question navigation, API calls, and overall flow.
- Main elements: `QuizHeader`, `QuizContent` (conditional), `CompletionModal` (conditional), error boundary, toast container.
- Handled events: quiz abandonment, answer submission, navigation, completion, need review toggle.
- Handled validation: all questions answered before completion, quiz in 'in_progress' state.
- Types: `QuizViewModel`, `QuestionViewModel`, `QuizWithQuestionsDTO`, `QuestionAnswerResponseDTO`, `QuizDTO`.
- Props: `initialQuiz: QuizWithQuestionsDTO`, `quizId: number`.

### `QuizHeader`
- Component description: Fixed header with app title and abandon button.
- Main elements: `header`, title text, `AbandonButton`.
- Handled events: none (delegates to child).
- Handled validation: none.
- Types: none.
- Props: none.

### `AbandonButton`
- Component description: Destructive button that opens confirmation dialog before abandoning quiz.
- Main elements: `Button variant="destructive"`, `ConfirmationDialog`.
- Handled events: `onClick` (open dialog), dialog `onConfirm`/`onCancel`.
- Handled validation: quiz must have `status='in_progress'`.
- Types: `QuizStatus`.
- Props: `onAbandon: () => Promise<void>`.

### `ConfirmationDialog`
- Component description: Modal asking for user confirmation with warning message before abandoning.
- Main elements: Dialog overlay, content, Cancel button, Confirm Abandon button.
- Handled events: `onConfirm`, `onCancel`.
- Handled validation: none.
- Types: none.
- Props: `isOpen: boolean`, `onConfirm: () => void`, `onCancel: () => void`, `title: string`, `description: string`.

### `ProgressIndicator`
- Component description: Visual progress bar and text indicator showing current question position.
- Main elements: `div` (progress bar with CSS width %), `p` ("Question X of Y").
- Handled events: none.
- Handled validation: none.
- Types: `ProgressViewModel`.
- Props: `currentQuestionIndex: number`, `totalQuestions: number`.

### `CurrentQuestion`
- Component description: Container for current question displaying kanji, input, feedback, and navigation.
- Main elements: `KanjiDisplay`, `QuestionPrompt`, `AnswerInput`, `SubmitButton`, `FeedbackSection`, `NextQuestionButton`.
- Handled events: answer submission, next navigation, need review toggle.
- Handled validation: cannot submit empty answer, cannot submit if already answered, feedback shown before proceeding.
- Types: `QuestionViewModel`, `QuestionAnswerResponseDTO`.
- Props: `question: QuestionViewModel`, `onSubmitAnswer: (answer: string) => Promise<void>`, `onNextQuestion: () => void`, `onToggleNeedReview: (kanjiId, state) => Promise<void>`, `isLastQuestion: boolean`, `needReviewState: boolean`.

### `KanjiDisplay`
- Component description: Large centered kanji character (120px desktop, responsive mobile).
- Main elements: `div` with large text.
- Handled events: none.
- Handled validation: none.
- Types: none.
- Props: `character: string`.

### `QuestionPrompt`
- Component description: Dynamic prompt text based on question type.
- Main elements: `p` with prompt ("What is the reading?" or "What does this kanji mean?").
- Handled events: none.
- Handled validation: none.
- Types: `QuestionType`.
- Props: `questionType: QuestionType`.

### `AnswerInput`
- Component description: Input field with WanaKana binding for reading questions, plain for meaning questions.
- Main elements: `input type="text"`, placeholder, hint text (reading: "Type in hiragana or katakana").
- Handled events: `onChange`, `onKeyDown` (Enter to submit).
- Handled validation: answer must not be empty (trimmed).
- Types: `QuestionType`.
- Props: `questionType: QuestionType`, `value: string`, `onChange: (value: string) => void`, `onSubmit: () => void`, `disabled: boolean`.

### `SubmitButton`
- Component description: Primary button to submit answer, disabled when empty or submitting.
- Main elements: `Button variant="default"`, loading spinner.
- Handled events: `onClick`.
- Handled validation: disabled when answer empty or submitting.
- Types: none.
- Props: `onClick: () => void`, `disabled: boolean`, `isLoading: boolean`.

### `FeedbackSection`
- Component description: Section shown after submission with correctness, correct answers, and need review toggle. Styled green/red. Includes aria-live region.
- Main elements: `div`, `CorrectnessIndicator`, `CorrectAnswersList`, `NeedReviewToggle`.
- Handled events: none (delegates to children).
- Handled validation: none.
- Types: `QuestionFeedbackDTO`.
- Props: `feedback: QuestionFeedbackDTO`, `needReviewState: boolean`, `onToggleNeedReview: () => Promise<void>`.

### `CorrectnessIndicator`
- Component description: Icon and text showing correctness (checkmark + "Correct!" or X + "Incorrect").
- Main elements: icon, text with success/error colors.
- Handled events: none.
- Handled validation: none.
- Types: none.
- Props: `isCorrect: boolean`.

### `CorrectAnswersList`
- Component description: List of all acceptable correct answers.
- Main elements: heading ("Correct answers:"), `ul` with `li` items.
- Handled events: none.
- Handled validation: none.
- Types: `QuestionFeedbackDTO`.
- Props: `correctAnswers: string[]`.

### `NeedReviewToggle`
- Component description: Checkbox to mark/unmark kanji for review with optimistic updates.
- Main elements: `label`, checkbox, text ("Mark for review"), loading spinner.
- Handled events: `onChange`.
- Handled validation: revert on API failure.
- Types: `NeedReviewDTO`, `AddNeedReviewCommandDTO`.
- Props: `kanjiId: number`, `isMarked: boolean`, `onChange: (newState: boolean) => Promise<void>`.

### `NextQuestionButton`
- Component description: Button to proceed to next question or finish quiz (last question).
- Main elements: `Button variant="default"`, text ("Next Question" or "Finish Quiz").
- Handled events: `onClick`.
- Handled validation: only visible after feedback shown.
- Types: none.
- Props: `onClick: () => void`, `isLastQuestion: boolean`.

### `CompletionModal`
- Component description: Modal shown after completion with score, encouragement, and return button.
- Main elements: Modal overlay, heading ("Quiz Complete!"), `ScoreSummary`, encouragement message, `ReturnToDashboardButton`.
- Handled events: return to dashboard navigation.
- Handled validation: only shown when `status='completed'`.
- Types: `QuizDTO`.
- Props: `score: number`, `correctCount: number`, `totalCount: number`, `onReturnToDashboard: () => void`.

### `ScoreSummary`
- Component description: Visual score display with large percentage and counts. Color coded: green >80%, yellow 50-80%, red <50%.
- Main elements: large percentage text, detailed count text.
- Handled events: none.
- Handled validation: none.
- Types: none.
- Props: `scorePercent: number`, `correctCount: number`, `totalCount: number`.

### `ReturnToDashboardButton`
- Component description: Primary button to navigate back to dashboard.
- Main elements: `Button variant="default"`.
- Handled events: `onClick` (navigate to `/dashboard`).
- Handled validation: none.
- Types: none.
- Props: `onClick: () => void`.

## 5. Types

### Existing DTOs (from `src/types.ts`)
- `QuizWithQuestionsDTO`
- `QuizQuestionDTO`
- `KanjiDTO`
- `QuestionAnswerResponseDTO`
- `QuestionFeedbackDTO`
- `QuizDTO`
- `SubmitAnswerCommandDTO`
- `AddNeedReviewCommandDTO`
- `NeedReviewDTO`
- `ErrorResponseDTO`
- `QuizType`, `QuestionType`, `QuizStatus`, `JLPTLevel`

### New ViewModel Types
- `QuizViewModel`
  - `quiz: QuizWithQuestionsDTO`
  - `currentQuestionIndex: number`
  - `needReviewMap: Map<number, boolean>`
  - `isAbandoning: boolean`
  - `isCompleting: boolean`
- `QuestionViewModel` (extends `QuizQuestionDTO`)
  - `currentAnswer: string`
  - `isSubmitting: boolean`
  - `feedbackData: QuestionFeedbackDTO | null`
  - `isAnswered: boolean`
- `ProgressViewModel`
  - `current: number`
  - `total: number`
  - `percentComplete: number`
- `CompletionSummaryViewModel`
  - `scorePercent: number`
  - `correctCount: number`
  - `totalCount: number`
  - `encouragementMessage: string`
- `QuestionState` enum: `UNANSWERED`, `SUBMITTING`, `FEEDBACK`, `READY_TO_PROCEED`

## 6. State Management
- Use custom hook `useQuizState` in `src/components/hooks/useQuizState.ts` to centralize quiz state, API calls, and business logic.
- State variables:
  - `quiz: QuizWithQuestionsDTO`
  - `currentQuestionIndex: number`
  - `needReviewMap: Map<number, boolean>`
  - `isLoading: boolean`
  - `error: Error | null`
  - `isAbandoning: boolean`
  - `isCompleting: boolean`
  - `questionStates: Map<number, QuestionViewModel>`
- Derived state: `currentQuestion`, `isLastQuestion`, `progress`, `allQuestionsAnswered`, `completionSummary`.
- Actions:
  - `initializeQuiz(initialQuiz)`: sets initial data, loads need review states, finds first unanswered.
  - `submitAnswer(answer)`: validates, calls PATCH `/api/quizzes/:quizId/questions/:questionId`, updates with feedback.
  - `goToNextQuestion()`: increments index, triggers `completeQuiz()` if last.
  - `abandonQuiz()`: calls PATCH `/api/quizzes/:id/abandon`, navigates to dashboard.
  - `completeQuiz()`: validates all answered, calls POST `/api/quizzes/:id/complete`, shows modal.
  - `toggleNeedReview(kanjiId)`: optimistic update, calls POST/DELETE `/api/need-reviews`, reverts on error.
  - `refetchQuiz()`: re-fetches quiz from GET `/api/quizzes/:id`.

## 7. API Integration
- `GET /api/quizzes/:id`
  - Response: `QuizWithQuestionsDTO`
  - Action: initial load (server-side) or refetch (client-side).
- `PATCH /api/quizzes/:quizId/questions/:questionId`
  - Request: `SubmitAnswerCommandDTO`
  - Response: `QuestionAnswerResponseDTO`
  - Action: submit answer, update with feedback.
- `POST /api/quizzes/:id/complete`
  - Response: `QuizDTO`
  - Action: mark complete, update status and score.
- `PATCH /api/quizzes/:id/abandon`
  - Response: `QuizDTO`
  - Action: abandon quiz, navigate to dashboard.
- `POST /api/need-reviews`
  - Request: `AddNeedReviewCommandDTO`
  - Response: `NeedReviewDTO`
  - Action: add to review list.
- `DELETE /api/need-reviews/:kanjiId`
  - Response: `204 No Content`
  - Action: remove from review list.
- Create `src/lib/services/quiz-client.service.ts` with type-safe methods for all API calls.

## 8. User Interactions
- Start quiz: Navigate to `/quiz/:id` from dashboard; server loads data, renders first unanswered question.
- Answer question: Type answer, click Submit or press Enter; show loading, then feedback (green/red) with correct answers.
- Mark for review: Click checkbox in feedback; optimistic update, API call, revert on error with toast.
- Next question: Click "Next Question" after feedback; increment index, render next question, update progress.
- Complete quiz: Click "Finish Quiz" on last question; validate all answered, API call, show completion modal.
- Abandon quiz: Click "Abandon Quiz" in header; show confirmation dialog, call API on confirm, navigate to dashboard.
- Return to dashboard: Click "Return to Dashboard" in completion modal; navigate to `/dashboard`.
- Keyboard navigation: Enter submits answer, Tab navigates, Escape closes dialogs.
- Error recovery: Show toast with retry option; critical errors redirect to dashboard.

## 9. Conditions and Validation
- Answer submission:
  - Answer must not be empty (`answer.trim().length > 0`).
  - Submit button disabled when answer empty.
  - Question must not be already answered (`user_answer === null`).
  - Quiz must have `status='in_progress'`.
- Quiz completion:
  - All questions must be answered (`questions.every(q => q.user_answer !== null)`).
  - Quiz must have `status='in_progress'`.
  - Completion triggered only after last question answered.
- Quiz abandonment:
  - Quiz must have `status='in_progress'`.
  - Abandon button hidden if not in progress.
  - User must confirm in dialog.
- Need review toggle:
  - API handles idempotent add/remove.
  - Optimistic update with rollback on error.
- Input by question type:
  - Reading: WanaKana enabled, hint "Type in hiragana or katakana", server validates against readings.
  - Meaning: Plain input, hint "Type the English meaning", server validates against meanings.

## 10. Error Handling
- Network errors: Toast "Network error. Please check your connection." with retry button.
- Validation errors (400): Toast with specific message ("Answer cannot be empty", "This question has already been answered").
- Auth errors (401): Redirect to sign-in with return URL, toast "Your session has expired."
- Authorization errors (403): Redirect to dashboard, toast "You do not have permission to access this quiz."
- Not found errors (404): Redirect to dashboard, toast "Quiz not found."
- Conflict errors (409): For completion, treat as success; for abandon, toast and refresh state.
- Server errors (500): Toast "Something went wrong. Please try again." with retry button.
- Optimistic update rollback: On need review toggle failure, revert checkbox state and show toast.
- Error boundaries: Wrap `QuizContainer` with fallback UI offering return to dashboard or retry.
- Edge cases:
  - Session loss: Redirect to sign-in with return URL.
  - Stale state: Refetch quiz on 409, show appropriate message.
  - Question already answered: Refetch quiz, move to next unanswered.
  - All answered but not completed: Show "Finish Quiz" button, allow retry.
  - Invalid quiz state on load: Show completion modal if completed, redirect if abandoned.

## 11. Implementation Steps
1. Create `src/components/types/quiz-view.types.ts` with ViewModels.
2. Create `src/lib/services/quiz-client.service.ts` with API methods.
3. Create `src/components/hooks/useQuizState.ts` with state and actions.
4. Build presentational components: `KanjiDisplay`, `QuestionPrompt`, `ProgressIndicator`, `CorrectnessIndicator`, `CorrectAnswersList`, `ScoreSummary`.
5. Build interactive components: `AnswerInput` (with WanaKana), `SubmitButton`, `NextQuestionButton`, `NeedReviewToggle`, `AbandonButton`, `ReturnToDashboardButton`.
6. Build composite components: `FeedbackSection`, `CurrentQuestion`.
7. Build dialogs/modals: `ConfirmationDialog`, `CompletionModal`.
8. Build `QuizHeader` and `QuizContent`.
9. Build main `QuizContainer` with `useQuizState` hook, error boundary, and toast system.
10. Create `src/pages/quiz/[id].astro` with server-side quiz loading and error handling.
11. Add WanaKana integration: install `wanakana`, bind to input for reading questions.
12. Implement error handling: global handler, toast system, error messages for each type.
13. Add loading states: skeletons, spinners, disabled inputs.
14. Implement accessibility: ARIA labels, aria-live regions, keyboard navigation, focus management.
15. Style with Tailwind: responsive kanji display (120px desktop), green/red feedback, smooth transitions.
16. Integration testing: complete flow, abandon flow, error recovery, edge cases.
17. Performance optimization: memoize calculations, React.memo, lazy load modal.
18. Documentation: component props, hook API, JSDoc comments.
19. Final testing: multiple browsers, mobile devices, user stories (US-006/007/008/009/011/014/017), linter.
20. Deployment prep: production build, environment variables, bundle size, 3G performance test.
