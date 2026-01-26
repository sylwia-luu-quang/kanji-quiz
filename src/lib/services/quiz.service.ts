import type { SupabaseClient } from "../../db/supabase.client";
import type {
  QuizWithQuestionsDTO,
  QuizDTO,
  QuizQuestionDTO,
  JLPTLevel,
  QuizType,
  KanjiEntity,
  KanjiDTO,
  QuestionType,
} from "../../types";
import { InsufficientKanjiError, QuizCreationError } from "../errors/quiz.errors";

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
}
