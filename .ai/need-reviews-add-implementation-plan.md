# API Endpoint Implementation Plan: POST /api/need-reviews

## 1. Endpoint Overview

The `POST /api/need-reviews` endpoint enables authenticated users to add a kanji character to their personal need-review list for later practice.

**Idempotent Operation Design:**
- First request for a kanji: Creates new entry → Returns **201 Created**
- Subsequent requests for same kanji: Returns existing entry → Returns **200 OK**
- Both cases return full kanji details (character, level, readings, meanings)

**Key Features:**
- Requires user authentication via JWT token (development: uses DEFAULT_USER_ID)
- Validates kanji existence before insertion
- Prevents duplicate entries through database constraints and application logic
- Returns enriched response with embedded kanji object

**Use Cases:**
- User marks a kanji as needing review after quiz mistakes
- User manually curates kanji for focused practice
- Frontend can safely retry requests without creating duplicates
- Building personalized study lists

## 2. Request Details

### HTTP Method
`POST`

### URL Structure
`/api/need-reviews`

### Request Headers

**Authorization Header:**
- Required in production: `Authorization: Bearer <jwt_token>`
- Used to extract authenticated user's ID
- Development mode: Bypassed using `DEFAULT_USER_ID` environment variable
- Production mode: Must validate JWT and extract user_id

**Content-Type Header:**
- Required: `application/json`
- Ensures proper JSON parsing

### Request Body

**Required Field:**
- `kanji_id` (integer): ID of the kanji to add to need-review list

**Validation Requirements:**
- Must be present in request body
- Must be a positive integer
- Must not be decimal, negative, or zero
- Must not be string or other non-numeric type

## 3. Used Types

### Existing Types (from `src/types.ts`)

**Request Type:**
- `AddNeedReviewCommandDTO`: Contains single field `kanji_id` as number

**Response Type:**
- `NeedReviewDTO`: Extends `NeedReviewEntity` with embedded `KanjiDTO`
  - Includes: id, user_id, kanji_id, created_at
  - Embedded kanji object with: character, level, readings array, meanings array

**Error Type:**
- `ErrorResponseDTO`: Standard error response structure
  - Contains: error message, optional error code, optional details object

### New Validation Schema

**File:** `src/lib/validation/need-review.validation.ts`

**Purpose:** Validate request body using Zod schema

**Requirements:**
- Schema for `kanji_id` field
  - Must be number type
  - Must be integer
  - Must be positive
  - Custom error messages for each validation rule
- Parser function to validate unknown request body
- Type inference from schema

### New Service Interface

**File:** `src/lib/services/need-review.service.ts`

**Service Class:** `NeedReviewService`

**Main Method:**
- `addNeedReview(userId: string, kanjiId: number)`
- Returns: Object with `needReview` (DTO) and `isNewEntry` (boolean flag)
- The flag indicates whether a new entry was created (true) or existing returned (false)

### New Custom Error Classes

**File:** `src/lib/errors/need-review.errors.ts`

**Error Classes to Create:**

1. **KanjiNotFoundError**
   - Thrown when specified kanji_id doesn't exist in database
   - Should include kanjiId property for error details
   - Extends base Error class

2. **NeedReviewCreationError**
   - Thrown when database insertion fails
   - Used for database-level errors
   - Extends base Error class

## 4. Response Details

### Success Responses

**201 Created - New Entry**
- Returned when kanji is successfully added to need-review list for the first time
- Response body contains complete NeedReviewDTO
- Includes all need_review fields (id, user_id, kanji_id, created_at)
- Includes embedded kanji object with full details
- Kanji readings and meanings are properly typed as string arrays

**200 OK - Already Exists**
- Returned when kanji already exists in user's need-review list
- Response body structure identical to 201 response
- Status code difference signals idempotent behavior to client
- Same need_review record with same created_at timestamp

**Response Content:**
- Need review entry ID (auto-generated)
- User ID (from authentication)
- Kanji ID (from request)
- Embedded kanji object:
  - Character (single kanji)
  - JLPT level (N5 to N1)
  - Readings array (hiragana/katakana)
  - Meanings array (English translations)
  - Kanji created_at timestamp
- Need review created_at timestamp

### Error Responses

