/**
 * DashboardLayout - Main orchestrator component for the Dashboard view
 */

import { useState, useCallback, useEffect } from "react";
import DashboardHeader from "./DashboardHeader";
import QuizCreationSection from "./QuizCreationSection";
import NeedReviewListSection from "./NeedReviewListSection";
import HistorySection from "./HistorySection";
import type {
  DashboardViewState,
  LevelQuizFormState,
  NeedReviewQuizFormState,
  NeedReviewListItemVM,
  HistoryItemVM,
  PaginationState,
} from "./types/dashboard.types";
import type { CreateQuizCommandDTO, JLPTLevel } from "../types";
import { useNeedReviewList, useQuizHistory, useStartQuiz, useRemoveNeedReview } from "./hooks/useDashboardData";

interface DashboardLayoutProps {
  userEmail: string;
}

export default function DashboardLayout({ userEmail }: DashboardLayoutProps) {
  // Pagination states
  const [needReviewPagination, setNeedReviewPagination] = useState<PaginationState>({
    limit: 10,
    offset: 0,
    total: 0,
  });

  const [historyPagination, setHistoryPagination] = useState<PaginationState>({
    limit: 10,
    offset: 0,
    total: 0,
  });

  // Form states
  const [levelForm, setLevelForm] = useState<LevelQuizFormState>({
    level: "",
    questionCount: null,
    isSubmitting: false,
  });

  const [needReviewForm, setNeedReviewForm] = useState<NeedReviewQuizFormState>({
    questionCount: null,
    availableCount: 0,
    isSubmitting: false,
  });

  // Data fetching hooks
  const {
    data: needReviewData,
    loading: needReviewLoading,
    error: needReviewError,
    refresh: refreshNeedReview,
  } = useNeedReviewList({
    limit: needReviewPagination.limit,
    offset: needReviewPagination.offset,
  });

  const {
    data: historyData,
    loading: historyLoading,
    error: historyError,
  } = useQuizHistory({
    limit: historyPagination.limit,
    offset: historyPagination.offset,
  });

  const { startQuiz, error: startQuizError } = useStartQuiz();
  const { removeKanji, loading: removeKanjiLoading } = useRemoveNeedReview();

  // Update available count when need-review data changes
  useEffect(() => {
    if (needReviewData) {
      setNeedReviewForm((prev) => ({
        ...prev,
        availableCount: needReviewData.pagination.total,
      }));
      setNeedReviewPagination((prev) => ({
        ...prev,
        total: needReviewData.pagination.total,
      }));
    }
  }, [needReviewData]);

  // Update history pagination when data changes
  useEffect(() => {
    if (historyData) {
      setHistoryPagination((prev) => ({
        ...prev,
        total: historyData.pagination.total,
      }));
    }
  }, [historyData]);

  // Transform DTOs to ViewModels
  const needReviewList: NeedReviewListItemVM[] =
    needReviewData?.data.map((item) => ({
      id: item.id,
      kanjiId: item.kanji_id,
      character: item.kanji.character,
      level: item.kanji.level,
      readings: item.kanji.readings,
      meanings: item.kanji.meanings,
      createdAt: item.created_at,
    })) || [];

  const historyList: HistoryItemVM[] =
    historyData?.data.map((item) => ({
      id: item.id,
      type: item.type,
      level: item.level,
      questionCount: item.question_count,
      scorePercent: item.score_percent,
      createdAt: item.created_at,
      completedAt: item.completed_at,
    })) || [];

  // Handlers
  const handleStartLevelQuiz = useCallback(async () => {
    if (!levelForm.level || !levelForm.questionCount) {
      return;
    }

    setLevelForm((prev) => ({ ...prev, isSubmitting: true }));

    const command: CreateQuizCommandDTO = {
      type: "level",
      level: levelForm.level as JLPTLevel,
      question_count: levelForm.questionCount,
    };

    const result = await startQuiz(command);

    setLevelForm((prev) => ({ ...prev, isSubmitting: false }));

    if (result) {
      // Navigate to quiz page
      window.location.href = `/quiz/${result.id}`;
    }
  }, [levelForm, startQuiz]);

  const handleStartNeedReviewQuiz = useCallback(async () => {
    if (!needReviewForm.questionCount || needReviewForm.questionCount > needReviewForm.availableCount) {
      return;
    }

    setNeedReviewForm((prev) => ({ ...prev, isSubmitting: true }));

    const command: CreateQuizCommandDTO = {
      type: "need_review",
      question_count: needReviewForm.questionCount,
    };

    const result = await startQuiz(command);

    setNeedReviewForm((prev) => ({ ...prev, isSubmitting: false }));

    if (result) {
      // Navigate to quiz page
      window.location.href = `/quiz/${result.id}`;
    }
  }, [needReviewForm, startQuiz]);

  const handleRemoveNeedReview = useCallback(
    async (kanjiId: number) => {
      const success = await removeKanji(kanjiId);
      if (success) {
        // Refresh the list after successful removal
        refreshNeedReview();
      }
    },
    [removeKanji, refreshNeedReview]
  );

  const handleNeedReviewPaginationChange = useCallback((newPagination: PaginationState) => {
    setNeedReviewPagination(newPagination);
  }, []);

  const handleHistoryPaginationChange = useCallback((newPagination: PaginationState) => {
    setHistoryPagination(newPagination);
  }, []);

  const handleLevelFormChange = useCallback((changes: Partial<LevelQuizFormState>) => {
    setLevelForm((prev) => ({ ...prev, ...changes }));
  }, []);

  const handleNeedReviewFormChange = useCallback((changes: Partial<NeedReviewQuizFormState>) => {
    setNeedReviewForm((prev) => ({ ...prev, ...changes }));
  }, []);

  // Build view state
  const viewState: DashboardViewState = {
    levelForm,
    needReviewForm,
    needReviewList,
    historyList,
    needReviewPagination,
    historyPagination,
    loading: {
      needReview: needReviewLoading,
      history: historyLoading,
    },
    errors: {
      needReview: needReviewError || undefined,
      history: historyError || undefined,
      levelQuiz: startQuizError?.code === "INSUFFICIENT_KANJI" ? startQuizError.error : undefined,
      needReviewQuiz: startQuizError?.code === "INSUFFICIENT_KANJI" ? startQuizError.error : undefined,
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader email={userEmail} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Quiz Creation Section */}
        <QuizCreationSection
          levelForm={levelForm}
          needReviewForm={needReviewForm}
          onStartLevelQuiz={handleStartLevelQuiz}
          onStartNeedReviewQuiz={handleStartNeedReviewQuiz}
          onLevelFormChange={handleLevelFormChange}
          onNeedReviewFormChange={handleNeedReviewFormChange}
          levelQuizError={viewState.errors.levelQuiz}
          needReviewQuizError={viewState.errors.needReviewQuiz}
        />

        {/* Need Review List Section */}
        <NeedReviewListSection
          items={needReviewList}
          pagination={needReviewPagination}
          onRemove={handleRemoveNeedReview}
          onPaginate={handleNeedReviewPaginationChange}
          isLoading={needReviewLoading}
          isDeleting={removeKanjiLoading}
          error={viewState.errors.needReview}
        />

        {/* History Section */}
        <HistorySection
          items={historyList}
          pagination={historyPagination}
          onPaginate={handleHistoryPaginationChange}
          isLoading={historyLoading}
          error={viewState.errors.history}
        />
      </div>
    </div>
  );
}
