# API Endpoint Implementation Plan: Submit Quiz Question Answer

## 1. Endpoint Overview

The `PATCH /api/quizzes/:quizId/questions/:questionId` endpoint allows authenticated users to submit an answer for a specific quiz question. The endpoint validates the answer against the kanji's readings (for reading questions) or meanings (for meaning questions), records the answer with a timestamp, determines correctness, and returns immediate feedback including the correct answers.

**Key Functionality:**

- Validates user ownership of the quiz
- Ensures quiz is in progress (not completed or abandoned)
- Prevents duplicate answer submissions
- Performs case-insensitive answer validation
- Records answer, timestamp, and correctness
- Returns immediate feedback for learning reinforcement

## 2. Request Details

**HTTP Method:** `PATCH`

**URL Structure:** `/api/quizzes/:quizId/questions/:questionId`

**Path Parameters:**

- `quizId` (required): Numeric string representing the quiz ID (bigint)
- `questionId` (required): Numeric string representing the question ID (bigint)

**Request Headers:**

- `Authorization`: `Bearer <jwt_token>` (required, validated by Astro middleware)

**Request Body:**

```json
{
  "user_answer": "こう"
}
```

**Request Body Fields:**

- `user_answer` (required): String containing the user's answer (will be trimmed and normalized)

**Query Parameters:** None

## 3. Used Types

### Existing Types (from `src/types.ts`)

**Command Model:**

```typescript
export interface SubmitAnswerCommandDTO {
  user_answer: string;
}
```

**Response DTOs:**

```typescript
export interface QuestionAnswerResponseDTO extends QuizQuestionDTO {
  feedback: QuestionFeedbackDTO;
}

export interface QuestionFeedbackDTO {
  is_correct: boolean;
  correct_answers: string[];
}

export interface QuizQuestionDTO extends QuizQuestionEntity {
  kanji: KanjiDTO;
}
```

**Entity Types:**

```typescript
export type QuizQuestionEntity = Tables<"quiz_questions">;
export type QuestionType = Database["public"]["Enums"]["question_type"];
export type QuizStatus = Database["public"]["Enums"]["quiz_status"];
```

### New Validation Schemas (to be created in `src/lib/validation/quiz.validation.ts`)

```typescript
/**
 * Validation schema for PATCH /api/quizzes/:quizId/questions/:questionId path parameters
 */
export const submitAnswerParamsSchema = z.object({
  quizId: z
    .string()
    .regex(/^\d+$/, "Quiz ID must be a valid number")
    .transform(Number)
    .refine((val) => val > 0, {
      message: "Quiz ID must be a positive number",
    }),
  questionId: z
    .string()
    .regex(/^\d+$/, "Question ID must be a valid number")
    .transform(Number)
    .refine((val) => val > 0, {
      message: "Question ID must be a positive number",
    }),
});

export type SubmitAnswerParams = z.infer<typeof submitAnswerParamsSchema>;

/**
 * Validation schema for request body
 */
export const submitAnswerBodySchema = z.object({
  user_answer: z
    .string()
    .min(1, "Answer cannot be empty")
    .max(100, "Answer is too long (max 100 characters)")
    .transform((val) => val.trim()),
});

export type SubmitAnswerBody = z.infer<typeof submitAnswerBodySchema>;

/**
 * Parsing functions
 */
export function parseSubmitAnswerParams(quizId: string, questionId: string): SubmitAnswerParams {
  return submitAnswerParamsSchema.parse({ quizId, questionId });
}

export function parseSubmitAnswerBody(body: unknown): SubmitAnswerBody {
  return submitAnswerBodySchema.parse(body);
}
```

### New Error Classes (to be added to `src/lib/errors/quiz.errors.ts`)

```typescript
/**
 * Error thrown when a question is not found
 */
export class QuestionNotFoundError extends Error {
  constructor(
    public readonly questionId: number,
    public readonly quizId?: number
  ) {
    super(quizId ? `Question ${questionId} not found in quiz ${quizId}` : `Question ${questionId} not found`);
    this.name = "QuestionNotFoundError";
  }
}

/**
 * Error thrown when attempting to answer an already answered question
 */
export class QuestionAlreadyAnsweredError extends Error {
  constructor(
    public readonly questionId: number,
    public readonly answeredAt: string
  ) {
    super(`Question ${questionId} has already been answered at ${answeredAt}`);
    this.name = "QuestionAlreadyAnsweredError";
  }
}

/**
 * Error thrown when answer submission fails due to database or validation issues
 */
export class AnswerSubmissionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "AnswerSubmissionError";
  }
}

/**
 * Error thrown when quiz is not in a valid state for answering questions
 */
export class QuizInvalidStateError extends Error {
  constructor(
    public readonly quizId: number,
    public readonly currentStatus: string
  ) {
    super(`Quiz ${quizId} cannot accept answers. Current status: ${currentStatus}`);
    this.name = "QuizInvalidStateError";
  }
}
```

