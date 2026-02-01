# Authentication Architecture Specification - Kanji Quiz

## Document Overview

This specification defines the authentication architecture for the Kanji Quiz application, implementing user registration, login, and logout functionality using Supabase Auth integrated with Astro and React.

**Related User Stories**: US-001 (Sign up), US-002 (Sign in), US-015 (Logout)

**MVP Scope**: Registration, login, and logout only. Password recovery deferred to post-MVP.

**Key Principles**:

- All application functionality available only to authenticated users
- Server-side session validation via Supabase Auth
- Client-side interactive forms using React
- Astro pages handle navigation and SSR
- Consistent error handling and validation patterns

---

## 1. USER INTERFACE ARCHITECTURE

### 1.1 New Authentication Pages

**`/src/pages/auth/signin.astro`**

- Check for existing session, redirect authenticated users to dashboard
- Accept optional `redirect` query parameter for post-login navigation
- Render `SignInForm` React component with `client:load`
- Link to signup page

**`/src/pages/auth/signup.astro`**

- Check for existing session, redirect authenticated users to dashboard
- Accept optional `redirect` query parameter
- Render `SignUpForm` React component with `client:load`
- Link to signin page

**`/src/pages/auth/callback.astro`** (Future)

- Handle OAuth callbacks and email verification when enabled
- Pure server-side processing, no client component

### 1.2 Protected Pages (Modified)

**`/src/pages/index.astro`**

- Redirect authenticated users to `/dashboard`
- Redirect unauthenticated users to `/auth/signin`

**`/src/pages/dashboard.astro`**

- Require authentication, redirect to signin if not authenticated
- Pass user email and ID to `DashboardLayout` component

**`/src/pages/quiz/[id].astro`**

- Require authentication with redirect
- Replace `DEFAULT_USER_ID` with actual session user ID
- Maintain existing quiz validation logic

### 1.3 React Components

#### SignInForm (`/src/components/auth/SignInForm.tsx`)

**Responsibilities**: Email/password authentication form

**State**: email, password, isSubmitting, validation errors, auth errors

**Validation**:

- Email: Required, valid format
- Password: Required (min 1 character for signin)

**UI Elements**:

- Email input (autocomplete="email")
- Password input with show/hide toggle (autocomplete="current-password")
- Submit button with loading state
- Link to signup page
- Inline and form-level error displays

**Flow**: Validate → Call signin API → Redirect on success or show error

#### SignUpForm (`/src/components/auth/SignUpForm.tsx`)

**Responsibilities**: New user registration form

**State**: email, password, confirmPassword, isSubmitting, registrationSuccess, validation errors, auth errors

**Validation**:

- Email: Required, valid format
- Password: Min 8 chars, must contain uppercase, lowercase, and number
- Confirm Password: Must match password

**UI Elements**:

- Email input (autocomplete="email")
- Password input with show/hide toggle (autocomplete="new-password")
- Confirm password input with show/hide toggle
- Submit button with loading state
- Link to signin page
- Success banner for email confirmation (if enabled)
- Inline and form-level error displays

**Flow**: Validate → Call signup API → Auto-login and redirect on success or show error

#### DashboardHeader (Modified)

**New Props**: userEmail, onLogout callback

**Changes**: Add user email display and logout button in header navigation

**Logout Flow**: Call signout API → Show loading state → Redirect to signin

### 1.4 Navigation Patterns

**Protected Route Access**: Unauthenticated → Redirect to `/auth/signin?redirect={originalPath}`

**Auth Page Access**: Authenticated → Redirect to `/dashboard`

**Successful Registration**: Auto-login → Redirect to dashboard or original path

**Logout**: Clear session → Redirect to `/auth/signin`

---

## 2. BACKEND ARCHITECTURE

### 2.1 Authentication Service

**Location**: `/src/lib/services/auth.service.ts`

**Class**: `AuthService`

**Constructor**: Accepts `SupabaseClient` instance

**Methods**:

- **`signUp(params)`**: Register new user
  - Parameters: email, password
  - Returns: userId, email, emailConfirmationRequired
  - Throws: EmailAlreadyExistsError, WeakPasswordError, AuthServiceError

- **`signIn(params)`**: Authenticate user
  - Parameters: email, password
  - Returns: userId, email, accessToken, refreshToken
  - Throws: InvalidCredentialsError, AuthServiceError

- **`signOut()`**: Terminate session
  - Returns: void
  - Throws: AuthServiceError

- **`getSession()`**: Retrieve current session
  - Returns: SessionData or null
  - Throws: AuthServiceError

- **`refreshSession()`**: Refresh access token
  - Returns: SessionData
  - Throws: SessionExpiredError

### 2.2 Error Classes

**Location**: `/src/lib/errors/auth.errors.ts`

**Base**: `AuthError` extends Error with code and statusCode properties

**Specific Errors**:

1. `EmailAlreadyExistsError` (409 Conflict)
2. `InvalidCredentialsError` (401 Unauthorized)
3. `WeakPasswordError` (400 Bad Request)
4. `SessionExpiredError` (401 Unauthorized)
5. `AuthServiceError` (500 Internal Server Error)

