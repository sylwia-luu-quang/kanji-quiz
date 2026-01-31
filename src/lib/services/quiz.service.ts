import type { SupabaseClient } from "../../db/supabase.client";
import type {
  QuizWithQuestionsDTO,
  QuizDTO,
  QuizQuestionDTO,
  JLPTLevel,
  QuizType,
  QuizStatus,
  KanjiEntity,
  KanjiDTO,
  QuestionType,
  QuestionAnswerResponseDTO,
} from "../../types";
import {
  InsufficientKanjiError,
  QuizCreationError,
  QuizNotFoundError,
  QuizAccessDeniedError,
  QuizAlreadyCompletedError,
  IncompleteQuizError,
  QuizCompletionError,
  QuizNotAbandonableError,
  QuizAbandonmentError,
  QuestionNotFoundError,
  QuestionAlreadyAnsweredError,
  AnswerSubmissionError,
  QuizInvalidStateError,
} from "../errors/quiz.errors";

/**
 * Parameters for creating a quiz
 */
export interface CreateQuizParams {
  userId: string;
  type: QuizType;
  level?: JLPTLevel;
  questionCount: number;
}

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

/**
 * Internal structure for quiz question record before insertion
 */
interface QuizQuestionInsert {
  quiz_id: number;
  kanji_id: number;
  sequence: number;
  question_type: QuestionType;
}

/**
 * Service for managing quiz operations
 * Handles quiz creation, question generation, and data transformation
 */