**400 Bad Request - Validation Errors**
- **Error Code:** `VALIDATION_ERROR`
- **When:** Request body fails Zod validation
- **Scenarios:**
  - Missing kanji_id field
  - kanji_id is not a number
  - kanji_id is negative or zero
  - kanji_id is decimal (not integer)
- **Response includes:** Detailed validation error messages in details object

**401 Unauthorized**
- **Error Code:** `UNAUTHORIZED`
- **When:** Missing or invalid authentication token
- **Note:** Only in production with JWT authentication
- **Development:** Uses DEFAULT_USER_ID, won't trigger this error

**404 Not Found - Kanji Not Found**
- **Error Code:** `KANJI_NOT_FOUND`
- **When:** Specified kanji_id doesn't exist in kanji table
- **Response includes:** The invalid kanjiId in details object
- **Purpose:** Prevents foreign key constraint violations

**500 Internal Server Error - Database Error**
- **Error Code:** `DATABASE_ERROR`
- **When:** Database operation fails
- **Scenarios:**
  - Insert operation fails
  - Database connection issues
  - Transaction failures
- **Logging:** Error logged to console for debugging

**500 Internal Server Error - Generic**
- **Error Code:** `SERVER_ERROR`
- **When:** Unexpected errors not covered by specific handlers
- **Scenarios:**
  - Programming errors
  - Network timeouts
  - Out of memory
- **Logging:** Full error logged for debugging

### Response Headers
- All responses include `Content-Type: application/json`
- Astro handles additional security headers (CORS, etc.)

## 5. Data Flow

### High-Level Flow Overview

```
Client Request
    ↓
Authentication & User Identification
    ↓
Request Body Validation
    ↓
Service Layer Processing
    ├─→ Verify Kanji Exists
    ├─→ Check Existing Entry (Idempotent)
    ├─→ Insert New Entry (if needed)
    └─→ Fetch Complete Data
    ↓
Data Transformation
    ↓
Response Preparation
    ↓
Client Response
```

### Detailed Processing Steps

#### Phase 1: Request Reception and Authentication

**Authentication Check:**
- Extract user_id from request context
- Development mode: Read DEFAULT_USER_ID from environment variables
- Production mode: Validate JWT token from Authorization header
- Failure: Return 401 Unauthorized

**Request Body Parsing:**
- Parse incoming JSON payload
- Handle malformed JSON errors
- Failure: Return 400 Bad Request

#### Phase 2: Input Validation

**Zod Schema Validation:**
- Validate kanji_id field exists
- Validate kanji_id is number type
- Validate kanji_id is positive integer
- Collect all validation errors
- Failure: Return 400 with detailed validation errors

**Validation Output:**
- Validated and typed kanji_id
- Ready for service layer processing

#### Phase 3: Service Layer Processing

**3a. Kanji Existence Verification**
- Query kanji table by ID
- Purpose: Prevent foreign key constraint violations
- Provides user-friendly 404 instead of database error
- Failure: Throw KanjiNotFoundError → 404 response

**3b. Idempotent Check (Critical for Idempotency)**
- Query need_reviews table for existing entry
- Filter by both user_id AND kanji_id
- If found: Skip insertion, return existing record
  - Set isNewEntry flag to false
  - Response will use 200 OK status
- If not found: Proceed to insertion
  - Set isNewEntry flag to true
  - Response will use 201 Created status

**3c. Database Insertion (New Entries Only)**
- Insert record into need_reviews table
- Fields: user_id, kanji_id
- Auto-generated: id (sequence), created_at (timestamp)
- Database handles:
  - Primary key generation
  - Timestamp setting
  - Constraint enforcement
- Failure: Throw NeedReviewCreationError → 500 response

**3d. Complete Data Retrieval**
- Query need_reviews with JOIN to kanji table
- Retrieve all need_review fields
- Retrieve all kanji fields (character, level, readings, meanings)
- Single query with relationship loading
- Result contains all data needed for response

#### Phase 4: Data Transformation

**Entity to DTO Conversion:**
- Map database entities to DTOs
- Transform Json types to proper TypeScript types:
  - readings: Json → string[]
  - meanings: Json → string[]
- Build nested structure (NeedReviewDTO with embedded KanjiDTO)
- Ensure all fields properly typed for frontend consumption

#### Phase 5: Response Preparation

**Status Code Determination:**
- Check isNewEntry flag from service
- true → 201 Created (new resource created)
- false → 200 OK (existing resource returned)
- This signals idempotent behavior to client

