# API Endpoint Implementation Plan: POST /api/quizzes

## 1. Endpoint Overview

This endpoint creates a new quiz session for an authenticated user. It generates quiz questions by randomly selecting kanji characters based on either a specific JLPT level or the user's need-review list. Each selected kanji generates two questions: one for reading and one for meaning. The questions for each kanji are placed adjacently in the sequence but their order is randomized.

**Key Features:**
- Supports two quiz modes: level-based and need-review
- Prevents duplicate kanji within a single quiz
- Generates exactly 2 questions per kanji (reading + meaning)
- Returns the complete quiz with all questions and embedded kanji data
- Validates that sufficient kanji are available before quiz creation

## 2. Request Details

### HTTP Method
`POST`

### URL Structure
`/api/quizzes`

### Authentication
- **Required**: JWT token in Authorization header
- **Format**: `Authorization: Bearer <jwt_token>`
- **Validation**: Handled by Astro middleware (context.locals.supabase contains authenticated client)

### Request Body

**For level-based quiz:**
```json
{
  "type": "level",
  "level": "N5",
  "question_count": 10
}
```

**For need-review quiz:**
```json
{
  "type": "need_review",
  "question_count": 10
}
```

### Parameters

**Required:**
- `type` (string): Must be either `"level"` or `"need_review"`
- `question_count` (number): Number of kanji to include (valid values: 1, 10, 20, 50; 1 for development)

**Conditionally Required:**
- `level` (string): Required when `type="level"`. Must be one of: "N5", "N4", "N3", "N2", "N1". Must be omitted when `type="need_review"`.

### Validation Rules

1. `type` must be exactly `"level"` or `"need_review"`
2. When `type="level"`:
   - `level` must be provided and be a valid JLPT level
   - `question_count` must not exceed available kanji for the specified level
3. When `type="need_review"`:
   - `level` must not be provided
   - `question_count` must not exceed the user's need-review list size
4. `question_count` must be a positive integer and one of [1, 10, 20, 50] (1 for development)
5. Database must contain enough kanji to fulfill the request

## 3. Used Types

### Request Type
```typescript
// From src/types.ts - Already defined
type CreateQuizCommandDTO =
  | {
      type: "level";
      level: JLPTLevel;
      question_count: number;
    }
  | {
      type: "need_review";
      level?: never;
      question_count: number;
    };
```

### Response Type
```typescript
// From src/types.ts - Already defined
interface QuizWithQuestionsDTO extends QuizDTO {
  questions: QuizQuestionDTO[];
}

interface QuizQuestionDTO extends QuizQuestionEntity {
  kanji: KanjiDTO;
}

type KanjiDTO = Omit<KanjiEntity, "readings" | "meanings"> & {
  readings: string[];
  meanings: string[];
};
```

### Error Type
```typescript
// From src/types.ts - Already defined
interface ErrorResponseDTO {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}
```

### Zod Validation Schema
```typescript
// To be created in src/lib/validation/quiz.validation.ts
import { z } from "zod";

const jlptLevels = ["N5", "N4", "N3", "N2", "N1"] as const;
const questionCounts = [1, 10, 20, 50] as const; // 1 for development

const createQuizSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("level"),
    level: z.enum(jlptLevels),
    question_count: z.enum(questionCounts),
  }),
  z.object({
    type: z.literal("need_review"),
    question_count: z.enum(questionCounts),
  }),
]);
```

### Service Interface
```typescript
// To be created in src/lib/services/quiz.service.ts
interface CreateQuizParams {
  userId: string;
  type: QuizType;
  level?: JLPTLevel;
  questionCount: number;
}

interface QuestionPair {
  kanji_id: number;
  questions: Array<{
    question_type: QuestionType;
    sequence: number;
  }>;
}
```

## 4. Response Details

### Success Response (201 Created)

**Status Code**: `201 Created`