## 4. Response Details

### Success Response (200 OK)

```json
{
  "id": 1001,
  "quiz_id": 123,
  "kanji_id": 42,
  "sequence": 1,
  "question_type": "reading",
  "kanji": {
    "id": 42,
    "character": "行",
    "level": "N5",
    "readings": ["こう", "ぎょう"],
    "meanings": ["go", "conduct", "line"],
    "created_at": "2026-01-18T09:00:00Z"
  },
  "user_answer": "こう",
  "answered_at": "2026-01-18T10:01:15Z",
  "is_correct": true,
  "created_at": "2026-01-18T10:00:00Z",
  "feedback": {
    "is_correct": true,
    "correct_answers": ["こう", "ぎょう"]
  }
}
```

### Error Responses

**400 Bad Request:**

```json
{
  "error": "Answer cannot be empty",
  "code": "VALIDATION_ERROR"
}
```

```json
{
  "error": "Question 1001 has already been answered",
  "code": "QUESTION_ALREADY_ANSWERED"
}
```

```json
{
  "error": "Quiz 123 cannot accept answers. Current status: completed",
  "code": "QUIZ_INVALID_STATE"
}
```

**401 Unauthorized:**

```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

**403 Forbidden:**

```json
{
  "error": "User abc123 does not have permission to access quiz 123",
  "code": "ACCESS_DENIED"
}
```

**404 Not Found:**

```json
{
  "error": "Quiz not found with id: 123",
  "code": "QUIZ_NOT_FOUND"
}
```

```json
{
  "error": "Question 1001 not found in quiz 123",
  "code": "QUESTION_NOT_FOUND"
}
```

**500 Internal Server Error:**

```json
{
  "error": "Failed to submit answer",
  "code": "INTERNAL_ERROR"
}
```

## 5. Data Flow

### High-Level Flow

```
Client Request
    ↓
[1] Astro Middleware (Authentication)
    ↓
[2] API Route Handler (Parameter Validation)
    ↓
[3] Request Body Validation
    ↓
[4] QuizService.submitAnswer()
    ├─→ [4a] Fetch and validate quiz (ownership, status)
    ├─→ [4b] Fetch and validate question (existence, not answered)
    ├─→ [4c] Verify question belongs to quiz
    ├─→ [4d] Validate answer (case-insensitive comparison)
    ├─→ [4e] Update question record (answer, timestamp, correctness)
    └─→ [4f] Fetch updated question with kanji data
    ↓
[5] Transform to QuestionAnswerResponseDTO with feedback
    ↓
[6] Return 200 OK with response
```

### Detailed Data Flow

#### Step 1: Authentication (Astro Middleware)

- Extract JWT token from Authorization header
- Verify token validity
- Attach `user` object to `context.locals`
- If invalid: Return 401 Unauthorized

#### Step 2: Path Parameter Validation

- Extract `quizId` and `questionId` from URL path
- Parse and validate using `parseSubmitAnswerParams()`
- Transform strings to positive integers
- If invalid: Return 400 Bad Request

#### Step 3: Request Body Validation

- Parse request body JSON
- Validate using `parseSubmitAnswerBody()`
- Trim and validate `user_answer`
- If invalid: Return 400 Bad Request

#### Step 4: Service Layer Operations (QuizService.submitAnswer)

**4a. Fetch and Validate Quiz:**

```sql
SELECT * FROM quiz
WHERE id = :quizId AND user_id = :userId
```

- If not found: Check if quiz exists for other users
  - If exists: Throw `QuizAccessDeniedError` (403)
  - If not exists: Throw `QuizNotFoundError` (404)
- If found: Validate status is 'in_progress'
  - If not: Throw `QuizInvalidStateError` (400)

**4b. Fetch and Validate Question:**

```sql
SELECT qq.*, k.*
FROM quiz_questions qq
INNER JOIN kanji k ON qq.kanji_id = k.id
WHERE qq.id = :questionId
```

- If not found: Throw `QuestionNotFoundError` (404)
- Validate `user_answer` is NULL and `answered_at` is NULL
  - If already answered: Throw `QuestionAlreadyAnsweredError` (400)

**4c. Verify Question Belongs to Quiz:**

- Check `question.quiz_id === quizId`
- If mismatch: Throw `QuestionNotFoundError` with quiz context (404)

**4d. Validate Answer:**

- Normalize user answer: `trim()` and `toLowerCase()`
- Get correct answers based on question type:
  - If `question_type === 'reading'`: Use `kanji.readings` array
  - If `question_type === 'meaning'`: Use `kanji.meanings` array
- Normalize correct answers: `trim()` and `toLowerCase()` each
- Check if normalized user answer matches any normalized correct answer
- Set `is_correct` boolean

**4e. Update Question Record:**

```sql
UPDATE quiz_questions
SET
  user_answer = :userAnswer,
  answered_at = NOW(),
  is_correct = :isCorrect