### 2.3 Validation Schemas

**Location**: `/src/lib/validation/auth.validation.ts`

**Using**: Zod library

**Schemas**:

- `signUpBodySchema`: email, password, confirmPassword with validation rules
- `signInBodySchema`: email, password

**Helper Functions**: `parseSignUpBody()`, `parseSignInBody()`

### 2.4 API Endpoints

**POST /api/auth/signup**

- Request: email, password, confirmPassword
- Success (201): userId, email, emailConfirmationRequired
- Errors: 400 (validation), 409 (email exists), 500 (server error)

**POST /api/auth/signin**

- Request: email, password
- Success (200): userId, email, accessToken, refreshToken
- Errors: 400 (validation), 401 (invalid credentials), 500 (server error)
- Note: Sets session cookies automatically via Supabase

**POST /api/auth/signout**

- Request: none
- Success (200): message
- Note: Always returns success, clears session cookies

**GET /api/auth/session**

- Request: none
- Success (200): authenticated flag, user data (if authenticated), expiresAt
- Use Case: Client-side session validation

### 2.5 Middleware Enhancement

**Location**: `/src/middleware/index.ts`

**Current**: Adds supabase client to context.locals

**Enhanced**:

- Fetch session on every request via `supabase.auth.getSession()`
- Add `session` to `context.locals.session` (Session or null)
- Add `user` to `context.locals.user` with id and email (or null)

**Benefits**: Session available in all Astro pages and API routes without manual fetching

### 2.6 Authentication Guards

**Location**: `/src/lib/utils/auth-guards.ts`

**Helper Functions**:

**`requireAuth(astro, options?)`**: For protected pages

- Check `Astro.locals.user`
- If not authenticated: Redirect to signin with optional return URL
- If authenticated: Return user object

**`requireGuest(astro, redirectTo?)`**: For auth pages

- Check `Astro.locals.session`
- If authenticated: Redirect to dashboard
- If not authenticated: Continue

**`requireAuthAPI(locals)`**: For API endpoints

- Check `locals.user`
- If not authenticated: Throw AuthenticationRequiredError
- If authenticated: Return user object

### 2.7 Existing API Routes Updates

**Pattern**: Replace `DEFAULT_USER_ID` logic with `requireAuthAPI(locals)`

**Affected Routes**:

- `/api/quizzes/index.ts` (GET, POST)
- `/api/quizzes/[id]/index.ts` (GET)
- `/api/quizzes/[id]/abandon.ts` (POST)
- `/api/quizzes/[id]/complete.ts` (POST)
- `/api/quizzes/[quizId]/questions/[questionId].ts` (PATCH)
- `/api/need-reviews/index.ts` (GET, POST)
- `/api/need-reviews/[kanjiId].ts` (DELETE)

**Error Response**: 401 Unauthorized with code "AUTHENTICATION_REQUIRED"

### 2.8 Environment Variables

**Required**:

- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_KEY`: Supabase anonymous key
- `SITE_URL`: Application URL for redirects

**Deprecated**: `DEFAULT_USER_ID` (remove after migration)

---

## 3. AUTHENTICATION SYSTEM

### 3.1 Supabase Auth Configuration

**Dashboard Settings**:

- Enable Email Provider: Yes
- Confirm Email: No (MVP)
- Session Duration: 7 days
- Refresh Token Rotation: Enabled
- Reuse Interval: 10 seconds

**Password Requirements** (enforced by validation):

- Minimum 8 characters
- Must contain uppercase, lowercase, and number

**Rate Limiting**:

- Sign Up: 5 requests/hour per IP
- Sign In: 10 requests/hour per email

**Site URL**: Set to `SITE_URL` environment variable

### 3.2 Database Schema

**No Changes Required**: Schema already supports authentication

**Tables**:

- `auth.users`: Managed by Supabase (id, email, encrypted_password)
- `quiz.user_id`: Already references `auth.users(id)`
- `need_reviews.user_id`: Already references `auth.users(id)`

**RLS Policies**: Already configured, currently disabled for development

**Migration Required**: Re-enable RLS policies before production

- Create migration: `20260201000000_enable_rls_policies.sql`
- Verify policies are active and enforced

### 3.3 Session Management

**Storage**: HTTP-only cookies (managed by Supabase)

- `sb-access-token`: JWT access token (1 hour lifetime)
- `sb-refresh-token`: Refresh token (7 days lifetime)

**Cookie Attributes**:

- HttpOnly: Yes (prevents XSS)
- Secure: Yes in production (HTTPS only)
- SameSite: Lax
- Path: /

**Lifecycle**:

- Creation: On signin/signup, Supabase sets cookies automatically
- Validation: Middleware fetches session on every request
- Refresh: Automatic by Supabase client when access token expires
- Termination: On signout, Supabase clears cookies

### 3.4 Client-Side Helpers

**Location**: `/src/lib/client/auth.client.ts`

**Purpose**: Wrap API calls for React components

**Functions**:

- `signIn(email, password)`: POST to /api/auth/signin
- `signUp(email, password)`: POST to /api/auth/signup
- `signOut()`: POST to /api/auth/signout
- `getSession()`: GET /api/auth/session

**Error Handling**: Consistent error response structure with message, code, and optional details

### 3.5 SSR Integration

**Astro Configuration**: Already set to `output: "server"` with Node adapter

**Page-Level Patterns**:

- Protected pages: Use `requireAuth()` at top of component script
- Guest-only pages: Use `requireGuest()` at top of component script
- Optional auth: Check `Astro.locals.user` directly

**Benefits**:

- Server-side session validation before render
- Immediate redirects without client-side flicker
- Protected content never sent to unauthenticated users

---

## 4. TYPE DEFINITIONS

### 4.1 Authentication DTOs

**Location**: Add to `/src/types.ts`

**Command DTOs** (Request bodies):

- `SignUpCommandDTO`: email, password, confirmPassword
- `SignInCommandDTO`: email, password

**Response DTOs**:

- `SignUpResponseDTO`: userId, email, emailConfirmationRequired
- `SignInResponseDTO`: userId, email, accessToken, refreshToken
- `SessionDataDTO`: authenticated, user (id, email), expiresAt
- `UnauthenticatedSessionDTO`: authenticated (false)
- `SessionResponseDTO`: Union of above

**Error DTOs**:

- `AuthErrorResponseDTO`: Extends ErrorResponseDTO with auth-specific codes

### 4.2 Component Props

**Location**: `/src/components/types/auth.types.ts`

**Form State Types**: SignInFormState, SignUpFormState

**Props Types**: SignInFormProps, SignUpFormProps, DashboardHeaderProps

**View Models**: UserViewModel

### 4.3 Service Types

**Location**: `/src/lib/services/types/auth.types.ts`

**Parameters**: SignUpParams, SignInParams

**Results**: SignUpResult, SignInResult, SessionData

### 4.4 Environment Types

**Location**: `/src/env.d.ts` (update existing)

**App.Locals**: Add `session` and `user` properties

**ImportMetaEnv**: Add `SITE_URL`, deprecate `DEFAULT_USER_ID`

---

## 5. ERROR HANDLING

### 5.1 Error Categories

1. **Validation Errors** (400): Invalid input, format errors, constraint violations
2. **Authentication Errors** (401): Invalid credentials, session expired, auth required
3. **Conflict Errors** (409): Email already exists
4. **Server Errors** (500): Database errors, Supabase errors, unexpected errors

### 5.2 Error Response Format

**Structure**: error message, code, optional details

**Consistency**: Use existing ErrorResponseDTO format

**Security**: Generic messages for authentication (no account enumeration)

### 5.3 Client-Side Display

**Inline Errors**: Below/beside input fields, red text, cleared on input change

**Form Errors**: Banner at top/bottom of form, distinct styling, dismissible

**Toast Notifications**: For async operations, auto-dismiss after 5s

### 5.4 Logging

**Server-Side**:

- Log all auth events (INFO): signup, signin, signout, session refresh
- Log errors (WARN/ERROR): failed attempts, rate limits, service errors
- Never log passwords or tokens
- Include context: userId, email, IP, timestamp

**Client-Side**:

- Console errors in development
- Send critical errors to monitoring (future)
- Never log sensitive data

---

## 6. IMPLEMENTATION PLAN

### Phase 1: Foundation

1. Create AuthService class
2. Create error classes
3. Create validation schemas
4. Create client-side helpers
5. Update middleware for session handling
6. Create auth guard utilities

### Phase 2: API Endpoints

1. POST /api/auth/signup
2. POST /api/auth/signin
3. POST /api/auth/signout
4. GET /api/auth/session

### Phase 3: UI Components

1. SignUpForm component
2. SignInForm component
3. Update DashboardHeader with logout

### Phase 4: Pages

1. /auth/signup page
2. /auth/signin page
3. Update /dashboard with auth guard
4. Update /quiz/[id] with auth guard
5. Update /index with redirect logic

### Phase 5: Migration

1. Remove DEFAULT_USER_ID from all files
2. Apply RLS re-enable migration
3. Update existing API routes with requireAuthAPI
4. Test all protected routes and endpoints
5. Update environment documentation

### Phase 6: Deployment

1. Manual testing of all flows
2. Performance testing
3. Security review
4. Deploy to staging
5. Final validation
6. Deploy to production

---

## SUMMARY

This specification provides a complete authentication architecture for Kanji Quiz:

✅ **Meets Requirements**: US-001 (Sign up), US-002 (Sign in), US-015 (Logout)

✅ **Compatible**: Integrates with existing Astro SSR, React components, API patterns

✅ **Secure**: RLS policies, session management, HttpOnly cookies, rate limiting

✅ **Maintainable**: Clear separation of concerns, centralized service layer, type-safe

✅ **Scalable**: Supports future enhancements (OAuth, MFA, password recovery)

**MVP Deliverables**:

- 2 authentication pages (signin, signup)
- 2 React form components
- 4 API endpoints
- Authentication service layer
- Auth guards for protected routes
- Updated middleware
- Session management
- RLS policy enforcement

**Implementation**: Follow 6-phase plan for systematic deployment.
