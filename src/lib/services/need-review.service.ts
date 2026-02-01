import type { SupabaseClient } from "../../db/supabase.client";
import type { NeedReviewDTO, KanjiDTO, KanjiEntity, NeedReviewEntity, NeedReviewListResponseDTO } from "../../types";
import { KanjiNotFoundError, NeedReviewCreationError } from "../errors/need-review.errors";

/**
 * Result structure for addNeedReview operation
 * Contains the need-review DTO and a flag indicating if it's a new entry
 */
export interface AddNeedReviewResult {
  needReview: NeedReviewDTO;
  isNewEntry: boolean;
}

/**
 * Parameters for fetching need-review list
 */
export interface GetNeedReviewListParams {
  limit: number;
  offset: number;
}

/**
 * Database entity structure for need_reviews joined with kanji
 */
interface NeedReviewWithKanji extends NeedReviewEntity {
  kanji: KanjiEntity;
}

/**
 * Service for managing need-review operations
 * Handles adding kanji to user's need-review list with idempotent behavior
 */
export class NeedReviewService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Retrieves a paginated list of user's need-review entries with embedded kanji details
   *
   * Process:
   * 1. First get total count for the user
   * 2. If offset >= total, return empty array (valid pagination edge case)
   * 3. Query need_reviews table filtered by user_id
   * 4. JOIN with kanji table to get complete kanji details
   * 5. Apply pagination (limit, offset)
   * 6. Order by created_at DESC (most recent first)
   * 7. Transform results to DTOs
   *
   * @param userId - ID of the authenticated user
   * @param params - Pagination parameters (limit, offset)
   * @returns NeedReviewListResponseDTO with data and pagination metadata
   * @throws Error if database query fails
   */
  async getNeedReviewList(userId: string, params: GetNeedReviewListParams): Promise<NeedReviewListResponseDTO> {
    const { limit, offset } = params;

    // First, get the total count
    const { count: totalCount, error: countError } = await this.supabase
      .from("need_reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) {
      // eslint-disable-next-line no-console
      console.error("Database error in NeedReviewService.getNeedReviewList (count):", countError);
      throw new Error("Failed to retrieve need-review list");
    }

    const total = totalCount || 0;

    // If offset is beyond total, return empty result (valid pagination edge case)
    if (offset >= total && total > 0) {
      return {
        data: [],
        pagination: {
          total,
          limit,
          offset,
        },
      };
    }

    // Build query with JOIN to kanji table
    const { data, error } = await this.supabase
      .from("need_reviews")
      .select(
        `
        id,
        user_id,
        kanji_id,
        created_at,
        kanji:kanji_id (
          id,
          character,
          level,
          readings,
          meanings,
          created_at
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Handle database errors
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Database error in NeedReviewService.getNeedReviewList:", error);
      throw new Error("Failed to retrieve need-review list");
    }

    // Transform entities to DTOs
    const needReviewDTOs = (data || []).map((item) => this.transformToNeedReviewDTO(item as NeedReviewWithKanji));

    // Build response with pagination metadata
    return {
      data: needReviewDTOs,
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  /**
   * Adds a kanji to the user's need-review list (idempotent operation)
   *
   * Process:
   * 1. Verify kanji exists in database
   * 2. Check if entry already exists for this user and kanji
   * 3. If exists: Return existing entry with isNewEntry=false
   * 4. If not: Insert new entry and return with isNewEntry=true
   * 5. Return complete data with embedded kanji details
   *
   * @param userId - ID of the authenticated user
   * @param kanjiId - ID of the kanji to add to need-review list
   * @returns AddNeedReviewResult with needReview DTO and isNewEntry flag
   * @throws KanjiNotFoundError if specified kanji doesn't exist
   * @throws NeedReviewCreationError if database operation fails
   */
  async addNeedReview(userId: string, kanjiId: number): Promise<AddNeedReviewResult> {
    // Step 1: Verify kanji exists
    await this.verifyKanjiExists(kanjiId);

    // Step 2: Check for existing entry (idempotent check)
    const existing = await this.fetchExistingNeedReview(userId, kanjiId);

    if (existing) {
      // Entry already exists, return it with isNewEntry=false
      return {
        needReview: existing,
        isNewEntry: false,
      };
    }

    // Step 3: Create new entry
    const newNeedReview = await this.insertNeedReview(userId, kanjiId);

    return {
      needReview: newNeedReview,
      isNewEntry: true,
    };
  }

  /**
   * Verifies that a kanji exists in the database
   *
   * @param kanjiId - ID of the kanji to verify
   * @throws KanjiNotFoundError if kanji doesn't exist
   */
  private async verifyKanjiExists(kanjiId: number): Promise<void> {
    const { data, error } = await this.supabase.from("kanji").select("id").eq("id", kanjiId).maybeSingle();

    if (error) {
      throw new NeedReviewCreationError("Failed to verify kanji existence", error);
    }

    if (!data) {
      throw new KanjiNotFoundError(kanjiId);
    }
  }

  /**
   * Fetches an existing need-review entry if it exists
   *
   * @param userId - User ID to check
   * @param kanjiId - Kanji ID to check
   * @returns NeedReviewDTO if found, null if not found
   * @throws NeedReviewCreationError if database query fails
   */
  private async fetchExistingNeedReview(userId: string, kanjiId: number): Promise<NeedReviewDTO | null> {
    const { data, error } = await this.supabase
      .from("need_reviews")
      .select(
        `
        id,
        user_id,
        kanji_id,
        created_at,
        kanji:kanji_id (
          id,
          character,
          level,
          readings,
          meanings,
          created_at
        )
      `
      )
      .eq("user_id", userId)
      .eq("kanji_id", kanjiId)
      .maybeSingle();

    if (error) {
      throw new NeedReviewCreationError("Failed to check existing need-review entry", error);
    }

    if (!data) {
      return null;
    }

    return this.transformToNeedReviewDTO(data as NeedReviewWithKanji);
  }

  /**
   * Inserts a new need-review entry into the database
   *
   * @param userId - User ID
   * @param kanjiId - Kanji ID
   * @returns NeedReviewDTO with complete data
   * @throws NeedReviewCreationError if insertion fails
   */
  private async insertNeedReview(userId: string, kanjiId: number): Promise<NeedReviewDTO> {
    // Insert the new need-review entry
    const { data: insertData, error: insertError } = await this.supabase
      .from("need_reviews")
      .insert({
        user_id: userId,
        kanji_id: kanjiId,
      })
      .select()
      .single();

    if (insertError || !insertData) {
      throw new NeedReviewCreationError("Failed to create need-review entry", insertError);
    }

    // Fetch complete data with kanji details
    const { data, error } = await this.supabase
      .from("need_reviews")
      .select(
        `
        id,
        user_id,
        kanji_id,
        created_at,
        kanji:kanji_id (
          id,
          character,
          level,
          readings,
          meanings,
          created_at
        )
      `
      )
      .eq("id", insertData.id)
      .single();

    if (error || !data) {
      throw new NeedReviewCreationError("Failed to fetch created need-review entry", error);
    }

    return this.transformToNeedReviewDTO(data as NeedReviewWithKanji);
  }

  /**
   * Transforms database entity to NeedReviewDTO with embedded KanjiDTO
   *
   * @param entity - Database entity with joined kanji data
   * @returns Properly typed NeedReviewDTO
   */
  private transformToNeedReviewDTO(entity: NeedReviewWithKanji): NeedReviewDTO {
    const kanjiDTO: KanjiDTO = {
      id: entity.kanji.id,
      character: entity.kanji.character,
      level: entity.kanji.level,
      readings: this.jsonToStringArray(entity.kanji.readings),
      meanings: this.jsonToStringArray(entity.kanji.meanings),
      created_at: entity.kanji.created_at,
    };

    return {
      id: entity.id,
      user_id: entity.user_id,
      kanji_id: entity.kanji_id,
      created_at: entity.created_at,
      kanji: kanjiDTO,
    };
  }

  /**
   * Removes a kanji from the user's need-review list (idempotent operation)
   *
   * This operation is idempotent - it always succeeds regardless of whether:
   * - The kanji was successfully removed (existed in list)
   * - The kanji was not in the user's list (already absent)
   * - The kanji ID doesn't exist in the kanji table
   *
   * Process:
   * 1. Execute DELETE query filtered by user_id AND kanji_id
   * 2. Return success regardless of rows affected (idempotent behavior)
   * 3. Only throw error if database operation itself fails
   *
   * @param userId - ID of the authenticated user
   * @param kanjiId - ID of the kanji to remove from need-review list
   * @throws Error if database operation fails
   */
  async removeNeedReview(userId: string, kanjiId: number): Promise<void> {
    const { error } = await this.supabase.from("need_reviews").delete().eq("user_id", userId).eq("kanji_id", kanjiId);

    // Only throw error if database operation failed
    // Do NOT throw error if 0 rows deleted (idempotent behavior)
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Database error in NeedReviewService.removeNeedReview:", {
        userId,
        kanjiId,
        error,
        timestamp: new Date().toISOString(),
      });
      throw new Error("Failed to remove kanji from need-review list");
    }

    // Success - return void (no need to check row count)
  }

  /**
   * Safely converts Json type to string array
   * Filters out any non-string items and handles invalid data
   *
   * @param json - Json data from database (unknown type)
   * @returns String array (empty if invalid)
   */
  private jsonToStringArray(json: unknown): string[] {
    if (!Array.isArray(json)) {
      return [];
    }

    return json.filter((item): item is string => typeof item === "string");
  }
}