**Response Serialization:**
- Convert DTO to JSON
- Set Content-Type header
- Build Response object with appropriate status

#### Phase 6: Error Handling Flow

**Error Type Routing:**

1. **ZodError** (Validation)
   - Format Zod issues into user-friendly details
   - Build ErrorResponseDTO with VALIDATION_ERROR code
   - Return 400 Bad Request

2. **KanjiNotFoundError** (Business Logic)
   - Extract kanjiId from error
   - Build ErrorResponseDTO with KANJI_NOT_FOUND code
   - Include kanjiId in details
   - Return 404 Not Found

3. **NeedReviewCreationError** (Database)
   - Log error details to console
   - Build ErrorResponseDTO with DATABASE_ERROR code
   - Return 500 Internal Server Error

4. **Generic Error** (Unexpected)
   - Log full error with stack trace
   - Build ErrorResponseDTO with SERVER_ERROR code
   - Return 500 Internal Server Error

### Database Query Sequence

**Best Case (Already Exists):**
1. SELECT kanji existence (index scan)
2. SELECT need_reviews with JOIN (index scan, returns data)
- Total: 2 queries

**Worst Case (New Entry):**
1. SELECT kanji existence (index scan)
2. SELECT existing need_reviews (index scan, returns empty)
3. INSERT need_reviews (indexed write)
4. SELECT need_reviews with JOIN (index scan, returns data)
- Total: 4 queries (can be optimized to 3 with combined insert/select)

### Performance Characteristics

**Query Execution:**
- All queries use indexed columns
- Expected execution time: 1-5ms per query
- Total endpoint latency target: 10-50ms

**Memory Usage:**
- Small payload size (~500 bytes)
- Minimal memory per request (~2KB)
- Stateless operation (no session storage)

**Scalability:**
- Horizontal scaling friendly (stateless)
- Database connection pooling handles concurrency
- No caching needed (small responses, user-specific data)

## 6. Security Considerations

### Authentication Strategy

**Development Mode (Current):**
- Uses DEFAULT_USER_ID environment variable
- No token validation
- Bypasses authentication for rapid development
- NOT suitable for production

**Production Mode (Future):**
- Extract Bearer token from Authorization header
- Validate token format (Bearer prefix)
- Call Supabase auth service to verify token
- Extract user object from validated token
- Use authenticated user's ID for all operations
- Return 401 if token missing, malformed, or invalid

### Authorization Model

**Database-Level Security (RLS Policies):**
- Row-Level Security enabled on need_reviews table
- Policy: Users can only SELECT their own need_reviews
  - Filter: WHERE user_id = auth.uid()
- Policy: Users can only INSERT/UPDATE/DELETE their own need_reviews
  - Check: user_id must match authenticated user
- Provides defense-in-depth even if application logic fails

**Application-Level Security:**
- user_id always comes from authenticated session, never from request body
- No user-supplied user_id parameter accepted
- Request body contains only kanji_id
- Prevents users from manipulating other users' data

**Authorization Flow:**
1. Extract user_id from JWT/session
2. Use that user_id for all database operations
3. Database RLS policies enforce user can only access own data
4. Double protection: application + database layers

### Input Validation Strategy

**Validation Layers:**

**Layer 1: JSON Parsing**
- Catch malformed JSON errors
- Return 400 for unparseable requests
- Prevent server crashes from bad input

**Layer 2: Zod Schema Validation**
- Validate kanji_id field presence
- Validate type (must be number, not string)
- Validate integer constraint (no decimals)
- Validate positive constraint (no negative/zero)
- Collect all validation errors
- Return detailed, user-friendly error messages

**Layer 3: Business Logic Validation**
- Verify kanji exists in database
- Prevent foreign key constraint violations
- Provide better error messages than database constraints

**Validation Benefits:**
- Early rejection of invalid requests
- User-friendly error messages
- Protection against malformed data
- Type safety throughout application

### SQL Injection Prevention

**Supabase Client Protection:**
- All queries use parameterized approach
- No string concatenation with user input
- Supabase SDK handles escaping automatically
- Safe by design

**Query Building Pattern:**
- Use method chaining (.eq(), .select(), etc.)
- Parameters passed as separate arguments
- Never construct raw SQL with user input
- Framework-level protection

### Data Integrity Protection

