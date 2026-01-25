# REST API Plan – Kanji Quiz

## 1. Resources

The API exposes the following main resources, mapped to database entities:

| Resource        | Database Table   | Description                                               |
| --------------- | ---------------- | --------------------------------------------------------- |
| `/kanji`        | `kanji`          | JLPT kanji with readings, meanings, and levels            |
| `/quizzes`      | `quiz`           | User quiz attempts (in-progress, completed and abandoned) |
| `/questions`    | `quiz_questions` | Individual questions within a quiz                        |
| `/need-reviews` | `need_reviews`   | User's marked kanji for focused review                    |
| `/auth`         | `auth.users`     | Authentication endpoints (via Supabase Auth SDK)          |

---

## 2. Endpoints

### 2.1. Kanji Resource

#### `GET /api/kanji`

**Description**: Retrieve a list of kanji, optionally filtered by JLPT level.

**Query Parameters**:

- `level` (optional): Filter by JLPT level (`N5`, `N4`, `N3`, `N2`, `N1`)
- `limit` (optional, default: 50, max: 100): Number of results per page
- `offset` (optional, default: 0): Pagination offset

**Request Headers**:

- `Authorization`: `Bearer <jwt_token>` (optional for public kanji data)

**Response** (200 OK):

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

**Error Responses**:

- `400 Bad Request`: Invalid level parameter
- `500 Internal Server Error`: Server error

---

#### `GET /api/kanji/:id`

**Description**: Retrieve a single kanji by ID.

**Path Parameters**:

- `id`: Kanji ID (integer)

**Response** (200 OK):

```json
{
  "id": 1,
  "character": "行",
  "level": "N5",
  "readings": ["こう", "ぎょう", "い.く", "ゆ.く"],
  "meanings": ["go", "conduct", "line"],
  "created_at": "2026-01-18T10:00:00Z"
}
```

**Error Responses**:

- `404 Not Found`: Kanji not found
- `500 Internal Server Error`: Server error

---

### 2.2. Quiz Resource

#### `POST /api/quizzes`

**Description**: Create a new quiz. Generates quiz questions based on type (level-based or need-review), randomly selecting kanji without duplicates. Each kanji generates two questions: one for reading and one for meaning. The questions for each kanji are adjacent but their order is randomized.

**Request Headers**:

- `Authorization`: `Bearer <jwt_token>` (required)

**Request Body**:

```json
{
  "type": "level",
  "level": "N5",
  "question_count": 10
}
```

_or for need-review mode:_

```json
{
  "type": "need_review",
  "question_count": 10
}
```

**Request Body Fields**:

- `type` (required): `"level"` or `"need_review"`
- `level` (required if type=`"level"`): `"N5"`, `"N4"`, `"N3"`, `"N2"`, or `"N1"`
- `question_count` (required): Number of kanji to include in the quiz (10, 20, or 50). Each kanji generates 2 questions (reading + meaning), so total questions will be `question_count * 2`

**Response** (201 Created):

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

**Error Responses**:

- `400 Bad Request`:
  - Invalid type, level, or question_count
  - `question_count` exceeds available kanji for level/need-review list
  - Missing required fields
  - Level provided for need_review type, or vice versa
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server error

**Validation Rules**:

- `type` must be `"level"` or `"need_review"`
- `level` must be provided if `type="level"`, must be one of: N5, N4, N3, N2, N1
- `level` must be null/omitted if `type="need_review"`
- `question_count` must be > 0 (representing the number of kanji, not total questions)
- For `type="level"`, `question_count` must not exceed available kanji for the specified level
- For `type="need_review"`, `question_count` must not exceed user's need_review list size

**Note**: Total questions in the quiz will be `question_count * 2` since each kanji generates both a reading and a meaning question.

---

#### `GET /api/quizzes`

**Description**: Retrieve a list of user's quizzes, typically filtered for completed quizzes (history).

**Request Headers**:

- `Authorization`: `Bearer <jwt_token>` (required)

**Query Parameters**:

- `status` (optional): Filter by status (`in_progress`, `completed`, `abandoned`)
- `limit` (optional, default: 20, max: 100): Number of results per page
- `offset` (optional, default: 0): Pagination offset

**Response** (200 OK):

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
      "score_percent": 85.0,
      "created_at": "2026-01-18T10:00:00Z",
      "completed_at": "2026-01-18T10:05:32Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 20,
    "offset": 0
  }
}
```

**Error Responses**:

- `400 Bad Request`: Invalid status parameter
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server error

---

#### `GET /api/quizzes/:id`

**Description**: Retrieve a single quiz by ID with all questions and answers. Used for viewing quiz results or history details.

**Request Headers**:

- `Authorization`: `Bearer <jwt_token>` (required)

**Path Parameters**:

- `id`: Quiz ID (bigint)

**Response** (200 OK):

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
        "meanings": ["go", "conduct", "line"]
      },
      "user_answer": "こう",
      "answered_at": "2026-01-18T10:01:15Z",
      "is_correct": true,
      "created_at": "2026-01-18T10:00:00Z"
    }
  ]
}
```

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User does not own this quiz (RLS policy violation)
- `404 Not Found`: Quiz not found
- `500 Internal Server Error`: Server error

---

#### `POST /api/quizzes/:id/complete`

**Description**: Mark a quiz as completed. Validates that all questions are answered, calculates the score percentage, and updates the quiz status.

**Request Headers**:

- `Authorization`: `Bearer <jwt_token>` (required)

**Path Parameters**:

- `id`: Quiz ID (bigint)

**Request Body**: None

**Response** (200 OK):

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
  "completed_at": "2026-01-18T10:05:32Z"
}
```

**Error Responses**:

- `400 Bad Request`: Not all questions have been answered
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User does not own this quiz
- `404 Not Found`: Quiz not found
- `409 Conflict`: Quiz is already completed
- `500 Internal Server Error`: Server error

**Business Logic**:

1. Verify all questions in the quiz have `user_answer` and `answered_at` set
2. Calculate score: `(COUNT(is_correct=true) / question_count) * 100`
3. Set `status = 'completed'`
4. Set `completed_at = NOW()`
5. Set `score_percent = <calculated score>`

---

#### `PATCH /api/quizzes/:id/abandon`

**Description**: Abandon an in-progress quiz by changing its status to 'abandoned'. Only quizzes with `status='in_progress'` can be abandoned. Need-review toggles made during the quiz are preserved.

**Request Headers**:

- `Authorization`: `Bearer <jwt_token>` (required)

**Path Parameters**:

- `id`: Quiz ID (bigint)

**Request Body**: None

**Response** (200 OK):

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

**Error Responses**:

- `400 Bad Request`: Quiz is already completed or abandoned
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User does not own this quiz
- `404 Not Found`: Quiz not found
- `500 Internal Server Error`: Server error

---

### 2.3. Quiz Questions Resource

#### `PATCH /api/quizzes/:quizId/questions/:questionId`

**Description**: Submit an answer for a specific question. Validates the answer against kanji readings (for reading questions) or meanings (for meaning questions), sets correctness, and returns immediate feedback.

**Request Headers**:

- `Authorization`: `Bearer <jwt_token>` (required)

**Path Parameters**:

- `quizId`: Quiz ID (bigint)
- `questionId`: Question ID (bigint)

**Request Body**:

```json
{
  "user_answer": "こう"
}
```

**Request Body Fields**:

- `user_answer` (required): User's answer as a string

**Response** (200 OK):

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
    "readings": ["こう", "ぎょう", "い.く", "ゆ.く"],
    "meanings": ["go", "conduct", "line"]
  },
  "user_answer": "こう",
  "answered_at": "2026-01-18T10:01:15Z",
  "is_correct": true,
  "created_at": "2026-01-18T10:00:00Z",
  "feedback": {
    "is_correct": true,
    "correct_answers": ["こう", "ぎょう", "い.く", "ゆ.く"]
  }
}
```

**Error Responses**:

- `400 Bad Request`:
  - Missing user_answer
  - Question already answered
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User does not own this quiz
- `404 Not Found`: Quiz or question not found
- `500 Internal Server Error`: Server error

**Validation Logic**:

- For `question_type="reading"`: Check if `user_answer` (trimmed, lowercase) matches any reading in kanji.readings array
- For `question_type="meaning"`: Check if `user_answer` (trimmed, lowercase, case-insensitive) matches any meaning in kanji.meanings array
- Set `is_correct` based on match result
- Set `answered_at = NOW()`
- Return feedback with correct answers for reinforcement

**Validation Rules**:

- Question must belong to the specified quiz
- Question must not have been answered already (user_answer and answered_at must be null)
- Quiz must have `status='in_progress'`

---

### 2.4. Need Reviews Resource

#### `GET /api/need-reviews`

**Description**: Retrieve the authenticated user's need-review list with kanji details.

**Request Headers**:

- `Authorization`: `Bearer <jwt_token>` (required)

**Query Parameters**:

- `limit` (optional, default: 50, max: 100): Number of results per page
- `offset` (optional, default: 0): Pagination offset

**Response** (200 OK):

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

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server error

---

#### `POST /api/need-reviews`

**Description**: Add a kanji to the user's need-review list. Idempotent operation (returns success if already exists).

**Request Headers**:

- `Authorization`: `Bearer <jwt_token>` (required)

**Request Body**:

```json
{
  "kanji_id": 42
}
```

**Request Body Fields**:

- `kanji_id` (required): ID of the kanji to add (integer)

**Response** (201 Created):

```json
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
```

**Response** (200 OK): If already exists

```json
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
```

**Error Responses**:

- `400 Bad Request`: Invalid or missing kanji_id
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Kanji not found
- `500 Internal Server Error`: Server error

---

#### `DELETE /api/need-reviews/:kanjiId`

**Description**: Remove a kanji from the user's need-review list. Idempotent operation (returns success even if not in list).

**Request Headers**:

- `Authorization`: `Bearer <jwt_token>` (required)

**Path Parameters**:

- `kanjiId`: Kanji ID (integer) to remove from need-review list

**Response** (204 No Content): No response body

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server error

---

## 3. Authentication and Authorization

### 3.1. Authentication Mechanism

**Supabase Auth** is used for authentication, providing JWT-based session management:

1. **Client-side authentication**: The frontend uses the Supabase JavaScript client to authenticate users via:
   - `supabase.auth.signUp()` for registration
   - `supabase.auth.signInWithPassword()` for login
   - `supabase.auth.signOut()` for logout

2. **Session management**: Upon successful authentication, Supabase Auth returns a JWT token that is automatically included in subsequent API requests via the Authorization header.

3. **Token validation**: All API endpoints verify the JWT token by:
   - Extracting the token from the `Authorization: Bearer <token>` header
   - Validating the token signature using Supabase Auth
   - Extracting `user_id` from the token claims for use in queries

4. **Token refresh**: The Supabase client handles automatic token refresh.

### 3.2. Authorization

Authorization is enforced at two levels:

#### Row-Level Security (RLS)

PostgreSQL Row-Level Security policies ensure users can only access their own data:

- **quiz**: Users can only SELECT/INSERT/UPDATE/DELETE quizzes where `user_id = auth.uid()`
- **quiz_questions**: Users can only access questions belonging to their own quizzes
- **need_reviews**: Users can only access their own need-review entries
- **kanji**: Public read access (no RLS needed)

#### Application-Level Authorization

API endpoints validate:

