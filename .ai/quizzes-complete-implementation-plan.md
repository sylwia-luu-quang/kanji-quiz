# API Endpoint Implementation Plan: Complete Quiz

## 1. Endpoint Overview

The `POST /api/quizzes/:id/complete` endpoint marks a quiz as completed after the user has answered all questions. It performs validation to ensure all questions are answered, calculates the final score percentage, and updates the quiz status with a completion timestamp.

**Key Responsibilities**:

- Verify quiz ownership (user authorization)
- Validate quiz is in completable state (not already completed)
- Ensure all questions have been answered
- Calculate score percentage based on correct answers
- Update quiz record with completion data
- Return the completed quiz entity

**Business Rules**:

- All questions must have `user_answer` and `answered_at` set
- Score calculation: `(COUNT(is_correct=true) / question_count) * 100`
- Quiz status must transition from `in_progress` to `completed`
- `completed_at` timestamp must be set to current time
- Once completed, a quiz cannot be re-completed

## 2. Request Details

**HTTP Method**: `POST`

**URL Structure**: `/api/quizzes/:id/complete`

**Path Parameters**:

- `id` (required): Quiz ID as a positive integer (bigint from database)

**Request Headers**:

- `Authorization: Bearer <jwt_token>` (required for authentication)
  - _Note: Currently using default user ID for development; JWT authentication to be implemented_

**Request Body**: None

**Example Request**:

```bash
POST /api/quizzes/123/complete
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Used Types

### DTOs

**Response DTO**:

- `QuizDTO` - The completed quiz entity (defined in `src/types.ts`)

  ```typescript
  export type QuizDTO = QuizEntity;

  // QuizEntity includes:
  // - id: bigint
  // - user_id: uuid
  // - type: QuizType
  // - level: JLPTLevel | null
  // - question_count: smallint
  // - status: QuizStatus
  // - score_percent: numeric(5,2) | null
  // - created_at: timestamptz
  // - completed_at: timestamptz | null
  ```

**Error Response DTO**:

- `ErrorResponseDTO` (defined in `src/types.ts`)
  ```typescript
  export interface ErrorResponseDTO {
    error: string;
    code?: string;
    details?: Record<string, unknown>;
  }
  ```

### Validation Schema

**Path Parameter Schema** (new, to be added to `src/lib/validation/quiz.validation.ts`):

```typescript
export const completeQuizParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "Quiz ID must be a valid number").transform(Number),
});

export type CompleteQuizParams = z.infer<typeof completeQuizParamsSchema>;
```

### Service Interface

**Service Method** (to be added to `QuizService` in `src/lib/services/quiz.service.ts`):

```typescript
async completeQuiz(quizId: number, userId: string): Promise<QuizDTO>
```

## 4. Response Details

### Success Response (200 OK)

**Status Code**: `200 OK`

**Content-Type**: `application/json`

**Body Structure**:

```json
{
  "id": 123,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "level",
  "level": "N5",
  "question_count": 10,
  "status": "completed",
  "score_percent": 85.0,
  "created_at": "2026-01-18T10:00:00.000Z",
  "completed_at": "2026-01-18T10:05:32.000Z"
}
```

### Error Responses

#### 400 Bad Request - Incomplete Quiz

```json
{
  "error": "Cannot complete quiz. Not all questions have been answered.",
  "code": "INCOMPLETE_QUIZ",
  "details": {
    "total_questions": 20,
    "answered_questions": 18,
    "unanswered_questions": 2
  }
}
```

#### 401 Unauthorized - Missing/Invalid Authentication

```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

#### 403 Forbidden - User Doesn't Own Quiz

```json
{
  "error": "You do not have permission to complete this quiz",
  "code": "QUIZ_ACCESS_DENIED",
  "details": {
    "quiz_id": 123
  }
}
```

#### 404 Not Found - Quiz Not Found

```json
{
  "error": "Quiz not found",
  "code": "QUIZ_NOT_FOUND",
  "details": {
    "quiz_id": 123
  }
}
```

#### 409 Conflict - Quiz Already Completed

```json
{
  "error": "Quiz is already completed",
  "code": "QUIZ_ALREADY_COMPLETED",
  "details": {
    "quiz_id": 123,
    "completed_at": "2026-01-18T10:05:32.000Z",
    "score_percent": 85.0
  }
}
```

#### 500 Internal Server Error - Server Error

```json
{
  "error": "Failed to complete quiz. Please try again later.",
  "code": "QUIZ_COMPLETION_ERROR"
}
```

## 5. Data Flow

### Request Flow Diagram

