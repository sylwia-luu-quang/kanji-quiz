# API Endpoint Implementation Plan: DELETE /api/need-reviews/:kanjiId

## 1. Endpoint Overview

The `DELETE /api/need-reviews/:kanjiId` endpoint removes a specific kanji from the authenticated user's need-review list. This is an **idempotent operation** - it always returns success (204 No Content) regardless of whether the kanji was actually in the user's list. This design choice ensures the operation is safe to retry and maintains consistent behavior.

**Key Characteristics:**

- Requires user authentication via JWT Bearer token
- Scoped to authenticated user only (cannot delete other users' entries)
- No response body returned on success
- Idempotent - multiple identical requests produce the same result

## 2. Request Details

### HTTP Method

`DELETE`

### URL Structure

```
DELETE /api/need-reviews/:kanjiId
```

### Path Parameters

| Parameter | Type    | Required | Description                                     | Validation Rules           |
| --------- | ------- | -------- | ----------------------------------------------- | -------------------------- |
| `kanjiId` | integer | Yes      | ID of the kanji to remove from need-review list | Must be a positive integer |

### Request Headers

| Header          | Required | Description                              | Example             |
| --------------- | -------- | ---------------------------------------- | ------------------- |
| `Authorization` | Yes      | JWT Bearer token for user authentication | `Bearer eyJhbGc...` |

### Request Body

None - DELETE operations do not include a request body.

### Query Parameters

None

## 3. Used Types

### Existing Types (from `src/types.ts`)

```typescript
// Database entity (used internally in service)
export type NeedReviewEntity = Tables<"need_reviews">;
```

### New Validation Schema (to be added in `src/lib/validation/need-review.validation.ts`)

```typescript
// Zod schema for path parameter validation
export const deleteNeedReviewParamsSchema = z.object({
  kanjiId: z.coerce
    .number({
      required_error: "kanjiId is required",
      invalid_type_error: "kanjiId must be a valid number",
    })
    .int("kanjiId must be an integer")
    .positive("kanjiId must be a positive number"),
});

export type DeleteNeedReviewParams = z.infer<typeof deleteNeedReviewParamsSchema>;
```

**Note:** Using `z.coerce.number()` to automatically parse the string path parameter into a number.

## 4. Response Details

### Success Response

**Status Code:** `204 No Content`

**Response Body:** None

**Behavior:** Returns 204 regardless of whether:

- The kanji was successfully removed (existed in list)
- The kanji was not in the user's list (already absent)
- The kanji ID doesn't exist in the kanji table

This idempotent behavior ensures operations can be safely retried without side effects.

### Error Responses

| Status Code                 | Scenario                                                | Response Body Structure                                       |
| --------------------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| `400 Bad Request`           | Invalid kanjiId format (not an integer, negative, zero) | `{ "error": "Validation error message", "details": { ... } }` |
| `401 Unauthorized`          | Missing or invalid JWT token                            | `{ "error": "Unauthorized" }`                                 |
| `500 Internal Server Error` | Database connection failure or unexpected error         | `{ "error": "Internal server error" }`                        |

**Important:** 404 Not Found is NOT used since the operation is idempotent.

## 5. Data Flow

### High-Level Flow

```
Client Request
    ↓
Astro Middleware (JWT validation, user extraction)
    ↓
API Route Handler (/api/need-reviews/[kanjiId].ts)
    ↓
Validate Path Parameter (Zod schema)
    ↓
NeedReviewService.removeNeedReview(userId, kanjiId)
    ↓
Supabase DELETE Query
    ↓
Return 204 No Content
```

### Detailed Step-by-Step Flow

1. **Request Reception**
   - Client sends DELETE request to `/api/need-reviews/:kanjiId` with JWT in Authorization header

2. **Middleware Processing** (`src/middleware/index.ts`)
   - Validates JWT token format and signature
   - Extracts user ID from token payload
   - Attaches user info to `context.locals.user`
   - Returns 401 if token is missing or invalid

3. **Route Handler Processing** (`src/pages/api/need-reviews/[kanjiId].ts`)
   - Extracts `kanjiId` from path parameters
   - Validates `kanjiId` using Zod schema (must be positive integer)
   - Returns 400 if validation fails
   - Extracts authenticated `userId` from `context.locals.user`

4. **Service Layer** (`src/lib/services/need-review.service.ts`)
   - Receives `userId` and `kanjiId`
   - Executes DELETE query on `need_reviews` table:
     ```sql
     DELETE FROM need_reviews
     WHERE user_id = ? AND kanji_id = ?
     ```
   - Uses Supabase client from context
   - Handles database errors gracefully

5. **Response Generation**
   - Returns 204 No Content (empty response body)
   - Returns 500 if database operation fails

### Database Interaction

**Table:** `need_reviews`

**Operation:** DELETE

**Query Filters:**

- `user_id = <authenticated_user_id>` (ensures user can only delete their own entries)
- `kanji_id = <path_parameter_kanjiId>`

**Expected Outcomes:**

- 0 rows deleted: Entry didn't exist (still return 204)
- 1 row deleted: Entry successfully removed (return 204)

## 6. Security Considerations

### Authentication

- **JWT Token Validation**: Handled by Astro middleware
- Verifies token signature using Supabase Auth
- Extracts user ID from valid token
- Rejects requests with missing or invalid tokens (401)

### Authorization

- **User Scope Enforcement**: DELETE query MUST include `user_id` filter
- Users can only delete their own need-review entries
- Cannot delete entries belonging to other users
- This is enforced at the database query level, not just application logic

### Input Validation

- **Path Parameter Sanitization**: Zod schema validates `kanjiId` is a positive integer
- Prevents SQL injection by using Supabase parameterized queries
- Type coercion ensures numeric validation before database interaction

### Data Integrity

- **Foreign Key Constraints**: Database enforces referential integrity
- `kanji_id` references `kanji.id` (though not validated pre-deletion due to idempotency)
- `user_id` references `auth.users.id`

### Idempotency Safety

- **Retry Safety**: Multiple identical requests produce same result
- No side effects from repeated deletion attempts
- Client can safely retry on network failures

### Rate Limiting

- Not specified in requirements
- Consider implementing if abuse patterns emerge
- Could use Supabase Edge Functions rate limiting or application-level middleware

### CORS and Headers

- Follow existing CORS configuration in Astro setup
- Ensure proper Content-Type headers for error responses

## 7. Error Handling

### Error Categories and Responses

#### 1. Validation Errors (400 Bad Request)

**Trigger Conditions:**

- `kanjiId` is not a valid integer
- `kanjiId` is zero or negative
- `kanjiId` is not provided in path

**Example Scenarios:**

- `/api/need-reviews/abc` → kanjiId is not numeric
- `/api/need-reviews/-5` → kanjiId is negative
- `/api/need-reviews/0` → kanjiId is zero

**Response Format:**

```json
{
  "error": "Invalid kanjiId parameter",
  "details": {
    "field": "kanjiId",
    "message": "kanjiId must be a positive number"
  }
}
```

**Handling Strategy:**

- Validate using Zod schema before any database operations
- Return structured error with field-level details
- Log validation failures for monitoring (optional)

#### 2. Authentication Errors (401 Unauthorized)

**Trigger Conditions:**

- Missing Authorization header
- Invalid JWT token format
- Expired JWT token
- Token signature verification fails

**Handling:**

- Handled by Astro middleware before reaching route handler
- Middleware returns 401 automatically
- No route-level handling needed

**Response Format:**

```json
{
  "error": "Unauthorized"
}
```

#### 3. Database Errors (500 Internal Server Error)

**Trigger Conditions:**

- Supabase connection failure
- Database timeout
- Unexpected database exceptions

**Example Scenarios:**

- Network connectivity loss to Supabase
- Database service temporarily unavailable
- Query execution timeout

**Response Format:**

```json
{
  "error": "Failed to remove kanji from need-review list"
}
```

**Handling Strategy:**

- Catch database errors in service layer
- Log detailed error information to console (including error object)
- Return generic error message to client (avoid exposing internal details)
- Consider implementing retry logic for transient failures

**Logging Example:**

```typescript
console.error("Database error in NeedReviewService.removeNeedReview:", {
  userId,
  kanjiId,
  error: dbError,
  timestamp: new Date().toISOString(),
});
```

### Error Handling Flow

```
Request Processing
    ↓
Path Parameter Validation
    ├─ Invalid → Return 400 with details
    └─ Valid → Continue
         ↓
    Database Operation
         ├─ Error → Log + Return 500
         └─ Success → Return 204
```

### No Error Cases (Success Scenarios)

The following are **NOT** treated as errors due to idempotency:

- Kanji ID doesn't exist in `kanji` table → Still return 204
- Entry doesn't exist in user's need-review list → Still return 204
- User has no need-review entries at all → Still return 204

## 8. Performance Considerations

### Database Query Optimization

**Index Usage:**

- Ensure composite index exists on `need_reviews(user_id, kanji_id)` for efficient deletion
- Primary key index on `need_reviews.id` should exist
- Foreign key indices on `user_id` and `kanji_id` should exist

**Query Efficiency:**

- DELETE with WHERE clause on indexed columns is fast
- Expected query execution time: < 10ms
- Single-row deletion (at most) - minimal impact

### Connection Management

**Supabase Client:**

- Use pooled connections from `context.locals.supabase`
- Avoid creating new client instances per request
- Connection is managed by Astro middleware

### Potential Bottlenecks

**Low Risk Areas:**

- Single DELETE query with indexed columns - very fast
- No complex joins or subqueries required
- No cascading deletes to consider

**Medium Risk Areas:**

- High-frequency deletion requests from same user could impact database
- Consider caching user's need-review list if reads >> writes

### Optimization Strategies

1. **Database Indices** (Critical)
   - Verify `need_reviews(user_id, kanji_id)` composite index exists
   - Check query execution plan if performance issues arise

2. **Query Simplification**
   - Direct DELETE with filters - already optimal
   - No N+1 query problems possible

3. **Response Time**
   - Target response time: < 100ms for p95
   - Most time spent in network roundtrip, not query execution

### Scalability Considerations

**Current Design:**

- Scales linearly with number of users
- Each request is independent and stateless
- No shared state or locking concerns

## 9. Implementation Steps

### Step 1: Add Validation Schema

**File:** `src/lib/validation/need-review.validation.ts`

**Action:**

- Import Zod library
- Create `deleteNeedReviewParamsSchema` to validate path parameter
- Export validation function `parseDeleteNeedReviewParams(kanjiId: string)`
- Use `z.coerce.number()` to handle string-to-number conversion from URL path

**Validation Rules:**

- kanjiId must be coercible to number
- kanjiId must be an integer
- kanjiId must be positive (> 0)

### Step 2: Add Service Method

**File:** `src/lib/services/need-review.service.ts`

**Action:**

- Add `removeNeedReview(userId: string, kanjiId: number): Promise<void>` method to `NeedReviewService` class
- Implement DELETE query using `this.supabase.from("need_reviews").delete()`
- Filter by both `user_id` and `kanji_id` to ensure user can only delete their own entries
- Handle database errors by catching and rethrowing as generic Error
- Log errors to console with context (userId, kanjiId, error details)
- Do NOT throw error if 0 rows deleted (idempotent behavior)

**Query Pattern:**

```typescript
const { error } = await this.supabase.from("need_reviews").delete().eq("user_id", userId).eq("kanji_id", kanjiId);
```

**Error Handling:**

- If database error occurs, log and throw generic error
- If no rows deleted (count = 0), return success silently

### Step 3: Create API Route Handler

**File:** `src/pages/api/need-reviews/[kanjiId].ts`

**Action:**

- Create new API route file for dynamic path parameter
- Export `DELETE` function to handle DELETE requests
- Extract authenticated user from `context.locals.user` (populated by middleware)
- Return 401 if user not authenticated
- Extract `kanjiId` from `context.params.kanjiId`
- Validate `kanjiId` using validation function from Step 1
- Return 400 with error details if validation fails
- Initialize `NeedReviewService` with `context.locals.supabase`
- Call `service.removeNeedReview(userId, kanjiId)`
- Return 204 No Content on success
- Catch errors and return 500 with generic message

**Route Structure:**

```typescript
export async function DELETE(context: APIContext): Promise<Response> {
  // 1. Extract and validate authentication
  // 2. Extract and validate path parameter
  // 3. Call service method
  // 4. Handle errors
  // 5. Return response
}
```

### Step 4: Verify Database Indices

**Action:**

- Check existing migration files for index definitions
- Verify composite index on `need_reviews(user_id, kanji_id)` exists
- If missing, create new migration to add index

**Index Check:**

```sql
-- Verify index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'need_reviews';
```

**If Index Missing:**
Create migration: `supabase/migrations/YYYYMMDD_add_need_reviews_composite_index.sql`

### Step 5: Manual Testing

**Tools:**

- curl, Postman, or Thunder Client
- Valid JWT token from Supabase Auth

**Test Sequence:**

1. Authenticate user and obtain JWT token
2. Add kanji to need-review list (POST endpoint)
3. Verify entry exists (GET endpoint)
4. Delete entry (DELETE endpoint) → Expect 204
5. Verify entry gone (GET endpoint) → Should not appear in list
6. Delete again (DELETE endpoint) → Expect 204 (idempotent)

**Example curl command:**

```bash
curl -X DELETE \
  http://localhost:4321/api/need-reviews/123 \
  -H "Authorization: Bearer <your_jwt_token>"
```
