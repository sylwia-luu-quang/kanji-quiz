/**
 * LevelQuizCard - Level-based quiz configuration and start
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { LevelQuizFormState } from "./types/dashboard.types";
import type { JLPTLevel } from "../types";

interface LevelQuizCardProps {
  formState: LevelQuizFormState;
  onChange: (formState: Partial<LevelQuizFormState>) => void;
  onSubmit: () => void;
  errorMessage?: string;
}

const JLPT_LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];
const QUESTION_COUNTS = [10, 20, 50] as const;

export default function LevelQuizCard({ formState, onChange, onSubmit, errorMessage }: LevelQuizCardProps) {
  const isValid = formState.level !== "" && formState.questionCount !== null;
  const isDisabled = !isValid || formState.isSubmitting;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Level Quiz</CardTitle>
        <CardDescription>Practice kanji from a specific JLPT level</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Level Selection */}
        <div className="space-y-2">
          <label htmlFor="level-select" className="text-sm font-medium">
            JLPT Level
          </label>
          <Select
            value={formState.level}
            onValueChange={(value) => onChange({ level: value as JLPTLevel })}
            disabled={formState.isSubmitting}
          >
            <SelectTrigger id="level-select">
              <SelectValue placeholder="Select a level" />
            </SelectTrigger>
            <SelectContent>
              {JLPT_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            disabled={formState.isSubmitting}
          >
            <div className="flex gap-4">
              {QUESTION_COUNTS.map((count) => (
                <div key={count} className="flex items-center space-x-2">
                  <RadioGroupItem value={count.toString()} id={`level-count-${count}`} />
                  <label htmlFor={`level-count-${count}`} className="text-sm font-medium cursor-pointer">
                    {count}
                  </label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div role="alert" className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
            {errorMessage}
          </div>
        )}

        {/* Start Button */}
        <Button onClick={onSubmit} disabled={isDisabled} className="w-full" aria-label="Start level quiz">
          {formState.isSubmitting ? "Starting..." : "Start Quiz"}
        </Button>
      </CardContent>
    </Card>
  );
}