1. Authenticated user exists (valid JWT)
2. User owns the resource being accessed (enforced by RLS)
3. Business rules (e.g., cannot complete a quiz that's already completed)

### 3.3. Implementation in Astro API Routes

```typescript
// Example: src/pages/api/quizzes/[id].ts
import type { APIRoute } from "astro";
import { createServerClient } from "@/db/supabase.client";

export const GET: APIRoute = async ({ request, params }) => {
  const supabase = createServerClient(request);

  // Get authenticated user (JWT validation)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // RLS automatically filters by user_id
  const { data, error } = await supabase
    .from("quiz")
    .select("*, questions:quiz_questions(*)")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
```

---

## 4. Validation and Business Logic

### 4.1. Validation Rules by Resource

#### Kanji Resource

- `character`: Required, must be exactly 1 character
- `level`: Required, must be one of: `'N5'`, `'N4'`, `'N3'`, `'N2'`, `'N1'`
- `readings`: Required, must be a non-empty array of strings
- `meanings`: Required, must be a non-empty array of strings

#### Quiz Resource

- `user_id`: Required, must reference valid user from auth.users
- `type`: Required, must be one of: `'level'`, `'need_review'`
- `level`: Required if `type='level'`, must be one of: `'N5'`, `'N4'`, `'N3'`, `'N2'`, `'N1'`; must be null if `type='need_review'`
- `question_count`: Required, must be > 0
- `status`: Required, must be one of: `'in_progress'`, `'completed'`, `'abandoned'`; defaults to `'in_progress'`
- `score_percent`: Nullable, must be between 0 and 100 (with 2 decimal places)
- `completed_at`: Must be set if and only if `status='completed'`
- **Cross-field validation**: `(status = 'completed') = (completed_at IS NOT NULL)`

#### Quiz Questions Resource

- `quiz_id`: Required, must reference valid quiz
- `kanji_id`: Required, must reference valid kanji
- `sequence`: Required, must be > 0, unique per quiz_id
- `question_type`: Required, must be one of: `'reading'`, `'meaning'`
- `user_answer`: Nullable, must be set when answered
- `answered_at`: Nullable, must be set when answered
- `is_correct`: Nullable, must be set when answered
- **Uniqueness**: `(quiz_id, sequence)` must be unique
- **Uniqueness**: `(quiz_id, kanji_id, question_type)` must be unique
- **Business rule**: Each kanji must have exactly two questions in a quiz (one reading, one meaning)
- **Business rule**: Questions for the same kanji must be adjacent (consecutive sequence numbers)
- **Cross-field validation**: `(answered_at IS NOT NULL) = (user_answer IS NOT NULL)`

#### Need Reviews Resource

- `user_id`: Required, must reference valid user from auth.users
- `kanji_id`: Required, must reference valid kanji
- **Uniqueness**: `(user_id, kanji_id)` should be unique (implicit composite primary key)

### 4.2. Business Logic Implementation

#### Quiz Creation (`POST /api/quizzes`)

1. **Validate request**:
   - Check `type` is valid enum value
   - If `type='level'`, ensure `level` is provided and valid
   - If `type='need_review'`, ensure `level` is not provided
   - Ensure `question_count > 0`

2. **Check availability**:
   - If `type='level'`: Query count of kanji for specified level
   - If `type='need_review'`: Query count of user's need_review entries
   - Return 400 error if `question_count` exceeds available kanji

3. **Select kanji**:
   - If `type='level'`: Randomly select `question_count` kanji from specified level
   - If `type='need_review'`: Randomly select `question_count` kanji from user's need_review list
   - Ensure no duplicates

4. **Create quiz record**:
   - Insert into `quiz` table with `status='in_progress'`
   - Store user_id from authenticated session
   - Store the kanji count in `question_count` field (not the total number of questions)

5. **Create question records**:
   - For each selected kanji, create **two** `quiz_questions` records:
     - One with `question_type='reading'`
     - One with `question_type='meaning'`
   - For each kanji pair, randomly determine order (either meaning-then-reading or reading-then-meaning)
   - Assign `sequence` sequentially from 1 to `question_count * 2`
   - Example for 3 kanji:
     - Kanji A: sequence 1 (reading), sequence 2 (meaning)
     - Kanji B: sequence 3 (meaning), sequence 4 (reading)
     - Kanji C: sequence 5 (reading), sequence 6 (meaning)
   - This ensures questions for the same kanji are adjacent but their order varies

6. **Return response**:
   - Return created quiz with embedded questions and kanji details

#### Answer Submission (`PATCH /api/quizzes/:quizId/questions/:questionId`)

1. **Validate request**:
   - Ensure question belongs to specified quiz
   - Ensure quiz belongs to authenticated user (via RLS)
   - Ensure quiz status is 'in_progress'
   - Ensure question has not been answered yet (`user_answer IS NULL`)

2. **Validate answer**:
   - Fetch kanji details for the question
   - If `question_type='reading'`:
     - Normalize user_answer (trim whitespace, lowercase)
     - Check if normalized answer exists in kanji.readings array
   - If `question_type='meaning'`:
     - Normalize user_answer (trim whitespace, lowercase, case-insensitive)
     - Check if normalized answer exists in kanji.meanings array

3. **Update question**:
   - Set `user_answer` to submitted value
   - Set `is_correct` based on validation result
   - Set `answered_at = NOW()`

4. **Return response**:
   - Return updated question with feedback object containing:
     - `is_correct`: boolean
     - `correct_answers`: array of valid readings or meanings for reference

#### Quiz Completion (`POST /api/quizzes/:id/complete`)

1. **Validate request**:
   - Ensure quiz belongs to authenticated user
   - Ensure quiz status is 'in_progress'
   - Query all questions for the quiz
   - Ensure all questions have `user_answer` and `answered_at` set
   - Verify total question count equals `question_count * 2`

2. **Calculate score**:
   - Count total questions: `COUNT(*)` (should equal `question_count * 2`)
   - Count correct answers: `COUNT(*) WHERE is_correct = true`
   - Calculate percentage: `(correct_count / total_count) * 100`
   - Round to 2 decimal places

3. **Update quiz**:
   - Set `status = 'completed'`
   - Set `score_percent = <calculated score>`
   - Set `completed_at = NOW()`

4. **Return response**:
   - Return updated quiz record

#### Need Review Toggle

**Add (`POST /api/need-reviews`):**

1. **Validate request**:
   - Ensure kanji_id is provided and valid
   - Ensure kanji exists in kanji table

2. **Check existence**:
   - Query need_reviews for (user_id, kanji_id)
   - If exists, return existing record with 200 status
   - If not exists, insert new record and return with 201 status

3. **Return response**:
   - Return need_review record with embedded kanji details

**Remove (`DELETE /api/need-reviews/:kanjiId`):**

1. **Delete record**:
   - Delete from need_reviews where user_id = authenticated user AND kanji_id = :kanjiId
   - Idempotent: succeeds even if record doesn't exist

2. **Return response**:
   - Return 204 No Content

#### Quiz Abandonment (`PATCH /api/quizzes/:id/abandon`)

1. **Validate request**:
   - Ensure quiz belongs to authenticated user
   - Ensure quiz status is 'in_progress' (cannot abandon completed or already abandoned quizzes)

2. **Update quiz**:
   - Set `status = 'abandoned'`
   - Leave all other fields unchanged (questions, answers, timestamps remain for analytics)
   - Note: need_review entries created during quiz are preserved

3. **Return response**:
   - Return updated quiz record with status 'abandoned'

### 4.3. Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context if applicable"
  }
}
```

Common error codes:

- `UNAUTHORIZED`: Missing or invalid authentication token
- `FORBIDDEN`: User does not have permission to access resource
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Request validation failed
- `INSUFFICIENT_KANJI`: Not enough kanji available for requested quiz
- `ALREADY_ANSWERED`: Question has already been answered
- `ALREADY_COMPLETED`: Quiz is already completed
- `NOT_ALL_ANSWERED`: Not all questions have been answered
- `INTERNAL_ERROR`: Server error

---

## 5. Additional Notes

### 5.1. Content Management

Kanji data is maintained separately (via migrations or seed scripts) and accessed via the `/api/kanji` endpoints. The API does not provide administrative endpoints for content modification in the MVP.

### 5.3. CORS Configuration

Configure CORS headers to allow requests from the frontend domain. In production, restrict to specific origins.
