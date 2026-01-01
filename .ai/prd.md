# Product Requirements Document (PRD) - Kanji Quiz

## 1. Product Overview

Kanji Quiz is a web application that enables Japanese-language learners preparing for the JLPT (levels N5–N1) to conduct quick, repeatable kanji practice sessions of 5–10 minutes. The MVP focuses on level-based quizzes, immediate feedback, personal "Need review" lists, basic history, and email-based authentication. Kanji content is served from a developer-maintained JSON file, and only minimal user data (email, quiz data) is stored. Performance target is loading the initial quiz screen in under 5 seconds on a 3 G connection.

## 2. User Problem

Learners often forget kanji readings and meanings because existing resources are scattered, slow, or not optimized for daily micro-practice. They need a focused tool that:

- Quickly serves level-appropriate kanji questions.
- Provides instant feedback to reinforce memory.
- Lets them flag difficult kanji for targeted review.
- Remembers their progress across sessions and devices.

## 3. Functional Requirements

1. Level-based quiz
   - User selects JLPT level (N5–N1).
   - User selects number of questions (preset options: 10, 20, 50).
   - System randomly selects kanji for the quiz without duplicates.
2. Quiz flow
   - Single-kanji display with large centered character.
   - Question type per session: reading and meaning.
   - Answer input field and submit action.
   - Immediate feedback showing correctness and the correct answer.
   - Per-question hit/miss recorded.
3. Need review list
   - User can mark/unmark kanji as "Need review" during quiz or on the immediate results screen.
   - Separate quiz mode that draws only from the marked list; user chooses question count up to list size.
4. Accounts & persistence
   - Email + password sign-up/sign-in.
   - Passwords are securely hashed.
   - Data stored per user: quiz history, Need review list.
5. History
   - List of completed quiz attempts with date, level, score.
   - Detail view showing all kanji in an attempt with hit/miss status.
6. Content management
   - JLPT kanji dataset loaded from a static JSON file containing kanji, readings, meanings, synonyms, level, and IDs.
7. Performance & platform
   - Desktop-web responsive layout; initial quiz load < 5 s on 3 G.
8. Security & privacy
   - Minimal PII (email only).
   - Secure password storage.

## 4. Product Boundaries

In scope (MVP):

- Level-based quizzes with immediate feedback.
- Need review marking and dedicated quiz mode.
- Email-based authentication.
- Basic history views.
- Static JSON for kanji content.
- Desktop-web UI.

Out of scope (MVP):

- Spaced repetition or adaptive scheduling.
- Audio/phonetics.
- Social sharing or leaderboards.
- Advanced analytics dashboards.
- Reporting errors in content.
- Mobile app or offline mode.
- Administrative UI for content updates.

## 5. User Stories

ID: US-001
Title: Sign up
Description: As a new user, I want to create an account using email and password so that my progress is saved.
Acceptance Criteria:

- User provides a valid email and strong password.
- Password is hashed and stored securely.
- Successful registration redirects to the home screen.
- Errors (email already in use, weak password) are displayed.

ID: US-002
Title: Sign in
Description: As a returning user, I want to sign in so I can access my quizzes and Need review list.
Acceptance Criteria:

- Correct credentials authenticate the user.
- Incorrect credentials show a generic error without revealing account existence.
- After sign-in, previous data (history, Need review list) is available.

ID: US-003
Title: Choose quiz level
Description: As a user, I want to select a JLPT level (N5–N1) to focus my quiz on the kanji I need to study.
Acceptance Criteria:

- Level selector lists N5–N1.
- Selected level is passed to the quiz generator.
- UI clearly displays the chosen level during the quiz.

ID: US-004
Title: Choose question count
Description: As a user, I want to choose how many questions (10, 20, 50) so my session fits my available time.
Acceptance Criteria:

- Preset counts (10, 20, 50) are selectable.
- Choosing a count updates the quiz generator.
- If fewer kanji exist than requested, the user is informed and cannot proceed.

ID: US-005
Title: Start quiz
Description: As a user, I want to start the quiz after configuring level and question count.
Acceptance Criteria:

- Start button initiates quiz generation.
- First kanji loads within 5 seconds on a simulated 3 G connection.

ID: US-006
Title: Answer reading question
Description: As a user, I want to type the reading of the kanji so I can test my knowledge.
Acceptance Criteria:

- Input accepts Japanese characters.
- Submission records answer.
- Immediate feedback shows correct answer and hit/miss.

ID: US-007
Title: Answer meaning question
Description: As a user, I want to type the English meaning of the kanji so I can test my understanding.
Acceptance Criteria:

- Input accepts English text.
- Exact match or predefined synonyms are accepted (case-insensitive, trimmed).
- Immediate feedback is provided.

ID: US-008
Title: View instant feedback
Description: As a user, I want to know immediately if my answer was correct to reinforce learning.
Acceptance Criteria:

- After submission, the system displays correct/incorrect status and the correct answer.
- User can proceed to the next question only after viewing feedback.

ID: US-009
Title: Mark Need review
Description: As a user, I want to mark a kanji as "Need review" when I’m unsure so I can revisit it later.
Acceptance Criteria:

- Toggle control available on question and results views.
- Toggling adds/removes kanji from the personal Need review list.
- Visual state reflects current status.

ID: US-010
Title: Start Need review quiz
Description: As a user, I want to start a quiz using only my Need review kanji to focus on weak areas.
Acceptance Criteria:

- User selects Need review mode from navigation.
- User chooses question count up to the available items.
- Quiz draws only from Need review list without duplicates.

ID: US-011
Title: View quiz results summary
Description: As a user, I want to see my overall score and which kanji I missed after finishing a quiz.
Acceptance Criteria:

- Final screen shows score (percentage correct).
- List of kanji indicates hit/miss.
- Kanji can still be toggled for Need review here.

ID: US-012
Title: View history list
Description: As a user, I want to view past quiz attempts with date, level, and score so I can track progress.
Acceptance Criteria:

- History page lists all completed attempts sorted by date.
- Each entry shows date, level, score, question count.

ID: US-013
Title: View history detail
Description: As a user, I want to drill into a past attempt to review which kanji I got right or wrong.
Acceptance Criteria:

- Selecting an attempt opens a detail view.
- All kanji from that quiz are displayed with hit/miss status.

ID: US-014
Title: Handle incomplete quiz
Description: As a user, I expect that if I abandon a quiz partway, it will not appear in history.
Acceptance Criteria:

- Quitting or refreshing mid-quiz discards the attempt.
- No record is stored; Need review toggles before quit are still respected.

ID: US-015
Title: Secure session handling
Description: As a user, I want my session to expire after inactivity to protect my data.
Acceptance Criteria:

- Inactivity timeout (e.g., 1 hour) logs the user out.
- Refresh token or session cookie is invalidated.

ID: US-016
Title: Logout
Description: As a user, I want to log out so others cannot access my data on a shared computer.
Acceptance Criteria:

- Logout control available in navigation.
- Clicking logout clears the session and redirects to sign-in.

ID: US-017
Title: Error handling for content load
Description: As a user, I want to see a friendly error if the kanji data fails to load so I know what happened.
Acceptance Criteria:

- If JSON fetch fails, the user sees an error message.
- Retry option is provided.
- No blank screens are shown.

ID: US-018
Title: Performance requirement
Description: As a user on a slow connection, I expect the first quiz question to load quickly so I can start practicing.
Acceptance Criteria:

- First Contentful Paint to quiz view is under 5 seconds on a simulated 3 G connection.

## 6. Success Metrics

1. Activation: at least 60 % of newly registered users complete their first quiz (metric: quiz_completed_first_time / user_registered).
2. Performance: initial quiz screen loads in under 5 s on 3 G for 95 % of sessions (synthetic and real user monitoring).
3. Engagement (post-launch stretch): percentage of users completing ≥1 quiz per day during first week (baseline to be defined).

---

Checklist review:

- Each user story includes clear, testable acceptance criteria.
- Authentication and secure session handling covered (US-001, US-002, US-015, US-016).
- User stories cover all interactions required for MVP functionality.
- Success metrics align with activation and performance goals.
