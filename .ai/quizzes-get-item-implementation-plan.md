# API Endpoint Implementation Plan: GET /api/quizzes/:id

## 1. Endpoint Overview

**Purpose**: Retrieve a single quiz by ID with complete details including all questions, answers, and embedded kanji information. This endpoint is used for viewing quiz results after completion or reviewing quiz history details.

**Key Features**:

- Fetches a specific quiz record by ID
- Includes all questions with their answers and correctness status
- Embeds kanji details (character, level, readings, meanings) for each question
- Enforces user ownership validation to prevent unauthorized access
- Returns questions ordered by sequence number

**Business Context**: This endpoint enables users to review their quiz performance, see which questions they answered correctly or incorrectly, and access the complete kanji information for each question. It's essential for the post-quiz review experience and accessing historical quiz data.

---

## 2. Request Details

### HTTP Method

`GET`

### URL Structure

`/api/quizzes/:id`

### Path Parameters

| Parameter | Type     | Required | Description                                   | Constraints                     |
| --------- | -------- | -------- | --------------------------------------------- | ------------------------------- |
| `id`      | `string` | Yes      | Quiz ID to retrieve (transformed to `bigint`) | Must be positive integer string |

### Query Parameters

None

### Request Headers

| Header          | Required | Description               | Example              |
| --------------- | -------- | ------------------------- | -------------------- |
| `Authorization` | Yes      | JWT Bearer token for auth | `Bearer <jwt_token>` |

**Note**: Currently disabled in development (using `defaultUserId`). Must be implemented for production.

### Request Body

None (GET request)

---

## 3. Used Types

### DTOs (from `src/types.ts`)

**Response Type**:

```typescript
QuizWithQuestionsDTO extends QuizDTO {
  questions: QuizQuestionDTO[];
}
```

**Embedded Types**:

```typescript
// Base quiz data
QuizDTO = QuizEntity (from database.types.ts)

// Question with embedded kanji
QuizQuestionDTO extends QuizQuestionEntity {
  kanji: KanjiDTO;
}

// Kanji with properly typed arrays
KanjiDTO = Omit<KanjiEntity, "readings" | "meanings"> & {
  readings: string[];
  meanings: string[];
}

// Error response
ErrorResponseDTO {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}
```

### Validation Schema (new, to be added to `src/lib/validation/quiz.validation.ts`)

```typescript
export const getQuizByIdParamsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Quiz ID must be a valid number")
    .transform(Number)
    .refine((val) => val > 0, {
      message: "Quiz ID must be a positive number",
    }),
});

export type GetQuizByIdParams = z.infer<typeof getQuizByIdParamsSchema>;

export function parseGetQuizByIdParams(id: string): GetQuizByIdParams {
  return getQuizByIdParamsSchema.parse({ id });
}
```

---

## 4. Response Details

### Success Response (200 OK)

**Status Code**: `200 OK`

**Content-Type**: `application/json`

**Response Body**:

```json
{
  "id": 123,
  "user_id": "uuid-here",
  "type": "level",
  "level": "N5",
  "question_count": 10,
  "status": "completed",
  "score_percent": 85.0,
  "created_at": "2026-01-18T10:00:00Z",
  "completed_at": "2026-01-18T10:05:32Z",
  "questions": [
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
        "readings": ["こう", "ぎょう", "い.く", "ゆ.く"],
        "meanings": ["go", "conduct", "line"],
        "created_at": "2026-01-18T10:00:00Z"
      },
      "user_answer": "こう",
      "answered_at": "2026-01-18T10:01:15Z",
      "is_correct": true,
      "created_at": "2026-01-18T10:00:00Z"
    }
    // ... more questions
  ]
}
```

### Error Responses

#### 400 Bad Request

Invalid quiz ID format (non-numeric, negative, or zero).

```json
{
  "error": "Invalid quiz ID",
  "code": "VALIDATION_ERROR",
  "details": {
    "id": "Quiz ID must be a valid number"
  }
}
```

#### 401 Unauthorized

Missing or invalid authentication token.

```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

#### 403 Forbidden

User doesn't own the quiz (RLS policy violation or manual check).

```json
{
  "error": "You do not have permission to access this quiz",
  "code": "ACCESS_DENIED",
  "details": {
    "quiz_id": 123
  }
}
```

#### 404 Not Found

Quiz doesn't exist in the database.

```json
{
  "error": "Quiz not found",
  "code": "QUIZ_NOT_FOUND",
  "details": {
    "quiz_id": 123
  }
}
```

#### 500 Internal Server Error

Database errors or unexpected failures.

```json
{
  "error": "Internal server error",
  "code": "SERVER_ERROR"
}
```

---

## 5. Data Flow

### Overall Flow

```
1. Client Request
   └─> GET /api/quizzes/123 with Bearer token

2. Astro API Route Handler
   └─> Extract and validate path parameter (quiz ID)
   └─> Extract user ID from authentication (locals.supabase or JWT)
   └─> Instantiate QuizService with Supabase client