WHERE id = :questionId
RETURNING *
```

**4f. Fetch Complete Question with Kanji:**

```sql
SELECT qq.*, k.*
FROM quiz_questions qq
INNER JOIN kanji k ON qq.kanji_id = k.id
WHERE qq.id = :questionId
```

#### Step 5: Response Transformation

- Convert kanji entity readings/meanings from JSONB to string arrays
- Build `QuestionFeedbackDTO` with:
  - `is_correct`: Boolean from validation
  - `correct_answers`: Array of readings or meanings based on question type
- Construct `QuestionAnswerResponseDTO`

#### Step 6: Return Response

- HTTP 200 OK
- JSON body with complete question data and feedback

## 6. Security Considerations

### Authentication

- **Requirement:** Valid JWT token in Authorization header
- **Implementation:** Handled by Astro middleware
- **Validation:** User ID extracted from `context.locals.user`
- **Error Handling:** Return 401 if token missing or invalid

### Authorization

- **Ownership Verification:** Quiz must belong to authenticated user
- **Implementation:** Use `user_id` filter in quiz query
- **Prevention:** Two-step check to distinguish 403 vs 404
  1. Try to fetch quiz with user filter
  2. If fails, check if quiz exists without filter
  3. Return 403 if exists for other user, 404 if doesn't exist
- **Error Handling:** Return 403 for access denied, 404 for not found

### Input Validation

- **Path Parameters:**
  - Validate as numeric strings using regex
  - Transform to positive integers
  - Prevent negative numbers or zero
- **Request Body:**
  - Require non-empty `user_answer`
  - Trim whitespace to prevent padding attacks
  - Limit length to 100 characters to prevent abuse
  - Sanitize through Zod schema

- **Business Logic:**
  - Verify quiz is in 'in_progress' state
  - Prevent duplicate answer submissions
  - Ensure question belongs to specified quiz

### SQL Injection Prevention

- **Implementation:** Use Supabase parameterized queries
- **Protection:** All query parameters automatically escaped
- **No Manual SQL:** Rely on Supabase query builder

### Data Exposure Prevention

- **Error Messages:** Avoid exposing internal database details
- **Response Data:** Only return data user is authorized to see
- **Logging:** Log detailed errors server-side, return generic messages to client

### Rate Limiting Considerations

- **Concern:** Rapid-fire answer submissions
- **Mitigation:** Quiz-level validation (must be in progress)
- **Future Enhancement:** Consider rate limiting per user/quiz

## 7. Error Handling

### Error Types and Status Codes

| Error Type                     | Status Code | Trigger Condition                                | Error Code                  | Example Message                                                   |
| ------------------------------ | ----------- | ------------------------------------------------ | --------------------------- | ----------------------------------------------------------------- |
| `ZodError`                     | 400         | Invalid path parameters                          | `VALIDATION_ERROR`          | "Quiz ID must be a valid number"                                  |
| `ZodError`                     | 400         | Invalid request body                             | `VALIDATION_ERROR`          | "Answer cannot be empty"                                          |
| `QuizNotFoundError`            | 404         | Quiz doesn't exist                               | `QUIZ_NOT_FOUND`            | "Quiz not found with id: 123"                                     |
| `QuizAccessDeniedError`        | 403         | User doesn't own quiz                            | `ACCESS_DENIED`             | "User abc123 does not have permission to access quiz 123"         |
| `QuizInvalidStateError`        | 400         | Quiz not in progress                             | `QUIZ_INVALID_STATE`        | "Quiz 123 cannot accept answers. Current status: completed"       |
| `QuestionNotFoundError`        | 404         | Question doesn't exist or doesn't belong to quiz | `QUESTION_NOT_FOUND`        | "Question 1001 not found in quiz 123"                             |
| `QuestionAlreadyAnsweredError` | 400         | Question already has answer                      | `QUESTION_ALREADY_ANSWERED` | "Question 1001 has already been answered at 2026-01-18T10:00:00Z" |
| `AnswerSubmissionError`        | 500         | Database or unexpected error                     | `INTERNAL_ERROR`            | "Failed to submit answer"                                         |
| Authentication Error           | 401         | Missing or invalid token                         | `UNAUTHORIZED`              | "Authentication required"                                         |

### Error Handling Strategy

#### API Route Handler Level

```typescript
try {
  // Validate parameters and body
  const params = parseSubmitAnswerParams(quizId, questionId);
  const body = parseSubmitAnswerBody(await request.json());

  // Call service
  const result = await quizService.submitAnswer(params.quizId, params.questionId, body.user_answer, userId);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        error: error.errors[0].message,
        code: "VALIDATION_ERROR",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof QuizNotFoundError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        code: "QUIZ_NOT_FOUND",
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof QuizAccessDeniedError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        code: "ACCESS_DENIED",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof QuizInvalidStateError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        code: "QUIZ_INVALID_STATE",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof QuestionNotFoundError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        code: "QUESTION_NOT_FOUND",
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof QuestionAlreadyAnsweredError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        code: "QUESTION_ALREADY_ANSWERED",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Log unexpected errors
  console.error("Unexpected error in submit answer endpoint:", error);

  return new Response(
    JSON.stringify({
      error: "Failed to submit answer",
      code: "INTERNAL_ERROR",
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

#### Service Layer Error Handling

- Catch database errors and wrap in appropriate custom error types
- Use early returns for validation failures
- Re-throw known error types for route handler to process
- Wrap unexpected errors in `AnswerSubmissionError`

## 8. Performance Considerations

### Database Query Optimization

**Current Approach:**

- Multiple sequential queries for validation
- Separate queries for quiz, question, and update

**Optimization Opportunities:**

1. **Combined Quiz and Question Fetch:**
   - Use a single JOIN query to fetch quiz with question
   - Reduces round trips from 2 to 1

   ```sql
   SELECT
     q.id AS quiz_id,
     q.user_id,
     q.status,
     qq.id AS question_id,
     qq.quiz_id AS question_quiz_id,
     qq.user_answer,
     qq.answered_at,
     qq.question_type,
     k.*
   FROM quiz q
   INNER JOIN quiz_questions qq ON q.id = qq.quiz_id
   INNER JOIN kanji k ON qq.kanji_id = k.id
   WHERE q.id = :quizId AND qq.id = :questionId
   ```

2. **Index Utilization:**
   - Ensure indexes exist on:
     - `quiz(id, user_id)` - for ownership check
     - `quiz_questions(id, quiz_id)` - for question lookup
     - `quiz_questions(quiz_id, kanji_id)` - for question-kanji join

3. **Answer Validation:**
   - Perform in-memory comparison (already efficient)
   - No database operation needed for validation

### Response Time Targets

- **Target:** < 200ms for typical requests
- **Bottlenecks:**
  - Database query latency (primary concern)
  - Network round trips
- **Monitoring:** Log slow requests (> 500ms)

### Caching Considerations

- **Not Recommended:** Question data changes after answer submission
- **Kanji Data:** Could cache kanji characters (rarely change)
- **Implementation:** Consider future caching layer for read-only kanji data

### Scalability

- **Concurrent Requests:** Supabase connection pooling handles concurrency
- **Lock Contention:** Minimal (updates single row)
- **Horizontal Scaling:** Stateless endpoint, easily scalable

## 9. Implementation Steps

### Step 1: Add Error Classes

**File:** `src/lib/errors/quiz.errors.ts`

1. Add `QuestionNotFoundError` class
2. Add `QuestionAlreadyAnsweredError` class
3. Add `AnswerSubmissionError` class
4. Add `QuizInvalidStateError` class
5. Export all new error classes

### Step 2: Add Validation Schemas

**File:** `src/lib/validation/quiz.validation.ts`

1. Import Zod
2. Define `submitAnswerParamsSchema` for path parameters
   - Validate `quizId` as numeric string, transform to positive integer
   - Validate `questionId` as numeric string, transform to positive integer
3. Define `submitAnswerBodySchema` for request body
   - Validate `user_answer` as non-empty string (1-100 chars)
   - Transform to trimmed string
4. Export type aliases for inferred types
5. Create `parseSubmitAnswerParams()` helper function
6. Create `parseSubmitAnswerBody()` helper function

### Step 3: Add Service Method

**File:** `src/lib/services/quiz.service.ts`

1. Add `submitAnswer()` method to `QuizService` class:

   ```typescript
   async submitAnswer(
     quizId: number,
     questionId: number,
     userAnswer: string,
     userId: string
   ): Promise<QuestionAnswerResponseDTO>
   ```

2. Implement method logic:
   - **Substep 3a:** Fetch and validate quiz
     - Query quiz by id and user_id
     - If not found, check if exists for other users (403 vs 404)
     - Validate status is 'in_progress'
   - **Substep 3b:** Fetch question with kanji data
     - Query quiz_questions joined with kanji
     - If not found, throw `QuestionNotFoundError`
     - Validate question belongs to quiz
     - Check if already answered (user_answer is null)
   - **Substep 3c:** Validate answer
     - Normalize user answer (trim, lowercase)
     - Get correct answers based on question_type
     - Normalize correct answers (trim, lowercase)
     - Compare and determine is_correct
   - **Substep 3d:** Update question record
     - Set user_answer, answered_at (NOW()), is_correct
     - Use Supabase update with where clause
   - **Substep 3e:** Fetch updated question
     - Re-fetch with kanji data for response
   - **Substep 3f:** Build response
     - Transform kanji entity to DTO
     - Create feedback object with correct_answers
     - Return QuestionAnswerResponseDTO

3. Add helper method `validateAnswer()`:

   ```typescript
   private validateAnswer(
     userAnswer: string,
     questionType: QuestionType,
     kanjiReadings: string[],
     kanjiMeanings: string[]
   ): boolean
   ```

   - Normalize user answer
   - Get correct answers array
   - Normalize correct answers
   - Return boolean match result

4. Add helper method `getCorrectAnswers()`:

   ```typescript
   private getCorrectAnswers(
     questionType: QuestionType,
     kanjiReadings: string[],
     kanjiMeanings: string[]
   ): string[]
   ```

   - Return readings for 'reading' type
   - Return meanings for 'meaning' type

5. Handle all error cases with appropriate custom errors
6. Use try-catch to wrap database operations

### Step 4: Create API Route Handler

**File:** `src/pages/api/quizzes/[quizId]/questions/[questionId].ts`

1. Import dependencies:
   - Astro types (`APIRoute`, `APIContext`)
   - Type definitions from `src/types.ts`
   - Validation functions from `src/lib/validation/quiz.validation.ts`
   - Error classes from `src/lib/errors/quiz.errors.ts`
   - `QuizService` from `src/lib/services/quiz.service.ts`
   - Zod for error handling

2. Define route handler for PATCH method:

   ```typescript
   export const PATCH: APIRoute = async (context: APIContext) => {};
   ```

3. Implement handler logic:
   - **Substep 4a:** Extract authentication
     - Get user from `context.locals.user`
     - Return 401 if not authenticated
   - **Substep 4b:** Extract and validate path parameters
     - Get `quizId` and `questionId` from `context.params`
     - Parse using `parseSubmitAnswerParams()`
     - Catch Zod errors and return 400
   - **Substep 4c:** Parse and validate request body
     - Get JSON from `context.request.json()`
     - Parse using `parseSubmitAnswerBody()`
     - Catch Zod errors and return 400
   - **Substep 4d:** Initialize service
     - Get Supabase client from `context.locals.supabase`
     - Create `QuizService` instance
   - **Substep 4e:** Call service method
     - Invoke `submitAnswer()` with validated parameters
     - Handle service errors with appropriate status codes
   - **Substep 4f:** Return success response
     - Return 200 OK with QuestionAnswerResponseDTO
     - Set Content-Type: application/json

4. Implement comprehensive error handling:
   - ZodError → 400 Bad Request
   - QuizNotFoundError → 404 Not Found
   - QuizAccessDeniedError → 403 Forbidden
   - QuizInvalidStateError → 400 Bad Request
   - QuestionNotFoundError → 404 Not Found
   - QuestionAlreadyAnsweredError → 400 Bad Request
   - AnswerSubmissionError → 500 Internal Server Error
   - Unknown errors → 500 Internal Server Error (with logging)

5. Add request logging for debugging (optional)

## Summary

This implementation plan provides comprehensive guidance for implementing the `PATCH /api/quizzes/:quizId/questions/:questionId` endpoint. The endpoint follows established patterns in the codebase, uses existing service infrastructure, and provides robust error handling and validation.

**Key Implementation Points:**

- Validate quiz ownership and state before accepting answers
- Prevent duplicate answer submissions
- Perform case-insensitive answer matching
- Provide immediate feedback with correct answers
- Follow RESTful conventions and consistent error handling
- Leverage existing QuizService for business logic
- Use Zod for input validation
- Implement custom error classes for clear error communication

**Dependencies:**

- Existing QuizService infrastructure
- Existing error handling patterns
- Supabase client configuration
- Astro middleware for authentication
