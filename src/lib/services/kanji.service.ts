import type { SupabaseClient } from "../../db/supabase.client";
import type { KanjiDTO, KanjiEntity, KanjiListResponseDTO, JLPTLevel } from "../../types";

/**
 * Parameters for fetching kanji
 */
export interface GetKanjiParams {
  level?: JLPTLevel;
  limit: number;
  offset: number;
}

/**
 * Service for managing kanji data
 * Handles database queries, data transformation, and business logic
 */
export class KanjiService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Retrieves a paginated list of kanji with optional JLPT level filtering
   *
   * @param params - Query parameters (level, limit, offset)
   * @returns KanjiListResponseDTO with data and pagination metadata
   * @throws Error if database query fails
   */
  async getKanji(params: GetKanjiParams): Promise<KanjiListResponseDTO> {
    const { level, limit, offset } = params;

    // Build the query with optional level filter
    let query = this.supabase.from("kanji").select("*", { count: "exact" });

    // Apply level filter if provided
    if (level) {
      query = query.eq("level", level);
    }

    // Execute query with ordering and pagination
    const { data, error, count } = await query.order("id", { ascending: true }).range(offset, offset + limit - 1);

    // Handle database errors
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Database error in KanjiService.getKanji:", error);
      throw new Error("Failed to retrieve kanji data");
    }

    // Transform entities to DTOs
    const kanjiDTOs = this.transformToKanjiDTOs(data || []);

    // Build response with pagination metadata
    return {
      data: kanjiDTOs,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    };
  }

  /**
   * Transforms database entities to KanjiDTOs with properly typed arrays
   * Ensures readings and meanings are typed as string[] instead of Json
   *
   * @param entities - Array of kanji entities from database
   * @returns Array of KanjiDTOs with typed readings and meanings
   */
  private transformToKanjiDTOs(entities: KanjiEntity[]): KanjiDTO[] {
    return entities.map((entity) => ({
      ...entity,
      readings: this.jsonToStringArray(entity.readings),
      meanings: this.jsonToStringArray(entity.meanings),
    }));
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