3. QuizService.getQuizById(quizId, userId)
   └─> Query quiz table by ID and user_id
   └─> If not found, check if quiz exists (without user filter)
       ├─> Not found at all → throw QuizNotFoundError
       └─> Found but wrong user → throw QuizAccessDeniedError
   └─> Query quiz_questions with JOIN to kanji table
   └─> Transform kanji data (JSONB arrays → string arrays)
   └─> Order questions by sequence
   └─> Return QuizWithQuestionsDTO

4. API Route Handler
   └─> Return 200 OK with complete quiz data

5. Error Handling
   └─> Catch specific error types (QuizNotFoundError, etc.)
   └─> Map to appropriate HTTP status codes
   └─> Return ErrorResponseDTO
```

### Database Queries

**Query 1: Fetch quiz with ownership verification**

```sql
SELECT * FROM quiz
WHERE id = $1 AND user_id = $2
LIMIT 1
```

**Query 2 (if Query 1 returns null): Check if quiz exists**

```sql
SELECT id FROM quiz
WHERE id = $1
LIMIT 1
```

**Query 3: Fetch questions with kanji data**

```sql
SELECT
  quiz_questions.*,
  kanji.*
FROM quiz_questions
INNER JOIN kanji ON quiz_questions.kanji_id = kanji.id
WHERE quiz_questions.quiz_id = $1
ORDER BY quiz_questions.sequence ASC
```

### Data Transformations

1. **Path parameter string → number**: Via Zod schema transformation
2. **JSONB arrays → TypeScript string arrays**: Via `jsonToStringArray()` helper
3. **Database rows → DTOs**: Via `transformToKanjiDTO()` and question mapping

---

## 6. Security Considerations

### Authentication

- **Requirement**: Valid JWT token in `Authorization` header
- **Current State**: Disabled in development (using `defaultUserId`)
- **Production Implementation**: Extract user ID from verified JWT token via `locals.supabase.auth.getUser()`
- **Validation**: Return 401 if token is missing or invalid

### Authorization

- **Requirement**: User must own the quiz they're requesting
- **Implementation**: Filter query by both `quiz.id` AND `quiz.user_id`
- **RLS Consideration**: RLS policies are disabled (migration 20260118170000), so manual authorization checks are required
- **Error Response**: Return 403 if quiz exists but user doesn't own it

### Input Validation

- **Path Parameter**: Validate quiz ID is positive integer using Zod schema
- **SQL Injection**: Prevented via Supabase client's parameterized queries
- **Type Safety**: TypeScript ensures type correctness throughout

### Data Exposure

- **Principle**: Only return data for quizzes owned by authenticated user
- **Implementation**: Always include `user_id` filter in queries
- **Verification**: Double-check ownership before returning data

### Rate Limiting

- **Recommendation**: Implement rate limiting at API gateway or middleware level
- **Pattern**: Max 100 requests per minute per user for GET endpoints
- **Not included in this implementation**: Should be handled by infrastructure

---

## 7. Error Handling

### Error Mapping Table

| Error Type              | HTTP Status | Error Code       | User Message                                     |
| ----------------------- | ----------- | ---------------- | ------------------------------------------------ |
| `ZodError`              | 400         | VALIDATION_ERROR | "Invalid quiz ID"                                |
| `QuizNotFoundError`     | 404         | QUIZ_NOT_FOUND   | "Quiz not found"                                 |
| `QuizAccessDeniedError` | 403         | ACCESS_DENIED    | "You do not have permission to access this quiz" |
| `QuizCreationError`     | 500         | DATABASE_ERROR   | "Failed to retrieve quiz"                        |
| Missing user ID         | 500         | MISSING_USER_ID  | "User ID not available"                          |
| Unknown errors          | 500         | SERVER_ERROR     | "Internal server error"                          |

### Error Handling Strategy

1. **Validation Errors (ZodError)**:
   - Catch at API route level
   - Format error details using `formatZodError()` helper
   - Return 400 with field-specific error messages

2. **Business Logic Errors**:
   - Use custom error classes from `src/lib/errors/quiz.errors.ts`
   - Catch specific types in order: `QuizNotFoundError`, `QuizAccessDeniedError`, `QuizCreationError`
   - Map to appropriate HTTP status codes
   - Include contextual details (quiz ID, etc.)

3. **Database Errors**:
   - Wrap Supabase errors in `QuizCreationError` at service level
   - Log original error for debugging (console.error)
   - Return generic 500 error to client (don't expose internal details)

4. **Unexpected Errors**:
   - Catch-all for any unhandled exceptions
   - Log full error stack for debugging
   - Return generic 500 error to client

### Error Response Format

All errors follow the `ErrorResponseDTO` structure:

```typescript
{
  error: string;      // Human-readable error message
  code?: string;      // Machine-readable error code
  details?: Record<string, unknown>;  // Additional context
}
```

---

## 8. Performance Considerations

### Database Query Optimization

1. **Indexes (already in place)**:
   - Primary key index on `quiz.id` (automatic)
   - Primary key index on `quiz_questions.id` (automatic)
   - Foreign key index on `quiz_questions.quiz_id` (migration 20260130000000)
   - Foreign key index on `quiz_questions.kanji_id` (migration 20260125000000)
   - Composite index on `(quiz.user_id, quiz.created_at DESC)` for list queries

2. **Query Efficiency**:
   - Single query with JOIN for questions + kanji (efficient)
   - Uses primary key lookup for quiz (O(1) time)
   - Ordered by sequence (uses natural ordering, no additional sort)

3. **Data Volume**:
   - Maximum 100 questions per quiz (50 kanji × 2 questions)
   - Kanji data is small (~500 bytes per kanji)
   - Total response size: ~50KB maximum (well within acceptable limits)

### Caching Strategy

**Not implemented in initial version**, but future considerations:

1. **Client-Side Caching**:
   - Return `Cache-Control: private, max-age=300` (5 minutes)
   - Completed quizzes are immutable and can be cached longer
   - In-progress quizzes should have shorter cache or no cache

2. **Server-Side Caching**:
   - Redis cache for frequently accessed completed quizzes
   - Cache key pattern: `quiz:{id}:{user_id}`
   - TTL: 1 hour for completed quizzes
   - Invalidate on quiz updates (status changes)

### Response Size Optimization

1. **JSONB Handling**:
   - Readings and meanings are already arrays (no nested objects)
   - Efficient serialization via native JSON support

2. **Field Selection**:
   - Return all fields (no optional filtering)
   - Consider adding `?fields=` parameter in future for selective field retrieval

3. **Compression**:
   - Enable GZIP compression at server/CDN level
   - Can reduce response size by 60-70%

### Bottleneck Analysis

**Potential Bottlenecks**:

1. JOIN query for questions + kanji (mitigated by indexes)
2. JSONB deserialization (minimal impact, native Postgres support)
3. N+1 query problem (avoided by using JOIN, not separate queries)

---

## 9. Implementation Steps

### Step 1: Add Validation Schema

**File**: `src/lib/validation/quiz.validation.ts`

1. Define `getQuizByIdParamsSchema` using Zod
2. Add type export `GetQuizByIdParams`
3. Implement `parseGetQuizByIdParams(id: string)` helper function
4. Follow existing pattern from `completeQuizParamsSchema`

**Success Criteria**: Schema validates valid IDs and rejects invalid formats

---

### Step 2: Add Service Method

**File**: `src/lib/services/quiz.service.ts`

1. Add public method `getQuizById(quizId: number, userId: string): Promise<QuizWithQuestionsDTO>`
2. Implement logic:
   ```typescript
   - Query quiz by ID and user_id
   - If not found, check if quiz exists (without user filter)
   - Throw QuizNotFoundError if quiz doesn't exist
   - Throw QuizAccessDeniedError if wrong user
   - Query questions with kanji JOIN
   - Transform kanji entities to DTOs
   - Order by sequence
   - Return complete quiz
   ```
3. Reuse existing private methods: `transformToKanjiDTO()`, `jsonToStringArray()`
4. Handle all error cases with appropriate custom errors

**Success Criteria**: Method returns complete quiz data or throws specific errors

---

### Step 3: Create API Route Handler

**File**: `src/pages/api/quizzes/[id].ts`

1. Create new file with APIRoute export
2. Implement `GET` handler:
   ```typescript
   - Extract id from params
   - Validate using parseGetQuizByIdParams()
   - Extract userId from locals/auth
   - Instantiate QuizService
   - Call getQuizById()
   - Return 200 with quiz data
   ```
3. Implement error handling:
   - ZodError → 400
   - QuizNotFoundError → 404
   - QuizAccessDeniedError → 403
   - QuizCreationError → 500
   - Unknown errors → 500
4. Use existing `formatZodError()` helper from `index.ts`
5. Add `prerender = false` export

**Success Criteria**: Endpoint returns correct responses for all scenarios

---

### Step 4: Testing and Validation

2. **Manual Testing**:
   - Test with valid quiz ID owned by user → 200
   - Test with valid quiz ID not owned by user → 403
   - Test with non-existent quiz ID → 404
   - Test with invalid ID formats → 400
   - Test with missing auth token → 401 (when auth enabled)

3. **Database Verification**:
   - Verify correct indexes are in place
   - Run EXPLAIN ANALYZE on queries
   - Check query performance meets expectations (<20ms)

---

## Notes and Considerations

1. **Authentication**: Currently disabled in development. Production implementation must extract real user ID from JWT token via Supabase Auth.

2. **RLS Policies**: Disabled in migration `20260118170000_disable_rls_policies.sql`. Manual authorization checks are required in all endpoints.

3. **Question Ordering**: Questions are ordered by `sequence` field (1-based). This ensures consistent ordering across requests.

4. **Immutability**: Completed quizzes are immutable (status cannot change once completed). This makes them safe to cache aggressively.
