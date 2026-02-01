/**
 * QuizCreationSection - Hosts two cards for quiz setup and start actions
 */

import LevelQuizCard from "./LevelQuizCard";
import NeedReviewQuizCard from "./NeedReviewQuizCard";
import type { LevelQuizFormState, NeedReviewQuizFormState } from "./types/dashboard.types";

interface QuizCreationSectionProps {
  levelForm: LevelQuizFormState;
  needReviewForm: NeedReviewQuizFormState;
  onStartLevelQuiz: () => void;
  onStartNeedReviewQuiz: () => void;
  onLevelFormChange: (formState: Partial<LevelQuizFormState>) => void;
  onNeedReviewFormChange: (formState: Partial<NeedReviewQuizFormState>) => void;
  levelQuizError?: string;
  needReviewQuizError?: string;
}

export default function QuizCreationSection({
  levelForm,
  needReviewForm,
  onStartLevelQuiz,
  onStartNeedReviewQuiz,
  onLevelFormChange,
  onNeedReviewFormChange,
  levelQuizError,
  needReviewQuizError,
}: QuizCreationSectionProps) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Start a Quiz</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LevelQuizCard
          formState={levelForm}
          onChange={onLevelFormChange}
          onSubmit={onStartLevelQuiz}
          errorMessage={levelQuizError}
        />
        <NeedReviewQuizCard
          formState={needReviewForm}
          onChange={onNeedReviewFormChange}
          onSubmit={onStartNeedReviewQuiz}
          errorMessage={needReviewQuizError}
        />
      </div>
    </section>
  );
}