export class QuizService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Creates a new quiz for a user with randomly selected kanji
   *
   * Process:
   * 1. Validate sufficient kanji are available
   * 2. Randomly select kanji (without duplicates)
   * 3. Create quiz record
   * 4. Generate question pairs (reading + meaning) for each kanji
   * 5. Randomize question order within each pair
   * 6. Bulk insert all questions
   * 7. Fetch and return complete quiz with questions and kanji data
   *
   * @param params - Quiz creation parameters
   * @returns QuizWithQuestionsDTO with all questions and embedded kanji data
   * @throws InsufficientKanjiError if not enough kanji available
   * @throws QuizCreationError if database operation fails
   */
  async createQuiz(params: CreateQuizParams): Promise<QuizWithQuestionsDTO> {
    const { userId, type, level, questionCount } = params;

    const availableCount = await this.countAvailableKanji(userId, type, level);

    if (availableCount < questionCount) {
      throw new InsufficientKanjiError(questionCount, availableCount);
    }

    const kanjiIds = await this.selectRandomKanji(userId, type, level, questionCount);

    if (kanjiIds.length !== questionCount) {
      throw new QuizCreationError(
        `Failed to select sufficient kanji. Expected ${questionCount}, got ${kanjiIds.length}`
      );
    }

    const quiz = await this.createQuizRecord(userId, type, level, questionCount);

    const questions = this.generateQuestions(kanjiIds, quiz.id);

    await this.insertQuestions(questions);

    const completeQuiz = await this.fetchCompleteQuiz(quiz.id);

    return completeQuiz;
  }

  /**
   * Counts available kanji based on quiz type
   *
   * @param userId - User ID for need-review filtering
   * @param type - Quiz type (level or need_review)
   * @param level - JLPT level (required for level-based quizzes)
   * @returns Number of available kanji
   * @throws QuizCreationError if database query fails
   */
  private async countAvailableKanji(userId: string, type: QuizType, level?: JLPTLevel): Promise<number> {
    try {
      if (type === "level") {
        if (!level) {
          throw new QuizCreationError("Level is required for level-based quiz");
        }

        const { count, error } = await this.supabase
          .from("kanji")
          .select("*", { count: "exact", head: true })
          .eq("level", level);

        if (error) {
          throw error;
        }

        return count || 0;
      } else {
        const { count, error } = await this.supabase
          .from("need_reviews")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        if (error) {
          throw error;
        }

        return count || 0;
      }
    } catch (error) {
      throw new QuizCreationError("Failed to count available kanji", error);
    }
  }

  /**
   * Selects random kanji IDs without duplicates
   *
   * Fetches all available kanji and randomly selects the required count
   *
   * @param userId - User ID for need-review filtering
   * @param type - Quiz type (level or need_review)
   * @param level - JLPT level (required for level-based quizzes)
   * @param count - Number of kanji to select
   * @returns Array of kanji IDs
   * @throws QuizCreationError if database query fails
   */
  private async selectRandomKanji(
    userId: string,
    type: QuizType,
    level: JLPTLevel | undefined,
    count: number
  ): Promise<number[]> {
    try {
      if (type === "level") {
        if (!level) {
          throw new QuizCreationError("Level is required for level-based quiz");
        }

        const { data, error } = await this.supabase.from("kanji").select("id").eq("level", level);

        if (error) {
          throw error;
        }

        const allIds = (data || []).map((k) => k.id);
        return this.shuffleAndTake(allIds, count);
      } else {
        const { data, error } = await this.supabase.from("need_reviews").select("kanji_id").eq("user_id", userId);

        if (error) {
          throw error;
        }

        const allIds = (data || []).map((nr) => nr.kanji_id);
        return this.shuffleAndTake(allIds, count);
      }
    } catch (error) {
      throw new QuizCreationError("Failed to select random kanji", error);
    }
  }

  /**
   * Shuffles an array and takes the first n elements
   * Uses Fisher-Yates shuffle algorithm for uniform randomization
   *
   * @param array - Array to shuffle
   * @param count - Number of elements to take
   * @returns Array of randomly selected elements
   */
  private shuffleAndTake<T>(array: T[], count: number): T[] {
    const shuffled = [...array];

    // Fisher-Yates shuffle for first 'count' elements
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const j = i + Math.floor(Math.random() * (shuffled.length - i));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count);
  }

  /**
   * Creates a quiz record in the database
   *
   * @param userId - User ID
   * @param type - Quiz type
   * @param level - JLPT level (optional)
   * @param questionCount - Number of kanji
   * @returns Created quiz record
   * @throws QuizCreationError if insert fails
   */
  private async createQuizRecord(
    userId: string,
    type: QuizType,
    level: JLPTLevel | undefined,
    questionCount: number
  ): Promise<QuizDTO> {
    try {
      const { data, error } = await this.supabase
        .from("quiz")
        .insert({
          user_id: userId,
          type,
          level: level || null,
          question_count: questionCount,
          status: "in_progress",
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new QuizCreationError("Failed to create quiz: no data returned");
      }

      return data;
    } catch (error) {
      throw new QuizCreationError("Failed to create quiz record", error);
    }
  }

  /**
   * Generates question pairs for each kanji with randomized order
   *
   * For each kanji:
   * - Creates 2 questions: reading and meaning
   * - Randomly swaps their sequence (50% chance)
   * - Questions within a pair are adjacent
   *
   * Example for 2 kanji:
   * - Kanji 1: sequence 1 (reading), sequence 2 (meaning) OR sequence 1 (meaning), sequence 2 (reading)
   * - Kanji 2: sequence 3 (reading), sequence 4 (meaning) OR sequence 3 (meaning), sequence 4 (reading)
   *
   * @param kanjiIds - Array of kanji IDs
   * @param quizId - Quiz ID
   * @returns Array of quiz question records ready for insertion
   */
  private generateQuestions(kanjiIds: number[], quizId: number): QuizQuestionInsert[] {
    const questions: QuizQuestionInsert[] = [];

    kanjiIds.forEach((kanjiId, index) => {
      const baseSequence = index * 2 + 1;
      const shouldSwap = Math.random() < 0.5;

      const readingQuestion: QuizQuestionInsert = {
        quiz_id: quizId,
        kanji_id: kanjiId,
        sequence: shouldSwap ? baseSequence + 1 : baseSequence,
        question_type: "reading",
      };

      const meaningQuestion: QuizQuestionInsert = {
        quiz_id: quizId,
        kanji_id: kanjiId,
        sequence: shouldSwap ? baseSequence : baseSequence + 1,
        question_type: "meaning",
      };

      questions.push(readingQuestion, meaningQuestion);
    });

    return questions;
  }

  /**
   * Bulk inserts quiz questions into the database
   *
   * @param questions - Array of question records to insert
   * @throws QuizCreationError if insert fails
   */
  private async insertQuestions(questions: QuizQuestionInsert[]): Promise<void> {
    try {
      const { error } = await this.supabase.from("quiz_questions").insert(questions);

      if (error) {
        throw error;
      }
    } catch (error) {
      throw new QuizCreationError("Failed to insert quiz questions", error);
    }
  }

  /**
   * Fetches complete quiz with all questions and embedded kanji data
   *
   * Uses Supabase's nested select for efficient JOIN operations
   *
   * @param quizId - Quiz ID
   * @returns QuizWithQuestionsDTO with all related data
   * @throws QuizCreationError if fetch fails
   */
  private async fetchCompleteQuiz(quizId: number): Promise<QuizWithQuestionsDTO> {
    try {
      const { data: quiz, error: quizError } = await this.supabase.from("quiz").select("*").eq("id", quizId).single();

      if (quizError) {
        throw quizError;
      }

      if (!quiz) {
        throw new QuizCreationError(`Quiz not found with id: ${quizId}`);
      }

      const { data: questions, error: questionsError } = await this.supabase
        .from("quiz_questions")
        .select("*, kanji(*)")
        .eq("quiz_id", quizId)
        .order("sequence", { ascending: true });

      if (questionsError) {
        throw questionsError;
      }

      const questionDTOs: QuizQuestionDTO[] = (questions || []).map((q) => ({
        ...q,
        kanji: this.transformToKanjiDTO(q.kanji as unknown as KanjiEntity),
      }));

      return {
        ...quiz,
        questions: questionDTOs,
      };
    } catch (error) {
      throw new QuizCreationError("Failed to fetch complete quiz", error);
    }
  }

  /**
   * Transforms a kanji entity to DTO with properly typed arrays
   *
   * @param entity - Kanji entity from database
   * @returns KanjiDTO with typed readings and meanings
   */
  private transformToKanjiDTO(entity: KanjiEntity): KanjiDTO {
    return {
      ...entity,
      readings: this.jsonToStringArray(entity.readings),
      meanings: this.jsonToStringArray(entity.meanings),
    };
  }

  /**
   * Safely converts Json type to string array
   *
   * @param json - Json value from database
   * @returns Array of strings, empty array if invalid
   */
  private jsonToStringArray(json: unknown): string[] {
    if (Array.isArray(json)) {
      return json.filter((item): item is string => typeof item === "string");
    }
    return [];
  }

  /**
   * Retrieves a paginated list of quizzes for a user with optional status filtering
   *
   * Process:
   * 1. Build base query filtering by user_id
   * 2. Apply optional status filter
   * 3. Order by created_at DESC (most recent first)
   * 4. Apply pagination (limit and offset)
   * 5. Execute query with count for pagination metadata
   * 6. Return quizzes with total count
   *
   * @param params - Quiz list parameters with pagination and filtering
   * @returns QuizListResult with quizzes array and total count
   * @throws QuizCreationError if database query fails
   */
  async getQuizList(params: GetQuizListParams): Promise<QuizListResult> {
    const { userId, status, limit, offset } = params;

    try {
      let query = this.supabase
        .from("quiz")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      query = query.range(offset, offset + limit - 1);

      const { data, count, error } = await query;

      if (error) {
        throw error;
      }

      return {
        quizzes: data || [],
        total: count || 0,
      };
    } catch (error) {
      throw new QuizCreationError("Failed to retrieve quiz list", error);
    }
  }

  /**
   * Completes a quiz after all questions have been answered
   *
   * Process:
   * 1. Fetch quiz record and verify ownership
   * 2. Verify quiz is in completable state (status = 'in_progress')
   * 3. Fetch all questions and verify all are answered
   * 4. Calculate score percentage based on correct answers
   * 5. Update quiz with completion data (status, score, completed_at)
   * 6. Return updated quiz
   *
   * @param quizId - Quiz ID to complete
   * @param userId - User ID for authorization
   * @returns QuizDTO with completion data
   * @throws QuizNotFoundError if quiz doesn't exist
   * @throws QuizAccessDeniedError if user doesn't own the quiz
   * @throws QuizAlreadyCompletedError if quiz is already completed
   * @throws IncompleteQuizError if not all questions are answered
   * @throws QuizCompletionError if database operation fails
   */
  async completeQuiz(quizId: number, userId: string): Promise<QuizDTO> {
    try {
      // Step 1: Fetch quiz and verify ownership
      const { data: quiz, error: quizError } = await this.supabase
        .from("quiz")
        .select("*")
        .eq("id", quizId)
        .eq("user_id", userId)
        .single();

      if (quizError || !quiz) {
        // Check if quiz exists at all (without user filter)
        const { data: quizCheck, error: checkError } = await this.supabase
          .from("quiz")
          .select("id")
          .eq("id", quizId)
          .single();

        if (checkError || !quizCheck) {
          throw new QuizNotFoundError(quizId);
        }

        // Quiz exists but user doesn't own it
        throw new QuizAccessDeniedError(quizId, userId);
      }

      // Step 2: Verify quiz is in completable state
      if (quiz.status === "completed") {
        throw new QuizAlreadyCompletedError(
          quizId,
          quiz.completed_at?.toString() || "",
          Number(quiz.score_percent) || 0
        );
      }

      // Step 3: Fetch questions and verify all are answered
      const { data: questionsStats, error: statsError } = await this.supabase
        .from("quiz_questions")
        .select("user_answer, is_correct")
        .eq("quiz_id", quizId);

      if (statsError) {
        throw new QuizCompletionError("Failed to fetch quiz questions", statsError);
      }

      const questions = questionsStats || [];
      const totalQuestions = questions.length;
      const answeredQuestions = questions.filter((q) => q.user_answer !== null).length;

      if (answeredQuestions < totalQuestions) {
        throw new IncompleteQuizError(totalQuestions, answeredQuestions);
      }

      // Step 4: Calculate score percentage
      const correctAnswers = questions.filter((q) => q.is_correct === true).length;
      const scorePercent = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      const roundedScore = Number(scorePercent.toFixed(2));

      // Step 5: Update quiz with completion data
      const { data: updatedQuiz, error: updateError } = await this.supabase
        .from("quiz")
        .update({
          status: "completed",
          score_percent: roundedScore,
          completed_at: new Date().toISOString(),
        })
        .eq("id", quizId)
        .eq("user_id", userId)
        .select()
        .single();

      if (updateError || !updatedQuiz) {
        throw new QuizCompletionError("Failed to update quiz completion status", updateError);
      }

      return updatedQuiz;
    } catch (error) {
      // Re-throw known error types
      if (
        error instanceof QuizNotFoundError ||
        error instanceof QuizAccessDeniedError ||
        error instanceof QuizAlreadyCompletedError ||
        error instanceof IncompleteQuizError ||
        error instanceof QuizCompletionError
      ) {
        throw error;
      }

      // Wrap unknown errors
      throw new QuizCompletionError("Unexpected error during quiz completion", error);
    }
  }

  /**
   * Abandons an in-progress quiz
   *
   * Process:
   * 1. Fetch quiz and verify ownership
   * 2. Verify quiz is in abandonable state (status = 'in_progress')
   * 3. Update quiz status to 'abandoned'
   * 4. Return updated quiz
   *
   * @param quizId - Quiz ID to abandon
   * @param userId - User ID for authorization
   * @returns QuizDTO with updated status
   * @throws QuizNotFoundError if quiz doesn't exist
   * @throws QuizAccessDeniedError if user doesn't own the quiz
   * @throws QuizNotAbandonableError if quiz is already completed or abandoned
   * @throws QuizAbandonmentError if database operation fails
   */
  async abandonQuiz(quizId: number, userId: string): Promise<QuizDTO> {
    try {
      // Step 1: Fetch quiz and verify ownership
      const { data: quiz, error: quizError } = await this.supabase
        .from("quiz")
        .select("*")
        .eq("id", quizId)
        .eq("user_id", userId)
        .single();

      if (quizError || !quiz) {
        // Check if quiz exists at all (without user filter)
        const { data: quizCheck, error: checkError } = await this.supabase
          .from("quiz")
          .select("id")
          .eq("id", quizId)
          .single();

        if (checkError || !quizCheck) {
          throw new QuizNotFoundError(quizId);
        }

        // Quiz exists but user doesn't own it
        throw new QuizAccessDeniedError(quizId, userId);
      }

      // Step 2: Verify quiz is in abandonable state
      if (quiz.status !== "in_progress") {
        throw new QuizNotAbandonableError(quizId, quiz.status);
      }

      // Step 3: Update quiz status to 'abandoned'
      const { data: updatedQuiz, error: updateError } = await this.supabase
        .from("quiz")
        .update({
          status: "abandoned",
        })
        .eq("id", quizId)
        .eq("user_id", userId)
        .select()
        .single();

      if (updateError || !updatedQuiz) {
        throw new QuizAbandonmentError("Failed to update quiz abandonment status", updateError);
      }

      return updatedQuiz;
    } catch (error) {
      // Re-throw known error types
      if (
        error instanceof QuizNotFoundError ||
        error instanceof QuizAccessDeniedError ||
        error instanceof QuizNotAbandonableError ||
        error instanceof QuizAbandonmentError
      ) {
        throw error;
      }

      // Wrap unknown errors
      throw new QuizAbandonmentError("Unexpected error during quiz abandonment", error);
    }
  }

  /**
   * Submits an answer for a specific quiz question
   *
   * Process:
   * 1. Fetch and validate quiz (ownership, status)
   * 2. Fetch and validate question (existence, not answered)
   * 3. Verify question belongs to quiz
   * 4. Validate answer (case-insensitive comparison)
   * 5. Update question record (answer, timestamp, correctness)
   * 6. Fetch updated question with kanji data
   * 7. Build and return response with feedback
   *
   * @param quizId - Quiz ID
   * @param questionId - Question ID
   * @param userAnswer - User's submitted answer (already trimmed)
   * @param userId - User ID for authorization
   * @returns QuestionAnswerResponseDTO with feedback
   * @throws QuizNotFoundError if quiz doesn't exist
   * @throws QuizAccessDeniedError if user doesn't own the quiz
   * @throws QuizInvalidStateError if quiz is not in progress
   * @throws QuestionNotFoundError if question doesn't exist or doesn't belong to quiz
   * @throws QuestionAlreadyAnsweredError if question has already been answered
   * @throws AnswerSubmissionError if database operation fails
   */
  async submitAnswer(
    quizId: number,
    questionId: number,
    userAnswer: string,
    userId: string
  ): Promise<QuestionAnswerResponseDTO> {
    try {
      // Step 1: Fetch and validate quiz
      const { data: quiz, error: quizError } = await this.supabase
        .from("quiz")
        .select("*")
        .eq("id", quizId)
        .eq("user_id", userId)
        .single();

      if (quizError || !quiz) {
        // Check if quiz exists at all (without user filter)
        const { data: quizCheck, error: checkError } = await this.supabase
          .from("quiz")
          .select("id")
          .eq("id", quizId)
          .single();

        if (checkError || !quizCheck) {
          throw new QuizNotFoundError(quizId);
        }

        // Quiz exists but user doesn't own it
        throw new QuizAccessDeniedError(quizId, userId);
      }

      // Validate quiz status is 'in_progress'
      if (quiz.status !== "in_progress") {
        throw new QuizInvalidStateError(quizId, quiz.status);
      }

      // Step 2: Fetch question with kanji data
      const { data: questionData, error: questionError } = await this.supabase
        .from("quiz_questions")
        .select("*, kanji(*)")
        .eq("id", questionId)
        .single();

      if (questionError || !questionData) {
        throw new QuestionNotFoundError(questionId, quizId);
      }

      // Step 3: Verify question belongs to quiz
      if (questionData.quiz_id !== quizId) {
        throw new QuestionNotFoundError(questionId, quizId);
      }

      // Check if already answered
      if (questionData.user_answer !== null || questionData.answered_at !== null) {
        throw new QuestionAlreadyAnsweredError(questionId, questionData.answered_at?.toString() || "unknown");
      }

      // Extract kanji data
      const kanjiEntity = questionData.kanji as unknown as KanjiEntity;
      const kanjiDTO = this.transformToKanjiDTO(kanjiEntity);

      // Step 4: Validate answer
      const isCorrect = this.validateAnswer(
        userAnswer,
        questionData.question_type,
        kanjiDTO.readings,
        kanjiDTO.meanings
      );

      // Step 5: Update question record
      const { data: updatedQuestion, error: updateError } = await this.supabase
        .from("quiz_questions")
        .update({
          user_answer: userAnswer,
          answered_at: new Date().toISOString(),
          is_correct: isCorrect,
        })
        .eq("id", questionId)
        .select("*, kanji(*)")
        .single();

      if (updateError || !updatedQuestion) {
        throw new AnswerSubmissionError("Failed to update question with answer", updateError);
      }

      // Step 6: Build response with feedback
      const updatedKanjiEntity = updatedQuestion.kanji as unknown as KanjiEntity;
      const updatedKanjiDTO = this.transformToKanjiDTO(updatedKanjiEntity);

      const correctAnswers = this.getCorrectAnswers(
        updatedQuestion.question_type,
        updatedKanjiDTO.readings,
        updatedKanjiDTO.meanings
      );

      const response: QuestionAnswerResponseDTO = {
        ...updatedQuestion,
        kanji: updatedKanjiDTO,
        feedback: {
          is_correct: isCorrect,
          correct_answers: correctAnswers,
        },
      };

      return response;
    } catch (error) {
      // Re-throw known error types
      if (
        error instanceof QuizNotFoundError ||
        error instanceof QuizAccessDeniedError ||
        error instanceof QuizInvalidStateError ||
        error instanceof QuestionNotFoundError ||
        error instanceof QuestionAlreadyAnsweredError ||
        error instanceof AnswerSubmissionError
      ) {
        throw error;
      }

      // Wrap unknown errors
      throw new AnswerSubmissionError("Unexpected error during answer submission", error);
    }
  }

  /**
   * Validates a user's answer against correct answers
   *
   * Performs case-insensitive comparison after trimming whitespace
   *
   * @param userAnswer - User's submitted answer (already trimmed)
   * @param questionType - Type of question (reading or meaning)
   * @param kanjiReadings - Array of correct readings
   * @param kanjiMeanings - Array of correct meanings
   * @returns true if answer matches any correct answer
   */
  private validateAnswer(
    userAnswer: string,
    questionType: QuestionType,
    kanjiReadings: string[],
    kanjiMeanings: string[]
  ): boolean {
    const normalizedUserAnswer = userAnswer.toLowerCase().trim();
    const correctAnswers = this.getCorrectAnswers(questionType, kanjiReadings, kanjiMeanings);
    const normalizedCorrectAnswers = correctAnswers.map((answer) => answer.toLowerCase().trim());

    return normalizedCorrectAnswers.includes(normalizedUserAnswer);
  }

  /**
   * Gets the correct answers based on question type
   *
   * @param questionType - Type of question (reading or meaning)
   * @param kanjiReadings - Array of kanji readings
   * @param kanjiMeanings - Array of kanji meanings
   * @returns Array of correct answers for the question type
   */
  private getCorrectAnswers(questionType: QuestionType, kanjiReadings: string[], kanjiMeanings: string[]): string[] {
    return questionType === "reading" ? kanjiReadings : kanjiMeanings;
  }

  /**
   * Retrieves a single quiz by ID with complete details including all questions and kanji data
   *
   * Process:
   * 1. Query quiz by ID and user_id for ownership verification
   * 2. If not found, check if quiz exists without user filter
   * 3. Throw appropriate error (QuizNotFoundError or QuizAccessDeniedError)
   * 4. Query quiz_questions with JOIN to kanji table
   * 5. Transform kanji entities to DTOs with typed arrays
   * 6. Order questions by sequence
   * 7. Return complete quiz with embedded questions and kanji data
   *
   * @param quizId - Quiz ID to retrieve
   * @param userId - User ID for authorization
   * @returns QuizWithQuestionsDTO with all questions and embedded kanji data
   * @throws QuizNotFoundError if quiz doesn't exist
   * @throws QuizAccessDeniedError if user doesn't own the quiz
   * @throws QuizCreationError if database operation fails
   */
  async getQuizById(quizId: number, userId: string): Promise<QuizWithQuestionsDTO> {
    try {
      // Step 1: Query quiz by ID and user_id for ownership verification
      const { data: quiz, error: quizError } = await this.supabase
        .from("quiz")
        .select("*")
        .eq("id", quizId)
        .eq("user_id", userId)
        .single();

      if (quizError || !quiz) {
        // Step 2: Check if quiz exists at all (without user filter)
        const { data: quizCheck, error: checkError } = await this.supabase
          .from("quiz")
          .select("id")
          .eq("id", quizId)
          .single();

        if (checkError || !quizCheck) {
          // Step 3: Quiz doesn't exist at all
          throw new QuizNotFoundError(quizId);
        }

        // Quiz exists but user doesn't own it
        throw new QuizAccessDeniedError(quizId, userId);
      }

      // Step 4: Query quiz_questions with JOIN to kanji table
      const { data: questions, error: questionsError } = await this.supabase
        .from("quiz_questions")
        .select("*, kanji(*)")
        .eq("quiz_id", quizId)
        .order("sequence", { ascending: true });

      if (questionsError) {
        throw new QuizCreationError("Failed to fetch quiz questions", questionsError);
      }

      // Step 5: Transform kanji entities to DTOs
      const questionDTOs: QuizQuestionDTO[] = (questions || []).map((q) => ({
        ...q,
        kanji: this.transformToKanjiDTO(q.kanji as unknown as KanjiEntity),
      }));

      // Step 6 & 7: Return complete quiz with questions ordered by sequence
      return {
        ...quiz,
        questions: questionDTOs,
      };
    } catch (error) {
      // Re-throw known error types
      if (
        error instanceof QuizNotFoundError ||
        error instanceof QuizAccessDeniedError ||
        error instanceof QuizCreationError
      ) {
        throw error;
      }

      // Wrap unknown errors
      throw new QuizCreationError("Failed to retrieve quiz", error);
    }
  }
}
