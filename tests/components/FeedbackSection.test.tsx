import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeedbackSection } from "@/components/FeedbackSection";
import type { QuestionFeedbackDTO } from "@/types";

/**
 * Unit tests for FeedbackSection component
 *
 * Tests cover:
 * - Component rendering with correct/incorrect states
 * - Conditional rendering of correct answers list
 * - Visual styling based on correctness
 * - Accessibility features (ARIA attributes)
 * - Edge cases (empty answers, multiple answers, single answer)
 */
describe("FeedbackSection", () => {
  describe("Rendering - Correct Answer", () => {
    const correctFeedback: QuestionFeedbackDTO = {
      is_correct: true,
      correct_answers: ["読む", "よむ"],
    };

    it("should render correct feedback with green styling", () => {
      // Arrange & Act
      const { container } = render(<FeedbackSection feedback={correctFeedback} />);

      // Assert - check for green styling classes
      const section = container.querySelector('[role="status"]');
      expect(section).toHaveClass("bg-green-50", "border-green-200");
    });

    it("should display correct indicator", () => {
      // Arrange & Act
      render(<FeedbackSection feedback={correctFeedback} />);

      // Assert
      expect(screen.getByText("Correct!")).toBeInTheDocument();
    });

    it("should not display correct answers list when answer is correct", () => {
      // Arrange & Act
      render(<FeedbackSection feedback={correctFeedback} />);

      // Assert - should not show "Correct answer(s):" heading
      expect(screen.queryByText(/Correct answer/i)).not.toBeInTheDocument();
    });
  });

  describe("Rendering - Incorrect Answer", () => {
    const incorrectFeedback: QuestionFeedbackDTO = {
      is_correct: false,
      correct_answers: ["読む", "よむ"],
    };

    it("should render incorrect feedback with red styling", () => {
      // Arrange & Act
      const { container } = render(<FeedbackSection feedback={incorrectFeedback} />);

      // Assert - check for red styling classes
      const section = container.querySelector('[role="status"]');
      expect(section).toHaveClass("bg-red-50", "border-red-200");
    });

    it("should display incorrect indicator", () => {
      // Arrange & Act
      render(<FeedbackSection feedback={incorrectFeedback} />);

      // Assert
      expect(screen.getByText("Incorrect")).toBeInTheDocument();
    });

    it("should display correct answers list when answer is incorrect", () => {
      // Arrange & Act
      render(<FeedbackSection feedback={incorrectFeedback} />);

      // Assert - should show heading and answers
      expect(screen.getByText("Correct answers:")).toBeInTheDocument();
      expect(screen.getByText("読む")).toBeInTheDocument();
      expect(screen.getByText("よむ")).toBeInTheDocument();
    });
  });

  describe("Correct Answers List - Edge Cases", () => {
    it("should display singular 'answer' when only one correct answer", () => {
      // Arrange
      const feedback: QuestionFeedbackDTO = {
        is_correct: false,
        correct_answers: ["意味"],
      };

      // Act
      render(<FeedbackSection feedback={feedback} />);

      // Assert - should say "Correct answer:" not "answers:"
      expect(screen.getByText("Correct answer:")).toBeInTheDocument();
      expect(screen.getByText("意味")).toBeInTheDocument();
    });

    it("should display plural 'answers' when multiple correct answers", () => {
      // Arrange
      const feedback: QuestionFeedbackDTO = {
        is_correct: false,
        correct_answers: ["読む", "よむ", "yomu"],
      };

      // Act
      render(<FeedbackSection feedback={feedback} />);

      // Assert - should say "Correct answers:" (plural)
      expect(screen.getByText("Correct answers:")).toBeInTheDocument();
      expect(screen.getByText("読む")).toBeInTheDocument();
      expect(screen.getByText("よむ")).toBeInTheDocument();
      expect(screen.getByText("yomu")).toBeInTheDocument();
    });

    it("should handle empty correct answers array gracefully", () => {
      // Arrange
      const feedback: QuestionFeedbackDTO = {
        is_correct: false,
        correct_answers: [],
      };

      // Act
      render(<FeedbackSection feedback={feedback} />);

      // Assert - should still show incorrect indicator but no answers list
      expect(screen.getByText("Incorrect")).toBeInTheDocument();
      expect(screen.queryByText(/Correct answer/i)).not.toBeInTheDocument();
    });

    it("should render all correct answers in a list", () => {
      // Arrange
      const feedback: QuestionFeedbackDTO = {
        is_correct: false,
        correct_answers: ["答え1", "答え2", "答え3", "答え4"],
      };

      // Act
      render(<FeedbackSection feedback={feedback} />);

      // Assert - all answers should be visible
      expect(screen.getByText("答え1")).toBeInTheDocument();
      expect(screen.getByText("答え2")).toBeInTheDocument();
      expect(screen.getByText("答え3")).toBeInTheDocument();
      expect(screen.getByText("答え4")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA role for status announcements", () => {
      // Arrange
      const feedback: QuestionFeedbackDTO = {
        is_correct: true,
        correct_answers: ["読む"],
      };

      // Act
      const { container } = render(<FeedbackSection feedback={feedback} />);

      // Assert - should have role="status" for screen readers
      const section = container.querySelector('[role="status"]');
      expect(section).toBeInTheDocument();
    });

    it("should have aria-live='polite' for non-intrusive announcements", () => {
      // Arrange
      const feedback: QuestionFeedbackDTO = {
        is_correct: false,
        correct_answers: ["書く"],
      };

      // Act
      const { container } = render(<FeedbackSection feedback={feedback} />);

      // Assert - should announce changes politely
      const section = container.querySelector('[aria-live="polite"]');
      expect(section).toBeInTheDocument();
    });

    it("should have aria-atomic='true' for complete region announcements", () => {
      // Arrange
      const feedback: QuestionFeedbackDTO = {
        is_correct: true,
        correct_answers: [],
      };

      // Act
      const { container } = render(<FeedbackSection feedback={feedback} />);

      // Assert - should read entire region as one unit
      const section = container.querySelector('[aria-atomic="true"]');
      expect(section).toBeInTheDocument();
    });

    it("should have all ARIA attributes on correct answer feedback", () => {
      // Arrange
      const feedback: QuestionFeedbackDTO = {
        is_correct: true,
        correct_answers: ["テスト"],
      };

      // Act
      const { container } = render(<FeedbackSection feedback={feedback} />);

      // Assert - verify all accessibility attributes together
      const section = container.querySelector("div");
      expect(section).toHaveAttribute("role", "status");
      expect(section).toHaveAttribute("aria-live", "polite");
      expect(section).toHaveAttribute("aria-atomic", "true");
    });

    it("should have all ARIA attributes on incorrect answer feedback", () => {
      // Arrange
      const feedback: QuestionFeedbackDTO = {
        is_correct: false,
        correct_answers: ["食べる"],
      };

      // Act
      const { container } = render(<FeedbackSection feedback={feedback} />);

      // Assert - verify all accessibility attributes together
      const section = container.querySelector("div");
      expect(section).toHaveAttribute("role", "status");
      expect(section).toHaveAttribute("aria-live", "polite");
      expect(section).toHaveAttribute("aria-atomic", "true");
    });
  });

  describe("Dark Mode Styling", () => {
    it("should include dark mode classes for correct feedback", () => {
      // Arrange
      const feedback: QuestionFeedbackDTO = {
        is_correct: true,
        correct_answers: ["漢字"],
      };

      // Act
      const { container } = render(<FeedbackSection feedback={feedback} />);

      // Assert - should have dark mode variants
      const section = container.querySelector('[role="status"]');
      expect(section).toHaveClass("dark:bg-green-950/20", "dark:border-green-800");
    });

    it("should include dark mode classes for incorrect feedback", () => {
      // Arrange
      const feedback: QuestionFeedbackDTO = {
        is_correct: false,
        correct_answers: ["間違い"],
      };

      // Act
      const { container } = render(<FeedbackSection feedback={feedback} />);

      // Assert - should have dark mode variants
      const section = container.querySelector('[role="status"]');
      expect(section).toHaveClass("dark:bg-red-950/20", "dark:border-red-800");
    });
  });

  describe("Component Structure", () => {
    it("should render with proper spacing and layout classes", () => {
      // Arrange
      const feedback: QuestionFeedbackDTO = {
        is_correct: false,
        correct_answers: ["テスト"],
      };

      // Act
      const { container } = render(<FeedbackSection feedback={feedback} />);

      // Assert - should have layout classes
      const section = container.querySelector('[role="status"]');
      expect(section).toHaveClass("space-y-4", "rounded-lg", "border", "p-6");
    });

    it("should contain CorrectnessIndicator component", () => {
      // Arrange
      const feedback: QuestionFeedbackDTO = {
        is_correct: true,
        correct_answers: [],
      };

      // Act
      render(<FeedbackSection feedback={feedback} />);

      // Assert - CorrectnessIndicator should render with text
      expect(screen.getByText("Correct!")).toBeInTheDocument();
    });

    it("should contain CorrectAnswersList component when incorrect", () => {
      // Arrange
      const feedback: QuestionFeedbackDTO = {
        is_correct: false,
        correct_answers: ["正解"],
      };

      // Act
      render(<FeedbackSection feedback={feedback} />);

      // Assert - CorrectAnswersList should render
      expect(screen.getByText("Correct answer:")).toBeInTheDocument();
      expect(screen.getByText("正解")).toBeInTheDocument();
    });
  });

  describe("Visual Feedback Distinction", () => {
    it("should have distinct visual styling between correct and incorrect states", () => {
      // Arrange
      const correctFeedback: QuestionFeedbackDTO = {
        is_correct: true,
        correct_answers: [],
      };
      const incorrectFeedback: QuestionFeedbackDTO = {
        is_correct: false,
        correct_answers: ["答え"],
      };

      // Act
      const { container: correctContainer } = render(<FeedbackSection feedback={correctFeedback} />);
      const correctSection = correctContainer.querySelector('[role="status"]');

      const { container: incorrectContainer } = render(<FeedbackSection feedback={incorrectFeedback} />);
      const incorrectSection = incorrectContainer.querySelector('[role="status"]');

      // Assert - styles should be different
      expect(correctSection?.className).not.toBe(incorrectSection?.className);
      expect(correctSection).toHaveClass("bg-green-50");
      expect(incorrectSection).toHaveClass("bg-red-50");
    });
  });

  describe("Content Rendering", () => {
    it("should render Japanese characters correctly in correct answers", () => {
      // Arrange
      const feedback: QuestionFeedbackDTO = {
        is_correct: false,
        correct_answers: ["漢字", "かんじ", "kanji"],
      };

      // Act
      render(<FeedbackSection feedback={feedback} />);

      // Assert - should display all character types
      expect(screen.getByText("漢字")).toBeInTheDocument();
      expect(screen.getByText("かんじ")).toBeInTheDocument();
      expect(screen.getByText("kanji")).toBeInTheDocument();
    });

    it("should render special characters and punctuation in answers", () => {
      // Arrange
      const feedback: QuestionFeedbackDTO = {
        is_correct: false,
        correct_answers: ["答え（回答）", "答え・回答", "答え／回答"],
      };

      // Act
      render(<FeedbackSection feedback={feedback} />);

      // Assert - should handle special characters
      expect(screen.getByText("答え（回答）")).toBeInTheDocument();
      expect(screen.getByText("答え・回答")).toBeInTheDocument();
      expect(screen.getByText("答え／回答")).toBeInTheDocument();
    });
  });
});
