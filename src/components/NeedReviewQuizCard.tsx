/**
 * NeedReviewQuizCard - Need-review quiz configuration and start
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { NeedReviewQuizFormState } from "./types/dashboard.types";

interface NeedReviewQuizCardProps {
  formState: NeedReviewQuizFormState;
  onChange: (formState: Partial<NeedReviewQuizFormState>) => void;
  onSubmit: () => void;
  errorMessage?: string;
}

const QUESTION_COUNTS = [10, 20, 50] as const;

export default function NeedReviewQuizCard({ formState, onChange, onSubmit, errorMessage }: NeedReviewQuizCardProps) {
  const isValid =
    formState.questionCount !== null &&
    formState.questionCount <= formState.availableCount &&
    formState.availableCount > 0;
  const isDisabled = !isValid || formState.isSubmitting;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Need Review Quiz</CardTitle>
        <CardDescription>Practice kanji you&apos;ve marked for review</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Availability Info */}
        <div className="text-sm">
          <span className="text-gray-600">Available kanji: </span>
          <span className="font-semibold text-gray-900">{formState.availableCount}</span>
        </div>

        {/* Question Count Selection */}
        <div className="space-y-2">
          <label htmlFor="question-count-radio-group" className="text-sm font-medium">
            Number of Questions
          </label>
          <RadioGroup
            id="question-count-radio-group"
            value={formState.questionCount?.toString() || ""}
            onValueChange={(value) => onChange({ questionCount: parseInt(value) as 10 | 20 | 50 })}
            disabled={formState.isSubmitting || formState.availableCount === 0}
          >
            <div className="flex gap-4">
              {QUESTION_COUNTS.map((count) => {
                const isUnavailable = count > formState.availableCount;
                return (
                  <div key={count} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={count.toString()}
                      id={`need-review-count-${count}`}
                      disabled={isUnavailable || formState.availableCount === 0}
                    />
                    <label
                      htmlFor={`need-review-count-${count}`}
                      className={`text-sm font-medium cursor-pointer ${isUnavailable ? "text-gray-400" : ""}`}
                    >
                      {count}
                    </label>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div role="alert" className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
            {errorMessage}
          </div>
        )}

        {/* No Items Warning */}
        {formState.availableCount === 0 && (
          <div role="status" className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
            No kanji marked for review. Add some kanji to your review list first.
          </div>
        )}

        {/* Start Button */}
        <Button onClick={onSubmit} disabled={isDisabled} className="w-full" aria-label="Start need review quiz">
          {formState.isSubmitting ? "Starting..." : "Start Quiz"}
        </Button>
      </CardContent>
    </Card>
  );
}
