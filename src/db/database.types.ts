export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      kanji: {
        Row: {
          character: string;
          created_at: string;
          id: number;
          level: Database["public"]["Enums"]["jlpt_level"];
          meanings: Json;
          readings: Json;
        };
        Insert: {
          character: string;
          created_at?: string;
          id?: number;
          level: Database["public"]["Enums"]["jlpt_level"];
          meanings: Json;
          readings: Json;
        };
        Update: {
          character?: string;
          created_at?: string;
          id?: number;
          level?: Database["public"]["Enums"]["jlpt_level"];
          meanings?: Json;
          readings?: Json;
        };
        Relationships: [];
      };
      need_reviews: {
        Row: {
          created_at: string;
          id: number;
          kanji_id: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          kanji_id: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          kanji_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "need_reviews_kanji_id_fkey";
            columns: ["kanji_id"];
            isOneToOne: false;
            referencedRelation: "kanji";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz: {
        Row: {
          completed_at: string | null;
          created_at: string;
          id: number;
          level: Database["public"]["Enums"]["jlpt_level"] | null;
          question_count: number;
          score_percent: number | null;
          status: Database["public"]["Enums"]["quiz_status"];
          type: Database["public"]["Enums"]["quiz_type"];
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          id?: number;
          level?: Database["public"]["Enums"]["jlpt_level"] | null;
          question_count: number;
          score_percent?: number | null;
          status?: Database["public"]["Enums"]["quiz_status"];
          type: Database["public"]["Enums"]["quiz_type"];
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          id?: number;
          level?: Database["public"]["Enums"]["jlpt_level"] | null;
          question_count?: number;
          score_percent?: number | null;
          status?: Database["public"]["Enums"]["quiz_status"];
          type?: Database["public"]["Enums"]["quiz_type"];
          user_id?: string;
        };
        Relationships: [];
      };
      quiz_questions: {
        Row: {
          answered_at: string | null;
          created_at: string;
          id: number;
          is_correct: boolean | null;
          kanji_id: number;
          question_type: Database["public"]["Enums"]["question_type"];
          quiz_id: number;
          sequence: number;
          user_answer: string | null;
        };
        Insert: {
          answered_at?: string | null;
          created_at?: string;
          id?: number;
          is_correct?: boolean | null;
          kanji_id: number;
          question_type: Database["public"]["Enums"]["question_type"];
          quiz_id: number;
          sequence: number;
          user_answer?: string | null;
        };
        Update: {
          answered_at?: string | null;
          created_at?: string;
          id?: number;
          is_correct?: boolean | null;
          kanji_id?: number;
          question_type?: Database["public"]["Enums"]["question_type"];
          quiz_id?: number;
          sequence?: number;
          user_answer?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_questions_kanji_id_fkey";
            columns: ["kanji_id"];
            isOneToOne: false;
            referencedRelation: "kanji";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quiz";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      user_quiz_stats: {
        Row: {
          avg_score: number | null;
          last_attempt_at: string | null;
          total_attempts: number | null;
          user_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<never, never>;
    Enums: {
      jlpt_level: "N5" | "N4" | "N3" | "N2" | "N1";
      question_type: "reading" | "meaning";
      quiz_status: "in_progress" | "completed" | "abandoned";
      quiz_type: "level" | "need_review";
    };
    CompositeTypes: Record<never, never>;
  };
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      jlpt_level: ["N5", "N4", "N3", "N2", "N1"],
      question_type: ["reading", "meaning"],
      quiz_status: ["in_progress", "completed", "abandoned"],
      quiz_type: ["level", "need_review"],
    },
  },
} as const;
