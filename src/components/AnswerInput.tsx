/**
 * AnswerInput Component
 *
 * Input field with WanaKana binding for reading questions, plain for meaning questions
 * Supports Enter key to submit
 */

import { useEffect, useRef, useState } from "react";
import * as wanakana from "wanakana";
import type { QuestionType } from "@/types";

interface AnswerInputProps {
  questionType: QuestionType;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export function AnswerInput({ questionType, value, onChange, onSubmit, disabled }: AnswerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  useEffect(() => {
    const input = inputRef.current;
    if (questionType === "reading" && input) {
      wanakana.bind(input);

      if (!disabled) {
        input.focus();
      }

      return () => {
        wanakana.unbind(input);
      };
    } else if (!disabled && input) {
      input.focus();
    }
  }, [questionType, disabled]);

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    onChange(e.currentTarget.value);
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    onChange(e.currentTarget.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isComposing && !disabled) {
      const currentValue = e.currentTarget.value.trim();
      if (currentValue.length > 0) {
        e.preventDefault();
        onSubmit();
      }
    }
  };

  const placeholder = questionType === "reading" ? "Type in hiragana or katakana" : "Type the English meaning";

  const hintText = questionType === "reading" ? "Type in hiragana or katakana" : "Type the English meaning";

  return (
    <div className="space-y-2">
      <input
        data-testid="answer-input"
        ref={inputRef}
        type="text"
        defaultValue={value}
        onInput={handleInput}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-lg text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-blue-400 dark:focus:ring-blue-400 dark:disabled:bg-neutral-800"
        aria-label="Your answer"
        aria-describedby="answer-hint"
      />
      <p id="answer-hint" className="text-sm text-neutral-500 dark:text-neutral-400">
        {hintText}
      </p>
    </div>
  );
}