**Response Body**:
```json
{
  "id": 123,
  "user_id": "uuid-here",
  "type": "level",
  "level": "N5",
  "question_count": 10,
  "status": "in_progress",
  "score_percent": null,
  "created_at": "2026-01-18T10:00:00Z",
  "completed_at": null,
  "questions": [
    {
      "id": 1001,
      "quiz_id": 123,
      "kanji_id": 42,
      "sequence": 1,
      "question_type": "meaning",
      "kanji": {
        "id": 42,
        "character": "行",
        "level": "N5",
        "readings": ["こう", "ぎょう", "い.く", "ゆ.く"],
        "meanings": ["go", "conduct", "line"]
      },
      "user_answer": null,
      "answered_at": null,
      "is_correct": null,
      "created_at": "2026-01-18T10:00:00Z"
    },
    {
      "id": 1002,
      "quiz_id": 123,
      "kanji_id": 42,
      "sequence": 2,
      "question_type": "reading",
      "kanji": {
        "id": 42,
        "character": "行",
        "level": "N5",
        "readings": ["こう", "ぎょう", "い.く", "ゆ.く"],
        "meanings": ["go", "conduct", "line"]
      },
      "user_answer": null,
      "answered_at": null,
      "is_correct": null,
      "created_at": "2026-01-18T10:00:00Z"
    }
  ]
}
```

### Error Responses

#### 400 Bad Request
**Scenarios**:
- Invalid or missing `type`
- Invalid `level` value
- `level` provided when `type="need_review"`
- `level` missing when `type="level"`
   - **Invalid `question_count` (not 1, 10, 20, or 50)**
- `question_count` exceeds available kanji
- Malformed JSON

**Example**:
```json
{
  "error": "Insufficient kanji available. Requested: 50, Available: 30",
  "code": "INSUFFICIENT_KANJI"
}
```

#### 401 Unauthorized
**Scenarios**:
- Missing Authorization header
- Invalid JWT token
- Expired JWT token

**Example**:
```json
{
  "error": "Authentication required"
}
```

#### 500 Internal Server Error
**Scenarios**:
- Database connection failure
- Unexpected server error
- Transaction rollback failure

**Example**:
```json
{
  "error": "Failed to create quiz. Please try again later."
}
```

## 5. Data Flow

### High-Level Flow

```
1. Request arrives at POST /api/quizzes
   ↓
2. Middleware validates JWT token (user_id extracted)
   ↓
3. Request body parsed and validated with Zod schema
   ↓
4. QuizService.createQuiz() called
   ↓
5. Count available kanji (based on type/level)
   ↓
6. Validate question_count ≤ available kanji
   ↓
7. Randomly select kanji IDs (without duplicates)
   ↓
8. Begin database transaction:
   a. Insert quiz record
   b. Generate question pairs for each kanji
   c. Randomize question order per kanji
   d. Bulk insert quiz_questions
   e. Commit transaction
   ↓
9. Fetch complete quiz with questions + kanji data
   ↓
10. Transform to QuizWithQuestionsDTO
   ↓
11. Return 201 Created
```

### Detailed Service Logic

#### Step 1: Count Available Kanji
Query the database to count available kanji based on quiz type:
- For level-based quizzes: Count kanji matching the specified JLPT level
- For need-review quizzes: Count kanji in the user's need-review list
- Use count-only query for efficiency (no data fetch needed)

#### Step 2: Validate Count
Compare available kanji count against requested question count:
- If insufficient kanji available, throw InsufficientKanjiError
- Error should include both requested and available counts for user feedback

