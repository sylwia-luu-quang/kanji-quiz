# API Endpoint Implementation Plan: GET /api/quizzes

## 1. Endpoint Overview

The `GET /api/quizzes` endpoint retrieves a paginated list of quizzes belonging to the authenticated user. This endpoint is primarily used to display quiz history, allowing users to review their past quiz sessions. The endpoint supports optional filtering by quiz status (in_progress, completed, abandoned) and includes pagination controls to efficiently handle large result sets.

**Key Features:**

- User-scoped quiz retrieval (users only see their own quizzes)
- Optional status filtering
- Pagination support with configurable limit and offset
- Returns quiz metadata including scores, timestamps, and configuration

## 2. Request Details

### HTTP Method

`GET`

### URL Structure

```
/api/quizzes
```

### Request Headers

- `Authorization: Bearer <jwt_token>` (required in production, uses default user ID in development)

### Query Parameters

| Parameter | Type   | Required | Default | Validation                                              | Description                        |
| --------- | ------ | -------- | ------- | ------------------------------------------------------- | ---------------------------------- |
| `status`  | string | No       | -       | Must be one of: `in_progress`, `completed`, `abandoned` | Filter quizzes by status           |
| `limit`   | number | No       | 20      | Min: 1, Max: 100                                        | Number of results per page         |
| `offset`  | number | No       | 0       | Min: 0                                                  | Pagination offset (skip N records) |

### Example Requests

**Get all quizzes (default pagination):**

```
GET /api/quizzes
```

**Get completed quizzes with custom pagination:**

```
GET /api/quizzes?status=completed&limit=50&offset=0
```

**Get second page of in-progress quizzes:**

```
GET /api/quizzes?status=in_progress&limit=20&offset=20
```

## 3. Used Types

### Existing Types (from `src/types.ts`)

```typescript
// Response DTO
export interface QuizListResponseDTO {
  data: QuizListItemDTO[];
  pagination: PaginationDTO;
}

// Quiz item in list (alias for QuizEntity)
export type QuizListItemDTO = QuizDTO;

// Pagination metadata
export interface PaginationDTO {
  total: number;
  limit: number;
  offset: number;
}

// Quiz status enum
export type QuizStatus = Database["public"]["Enums"]["quiz_status"];
// Possible values: "in_progress" | "completed" | "abandoned"

// Error response
export interface ErrorResponseDTO {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}
```

### New Types (to be created in `src/lib/validation/quiz.validation.ts`)

```typescript
// Query parameters validation schema
export const getQuizListQuerySchema = z.object({
  status: z.enum(["in_progress", "completed", "abandoned"]).optional(),
  limit: z.number().int().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").default(20),
  offset: z.number().int().min(0, "Offset must be non-negative").default(0),
});

export type GetQuizListQuery = z.infer<typeof getQuizListQuerySchema>;

// Helper function to parse and validate query parameters
export function parseGetQuizListQuery(query: URLSearchParams): GetQuizListQuery {
  const rawParams = {
    status: query.get("status") || undefined,
    limit: query.get("limit") ? Number(query.get("limit")) : 20,
    offset: query.get("offset") ? Number(query.get("offset")) : 0,
  };

  return getQuizListQuerySchema.parse(rawParams);
}
```

### New Service Method (to be added to `src/lib/services/quiz.service.ts`)

```typescript
/**
 * Parameters for listing quizzes
 */
export interface GetQuizListParams {
  userId: string;
  status?: QuizStatus;
  limit: number;
  offset: number;
}

/**
 * Result structure for quiz list with pagination
 */
export interface QuizListResult {
  quizzes: QuizDTO[];
  total: number;
}
```

## 4. Response Details

### Success Response (200 OK)

**Response Body:**

```json
{
  "data": [
    {
      "id": 123,
      "user_id": "uuid-here",
      "type": "level",
      "level": "N5",
      "question_count": 10,
      "status": "completed",
      "score_percent": "85.00",
      "created_at": "2026-01-18T10:00:00Z",
      "completed_at": "2026-01-18T10:05:32Z"
    },
    {
      "id": 122,
      "user_id": "uuid-here",
      "type": "need_review",
      "level": null,
      "question_count": 20,
      "status": "abandoned",
      "score_percent": null,
      "created_at": "2026-01-17T14:30:00Z",
      "completed_at": null
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 20,
    "offset": 0
  }
}
```

**Headers:**

- `Content-Type: application/json`

### Error Responses

#### 400 Bad Request

**Scenarios:**

- Invalid status parameter (not one of: in_progress, completed, abandoned)
- Invalid limit (< 1 or > 100 or not a number)
- Invalid offset (< 0 or not a number)

**Response Body:**

```json
{
  "error": "Invalid query parameters",
  "code": "VALIDATION_ERROR",
  "details": {
    "status": "Status must be one of: in_progress, completed, abandoned",
    "limit": "Limit must be between 1 and 100"
  }
}
```

#### 401 Unauthorized

**Scenarios:**

- Missing Authorization header
- Invalid JWT token
- Expired JWT token

**Response Body:**

