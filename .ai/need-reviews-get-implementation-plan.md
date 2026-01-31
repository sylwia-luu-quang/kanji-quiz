# API Endpoint Implementation Plan: GET /api/need-reviews

## 1. Endpoint Overview

This endpoint retrieves the authenticated user's need-review list, which contains kanji characters that the user has marked for future review. The response includes full kanji details (character, level, readings, meanings) for each need-review entry, along with pagination metadata to support efficient data retrieval.

**Primary Functions:**
- Fetch user-specific need-review entries with embedded kanji details
- Support pagination for large need-review lists
- Ensure users can only access their own need-review data

## 2. Request Details

### HTTP Method
`GET`

### URL Structure
`/api/need-reviews`

### Request Headers
- **Authorization** (required): `Bearer <jwt_token>`
  - JWT token issued by Supabase Auth
  - Contains user_id for authorization

### Query Parameters

| Parameter | Type    | Required | Default | Constraints | Description                    |
|-----------|---------|----------|---------|-------------|--------------------------------|
| `limit`   | integer | No       | 50      | 1-100       | Number of results per page     |
| `offset`  | integer | No       | 0       | >= 0        | Pagination offset (zero-based) |

### Request Body
None (GET request)

## 3. Used Types

### Request Types
No command model needed for this GET endpoint.

### Query Parameter Validation Schema
```typescript
// Zod schema for query parameter validation
{
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
}
```

### Response Types

**NeedReviewDTO** (extends NeedReviewEntity):
```typescript
{
  id: number;
  user_id: string;  // UUID
  kanji_id: number;
  kanji: KanjiDTO;  // Embedded kanji details
  created_at: string;  // ISO 8601 timestamp
}
```

**KanjiDTO**:
```typescript
{
  id: number;
  character: string;
  level: JLPTLevel;  // 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
  readings: string[];
  meanings: string[];
  created_at: string;
}
```

**NeedReviewListResponseDTO**:
```typescript
{
  data: NeedReviewDTO[];
  pagination: PaginationDTO;
}
```

**PaginationDTO**:
```typescript
{
  total: number;     // Total count of user's need-review entries
  limit: number;     // Applied limit
  offset: number;    // Applied offset
}
```

**ErrorResponseDTO**:
```typescript
{
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}
```

## 4. Response Details

### Success Response (200 OK)
```json
{
  "data": [
    {
      "id": 501,
      "user_id": "uuid-here",
      "kanji_id": 42,
      "kanji": {
        "id": 42,
        "character": "行",
        "level": "N5",
        "readings": ["こう", "ぎょう", "い.く", "ゆ.く"],
        "meanings": ["go", "conduct", "line"]
      },
      "created_at": "2026-01-18T10:01:30Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0
  }
}
```

### Error Responses

**400 Bad Request** (Invalid query parameters):
```json
{
  "error": "Invalid query parameters",
  "code": "VALIDATION_ERROR",
  "details": {
    "limit": "Must be between 1 and 100",
    "offset": "Must be a non-negative integer"
  }
}
```

**401 Unauthorized** (Missing or invalid token):
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

