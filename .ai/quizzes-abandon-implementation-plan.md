# API Endpoint Implementation Plan: PATCH /api/quizzes/:id/abandon

## 1. Endpoint Overview

This endpoint allows users to abandon an in-progress quiz, changing its status from `in_progress` to `abandoned`. The endpoint provides a way for users to explicitly mark a quiz they've started but don't intend to complete, preserving any need-review toggles they made during the quiz session.

**Key Characteristics:**

- Requires authentication (JWT Bearer token)
- Only works on quizzes with `status='in_progress'`
- Preserves all quiz questions and their state (including answers if any)
- Preserves need-review toggles made during the quiz
- No scoring or completion timestamp is set
- User can only abandon their own quizzes

## 2. Request Details

**HTTP Method:** PATCH

**URL Structure:** `/api/quizzes/:id/abandon`

**Path Parameters:**

- `id` (required): Quiz ID as a positive integer

**Request Headers:**

- `Authorization: Bearer <jwt_token>` (required)

**Request Body:** None

**Query Parameters:** None

## 3. Used Types

### 3.1 Existing Types (from src/types.ts)

```typescript
// Entity type for quiz
export type QuizDTO = QuizEntity;

// Enum for quiz status
export type QuizStatus = Database["public"]["Enums"]["quiz_status"]; // "in_progress" | "completed" | "abandoned"
```

### 3.2 New Validation Types (to add to src/lib/validation/quiz.validation.ts)

```typescript
/**
 * Validation schema for PATCH /api/quizzes/:id/abandon path parameter
 *
 * Validates:
 * - id: Must be a valid positive integer string, transformed to number
 */
export const abandonQuizParamsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Quiz ID must be a valid number")
    .transform(Number)
    .refine((val) => val > 0, {
      message: "Quiz ID must be a positive number",
    }),
});

export type AbandonQuizParams = z.infer<typeof abandonQuizParamsSchema>;

/**
 * Parses and validates path parameters for quiz abandonment
 *
 * @param id - Raw quiz ID from path parameter
 * @returns Validated AbandonQuizParams with transformed number ID
 * @throws ZodError if validation fails with detailed error messages
 */
export function parseAbandonQuizParams(id: string): AbandonQuizParams {
  return abandonQuizParamsSchema.parse({ id });
}
```

### 3.3 New Error Types (to add to src/lib/errors/quiz.errors.ts)

```typescript
/**
 * Error thrown when attempting to abandon a quiz that cannot be abandoned
 * (quiz is already completed or abandoned)
 */
export class QuizNotAbandonableError extends Error {
  constructor(
    public readonly quizId: number,
    public readonly currentStatus: string
  ) {
    super(`Quiz ${quizId} cannot be abandoned. Current status: ${currentStatus}`);
    this.name = "QuizNotAbandonableError";
  }
}

/**
 * Error thrown when quiz abandonment fails due to database or transaction issues
 */
export class QuizAbandonmentError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "QuizAbandonmentError";
  }
}
```

## 4. Response Details

### 4.1 Success Response (200 OK)

```json
{
  "id": 123,
  "user_id": "uuid-here",
  "type": "level",
  "level": "N5",
  "question_count": 10,
  "status": "abandoned",
  "score_percent": null,
  "created_at": "2026-01-18T10:00:00Z",
  "completed_at": null
}
```

**Response Type:** `QuizDTO`

**Key Fields:**

- `status`: Will always be "abandoned"
- `score_percent`: Will always be null (quiz not scored)
- `completed_at`: Will always be null (quiz not completed)

### 4.2 Error Responses

#### 400 Bad Request

**Scenario:** Quiz is already completed or abandoned

```json
{
  "error": "Quiz 123 cannot be abandoned. Current status: completed",
  "code": "QUIZ_NOT_ABANDONABLE"
}
```

**Also:** Invalid quiz ID format

```json
{
  "error": "Quiz ID must be a valid number",
  "code": "INVALID_INPUT"
}
```

#### 401 Unauthorized

**Scenario:** Missing or invalid authentication token

```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

#### 403 Forbidden

**Scenario:** User does not own this quiz

```json
{
  "error": "User user-uuid does not have permission to access quiz 123",
  "code": "ACCESS_DENIED"
}
```

#### 404 Not Found

**Scenario:** Quiz not found

```json
{
  "error": "Quiz not found with id: 123",
  "code": "QUIZ_NOT_FOUND"
}
```

#### 500 Internal Server Error

**Scenario:** Database or unexpected server error

```json
{
  "error": "Failed to abandon quiz",
  "code": "INTERNAL_ERROR"
}
```

## 5. Data Flow

### 5.1 Request Flow

1. **Request Received**
   - Astro middleware intercepts request
   - Extracts JWT token from Authorization header
   - Validates token and extracts user_id
   - Attaches authenticated user to context.locals.user

2. **Path Parameter Validation**
   - Extract quiz ID from URL path parameter
   - Validate using `parseAbandonQuizParams`
   - Transform string to number
   - Reject if invalid format or non-positive

3. **Authorization Check**
   - Verify user is authenticated (middleware)
   - Service will verify user owns the quiz

4. **Service Layer Processing**
   - Call `quizService.abandonQuiz(quizId, userId)`
   - Service performs ownership and state validation
   - Updates quiz status in database
   - Returns updated quiz

5. **Response Formation**
   - Transform QuizDTO to JSON
   - Return 200 with quiz data
   - Or return appropriate error code

### 5.2 Database Interactions

```sql
-- Step 1: Fetch quiz and verify ownership
SELECT * FROM quiz
WHERE id = $1 AND user_id = $2;