**Foreign Key Constraints:**
- kanji_id must reference valid entry in kanji table
- user_id must reference valid entry in auth.users table
- ON DELETE CASCADE for user_id (cleanup when user deleted)
- Database enforces referential integrity

**Application-Level Checks:**
- Verify kanji exists before insert attempt
- Provides user-friendly 404 error message
- Better UX than database constraint error
- Fail fast approach

**Unique Constraint:**
- Composite unique index on (user_id, kanji_id)
- Prevents duplicate entries at database level
- Application checks first (idempotent pattern)
- Database constraint as backup protection

**Multi-Layer Protection:**
1. Application validation (user-friendly errors)
2. Database constraints (last line of defense)
3. Both layers work together

### Rate Limiting Considerations

**Current State:**
- No rate limiting implemented
- Acceptable for development
- Idempotent design reduces duplicate entry risk

### Additional Security Measures

**Request Size Limiting:**
- Limit request body size (prevent DoS)
- Small payload expected (~50 bytes)
- Set maximum at framework/server level

**Error Message Safety:**
- Don't expose internal details in errors
- No stack traces in production responses
- Log detailed errors server-side only
- Generic messages for unexpected errors

## 7. Error Handling

### Error Handling Architecture

**Layered Error Strategy:**
- Each layer catches and transforms errors appropriately
- Route handler has single try-catch wrapping all operations
- Specific error types map to specific HTTP status codes
- All errors return consistent ErrorResponseDTO structure
- Detailed errors logged server-side, sanitized errors sent to client

### Error Type Mapping

#### 1. Validation Errors (ZodError)

**Trigger Conditions:**
- Missing kanji_id field in request body
- kanji_id is not a number type
- kanji_id is negative or zero
- kanji_id is decimal (not integer)
- Malformed JSON in request body

**HTTP Status Code:** `400 Bad Request`

**Error Code:** `VALIDATION_ERROR`

**Response Structure:**
- Error message: Generic "Invalid request body"
- Code: VALIDATION_ERROR
- Details object: Field-level error messages from Zod

**Error Message Examples:**
- "kanji_id is required"
- "kanji_id must be a number"
- "kanji_id must be an integer"
- "kanji_id must be a positive number"

**Handler Requirements:**
- Catch ZodError instances
- Format Zod issues into user-friendly details
- Map field paths to error messages
- Return 400 with formatted error details

**Logging:** Not logged (user input error, not system error)

#### 2. Kanji Not Found Error

**Trigger Conditions:**
- Specified kanji_id does not exist in kanji table
- Prevents foreign key constraint violation
- Business logic error

**HTTP Status Code:** `404 Not Found`

**Error Code:** `KANJI_NOT_FOUND`

**Custom Error Class Requirements:**
- Extends base Error
- Stores kanjiId as property
- Provides default error message
- Named "KanjiNotFoundError"

**Response Structure:**
- Error message: Includes specific kanji ID
- Code: KANJI_NOT_FOUND
- Details object: Contains invalid kanjiId

**Handler Requirements:**
- Catch KanjiNotFoundError instances
- Extract kanjiId from error
- Return 404 with kanji ID in details
- Use error's message property

**Logging:** Not logged (expected business logic scenario)

#### 3. Need Review Creation Error

**Trigger Conditions:**
- Database insert operation fails
- Database connection lost
- Query timeout
- Unexpected constraint violation
- Transaction rollback

**HTTP Status Code:** `500 Internal Server Error`

**Error Code:** `DATABASE_ERROR`

**Custom Error Class Requirements:**
- Extends base Error
- Provides default error message
- Named "NeedReviewCreationError"
- No additional properties needed

**Response Structure:**
- Error message: User-friendly generic message
- Code: DATABASE_ERROR
- No details object (avoid exposing internal info)

**Handler Requirements:**
- Catch NeedReviewCreationError instances
- Return generic user-facing message
- Log detailed error server-side
- Return 500 status


#### 4. Missing User ID Error

**Trigger Conditions:**
- No user_id available from authentication
- DEFAULT_USER_ID not set (development)
- JWT token validation fails (production)
- Invalid or expired token (production)

**HTTP Status Code:**
- Development: `500 Internal Server Error`
- Production: `401 Unauthorized`

**Error Code:**
- Development: `MISSING_USER_ID`
- Production: `UNAUTHORIZED`

