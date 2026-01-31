/**
 * Custom hooks for Dashboard data fetching
 */

import { useState, useEffect, useCallback } from "react";
import type {
  NeedReviewListResponseDTO,
  QuizListResponseDTO,
  CreateQuizCommandDTO,
  QuizWithQuestionsDTO,
  ErrorResponseDTO,
} from "../../types";

/**
 * Hook for fetching need-review list with pagination
 */
export function useNeedReviewList({ limit, offset }: { limit: number; offset: number }) {
  const [data, setData] = useState<NeedReviewListResponseDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const startTime = Date.now();
    const minLoadingTime = 300;

    try {
      const response = await fetch(`/api/need-reviews?limit=${limit}&offset=${offset}`);

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.error || "Failed to fetch need-review list");
      }

      const result: NeedReviewListResponseDTO = await response.json();

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      await new Promise((resolve) => setTimeout(resolve, remainingTime));

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

/**
 * Hook for fetching quiz history (completed quizzes)
 */
export function useQuizHistory({ limit, offset }: { limit: number; offset: number }) {
  const [data, setData] = useState<QuizListResponseDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const startTime = Date.now();
    const minLoadingTime = 300;

    try {
      const response = await fetch(`/api/quizzes?status=completed&limit=${limit}&offset=${offset}`);

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.error || "Failed to fetch quiz history");
      }

      const result: QuizListResponseDTO = await response.json();

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      await new Promise((resolve) => setTimeout(resolve, remainingTime));

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

/**
 * Hook for starting a quiz (creating a new quiz)
 */
export function useStartQuiz() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponseDTO | null>(null);

  const startQuiz = useCallback(async (command: CreateQuizCommandDTO): Promise<QuizWithQuestionsDTO | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        setError(errorData);
        return null;
      }

      const result: QuizWithQuestionsDTO = await response.json();
      return result;
    } catch (err) {
      setError({
        error: err instanceof Error ? err.message : "An unexpected error occurred",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { startQuiz, loading, error };
}

/**
 * Hook for removing a kanji from need-review list
 */
export function useRemoveNeedReview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeKanji = useCallback(async (kanjiId: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/need-reviews/${kanjiId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.error || "Failed to remove kanji from need-review list");
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { removeKanji, loading, error };
}