-- Step 2: Check if quiz exists (if step 1 returns nothing)
SELECT id FROM quiz WHERE id = $1;

-- Step 3: Update quiz status
UPDATE quiz
SET status = 'abandoned'
WHERE id = $1 AND user_id = $2
RETURNING *;
```

**Note:** No cascade operations needed. Quiz questions remain unchanged.

### 5.3 State Transitions

```
Valid State Transition:
in_progress → abandoned ✓

Invalid State Transitions:
completed → abandoned ✗ (400 error)
abandoned → abandoned ✗ (400 error)
```

## 6. Security Considerations

### 6.1 Authentication & Authorization

**Threat:** Unauthenticated access

- **Mitigation:** Middleware checks JWT token before handler executes
- **Error:** 401 Unauthorized if token missing/invalid

**Threat:** Unauthorized quiz access (IDOR - Insecure Direct Object Reference)

- **Mitigation:** Service layer verifies `quiz.user_id === authenticated_user_id`
- **Implementation:** Use `.eq('user_id', userId)` in Supabase query
- **Error:** 403 Forbidden if user doesn't own quiz

### 6.2 Input Validation

**Threat:** SQL Injection via quiz ID

- **Mitigation:**
  - Zod schema validates ID is numeric string only (regex `/^\d+$/`)
  - Supabase uses parameterized queries
  - Transform to number type before database query

**Threat:** Path traversal or malicious input

- **Mitigation:** Strict regex validation, reject any non-numeric input

### 6.3 Business Logic Security

**Threat:** State manipulation (abandoning completed quizzes)

- **Mitigation:** Service validates current status before update
- **Error:** 400 Bad Request with descriptive message

**Threat:** Data loss (accidentally abandoning active quiz)

- **Consideration:** This is intentional user action, no additional safeguards needed
- **Note:** Questions and need-review toggles are preserved

### 6.4 Rate Limiting

**Recommendation:** Apply rate limiting at API gateway level

- Prevent abuse of abandonment endpoint
- Limit: ~10 abandon requests per minute per user

## 7. Error Handling

### 7.1 Error Handling Strategy

Follow guard clause pattern with early returns:

```typescript
try {
  // Validation
  const params = parseAbandonQuizParams(id);

  // Authentication check
  if (!context.locals.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Service call
  const quiz = await quizService.abandonQuiz(params.id, context.locals.user.id);

  // Success response
  return new Response(JSON.stringify(quiz), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
} catch (error) {
  // Error mapping
}
```

### 7.2 Error Mapping Table

| Error Type                | HTTP Status | Error Code           | Response Message                                                 |
| ------------------------- | ----------- | -------------------- | ---------------------------------------------------------------- |
| `ZodError`                | 400         | INVALID_INPUT        | First validation error message                                   |
| `QuizNotFoundError`       | 404         | QUIZ_NOT_FOUND       | "Quiz not found with id: {id}"                                   |
| `QuizAccessDeniedError`   | 403         | ACCESS_DENIED        | "User {userId} does not have permission to access quiz {quizId}" |
| `QuizNotAbandonableError` | 400         | QUIZ_NOT_ABANDONABLE | "Quiz {quizId} cannot be abandoned. Current status: {status}"    |
| `QuizAbandonmentError`    | 500         | INTERNAL_ERROR       | "Failed to abandon quiz"                                         |
| Unknown errors            | 500         | INTERNAL_ERROR       | "An unexpected error occurred"                                   |

### 7.3 Logging Strategy

**Error Levels:**

- **400-level errors:** Log as `console.warn()` - client errors
- **500-level errors:** Log as `console.error()` - server errors
- Include stack traces for 500 errors only

**Logged Information:**

- Error type and message
- Quiz ID
- User ID (for authorization context)
- Timestamp
- Request path

```typescript
console.error("Quiz abandonment failed", {
  error: error instanceof Error ? error.message : "Unknown error",
  quizId: params.id,
  userId: context.locals.user?.id,
  timestamp: new Date().toISOString(),
});
```

## 8. Performance Considerations

### 8.1 Database Operations

**Query Efficiency:**

- Single query to fetch and verify ownership (indexed on `id` and `user_id`)
- Single update query with WHERE clause on primary key
- Total: 2-3 database queries maximum (including existence check on error)

**Indexes Required:**

- Primary key on `quiz.id` (already exists)
- Index on `quiz.user_id` (should exist for foreign key)
- Composite index on `(id, user_id)` would be optimal

### 8.2 Expected Response Time

- **Best case:** ~50-100ms (direct match and update)
- **Average case:** ~100-200ms (includes authentication and validation)
- **Worst case:** ~300-500ms (includes quiz existence check on 404)

### 8.3 Optimization Opportunities

1. **Single Query Optimization:**
   - Combine fetch and update in service method
   - Use conditional update: `UPDATE ... WHERE status = 'in_progress'`
   - Check affected rows to determine error type

2. **Connection Pooling:**
   - Ensure Supabase client uses connection pooling
   - Reuse client instance across requests

3. **Response Caching:**
   - Not applicable (state-changing operation)

### 8.4 Scalability Considerations

- Stateless operation (no session storage)
- No transaction required (single table update)
- Can handle high concurrency (row-level locking)
- No cascade updates required

## 9. Implementation Steps

### Step 1: Add Validation Schema

**File:** `src/lib/validation/quiz.validation.ts`

Add the following to the file:

- `abandonQuizParamsSchema` - Zod schema for path parameter validation
- `AbandonQuizParams` - TypeScript type inferred from schema
- `parseAbandonQuizParams()` - Validation function

### Step 2: Add Custom Error Classes

**File:** `src/lib/errors/quiz.errors.ts`

Add two new error classes:

- `QuizNotAbandonableError` - For quizzes that cannot be abandoned (wrong status)
- `QuizAbandonmentError` - For general abandonment failures

### Step 3: Implement Service Method

**File:** `src/lib/services/quiz.service.ts`

Add `abandonQuiz` method to `QuizService` class:

```typescript
/**
 * Abandons an in-progress quiz
 *
 * Process:
 * 1. Fetch quiz and verify ownership
 * 2. Verify quiz is in abandonable state (status = 'in_progress')
 * 3. Update quiz status to 'abandoned'
 * 4. Return updated quiz
 *
 * @param quizId - Quiz ID to abandon
 * @param userId - User ID for authorization
 * @returns QuizDTO with updated status
 * @throws QuizNotFoundError if quiz doesn't exist
 * @throws QuizAccessDeniedError if user doesn't own the quiz
 * @throws QuizNotAbandonableError if quiz is already completed or abandoned
 * @throws QuizAbandonmentError if database operation fails
 */
async abandonQuiz(quizId: number, userId: string): Promise<QuizDTO>
```

**Implementation details:**

- Follow the same pattern as `completeQuiz` method
- Verify ownership with `.eq('user_id', userId)`
- Check current status before update
- Throw appropriate errors for each failure scenario
- Return updated quiz on success

### Step 4: Create API Endpoint Handler

**File:** `src/pages/api/quizzes/[id]/abandon.ts`

Create new Astro API endpoint:

```typescript
import type { APIRoute } from "astro";
import { QuizService } from "../../../../lib/services/quiz.service";
import { parseAbandonQuizParams } from "../../../../lib/validation/quiz.validation";
import {
  QuizNotFoundError,
  QuizAccessDeniedError,
  QuizNotAbandonableError,
  QuizAbandonmentError,
} from "../../../../lib/errors/quiz.errors";
import { ZodError } from "zod";

export const PATCH: APIRoute = async (context) => {
  // Implementation
};
```

**Handler logic:**

1. Extract and validate path parameter (quiz ID)
2. Check authentication (context.locals.user)
3. Initialize QuizService with Supabase client
4. Call `quizService.abandonQuiz()`
5. Handle success (200) or errors (400/401/403/404/500)
6. Return JSON response

### Step 5: Error Handling Implementation

**In:** `src/pages/api/quizzes/[id]/abandon.ts`

Implement comprehensive error handling:

```typescript
try {
  // Main logic
} catch (error) {
  if (error instanceof ZodError) {
    return new Response(
      JSON.stringify({
        error: error.errors[0].message,
        code: "INVALID_INPUT",
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

  // ... other error types
}
```

---

## Implementation Checklist Summary

- [ ] Step 1: Add validation schema to quiz.validation.ts
- [ ] Step 2: Add error classes to quiz.errors.ts
- [ ] Step 3: Implement abandonQuiz method in quiz.service.ts
- [ ] Step 4: Create abandon.ts API endpoint handler
- [ ] Step 5: Implement error handling in endpoint

## Expected File Structure After Implementation

```
src/
├── lib/
│   ├── errors/
│   │   └── quiz.errors.ts (updated with 2 new error classes)
│   ├── services/
│   │   └── quiz.service.ts (updated with abandonQuiz method)
│   └── validation/
│       └── quiz.validation.ts (updated with abandon validation)
└── pages/
    └── api/
        └── quizzes/
            └── [id]/
                ├── complete.ts (existing)
                └── abandon.ts (new file)
```