**Response Structure (Development):**
- Error message: "User ID not available"
- Code: MISSING_USER_ID
- Indicates configuration issue

**Response Structure (Production):**
- Error message: "Unauthorized"
- Code: UNAUTHORIZED
- Indicates authentication failure

**Handler Requirements:**
- Check userId before service call
- Early return if missing
- Different handling for dev vs production
- Clear error messages for each mode

**Logging:** Log in development (config issue), don't log in production (expected auth failure)

#### 5. Generic Server Errors

**Trigger Conditions:**
- Unexpected exceptions not covered by specific handlers
- Programming errors (null reference, undefined)
- Network timeouts
- Memory issues
- Framework errors

**HTTP Status Code:** `500 Internal Server Error`

**Error Code:** `SERVER_ERROR`

**Response Structure:**
- Error message: Generic "Internal server error"
- Code: SERVER_ERROR
- No details object (security - don't expose internals)

**Handler Requirements:**
- Catch-all for any unhandled errors
- Last error handler in chain
- Generic user-facing message
- Comprehensive server-side logging

**Logging:**
- Log full error with stack trace
- Include endpoint identifier
- Console.error for debugging
- Consider error tracking service (Sentry, etc.)

### Error Response Format

**Consistent Structure:**
- All errors use ErrorResponseDTO interface
- Always includes: error (string message)
- Optionally includes: code (machine-readable identifier)
- Optionally includes: details (additional context object)

**Error Code Convention:**
- SCREAMING_SNAKE_CASE format
- Descriptive and specific
- Machine-parseable by clients
- Frontend can switch on error codes


#### Index Requirements

**Required Indexes:**

**Primary Keys (Auto-indexed):**
- need_reviews.id (primary key)
- kanji.id (primary key)

**Composite Unique Index:**
- need_reviews (user_id, kanji_id)
- Purpose: Fast idempotent checks, prevent duplicates
- Type: B-tree
- Query optimization: WHERE user_id AND kanji_id lookups

**User-Specific Index:**
- need_reviews (user_id)
- Purpose: Fast user-scoped queries
- Used for: Listing user's need-reviews

**Ordering Index:**
- need_reviews (user_id, created_at DESC)
- Purpose: Fast sorted queries
- Used for: GET endpoint pagination

## 9. Implementation Steps

### Overview

Implementation follows a bottom-up approach:
1. Create foundation (errors, validation)
2. Build service layer (business logic)
3. Implement route handler (API interface)
4. Test and verify
5. Deploy and monitor

### Step 1: Create Custom Error Classes

**File:** `src/lib/errors/need-review.errors.ts`

**Purpose:** Define custom error types for specific failure scenarios

**Tasks:**
- Create `KanjiNotFoundError` class
  - Extends base Error
  - Stores kanjiId property
  - Provides default error message
  - Sets error name

- Create `NeedReviewCreationError` class
  - Extends base Error
  - Provides default error message for database failures
  - Sets error name

**Success Criteria:**
- TypeScript compiles without errors
- Error classes properly typed
- Error names set correctly
- Follows existing error patterns in codebase

### Step 2: Create Validation Schema

**File:** `src/lib/validation/need-review.validation.ts`

**Purpose:** Define Zod schema for request body validation

**Tasks:**
- Import Zod and necessary types
- Create `AddNeedReviewSchema`
  - Define kanji_id field validation
  - Number type required
  - Must be integer
  - Must be positive
  - Custom error messages for each rule

- Export type inference from schema
- Create `parseAddNeedReviewBody` function
  - Takes unknown body parameter
  - Returns validated DTO
  - Throws ZodError on validation failure

**Success Criteria:**
- Schema rejects invalid inputs correctly
- Error messages are clear and specific
- Type inference aligns with AddNeedReviewCommandDTO
- Follows validation patterns from existing validation files

**Testing:**
- Test with valid input (positive integer)
- Test with missing field
- Test with wrong type (string, null, undefined)
- Test with out-of-range values (negative, zero, decimal)
- Verify error messages are user-friendly

### Step 3: Create NeedReviewService

**File:** `src/lib/services/need-review.service.ts`

**Purpose:** Encapsulate business logic and database operations

**Tasks:**

**Service Class Structure:**
- Import necessary types and errors
- Define `AddNeedReviewResult` interface (needReview + isNewEntry flag)
- Create NeedReviewService class with SupabaseClient dependency

**Main Method: addNeedReview**
- Accept userId and kanjiId parameters
- Return AddNeedReviewResult
- Orchestrate the full operation flow

**Helper Method: verifyKanjiExists**
- Query kanji table by ID
- Throw KanjiNotFoundError if not found
- Provides user-friendly 404 instead of FK constraint error

**Helper Method: fetchExistingNeedReview**
- Query need_reviews with kanji JOIN
- Filter by user_id AND kanji_id
- Return NeedReviewDTO if found, null otherwise
- Implements idempotent check

**Helper Method: insertNeedReview**
- Insert into need_reviews table
- Fetch complete record with kanji JOIN
- Return NeedReviewDTO
- Throw NeedReviewCreationError on failure
- Log database errors

**Helper Method: transformToNeedReviewDTO**
- Convert database entities to DTO
- Transform Json types to string arrays (readings, meanings)
- Build nested structure with embedded kanji
- Handle type conversions

**Helper Method: jsonToStringArray**
- Safely convert Json to string[]
- Filter out non-string items
- Return empty array if invalid
- Reuse pattern from KanjiService

**Success Criteria:**
- All methods properly typed
- Follows existing service patterns (KanjiService, QuizService)
- Comprehensive error handling
- Database operations use Supabase client correctly
- Idempotent behavior implemented
- No TypeScript errors

### Step 4: Create API Route Handler

**File:** `src/pages/api/need-reviews/index.ts`

**Purpose:** Expose the endpoint and handle HTTP request/response cycle

**Tasks:**

**Imports and Setup:**
- Import Astro APIRoute type
- Import validation, service, and error classes
- Import types and utilities

**JSDoc Comment:**
- Document endpoint purpose
- List request/response formats
- Note error codes
- Include TODO for authentication

**POST Handler Implementation:**

**Request Processing:**
- Parse JSON body from request
- Call validation function
- Handle JSON parsing errors

**Authentication:**
- Extract user_id (currently from defaultUserId)
- Add TODO comment for JWT authentication
- Return 401/500 if no user_id

**Service Call:**
- Initialize NeedReviewService with locals.supabase
- Call addNeedReview with userId and kanjiId
- Capture result with isNewEntry flag

**Success Response:**
- Determine status code from isNewEntry flag (201 vs 200)
- Serialize needReview DTO to JSON
- Set Content-Type header
- Return Response object

**Error Handling (Try-Catch):**
- Catch ZodError → 400 VALIDATION_ERROR with formatted details
- Catch KanjiNotFoundError → 404 KANJI_NOT_FOUND with kanjiId
- Catch NeedReviewCreationError → 500 DATABASE_ERROR
- Catch generic Error → 500 SERVER_ERROR with logging

**formatZodError Helper:**
- Extract field paths from Zod issues
- Map to user-friendly error messages
- Return details object

**Export Configuration:**
- Set `prerender = false` (required for API routes)

**Success Criteria:**
- Follows pattern from existing routes (quizzes/index.ts)
- All error scenarios handled
- Proper status codes
- Comprehensive JSDoc
- TypeScript compiles cleanly

### Step 5: Run Linter and Fix Issues

**Purpose:** Ensure code quality and consistency

**Tasks:**
- Run project linter (eslint)
- Review linting errors and warnings
- Fix auto-fixable issues
- Manually fix remaining issues

**Common Issues:**
- Unused imports
- console.log instead of console.error
- Formatting issues (handled by prettier)
- TypeScript strict mode violations
- Missing JSDoc comments

**Verification:**
- Zero linting errors
- Zero linting warnings
- Code passes all eslint rules
- Formatting is consistent
- Follows project conventions

---

## Summary

This implementation plan provides a comprehensive guide for implementing the `POST /api/need-reviews` endpoint following best practices and existing codebase patterns.

### Key Design Decisions

**Idempotent Operation:**
- Returns 201 Created for new entries
- Returns 200 OK for existing entries
- Prevents duplicate entries through database constraints and application logic

**Error Handling:**
- Specific error classes for different scenarios
- User-friendly error messages
- Comprehensive error logging
- Consistent error response format

**Security:**
- Input validation with Zod schemas
- RLS policies for authorization
- user_id from authentication only
- SQL injection prevention via parameterized queries
