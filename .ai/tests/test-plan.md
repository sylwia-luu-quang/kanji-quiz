# Test Plan - Kanji Quiz Application

## 1. Introduction and Testing Objectives

### 1.1 Purpose

This test plan outlines the comprehensive testing strategy for the Kanji Quiz application, a web-based platform designed to help Japanese-language learners prepare for JLPT (Japanese Language Proficiency Test) exams through quick, focused kanji practice sessions.

### 1.2 Testing Objectives

- **Functional Correctness**: Verify all user stories and acceptance criteria from the PRD are implemented correctly
- **Data Integrity**: Ensure quiz questions, answers, and user progress are accurately stored and retrieved
- **Security Validation**: Confirm authentication, authorization, and Row-Level Security (RLS) policies function as designed
- **Performance Compliance**: Validate that the initial quiz screen loads in under 5 seconds on simulated 3G connections
- **User Experience Quality**: Ensure seamless quiz flow, immediate feedback, and error handling
- **Cross-Browser Compatibility**: Verify functionality across major desktop browsers
- **API Contract Compliance**: Ensure all REST API endpoints meet their specifications

### 1.3 Success Criteria

- All critical and high-priority test cases pass
- Zero critical or high-severity bugs in production-ready builds

## 2. Test Scope

### 2.1 In-Scope Features

#### Authentication & Authorization

- User registration with email/password
- User sign-in with email/password
- User sign-out
- Session management and JWT token handling
- Row-Level Security (RLS) enforcement
- Middleware authentication checks
- Unauthorized access prevention

#### Quiz Management

- Quiz creation (level-based and need-review modes)
- Random kanji selection without duplicates
- Question pair generation (reading + meaning per kanji)
- Answer submission with validation
- Immediate feedback display
- Quiz completion with score calculation
- Quiz abandonment
- Quiz history retrieval

#### Kanji Data Access

- Kanji list retrieval with filtering by JLPT level
- Pagination support

#### Need Review Functionality

- Adding kanji to need-review list
- Removing kanji from need-review list
- Viewing need-review list with pagination
- Creating quizzes from need-review list

#### User Interface Components

- Dashboard with quiz creation options
- Quiz view with question display
- Answer input with Japanese character support
- Feedback display (correct/incorrect indicators)
- Completion modal with score summary
- History view with pagination
- Need-review list management

#### Data Validation

- Request body validation (Zod schemas)
- Path parameter validation
- Query parameter validation
- Business rule enforcement

### 2.2 Out-of-Scope

The following features are explicitly excluded from MVP testing:

- Spaced repetition algorithms
- Audio/phonetics functionality
- Social features (sharing, leaderboards)
- Advanced analytics dashboards
- Content reporting mechanisms
- Mobile application testing
- Offline mode functionality
- Administrative content management UI
- AI-powered features (OpenRouter integration)

### 2.3 Testing Priorities

**Priority 1 (Critical)**: Must pass before release

- Authentication and authorization flows
- Quiz creation and question generation
- Answer validation and scoring
- RLS policy enforcement
- Core API endpoints functionality

**Priority 2 (High)**: Required for acceptable user experience

- Need-review list management
- Quiz history and completion flow
- Error handling and user feedback
- Performance requirements
- UI component functionality

**Priority 3 (Medium)**: Important but not blocking

- Pagination functionality
- Edge case handling
- Browser compatibility
- Accessibility features

## 3. Types of Tests

### 3.1 Unit Tests

**Scope**:

- **Service Layer** (`src/lib/services/`)
  - `auth.service.ts`: Sign-up, sign-in, sign-out, session management
  - `quiz.service.ts`: Quiz creation, question generation, answer validation, scoring
  - `kanji.service.ts`: Kanji retrieval and filtering
  - `need-review.service.ts`: Need-review list operations
  - `quiz-client.service.ts`: Client-side quiz state management

- **Validation Layer** (`src/lib/validation/`)
  - `auth.validation.ts`: Email/password validation
  - `quiz.validation.ts`: Quiz creation, answer submission validation
  - `kanji.validation.ts`: Kanji query parameter validation
  - `need-review.validation.ts`: Need-review command validation

- **Error Handling** (`src/lib/errors/`)
  - Custom error classes and error mapping logic

- **Utility Functions** (`src/lib/utils.ts`)
  - Helper functions for data transformation

**Testing Framework**: Vitest (recommended for Vite/Astro projects)

**Test Structure**:

