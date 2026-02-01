# API Endpoint Implementation Plan: GET /api/kanji

## 1. Endpoint Overview

This endpoint retrieves a paginated list of kanji characters from the database, optionally filtered by JLPT level (N5, N4, N3, N2, N1). The endpoint is public and does not require authentication, making kanji data accessible to all users. It supports pagination through `limit` and `offset` parameters to efficiently handle large datasets.

**Key Features**:

- Public access (no authentication required)
- Optional JLPT level filtering
- Configurable pagination (default: 50 items, max: 100)
- Returns kanji with readings and meanings as properly typed arrays

## 2. Request Details

**HTTP Method**: `GET`

**URL Structure**: `/api/kanji`

**Query Parameters**:

| Parameter | Type   | Required | Default | Validation                         | Description                 |
| --------- | ------ | -------- | ------- | ---------------------------------- | --------------------------- |
| `level`   | string | No       | -       | Must be one of: N5, N4, N3, N2, N1 | Filters kanji by JLPT level |
| `limit`   | number | No       | 50      | Must be positive integer, max 100  | Number of results per page  |
| `offset`  | number | No       | 0       | Must be non-negative integer       | Pagination offset           |

**Request Headers**:

- `Authorization: Bearer <jwt_token>` (optional, not validated for this public endpoint)

**Example Requests**:

```
GET /api/kanji
GET /api/kanji?level=N5
GET /api/kanji?level=N5&limit=20&offset=0
GET /api/kanji?limit=100&offset=50
```

## 3. Used Types

### DTOs (from `src/types.ts`)

**KanjiDTO**:

```typescript
type KanjiDTO = Omit<KanjiEntity, "readings" | "meanings"> & {
  readings: string[];
  meanings: string[];
};
```

Contains: `id`, `character`, `level`, `readings[]`, `meanings[]`, `created_at`

**KanjiListResponseDTO**:

```typescript
interface KanjiListResponseDTO {
  data: KanjiDTO[];
  pagination: PaginationDTO;
}
```

**PaginationDTO**:

```typescript
interface PaginationDTO {
  total: number;
  limit: number;
  offset: number;
}
```

**ErrorResponseDTO**:

```typescript
interface ErrorResponseDTO {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}
```

### Validation Types

**JLPTLevel**: `"N5" | "N4" | "N3" | "N2" | "N1"`

**Type Guards**:

- `isJLPTLevel(value: unknown): value is JLPTLevel`

## 4. Response Details

### Success Response (200 OK)

**Content-Type**: `application/json`

**Structure**:

```json
{
  "data": [
    {
      "id": 1,
      "character": "行",
      "level": "N5",
      "readings": ["こう", "ぎょう", "い.く", "ゆ.く"],
      "meanings": ["go", "conduct", "line"],
      "created_at": "2026-01-18T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 245,
    "limit": 50,
    "offset": 0
  }
}
```

### Error Responses

**400 Bad Request**:

```json
{
  "error": "Invalid query parameters",
  "code": "INVALID_PARAMETERS",
  "details": {
    "level": "Must be one of: N5, N4, N3, N2, N1"
  }
}
```

**500 Internal Server Error**:

```json
{
  "error": "Internal server error",
  "code": "SERVER_ERROR"
}
```

## 5. Data Flow

### Request Flow

1. **Request Reception**: Astro API route receives GET request
2. **Parameter Extraction**: Extract and parse query parameters from URL
3. **Input Validation**: Validate parameters using Zod schema
4. **Service Invocation**: Call `KanjiService.getKanji()` with validated parameters
5. **Database Query**: Service queries Supabase database with filters and pagination
6. **Data Transformation**: Transform database entities to KanjiDTO format
7. **Response Construction**: Build KanjiListResponseDTO with data and pagination
8. **Response Sending**: Return 200 OK with JSON payload

### Database Interaction

**Query Pattern**:

```typescript
// With level filter
SELECT * FROM kanji
WHERE level = $1
ORDER BY id ASC
LIMIT $2 OFFSET $3;

// Without level filter
SELECT * FROM kanji
ORDER BY id ASC
LIMIT $1 OFFSET $2;

// Count total for pagination
SELECT COUNT(*) FROM kanji WHERE level = $1;
```

**Supabase Client Usage**:

```typescript
const query = supabase.from("kanji").select("*", { count: "exact" });

if (level) {
  query.eq("level", level);
}

const { data, error, count } = await query.order("id", { ascending: true }).range(offset, offset + limit - 1);
```

### Data Transformation

**Entity to DTO**:

- Database `readings` (jsonb) → `string[]` (parsed and typed)
- Database `meanings` (jsonb) → `string[]` (parsed and typed)
- All other fields pass through unchanged

## 6. Security Considerations