```
1. Client Request
   ↓
2. Astro API Route (/api/quizzes/[id]/complete.ts)
   - Extract and validate quiz ID from path parameter
   - Extract user ID from authentication (locals.supabase)
   ↓
3. QuizService.completeQuiz(quizId, userId)
   ↓
4a. Fetch Quiz Record (quiz table)
    - Verify quiz exists
    - Verify user ownership (user_id match)
    - Verify quiz status is 'in_progress'
   ↓
4b. Fetch Quiz Questions (quiz_questions table)
    - Get all questions for the quiz
    - Count total questions
    - Count answered questions
    - Verify all have user_answer and answered_at
   ↓
5. Calculate Score
   - Count questions where is_correct = true
   - Calculate percentage: (correct / total) * 100
   - Round to 2 decimal places
   ↓
6. Update Quiz Record
   - SET status = 'completed'
   - SET score_percent = calculated_score
   - SET completed_at = NOW()
   - WHERE id = quiz_id AND user_id = user_id
   ↓
7. Return Updated Quiz
   - Fetch updated quiz record
   - Return QuizDTO to API route
   ↓
8. API Response
   - Return 200 OK with QuizDTO
   - Or return appropriate error response
```

### Database Operations

**1. Fetch Quiz (Single SELECT)**:

```sql
SELECT * FROM quiz
WHERE id = $1 AND user_id = $2
LIMIT 1;
```

**2. Fetch Questions with Answer Status (Single SELECT with Aggregation)**:

```sql
SELECT
  COUNT(*) as total_questions,
  COUNT(user_answer) as answered_questions,
  COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_answers
FROM quiz_questions
WHERE quiz_id = $1;
```

**3. Update Quiz (Single UPDATE)**:

```sql
UPDATE quiz
SET
  status = 'completed',
  score_percent = $1,
  completed_at = NOW()
WHERE id = $2 AND user_id = $3
RETURNING *;
```

### Performance Considerations

- **Single Transaction**: All operations should be within a single transaction for data consistency
- **Optimized Queries**: Use aggregation in a single query to avoid multiple round trips
- **Index Usage**: Existing indexes on `quiz(id)`, `quiz(user_id)`, and `quiz_questions(quiz_id)` will be utilized
- **No N+1 Queries**: Fetch all questions and calculate score in one database query

## 6. Security Considerations

### Authentication & Authorization

**Authentication** (Status: 401):

- JWT token required in `Authorization: Bearer <token>` header
- User ID extracted from validated JWT token
- _Development Mode_: Using default user ID from `supabase.client.ts`

**Authorization** (Status: 403):

- Verify quiz belongs to authenticated user via `quiz.user_id = authenticated_user_id`
- Implemented at service layer before any state changes
- Database-level verification in UPDATE query (double security)

### Input Validation

**Path Parameter Validation**:

- Quiz ID must be a valid positive integer
- Use Zod schema to validate and transform string to number
- Prevent SQL injection via parameterized queries (handled by Supabase client)

**State Validation**:

- Quiz must exist (404 if not found)
- Quiz must be in `in_progress` status (409 if `completed` or `abandoned`)
- All questions must be answered (400 if incomplete)

### Data Integrity

**Database Constraints**:

- Foreign key constraint: `quiz.user_id` references `auth.users(id)`
- Check constraint: `status = 'completed'` implies `completed_at IS NOT NULL`
- Check constraint: `question_count > 0`

**Transaction Safety**:

- Wrap all operations in a transaction to prevent partial updates
- Use optimistic locking via user_id in WHERE clause

### Rate Limiting

**Considerations**:

- Single quiz can only be completed once (enforced by status check)
- Natural rate limiting through quiz lifecycle
- No additional rate limiting needed for this endpoint

## 7. Error Handling

### Error Hierarchy

```typescript
// New error classes to be added to src/lib/errors/quiz.errors.ts

export class QuizNotFoundError extends Error {
  constructor(public readonly quizId: number) {
    super(`Quiz not found with id: ${quizId}`);
    this.name = "QuizNotFoundError";
  }
}

export class QuizAccessDeniedError extends Error {
  constructor(
    public readonly quizId: number,
    public readonly userId: string
  ) {
    super(`User ${userId} does not have permission to access quiz ${quizId}`);
    this.name = "QuizAccessDeniedError";
  }
}

export class QuizAlreadyCompletedError extends Error {
  constructor(
    public readonly quizId: number,
    public readonly completedAt: string,
    public readonly scorePercent: number
  ) {
    super(`Quiz ${quizId} is already completed`);
    this.name = "QuizAlreadyCompletedError";
  }
}

export class IncompleteQuizError extends Error {
  constructor(
    public readonly totalQuestions: number,
    public readonly answeredQuestions: number
  ) {
    super(`Cannot complete quiz. ${answeredQuestions} of ${totalQuestions} questions answered.`);
    this.name = "IncompleteQuizError";
  }
}

export class QuizCompletionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "QuizCompletionError";
  }
}
```

### Error Handling Strategy

**Service Layer** (`QuizService.completeQuiz`):

- Throw specific error classes for different failure scenarios
- Include relevant context in error objects
- Let errors bubble up to API route layer

**API Route Layer** (`/api/quizzes/[id]/complete.ts`):

- Catch specific error types and map to appropriate HTTP status codes
- Format errors into `ErrorResponseDTO` structure
- Include helpful details for debugging
- Never expose internal error messages or stack traces

### Error Response Mapping