```typescript
describe("QuizService", () => {
  describe("createQuiz", () => {
    it("should create a level-based quiz with correct number of questions", async () => {
      // Arrange: Mock Supabase client, prepare test data
      // Act: Call service method
      // Assert: Verify quiz structure, question count, randomization
    });

    it("should throw InsufficientKanjiError when not enough kanji available", async () => {
      // Test error handling
    });
  });

  describe("submitAnswer", () => {
    it("should validate answer case-insensitively", async () => {
      // Test answer validation logic
    });
  });
});
```

### 3.2 Integration Tests

**Scope**:

- **API Endpoints** (all routes in `src/pages/api/`)
  - Authentication endpoints (`/api/auth/*`)
  - Quiz endpoints (`/api/quizzes/*`)
  - Question endpoints (`/api/quizzes/:quizId/questions/:questionId`)
  - Kanji endpoints (`/api/kanji/*`)
  - Need-review endpoints (`/api/need-reviews/*`)

- **Database Operations**
  - CRUD operations on all tables
  - RLS policy enforcement
  - Transaction integrity
  - Constraint validation

- **Middleware**
  - Authentication middleware execution
  - Public vs. protected route handling
  - Session injection into context

**Testing Approach**:

- Use Supabase local development environment (Docker)
- Seed test data using migrations
- Test with actual HTTP requests
- Verify database state changes

**Test Categories**:

1. **Happy Path Tests**: Valid requests with expected success responses
2. **Authorization Tests**: Verify RLS prevents unauthorized access
3. **Validation Tests**: Invalid input returns appropriate 400 errors
4. **Error Handling Tests**: Simulate database failures, network issues
5. **Concurrent Operation Tests**: Multiple users, simultaneous quiz submissions

### 3.3 End-to-End (E2E) Tests

**Testing Framework**: Playwright (recommended for Astro)

**Scope**:

- **Complete User Journeys**
  - New user registration → first quiz → completion
  - Sign-in → create need-review quiz → complete
  - Multiple quiz attempts → view history
  - Add/remove kanji from need-review list during quiz

- **Critical User Flows**:
  1. **Registration Flow**: Sign up → email verification (if required) → redirect to dashboard
  2. **Level Quiz Flow**: Select level → choose question count → answer all questions → see results
  3. **Need-Review Flow**: Mark kanji → create need-review quiz → answer questions → verify list updates
  4. **History Flow**: Complete quizzes → view history list → drill into detail
  5. **Abandonment Flow**: Start quiz → abandon → verify not in history

### 3.4 Security Tests

**Scope**:

1. **Authentication Security**
   - Password strength enforcement
   - Secure password hashing (Supabase Auth)
   - JWT token validation
   - Session expiration handling
   - Token refresh mechanism
   - Sign-out clears session cookies

2. **Authorization Security**
   - RLS policies prevent cross-user data access
   - Quiz ownership verification
   - Question ownership through quiz relationship
   - Need-review list isolation per user
   - Kanji read-only enforcement

3. **Input Validation Security**
   - SQL injection prevention (parameterized queries)
   - XSS prevention (React auto-escaping)
   - CSRF protection (SameSite cookies)
   - Path traversal prevention
   - Request body size limits

4. **API Security**
   - Unauthorized access returns 401
   - Forbidden access returns 403
   - Rate limiting (if implemented)
   - CORS policy validation

**Testing Methodology**:

- Manual penetration testing
- Automated security scanning (OWASP ZAP)
- Code review for security anti-patterns
- Supabase RLS policy testing with different user contexts

### 3.5 UI Component Tests

**Framework**: React Testing Library

**Scope**: All components in `src/components/`

**Component Testing Priorities**:

**Priority 1 (Critical Components)**:

- `QuizContainer.tsx`: Quiz state management
- `AnswerInput.tsx`: Input handling and validation
- `FeedbackSection.tsx`: Correct/incorrect display
- `CompletionModal.tsx`: Score summary
- `NeedReviewToggle.tsx`: Toggle state management

**Priority 2 (High Priority)**:

- `DashboardLayout.tsx`: Layout and navigation
- `QuizHeader.tsx`: Progress display
- `HistoryList.tsx`: Quiz history rendering
- `NeedReviewList.tsx`: Need-review item rendering
- Form components (SignInForm, SignUpForm)

### 3.6 Database Tests

**Scope**:

- Migration integrity
- Constraint enforcement
- RLS policy validation
- Index performance
- Data type validation