```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

#### 500 Internal Server Error

**Scenarios:**

- Database connection failure
- Unexpected database query error
- Unhandled exceptions

**Response Body:**

```json
{
  "error": "Internal server error",
  "code": "SERVER_ERROR"
}
```

## 5. Data Flow

### High-Level Flow

```
Client Request
    ↓
[1] Astro API Route Handler (GET /api/quizzes)
    ↓
[2] Extract & Parse Query Parameters (status, limit, offset)
    ↓
[3] Validate Query Parameters (Zod schema)
    ↓
[4] Extract User ID from Auth Context (locals.supabase or defaultUserId)
    ↓
[5] Call QuizService.getQuizList(userId, filters)
    ↓
[6] QuizService: Build Supabase Query
    ├── Filter by user_id (always)
    ├── Filter by status (if provided)
    ├── Order by created_at DESC
    ├── Apply limit and offset
    └── Execute count query for total
    ↓
[7] Transform Database Results to DTOs
    ↓
[8] Build Response with Pagination Metadata
    ↓
[9] Return JSON Response (200 OK)
```

### Detailed Data Flow

#### Step 1: Request Reception

- Astro receives GET request at `/api/quizzes`
- Extracts query parameters from URL
- Provides `locals.supabase` context with authentication

#### Step 2-3: Parameter Validation

- Parse query parameters: `status`, `limit`, `offset`
- Validate using Zod schema
- Apply defaults: `limit=20`, `offset=0`
- Throw `ZodError` if validation fails

#### Step 4: User Authentication

- Extract user ID from authenticated session via `locals.supabase`
- In development mode: use `defaultUserId` from `src/db/supabase.client.ts`
- If no user ID available: return 401 or 500 (depending on context)

#### Step 5-6: Database Query

- Call `QuizService.getQuizList()` with validated parameters
- Build Supabase query:

  ```typescript
  let query = supabase
    .from("quiz")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  query = query.range(offset, offset + limit - 1);
  ```

- Execute query to get both data and total count

#### Step 7: Data Transformation

- Database returns `QuizEntity[]` with metadata
- No transformation needed (QuizListItemDTO is alias for QuizDTO)
- Extract total count from query metadata

#### Step 8: Response Building

- Construct `QuizListResponseDTO`:
  - `data`: array of quiz records
  - `pagination`: { total, limit, offset }

#### Step 9: Response Delivery

- Serialize to JSON
- Set `Content-Type: application/json` header
- Return with status 200

## 6. Security Considerations

### Authentication & Authorization

1. **User Authentication**
   - Verify JWT token in Authorization header (production)
   - Use Supabase auth session from `locals.supabase`
   - Development mode: use `defaultUserId` constant

2. **Data Access Control**
   - **CRITICAL**: Always filter by `user_id` to prevent users from accessing other users' quizzes
   - User ID must come from authenticated session, never from client input
   - Database query MUST include `.eq("user_id", userId)`

3. **Row-Level Security (RLS)**
   - Current design: RLS is disabled (see migration `20260118170000_disable_rls_policies.sql`)
   - Application-level authorization is enforced in service layer
   - Future consideration: Enable RLS policies for defense-in-depth

### Input Validation

1. **Query Parameter Validation**
   - Use Zod schema to validate all query parameters
   - Enforce strict type checking (string, number)
   - Enforce value constraints (status enum, limit range, offset >= 0)
   - Provide clear error messages for validation failures

2. **SQL Injection Prevention**
   - Use Supabase client (parameterized queries automatically)
   - Never construct raw SQL strings with user input
   - All filters use builder methods (`.eq()`, `.range()`)

3. **Resource Exhaustion Prevention**
   - Enforce maximum limit of 100 records per request
   - Validate offset to prevent negative values
   - Consider rate limiting (future enhancement)

### Data Exposure

1. **Sensitive Data Filtering**
   - User should only see their own `user_id` in responses
   - No password or authentication data in response
   - Quiz data is non-sensitive (scores, timestamps)

2. **Response Consistency**
   - Always return consistent error structure
   - Avoid exposing internal error details in production
   - Log detailed errors server-side only

## 7. Error Handling

### Error Handling Strategy

Follow the early return pattern with guard clauses:

1. Validate input first (query parameters)
2. Check authentication/authorization
3. Handle service-level errors
4. Catch unexpected errors last

### Error Scenarios & Responses

#### 1. Invalid Query Parameters (400)

**Trigger:**

- `status` is not one of: "in_progress", "completed", "abandoned"
- `limit` is not a number, < 1, or > 100
- `offset` is not a number or < 0

**Handler:**

```typescript
catch (error) {
  if (error instanceof ZodError) {
    const errorResponse: ErrorResponseDTO = {
      error: "Invalid query parameters",
      code: "VALIDATION_ERROR",
      details: formatZodError(error),
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

#### 2. Missing or Invalid Authentication (401)

**Trigger:**

- Missing Authorization header
- Invalid JWT token
- Expired session

**Handler:**

```typescript
if (!userId) {
  const errorResponse: ErrorResponseDTO = {
    error: "Authentication required",
    code: "UNAUTHORIZED",
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
```

**Note**: In development mode with `defaultUserId`, this would be 500 instead

#### 3. Database Query Error (500)

**Trigger:**

- Database connection failure
- Supabase query error
- Timeout

**Handler:**

```typescript
catch (error) {
  console.error("Failed to fetch quiz list:", error);

  const errorResponse: ErrorResponseDTO = {
    error: "Failed to retrieve quiz list",
    code: "DATABASE_ERROR",
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
```

#### 4. Unexpected Server Error (500)

**Trigger:**

- Unhandled exceptions
- Programming errors
- Runtime errors

**Handler:**

```typescript
catch (error) {
  console.error("Unexpected error in GET /api/quizzes:", error);

  const errorResponse: ErrorResponseDTO = {
    error: "Internal server error",
    code: "SERVER_ERROR",
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
```

### Error Handling Utilities

Reuse existing `formatZodError()` function from `src/pages/api/quizzes/index.ts`:

```typescript
function formatZodError(error: ZodError): Record<string, unknown> {
  const details: Record<string, unknown> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".") || "query";
    details[path] = issue.message;
  }

  return details;
}
```

## 8. Performance Considerations

### Database Optimization

1. **Indexes** (verify in database schema)
   - Index on `quiz.user_id` for filtering (should exist via FK)
   - Index on `quiz.status` for status filtering
   - Index on `quiz.created_at` for ordering
   - Composite index on `(user_id, status, created_at)` for optimal query performance

2. **Count Query Optimization**
   - Use Supabase `count: "exact"` option for accurate total
   - For very large datasets, consider:
     - Using `count: "estimated"` for faster response
     - Caching count results
     - Using window functions for count with data in single query

3. **Query Efficiency**
   - Use `.range()` for pagination (translates to LIMIT/OFFSET)
   - Select only needed columns (currently `*`, acceptable for quiz table)
   - Order by indexed column (`created_at`)

### Application-Level Optimization

1. **Pagination Best Practices**
   - Enforce maximum limit (100) to prevent resource exhaustion
   - Default limit of 20 balances UX and performance
   - Consider cursor-based pagination for very large datasets (future enhancement)

2. **Response Size**
   - Quiz records are relatively small (no embedded questions)
   - JSON serialization is fast for reasonable page sizes
   - Consider compression for large result sets

### Monitoring & Observability

1. **Performance Metrics to Track**
   - Average query execution time
   - 95th percentile response time
   - Number of records per typical request

2. **Query Analysis**
   - Use Supabase dashboard to analyze slow queries
   - Monitor query plans for sequential scans
   - Set up alerts for queries > 1 second

## 9. Implementation Steps

### Step 1: Create Validation Schema

- Add `getQuizListQuerySchema` to `src/lib/validation/quiz.validation.ts`
- Define validation rules for `status`, `limit`, and `offset` query parameters
- Create `parseGetQuizListQuery()` helper function to parse URLSearchParams

### Step 2: Add Service Method

- Add `GetQuizListParams` and `QuizListResult` interfaces to `src/lib/services/quiz.service.ts`
- Implement `getQuizList()` method in `QuizService` class
- Build Supabase query with user_id filter, optional status filter, ordering, and pagination
- Return quizzes array with total count for pagination metadata

### Step 3: Implement API Route Handler

- Add GET handler to `src/pages/api/quizzes/index.ts`
- Parse and validate query parameters using `parseGetQuizListQuery()`
- Extract user ID from auth context (use `defaultUserId` for development)
- Call `QuizService.getQuizList()` with validated parameters
- Build `QuizListResponseDTO` with data and pagination metadata
- Implement error handling for ZodError (400) and server errors (500)

### Step 4: Update Type Imports

- Import `QuizListResponseDTO` in `src/pages/api/quizzes/index.ts`
- Import `parseGetQuizListQuery` from validation module
- Ensure all necessary types are available

### Step 5: Test the Endpoint

- Test default behavior (no query parameters)
- Test status filtering with each valid status value
- Test pagination with various limit and offset values
- Test validation errors (invalid status, out-of-range limit, negative offset)
- Test combined filters (status + pagination)
- Verify response structure matches `QuizListResponseDTO`

### Step 6: Verify Database Performance

- Check existing indexes on `quiz` table (user_id, status, created_at)
- Create composite index on (user_id, status, created_at) if missing
- Run EXPLAIN ANALYZE on typical queries to verify performance
- Ensure queries use indexes and avoid sequential scans

---

## Summary

This implementation plan provides a complete guide for implementing the `GET /api/quizzes` endpoint. The endpoint follows established patterns in the codebase:

- Uses Zod for input validation (similar to POST /api/quizzes)
- Implements service layer separation (QuizService)
- Follows error handling patterns with ErrorResponseDTO
- Uses Supabase client from `locals.supabase`
- Enforces user-level data isolation
- Includes comprehensive security considerations

The implementation prioritizes:

- **Security**: User data isolation, input validation, SQL injection prevention
- **Performance**: Database indexing, pagination limits, efficient queries
- **Maintainability**: Clean code structure, type safety, clear error handling
- **Usability**: Sensible defaults, clear error messages, flexible filtering