| Error Type                  | HTTP Status | Error Code               | Response Details                 |
| --------------------------- | ----------- | ------------------------ | -------------------------------- |
| `ZodError`                  | 400         | `VALIDATION_ERROR`       | Field-specific validation errors |
| `IncompleteQuizError`       | 400         | `INCOMPLETE_QUIZ`        | Question counts and status       |
| Missing User ID             | 401         | `UNAUTHORIZED`           | Generic auth message             |
| `QuizAccessDeniedError`     | 403         | `QUIZ_ACCESS_DENIED`     | Quiz ID                          |
| `QuizNotFoundError`         | 404         | `QUIZ_NOT_FOUND`         | Quiz ID                          |
| `QuizAlreadyCompletedError` | 409         | `QUIZ_ALREADY_COMPLETED` | Completion details               |
| `QuizCompletionError`       | 500         | `QUIZ_COMPLETION_ERROR`  | Generic error message            |
| Unknown Error               | 500         | `SERVER_ERROR`           | Generic error message            |

### Logging Strategy

**Service Layer Logging**:

- Log error details with context (quiz ID, user ID, error type)
- Use structured logging for easier debugging
- Log database errors with sanitized details

**API Layer Logging**:

- Log all 500 errors for monitoring
- Log 403 errors for security auditing
- Consider logging 409 errors for user behavior analysis

## 8. Performance Considerations

### Database Performance

**Query Optimization**:

- Use single aggregation query to fetch question statistics
- Leverage existing indexes:
  - Primary key index on `quiz(id)`
  - Index on `quiz(user_id)` (from migration 20260130000000)
  - Foreign key index on `quiz_questions(quiz_id)`

**Expected Query Performance**:

- Quiz lookup: < 5ms (indexed primary key)
- Question aggregation: < 10ms (indexed foreign key)
- Quiz update: < 5ms (indexed primary key)
- **Total database time**: ~20ms for typical quiz

### Response Time Goals

- **Target P50**: < 100ms
- **Target P95**: < 200ms
- **Target P99**: < 500ms

### Scalability Considerations

**Current Scale**:

- Endpoint is idempotent after first success (returns 409 on retry)
- No expensive operations (joins, full table scans)
- Minimal data transfer

## 9. Implementation Steps

### Step 1: Add Validation Schema

**File**: `src/lib/validation/quiz.validation.ts`

**Action**: Create a Zod schema to validate the quiz ID path parameter. The schema should ensure the ID is a valid positive integer and provide appropriate error messages. Export a parser function that can be used in the API route to validate incoming path parameters.

### Step 2: Add Custom Error Classes

**File**: `src/lib/errors/quiz.errors.ts`

**Action**: Define custom error classes for quiz completion scenarios. Consider the various failure modes: quiz not found, access denied, already completed, incomplete quiz, and general completion errors. Each error class should extend the base Error class and include relevant context properties that can be used in error responses.

### Step 3: Add Service Method

**File**: `src/lib/services/quiz.service.ts`

**Action**: Implement a `completeQuiz` method in the `QuizService` class. The method should handle the complete quiz completion workflow including fetching the quiz, verifying ownership and status, checking question completion, calculating the score percentage, and updating the quiz record. Consider using database queries efficiently and throwing appropriate custom errors for different failure scenarios.

### Step 4: Create API Route

**File**: `src/pages/api/quizzes/[id]/complete.ts` (new file)

**Action**: Create a new API route handler that processes POST requests to complete a quiz. Extract and validate the quiz ID from path parameters, authenticate the user, call the service method, and handle all error cases appropriately. Map custom errors to correct HTTP status codes and format responses consistently with other endpoints in the application.

### Step 5: Verify Type Definitions

**File**: `src/types.ts`

**Action**: Review existing type definitions to ensure all necessary types are available for the quiz completion endpoint. Check that `QuizDTO`, `ErrorResponseDTO`, and related enums exist and are properly exported.

### Step 6: Optimize Database Queries (Optional)

**File**: New migration file in `supabase/migrations/`

**Action**: Consider creating a PostgreSQL function to efficiently aggregate quiz question statistics. This can optimize the query that counts total questions, answered questions, and correct answers. Evaluate whether the performance benefit justifies the additional complexity.

---

## Summary

This implementation plan provides comprehensive guidance for implementing the `POST /api/quizzes/:id/complete` endpoint. The endpoint follows established patterns in the codebase, uses proper error handling, validates all inputs, and ensures data integrity through careful authorization and state management.

**Key Features**:

- ✅ Comprehensive error handling with specific error types
- ✅ Proper HTTP status codes for all scenarios
- ✅ Authorization at both service and database level
- ✅ Efficient database queries with aggregation
- ✅ Clear validation with Zod schemas
- ✅ Consistent code patterns with existing endpoints
- ✅ Detailed documentation and comments

**Security**:

- ✅ Authentication required (JWT Bearer token)
- ✅ Authorization verified (user ownership check)
- ✅ Input validation (path parameter)
- ✅ State validation (quiz status, completion)
- ✅ SQL injection prevention (parameterized queries)

**Performance**:

- ✅ Optimized database queries (3-4 queries total)
- ✅ Efficient aggregation for score calculation
- ✅ Index usage for all queries
- ✅ Target response time: < 100ms (P50)