**500 Internal Server Error** (Database or server error):
```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

## 5. Data Flow

### Request Flow
1. **Middleware Layer**: Astro middleware intercepts the request
   - Validates JWT token from Authorization header
   - Extracts user_id from token and attaches to context.locals
   - Returns 401 if authentication fails

2. **Route Handler** (`src/pages/api/need-reviews/index.ts`):
   - Receives authenticated request with user_id in context.locals
   - Extracts and validates query parameters (limit, offset)
   - Returns 400 if validation fails

3. **Service Layer** (`src/lib/services/need-review.service.ts`):
   - Receives user_id and pagination parameters
   - Executes database queries via Supabase client

4. **Database Layer**:
   - Query 1: Fetch need-review entries with kanji details
     ```sql
     SELECT nr.*, k.*
     FROM need_reviews nr
     INNER JOIN kanji k ON nr.kanji_id = k.id
     WHERE nr.user_id = $1
     ORDER BY nr.created_at DESC
     LIMIT $2 OFFSET $3
     ```
   - Query 2: Count total entries for pagination
     ```sql
     SELECT COUNT(*) FROM need_reviews WHERE user_id = $1
     ```

5. **Response Transformation**:
   - Service transforms database results to DTOs
   - Parses JSONB fields (readings, meanings) to arrays
   - Constructs NeedReviewListResponseDTO with data and pagination

6. **Response**: Return 200 with JSON response

### Error Flow
- **Validation Errors**: Return 400 immediately from route handler
- **Database Errors**: Caught in service layer, logged, return 500
- **Unexpected Errors**: Caught at route handler level, logged, return 500

## 6. Security Considerations

### Authentication
- **JWT Validation**: Handled by Astro middleware
- **Token Verification**: Supabase client verifies token signature and expiration
- **User Context**: User ID extracted from verified JWT, not from request parameters

### Authorization
- **User Isolation**: Database queries filtered by `user_id` from JWT
- **Row-Level Security**: Users can only access their own need-review entries
- **No privilege escalation**: No way to access other users' data

### Input Validation
- **Query Parameters**: Validated using Zod schemas
- **Type Safety**: TypeScript ensures type correctness
- **Sanitization**: Supabase parameterized queries prevent SQL injection

### Data Protection
- **Minimal Data Exposure**: Only return data user is authorized to see
- **No Sensitive Data**: Response contains only kanji learning data
- **HTTPS Required**: All API calls should use HTTPS in production

### Rate Limiting
- **Consideration**: May implement rate limiting for GET requests to prevent abuse
- **Strategy**: Could use Supabase Edge Functions or external rate limiter
- **Not Critical**: Read-only endpoint with pagination limits impact

## 7. Error Handling

### Error Categories and Responses

| Error Type | Status Code | Trigger Condition | Response Code | Handling Strategy |
|------------|-------------|-------------------|---------------|-------------------|
| **Authentication Failure** | 401 | Missing/invalid JWT token | `UNAUTHORIZED` | Handled by middleware; return immediately |
| **Invalid Query Parameters** | 400 | limit > 100, limit < 1, offset < 0, non-numeric values | `VALIDATION_ERROR` | Validate with Zod; return detailed error messages |
| **Database Connection Error** | 500 | Supabase client connection failure | `DATABASE_ERROR` | Log error; return generic 500 message |
| **Database Query Error** | 500 | Invalid query, constraint violation | `DATABASE_ERROR` | Log error with query details; return 500 |
| **Unexpected Error** | 500 | Uncaught exceptions | `INTERNAL_ERROR` | Log full stack trace; return 500 |

### Error Handling Pattern
```typescript
try {
  // 1. Validate query parameters (throw 400)
  // 2. Call service layer (may throw service-specific errors)
  // 3. Return success response
} catch (error) {
  if (error instanceof ValidationError) {
    return new Response(JSON.stringify({
      error: error.message,
      code: 'VALIDATION_ERROR',
      details: error.details
    }), { status: 400 });
  }
  
  if (error instanceof NeedReviewServiceError) {
    // Log error details
    console.error('Service error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch need-review list',
      code: 'SERVICE_ERROR'
    }), { status: 500 });
  }
  
  // Unknown error
  console.error('Unexpected error:', error);
  return new Response(JSON.stringify({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  }), { status: 500 });
}
```

## 8. Performance Considerations

### Database Optimization

**Indexes**:
- Primary index: `need_reviews(user_id)` - Critical for WHERE clause
- Secondary index: `need_reviews(user_id, created_at DESC)` - Optimizes ORDER BY
- Foreign key indexes: `need_reviews(kanji_id)` - Optimizes JOIN

**Query Optimization**:
- Single JOIN operation (need_reviews → kanji)
- WHERE clause uses indexed column (user_id)
- LIMIT clause prevents excessive data retrieval
- Consider using single query with COUNT(*) OVER() window function to avoid separate count query

**Connection Management**:
- Reuse Supabase client from context.locals
- Connection pooling handled by Supabase
- Avoid creating new client instances per request

### Response Size Management
- **Pagination**: Maximum 100 items per response
- **Typical Response Size**: ~10-50 KB for full page (50 items)
- **Compression**: Enable gzip compression in production

### Caching Strategy
**Not Recommended for This Endpoint**:
- Need-review list changes frequently (users add/remove items)
- Data is user-specific (can't share cache between users)
- Real-time accuracy is important for learning workflow

**Potential Optimization**:
- Cache kanji details (rarely change) separately
- Use Supabase real-time subscriptions if implementing live updates

### Scalability Considerations
- **Database Load**: Read-only query, minimal impact
- **Concurrent Users**: Pagination prevents N+1 query problems
- **Growth**: Indexes scale well with user base growth
- **Monitoring**: Track query execution time via Supabase dashboard

### Expected Performance Metrics
- **Query Time**: < 50ms for typical user (25-100 need-review items)
- **Response Time**: < 200ms end-to-end
- **Max Response Size**: ~150 KB (100 items with full kanji details)

## 9. Implementation Steps

### Step 1: Setup Route File
- Create `src/pages/api/need-reviews/index.ts`
- Import required types from `src/types.ts`
- Import Supabase client type
- Setup basic GET request handler structure

### Step 2: Implement Query Parameter Validation
- Define Zod schema for query parameters
  - `limit`: coerce to number, integer, positive, max 100, default 50
  - `offset`: coerce to number, integer, min 0, default 0
- Parse `request.url` to extract query parameters
- Validate parameters using Zod schema
- Handle validation errors with 400 response

### Step 3: Extract Authentication Context
- Get Supabase client from `context.locals.supabase`
- Get authenticated user from `context.locals.user`
- Verify user exists (should be guaranteed by middleware)
- Extract `user_id` for database queries

### Step 4: Implement/Update Service Layer
- Check if `src/lib/services/need-review.service.ts` has required method
- If not, add `getNeedReviewList(userId, limit, offset)` method
- Service should:
  - Execute database query with JOIN
  - Handle pagination
  - Count total records
  - Transform results to DTOs
  - Handle database errors

### Step 5: Implement Database Query
- Use Supabase client to query need_reviews table
- JOIN with kanji table to get full kanji details
- Filter by `user_id`
- Order by `created_at DESC` (most recent first)
- Apply `limit` and `offset` for pagination
- Execute count query for pagination total

### Step 6: Transform Database Results to DTOs
- Map database rows to `NeedReviewDTO` structure
- Parse JSONB fields (readings, meanings) to arrays
- Ensure nested kanji object matches `KanjiDTO` structure
- Construct pagination metadata

### Step 7: Implement Error Handling
- Wrap service call in try-catch block
- Handle validation errors (400)
- Handle service-specific errors (500)
- Handle unexpected errors (500)
- Return structured error responses

### Step 8: Format and Return Success Response
- Construct `NeedReviewListResponseDTO`
- Include data array and pagination object
- Set Content-Type header to application/json
- Return 200 status with JSON body

### Step 9: Add Input Validation Schema
- Create or update `src/lib/validation/need-review.validation.ts`
- Export Zod schema for query parameters
- Add JSDoc comments for documentation
- Ensure schema aligns with API specification

### Step 10: Add Custom Error Classes (if needed)
- Update `src/lib/errors/need-review.errors.ts`
- Add error classes for service-specific errors
- Ensure errors include appropriate codes and messages
- Export error classes for use in route handler

### Step 11: Code Review and Linting
- Run linter to check for code style issues
- Fix any TypeScript errors
- Ensure consistent error handling patterns
- Verify adherence to project coding standards
- Request peer code review