#### Step 3: Select Random Kanji
Retrieve random kanji IDs without duplicates:
- Use database-level randomization for efficiency (ORDER BY RANDOM())
- Limit results to exactly question_count kanji
- Apply appropriate filter (level or user's need-review list)

#### Step 4: Create Quiz in Transaction
Create quiz and questions atomically:
- Insert quiz record with user_id, type, level, question_count, and in_progress status
- Generate question pairs for each selected kanji (reading + meaning)
- Randomize the order of questions within each pair
- Bulk insert all quiz_questions in single operation
- Ensure transaction consistency (all-or-nothing)

#### Step 5: Fetch Complete Quiz
Retrieve the newly created quiz with all related data:
- Fetch quiz record with nested questions
- Include kanji details for each question
- Use Supabase's nested select for efficient JOIN operations
- Transform database entities to DTOs with properly typed arrays

### Question Generation Algorithm

For each kanji (sequence represents pair position):
1. Create reading question with sequence = (pair_index * 2) + 1
2. Create meaning question with sequence = (pair_index * 2) + 2
3. Randomly swap the two questions (50% chance)

**Example for 3 kanji:**
```
Kanji A (id: 10): 
  - Reading → sequence 1 or 2 (randomized)
  - Meaning → sequence 2 or 1 (randomized)
  
Kanji B (id: 25):
  - Reading → sequence 3 or 4 (randomized)
  - Meaning → sequence 4 or 3 (randomized)
  
Kanji C (id: 8):
  - Reading → sequence 5 or 6 (randomized)
  - Meaning → sequence 6 or 5 (randomized)
```

## 6. Security Considerations

### Authentication
- **JWT Validation**: Middleware must verify the token before the handler is called
- **User ID Extraction**: Extract `user_id` from the authenticated Supabase client, not from request body
- **Token Expiration**: Reject expired tokens with 401 Unauthorized

### Authorization
- **User Isolation**: Ensure quiz is created for the authenticated user only
- **No Cross-User Access**: User cannot create quizzes for other users

### Input Validation
- **Strict Schema Validation**: Use Zod discriminated unions to enforce conditional validation
- **Whitelist Values**: Only accept predefined values for `type`, `level`, and `question_count`
- **Type Safety**: Leverage TypeScript for compile-time type checking

### Resource Protection
- **Question Count Limits**: Restrict to predefined values [1, 10, 20, 50] to prevent resource exhaustion (1 for development)
- **Database Query Optimization**: Use indexes on `kanji.level` and `need_reviews.user_id`

### Data Integrity
- **Transaction Safety**: Wrap quiz + questions creation in a transaction to prevent partial data
- **Unique Constraints**: Database ensures no duplicate (quiz_id, kanji_id, question_type) combinations
- **Foreign Key Constraints**: Database enforces referential integrity

### Error Handling
- **No Internal Details**: Never expose database error messages or stack traces
- **Generic Error Messages**: Return user-friendly messages for 500 errors
- **Structured Logging**: Log detailed errors server-side for debugging

## 7. Error Handling

### Error Categories and Responses

#### Validation Errors (400 Bad Request)

**Scenario**: Invalid request body
```typescript
// Zod validation failure
{
  "error": "Invalid request body",
  "code": "VALIDATION_ERROR",
  "details": {
    "issues": [
      {
        "path": ["level"],
        "message": "Expected 'N5' | 'N4' | 'N3' | 'N2' | 'N1', received 'N6'"
      }
    ]
  }
}
```

**Scenario**: Insufficient kanji
```typescript
{
  "error": "Insufficient kanji available for the requested quiz. Requested: 50, Available: 30",
  "code": "INSUFFICIENT_KANJI"
}
```

**Scenario**: Missing level for level-based quiz
```typescript
{
  "error": "Level is required when type is 'level'",
  "code": "MISSING_LEVEL"
}
```

**Scenario**: Level provided for need-review quiz
```typescript
{
  "error": "Level must not be provided when type is 'need_review'",
  "code": "INVALID_LEVEL_FOR_TYPE"
}
```

#### Authentication Errors (401 Unauthorized)

**Scenario**: Missing token
```typescript
{
  "error": "Authentication required"
}
```

**Scenario**: Invalid or expired token
```typescript
{
  "error": "Invalid or expired authentication token"
}
```

#### Database Errors (500 Internal Server Error)

**Scenario**: Database connection failure
```typescript
// Internal logging: Full error details
console.error("Database error in QuizService.createQuiz:", error);

// Client response: Generic message
{
  "error": "Failed to create quiz. Please try again later."
}
```

**Scenario**: Transaction failure
```typescript
// Internal logging: Transaction rollback details
console.error("Transaction failed in QuizService.createQuiz:", error);

// Client response: Generic message
{
  "error": "Failed to create quiz. Please try again later."
}
```

### Error Handling Strategy

1. **Try-Catch Blocks**: Wrap all service calls and database operations
2. **Custom Error Classes**: Create specific error types for better handling
3. **Error Transformation**: Convert internal errors to user-friendly ErrorResponseDTO
4. **Logging**: Log all errors with context (user_id, request_id, timestamp)
5. **Graceful Degradation**: Return meaningful errors rather than crashing

### Custom Error Classes

```typescript
// To be created in src/lib/errors/quiz.errors.ts
export class InsufficientKanjiError extends Error {
  constructor(
    public requested: number,
    public available: number
  ) {
    super(`Insufficient kanji available. Requested: ${requested}, Available: ${available}`);
    this.name = "InsufficientKanjiError";
  }
}

export class InvalidQuizTypeError extends Error {
  constructor(public type: string) {
    super(`Invalid quiz type: ${type}`);
    this.name = "InvalidQuizTypeError";
  }
}
```

## 8. Performance Considerations

### Database Optimization

#### Indexes (Already in Migration)
- `kanji.level` - For fast level-based filtering
- `need_reviews.user_id` - For fast user need-review lookup
- `quiz_questions.quiz_id` - For fast question retrieval
- `quiz_questions.kanji_id` - For foreign key lookup

#### Query Optimization
1. **Count Query**: Use `{ count: "exact", head: true }` to avoid fetching full data
2. **Bulk Insert**: Insert all questions in a single batch operation
3. **Single Fetch**: Retrieve complete quiz with questions in one query using Supabase's nested select
4. **Pagination Awareness**: If fetching many kanji, consider pagination or limits

### Potential Bottlenecks

1. **Random Selection**: Shuffling large arrays can be slow
   - **Solution**: Use SQL `ORDER BY RANDOM() LIMIT N` for database-level randomization
   
2. **Large Question Sets**: Inserting 100 questions (50 kanji × 2) in one request
   - **Solution**: Use batch insert, not individual inserts
   - **Acceptable**: 100 inserts is well within PostgreSQL's capabilities

3. **Nested Select**: Fetching quiz with all questions and kanji
   - **Solution**: Supabase optimizes this into efficient JOIN queries
   - **Monitor**: If slow, consider separate queries and manual joining

### Optimization Strategies

#### Use Database-Level Random Selection
```typescript
// Instead of fetching all and shuffling in memory
const { data: kanji } = await supabase
  .from("kanji")
  .select("id")
  .eq("level", level)
  .order("random()")  // PostgreSQL random ordering
  .limit(questionCount);
```

#### Batch Question Insert
```typescript
// Single insert with array of objects
await supabase
  .from("quiz_questions")
  .insert(questions);  // Array of 20-100 question objects
```

#### Optimize Question Generation
```typescript
// Generate questions efficiently without creating intermediate arrays
function generateQuestions(kanjiIds: number[], quizId: number) {
  const questions = [];
  kanjiIds.forEach((kanjiId, index) => {
    const baseSequence = index * 2 + 1;
    const shouldSwap = Math.random() < 0.5;
    
    questions.push(
      {
        quiz_id: quizId,
        kanji_id: kanjiId,
        sequence: shouldSwap ? baseSequence + 1 : baseSequence,
        question_type: "reading"
      },
      {
        quiz_id: quizId,
        kanji_id: kanjiId,
        sequence: shouldSwap ? baseSequence : baseSequence + 1,
        question_type: "meaning"
      }
    );
  });
  return questions;
}
```

## 9. Implementation Steps

### Step 1: Create Validation Schema
**File**: `src/lib/validation/quiz.validation.ts`

1. Import Zod
2. Define `jlptLevels` constant array
3. Define `questionCounts` constant array
4. Create discriminated union schema for `CreateQuizCommandDTO`
5. Export `createQuizSchema` and validation function
6. Add error transformation helper

**Estimated complexity**: Low
**Dependencies**: Zod library

---

### Step 2: Create Custom Error Classes
**File**: `src/lib/errors/quiz.errors.ts`

1. Create `InsufficientKanjiError` class extending Error
2. Create `InvalidQuizTypeError` class extending Error
3. Create `QuizCreationError` class for generic database failures
4. Export all error classes

**Estimated complexity**: Low
**Dependencies**: None

---

### Step 3: Implement QuizService
**File**: `src/lib/services/quiz.service.ts`

1. **Setup**:
   - Import necessary types from `src/types.ts`
   - Import SupabaseClient type from `src/db/supabase.client.ts`
   - Import custom error classes
   - Define service class structure

2. **Implement `createQuiz()` method**:
   - Accept CreateQuizParams (userId, type, level, questionCount)
   - Validate available kanji count based on type
   - Throw InsufficientKanjiError if count insufficient
   - Select random kanji using database random ordering
   - Create quiz record
   - Generate question pairs with randomized sequence
   - Bulk insert quiz_questions
   - Fetch complete quiz with nested questions and kanji
   - Transform and return QuizWithQuestionsDTO

3. **Implement helper methods**:
   - `countAvailableKanji()`: Count kanji for level or need-review
   - `selectRandomKanji()`: Fetch random kanji IDs
   - `generateQuestions()`: Create question pairs with randomized order
   - `fetchCompleteQuiz()`: Retrieve quiz with all related data
   - `transformToQuizWithQuestions()`: Convert entities to DTOs

4. **Add error handling**:
   - Try-catch around all database operations
   - Log errors with console.error
   - Throw meaningful errors
   - Never expose internal database details

**Estimated complexity**: High
**Dependencies**: SupabaseClient, types, error classes

---

### Step 4: Create API Route Handler
**File**: `src/pages/api/quizzes/index.ts`

1. **Setup**:
   - Import Astro types (APIRoute)
   - Import validation schema
   - Import QuizService
   - Import error classes
   - Import ErrorResponseDTO type

2. **Implement POST handler**:
   - Extract supabase client from `context.locals.supabase`
   - Verify user is authenticated (check user_id)
   - Parse request body JSON
   - Validate body with Zod schema
   - Extract user_id from authenticated session
   - Instantiate QuizService with supabase client
   - Call service.createQuiz() with validated params
   - Return 201 Created with QuizWithQuestionsDTO

3. **Implement error handling**:
   - Catch Zod validation errors → 400 with details
   - Catch InsufficientKanjiError → 400 with specific message
   - Catch authentication errors → 401
   - Catch all other errors → 500 with generic message
   - Transform all errors to ErrorResponseDTO

4. **Add response headers**:
   - Set Content-Type: application/json
   - Consider CORS headers if needed

**Estimated complexity**: Medium
**Dependencies**: QuizService, validation schema, error classes

---

### Step 5: Add Type Guards and Utilities
**File**: `src/types.ts` (update existing)

1. Verify existing type guards are sufficient:
   - `isJLPTLevel()`
   - `isQuizType()`
   - `isQuestionType()`

2. If needed, add additional helpers:
   - `isValidQuestionCount()`: Check if value is 10, 20, or 50

**Estimated complexity**: Low
**Dependencies**: None

---

### Step 6: Update Database Types (if needed)
**File**: `src/db/database.types.ts`

1. Verify types match database schema
2. Ensure enums are properly typed
3. Regenerate types if database schema changed:
   ```bash
   npx supabase gen types typescript --project-id <project-id> > src/db/database.types.ts
   ```

**Estimated complexity**: Low
**Dependencies**: Supabase CLI

---

### Step 7: Code Review and Refactoring

1. Review code against coding guidelines from `.cursor/rules/shared.mdc`
2. Ensure early returns for error conditions
3. Verify proper error handling and logging
4. Check TypeScript strict mode compliance
5. Run linter and fix any issues
6. Optimize imports and remove unused code

**Estimated complexity**: Medium
**Dependencies**: ESLint, TypeScript compiler

---

## Notes

- The implementation follows the existing pattern from `KanjiService`
- Question randomization ensures variety while keeping pairs adjacent
- Database indexes are critical for performance (already in migrations)
- Error messages should be user-friendly without exposing internals
- Transaction support may be needed for atomicity (evaluate Supabase RPC if needed)