**Test Approach**:

- Use Supabase local dev with test database
- Reset database between test suites
- Seed controlled test data
- Execute operations as different users

**Test Categories**:

1. **Schema Tests**
   - All tables exist with correct columns
   - Primary keys and foreign keys defined
   - Constraints enforced (CHECK, UNIQUE, NOT NULL)
   - Enums defined correctly

2. **RLS Policy Tests**
   - Authenticated users can only access own quizzes
   - Quiz questions inherit quiz ownership
   - Need-reviews scoped to user
   - Kanji publicly readable, writes denied
   - Anonymous users blocked from user data

3. **Data Integrity Tests**
   - Cascading deletes work correctly
   - Quiz completion updates score and timestamps
   - Question answering updates correctness flag
   - Unique constraints prevent duplicates

## 4. Testing Tools

### 4.1 Unit and Integration Testing

**Primary Framework**: Vitest

- **Rationale**: Native Vite integration, fast execution, ESM support
- **Features Used**:
  - Describe/it blocks for test organization
  - Mock functions and module mocking
  - Snapshot testing
  - Code coverage reporting (v8)

**Mocking Libraries**:

- **Supabase Mocking**: Custom mock factory for Supabase client
- **MSW (Mock Service Worker)**: API mocking for integration tests

### 4.2 Component Testing

**Framework**: React Testing Library + Vitest

- **Rationale**: Encourages testing from user perspective, no implementation details
- **Key Utilities**:
  - `render()`: Render components
  - `screen`: Query rendered elements
  - `fireEvent`, `userEvent`: Simulate interactions
  - `waitFor()`: Async assertions

### 4.3 End-to-End Testing

**Framework**: Playwright

- **Rationale**: Cross-browser support, excellent debugging, auto-waiting
- **Browsers**: Chromium, Firefox, WebKit
- **Features**:
  - Page Object Model (POM) pattern
  - Network interception
  - Visual regression testing (screenshots)
  - Trace viewer for debugging

### 4.4 API Testing

**Tools**:

1. **Postman** / **Insomnia**
   - Manual API exploration
   - Collection-based testing
   - Environment management

2. **Supertest** (Automated)
   - HTTP assertion library
   - Integration with Vitest
   - API contract testing

### 4.5 Code Quality Tools

**Linting & Formatting**:

- **ESLint**: JavaScript/TypeScript linting (with Astro, React plugins)
- **Prettier**: Code formatting
- **TypeScript Compiler**: Type checking

**Pre-commit Hooks**:

- **Husky**: Git hook management
- **lint-staged**: Run linters on staged files

## 7. Testing Schedule

### 7.1 Development Phase (Ongoing)

**Unit Tests**: Continuous (TDD approach)

- Written alongside feature development
- Executed on file save (watch mode)
- Must pass before commit

**Component Tests**: Per component completion

- Written when component is feature-complete
- Covers all props and interaction scenarios

**Integration Tests**: Per feature completion

- API endpoint tests after endpoint implementation
- Database tests after schema changes

### 7.2 Sprint Cycle (2-week sprints)

**Week 1**:

- Day 1-3: Feature development + unit tests
- Day 4-5: Integration tests for completed features

**Week 2**:

- Day 1-2: Component tests
- Day 3: E2E test scenarios for new features
- Day 4: Bug fixes and test updates
- Day 5: Sprint review (includes test results)

### 7.3 Pre-Release Testing

**Feature Freeze** (1 week before release):

- All feature development stops
- Bug fixes only

**Regression Testing** (Days 1-3):

- Full E2E suite execution (all browsers)
- Performance testing on staging
- Security scanning
- Accessibility audit

**UAT** (Days 4-5):

- Stakeholder testing
- Acceptance sign-off

**Release Readiness** (Day 6-7):

- Smoke tests on production-like environment
- Final performance validation
- Deployment dry-run

### 7.4 Post-Release

**Deployment Day**:

- Automated smoke tests (critical flows)
- Performance monitoring
- Error rate monitoring

**Week 1 Post-Release**:

- Daily smoke tests
- Real user monitoring analysis
- Bug triage and hot-fix testing

### 7.5 Continuous Testing (Production)

**Daily**:

- Synthetic monitoring (uptime checks)
- Automated smoke tests

**Weekly**:

- Full regression suite (off-peak hours)
- Performance trend analysis

**Monthly**:

- Security vulnerability scan
- Accessibility re-audit
- Load testing (capacity planning)