### Authentication

- **Not Required**: This endpoint serves public kanji data
- **Optional Header**: Authorization header may be present but is not validated
- **Future Enhancement**: May add rate limiting per user if authenticated

### Input Validation

- **Parameter Sanitization**: All query parameters validated before database queries
- **Type Safety**: TypeScript + Zod ensure type correctness
- **SQL Injection Prevention**: Supabase client uses parameterized queries
- **Limit Enforcement**: Maximum limit of 100 prevents resource exhaustion

### Data Exposure

- **Public Data**: Kanji information is intentionally public
- **No Sensitive Data**: Response contains only kanji learning data
- **No User Data**: No personal or user-specific information exposed

### Resource Protection

- **Result Limit**: Max 100 items per request prevents excessive data transfer
- **Database Load**: Pagination reduces database load
- **Indexed Queries**: Ensure `level` column is indexed for filter performance

## 7. Error Handling

### Validation Errors (400 Bad Request)

**Scenario 1**: Invalid JLPT level

```typescript
// Input: ?level=N6
{
  "error": "Invalid query parameters",
  "code": "INVALID_LEVEL",
  "details": {
    "level": "Must be one of: N5, N4, N3, N2, N1"
  }
}
```

**Scenario 2**: Invalid limit value

```typescript
// Input: ?limit=150 or ?limit=-10
{
  "error": "Invalid query parameters",
  "code": "INVALID_LIMIT",
  "details": {
    "limit": "Must be a positive integer between 1 and 100"
  }
}
```

**Scenario 3**: Invalid offset value

```typescript
// Input: ?offset=-5
{
  "error": "Invalid query parameters",
  "code": "INVALID_OFFSET",
  "details": {
    "offset": "Must be a non-negative integer"
  }
}
```

### Database Errors (500 Internal Server Error)

**Scenario 1**: Database connection failure

```typescript
{
  "error": "Failed to retrieve kanji data",
  "code": "DATABASE_ERROR"
}
```

**Scenario 2**: Unexpected query error

```typescript
{
  "error": "Internal server error",
  "code": "SERVER_ERROR"
}
```

### Error Handling Pattern

```typescript
try {
  // Validation
  const params = validateQueryParams(url.searchParams);

  // Service call
  const result = await kanjiService.getKanji(params);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
} catch (error) {
  if (error instanceof ZodError) {
    // Validation error - 400
    return new Response(
      JSON.stringify({
        error: "Invalid query parameters",
        code: "VALIDATION_ERROR",
        details: formatZodError(error),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Log error
  console.error("Error in GET /api/kanji:", error);

  // Generic server error - 500
  return new Response(
    JSON.stringify({
      error: "Internal server error",
      code: "SERVER_ERROR",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

## 8. Performance Considerations

### Optimization Strategies

**Database Level**:

- Create index on `level` column for efficient filtering
- Use `SELECT *` cautiously; consider selecting only needed columns
- Implement connection pooling (handled by Supabase)
- Consider materialized views for frequently accessed combinations

**Application Level**:

- Implement response caching for common queries (e.g., "GET /api/kanji?level=N5")
- Cache control headers for CDN caching
- Lazy loading of related data if extended in future

**Query Optimization**:

```sql
-- Recommended index
CREATE INDEX idx_kanji_level ON kanji(level);

-- Composite index for sorted pagination
CREATE INDEX idx_kanji_level_id ON kanji(level, id);
```

### Potential Bottlenecks

1. **Large Result Sets**: Mitigated by max limit of 100
2. **JSON Parsing**: `readings` and `meanings` jsonb fields require parsing
3. **Count Queries**: `COUNT(*)` can be slow on large tables
   - Solution: Use approximate counts for large offsets
   - Cache total counts per level

### Monitoring Metrics

- Response time per query
- Database query execution time
- Number of requests per level filter
- Cache hit/miss ratio (if caching implemented)

## 9. Implementation Steps

### Step 1: Create Input Validation

Create Zod schema in `src/lib/validation/kanji.validation.ts` to validate query parameters (`level`, `limit`, `offset`) with appropriate defaults and constraints.

### Step 2: Create Service Layer

Implement `KanjiService` in `src/lib/services/kanji.service.ts` with a `getKanji()` method that queries Supabase, applies filters, handles pagination, and transforms entities to DTOs.

### Step 3: Create API Endpoint

Implement `GET` handler in `src/pages/api/kanji/index.ts` that validates input, calls the service, and returns appropriate success or error responses.

### Step 4: Verify Infrastructure

Ensure middleware initializes Supabase client in `locals.supabase` and type definitions in `src/env.d.ts` are correct.

### Step 5: Create Database Indexes

Add migration for indexes on `level` column and composite `(level, id)` index to optimize queries.
