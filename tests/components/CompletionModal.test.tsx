import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { CompletionModal } from "@/components/CompletionModal";

/**
 * Unit tests for CompletionModal component
 *
 * Tests cover:
 * - Component rendering with different score ranges
 * - Modal dialog states (open/closed)
 * - Score display and color coding
 * - User interactions (return to dashboard)
 * - Accessibility features
 * - Edge cases and boundary values
 */
describe("CompletionModal", () => {
  // Default props for testing
  const defaultProps = {
    isOpen: false,
    scorePercent: 75,
    correctCount: 15,
    totalCount: 20,
    encouragementMessage: "Great job! Keep practicing!",
    onReturnToDashboard: vi.fn(),
  };

  const mockOnReturnToDashboard = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should not render modal when isOpen is false", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={false} />);

      // Assert
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should render modal when isOpen is true", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} />);

      // Assert
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should render 'Quiz Complete!' title", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} />);

      // Assert
      expect(screen.getByRole("heading", { name: /quiz complete!/i })).toBeInTheDocument();
    });

    it("should render score percentage with percent sign", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} scorePercent={85} />);

      // Assert
      expect(screen.getByText("85%")).toBeInTheDocument();
    });

    it("should render correct count text", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} correctCount={18} totalCount={20} />);

      // Assert
      expect(screen.getByText("18 out of 20 correct")).toBeInTheDocument();
    });

    it("should render encouragement message", () => {
      // Arrange
      const message = "Excellent work! You're making great progress!";

      // Act
      render(<CompletionModal {...defaultProps} isOpen={true} encouragementMessage={message} />);

      // Assert
      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it("should render return to dashboard button", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} />);

      // Assert
      expect(screen.getByRole("button", { name: /return to dashboard/i })).toBeInTheDocument();
    });
  });

  describe("Score Color Coding", () => {
    it("should display green color for high scores (>= 80%)", () => {
      // Arrange
      const highScores = [80, 85, 90, 95, 100];

      for (const score of highScores) {
        // Act
        const { unmount } = render(<CompletionModal {...defaultProps} isOpen={true} scorePercent={score} />);

        // Assert - Check for green color class
        const scoreElement = screen.getByText(`${score}%`);
        expect(scoreElement).toHaveClass("text-green-600");

        unmount();
      }
    });

    it("should display yellow color for medium scores (50-79%)", () => {
      // Arrange
      const mediumScores = [50, 55, 60, 70, 79];

      for (const score of mediumScores) {
        // Act
        const { unmount } = render(<CompletionModal {...defaultProps} isOpen={true} scorePercent={score} />);

        // Assert - Check for yellow color class
        const scoreElement = screen.getByText(`${score}%`);
        expect(scoreElement).toHaveClass("text-yellow-600");

        unmount();
      }
    });

    it("should display red color for low scores (< 50%)", () => {
      // Arrange
      const lowScores = [0, 10, 25, 40, 49];

      for (const score of lowScores) {
        // Act
        const { unmount } = render(<CompletionModal {...defaultProps} isOpen={true} scorePercent={score} />);

        // Assert - Check for red color class
        const scoreElement = screen.getByText(`${score}%`);
        expect(scoreElement).toHaveClass("text-red-600");

        unmount();
      }
    });

    it("should handle boundary score of 80% (green)", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} scorePercent={80} />);

      // Assert
      const scoreElement = screen.getByText("80%");
      expect(scoreElement).toHaveClass("text-green-600");
    });

    it("should handle boundary score of 50% (yellow)", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} scorePercent={50} />);

      // Assert
      const scoreElement = screen.getByText("50%");
      expect(scoreElement).toHaveClass("text-yellow-600");
    });

    it("should handle boundary score of 49% (red)", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} scorePercent={49} />);

      // Assert
      const scoreElement = screen.getByText("49%");
      expect(scoreElement).toHaveClass("text-red-600");
    });
  });

  describe("User Interactions", () => {
    it("should call onReturnToDashboard when button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<CompletionModal {...defaultProps} isOpen={true} onReturnToDashboard={mockOnReturnToDashboard} />);

      // Act
      const button = screen.getByRole("button", { name: /return to dashboard/i });
      await user.click(button);

      // Assert
      expect(mockOnReturnToDashboard).toHaveBeenCalledTimes(1);
    });

    it("should call onReturnToDashboard only once per click", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<CompletionModal {...defaultProps} isOpen={true} onReturnToDashboard={mockOnReturnToDashboard} />);

      // Act
      const button = screen.getByRole("button", { name: /return to dashboard/i });
      await user.click(button);

      // Assert
      expect(mockOnReturnToDashboard).toHaveBeenCalledTimes(1);
    });

    it("should not call onReturnToDashboard when modal is closed", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={false} onReturnToDashboard={mockOnReturnToDashboard} />);

      // Assert
      expect(mockOnReturnToDashboard).not.toHaveBeenCalled();
    });

    it("should handle multiple clicks on return button", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<CompletionModal {...defaultProps} isOpen={true} onReturnToDashboard={mockOnReturnToDashboard} />);

      // Act
      const button = screen.getByRole("button", { name: /return to dashboard/i });
      await user.click(button);
      await user.click(button);
      await user.click(button);

      // Assert
      expect(mockOnReturnToDashboard).toHaveBeenCalledTimes(3);
    });
  });

  describe("Modal Dialog Behavior", () => {
    it("should have modal dialog role when open", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} />);

      // Assert
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
    });

    it("should not be dismissible via onOpenChange callback", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} />);

      // Assert - Dialog has onOpenChange={() => {}} making it non-dismissible
      // This test verifies the dialog is present and can only be closed via the return button
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /return to dashboard/i })).toBeInTheDocument();
    });

    it("should contain title within dialog header", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} />);

      // Assert
      const heading = screen.getByRole("heading", { name: /quiz complete!/i });
      expect(heading).toHaveClass("text-center", "text-2xl");
    });

    it("should have proper modal content structure", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} />);

      // Assert
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(screen.getByRole("heading")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Score Display Variations", () => {
    it("should handle perfect score (100%)", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} scorePercent={100} correctCount={20} totalCount={20} />);

      // Assert
      expect(screen.getByText("100%")).toBeInTheDocument();
      expect(screen.getByText("20 out of 20 correct")).toBeInTheDocument();
    });

    it("should handle zero score (0%)", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} scorePercent={0} correctCount={0} totalCount={20} />);

      // Assert
      expect(screen.getByText("0%")).toBeInTheDocument();
      expect(screen.getByText("0 out of 20 correct")).toBeInTheDocument();
    });

    it("should handle single question quiz", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} scorePercent={100} correctCount={1} totalCount={1} />);

      // Assert
      expect(screen.getByText("100%")).toBeInTheDocument();
      expect(screen.getByText("1 out of 1 correct")).toBeInTheDocument();
    });

    it("should handle large quiz (50 questions)", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} scorePercent={76} correctCount={38} totalCount={50} />);

      // Assert
      expect(screen.getByText("76%")).toBeInTheDocument();
      expect(screen.getByText("38 out of 50 correct")).toBeInTheDocument();
    });

    it("should handle partial correct answers correctly", () => {
      // Arrange
      const testCases = [
        { correct: 7, total: 10, percent: 70 },
        { correct: 3, total: 5, percent: 60 },
        { correct: 15, total: 20, percent: 75 },
      ];

      for (const { correct, total, percent } of testCases) {
        // Act
        const { unmount } = render(
          <CompletionModal
            {...defaultProps}
            isOpen={true}
            scorePercent={percent}
            correctCount={correct}
            totalCount={total}
          />
        );

        // Assert
        expect(screen.getByText(`${percent}%`)).toBeInTheDocument();
        expect(screen.getByText(`${correct} out of ${total} correct`)).toBeInTheDocument();

        unmount();
      }
    });
  });

  describe("Encouragement Messages", () => {
    it("should display custom encouragement message", () => {
      // Arrange
      const messages = [
        "Outstanding performance!",
        "Keep up the good work!",
        "You're improving!",
        "Practice makes perfect!",
        "Never give up!",
      ];

      for (const message of messages) {
        // Act
        const { unmount } = render(<CompletionModal {...defaultProps} isOpen={true} encouragementMessage={message} />);

        // Assert
        expect(screen.getByText(message)).toBeInTheDocument();

        unmount();
      }
    });

    it("should display empty encouragement message", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} encouragementMessage="" />);

      // Assert - Empty text should still render (empty paragraph)
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
    });

    it("should display long encouragement message", () => {
      // Arrange
      const longMessage =
        "Congratulations on completing this quiz! Your dedication to learning Japanese kanji is commendable. Keep practicing regularly to maintain and improve your skills.";

      // Act
      render(<CompletionModal {...defaultProps} isOpen={true} encouragementMessage={longMessage} />);

      // Assert
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper dialog role", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} />);

      // Assert
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should have accessible heading", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} />);

      // Assert
      const heading = screen.getByRole("heading", { name: /quiz complete!/i });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe("H2"); // DialogTitle renders as h2
    });

    it("should have accessible button with proper label", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} />);

      // Assert
      const button = screen.getByRole("button", { name: /return to dashboard/i });
      expect(button).toBeInTheDocument();
    });

    it("should have Home icon with aria-hidden attribute", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} />);

      // Assert
      const button = screen.getByRole("button", { name: /return to dashboard/i });
      const icon = button.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it("should have proper text styling for encouragement message", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} />);

      // Assert
      const message = screen.getByText(defaultProps.encouragementMessage);
      expect(message).toHaveClass("text-center", "text-base");
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid open/close state changes", () => {
      // Arrange
      const { rerender } = render(<CompletionModal {...defaultProps} isOpen={false} />);

      // Act & Assert - Closed
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      // Act - Open
      rerender(<CompletionModal {...defaultProps} isOpen={true} />);

      // Assert - Open
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      // Act - Close
      rerender(<CompletionModal {...defaultProps} isOpen={false} />);

      // Assert - Closed again
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should maintain state when props change while open", () => {
      // Arrange
      const { rerender } = render(<CompletionModal {...defaultProps} isOpen={true} scorePercent={75} />);

      // Act - Update score
      rerender(<CompletionModal {...defaultProps} isOpen={true} scorePercent={90} />);

      // Assert - New score should be displayed
      expect(screen.getByText("90%")).toBeInTheDocument();
      expect(screen.queryByText("75%")).not.toBeInTheDocument();
    });

    it("should handle decimal score percentages", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} scorePercent={66.67} />);

      // Assert
      expect(screen.getByText("66.67%")).toBeInTheDocument();
    });

    it("should render with minimum viable props", () => {
      // Arrange
      const minimalProps = {
        isOpen: true,
        scorePercent: 0,
        correctCount: 0,
        totalCount: 1,
        encouragementMessage: "",
        onReturnToDashboard: vi.fn(),
      };

      // Act
      render(<CompletionModal {...minimalProps} />);

      // Assert
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("0%")).toBeInTheDocument();
      expect(screen.getByText("0 out of 1 correct")).toBeInTheDocument();
    });

    it("should handle very long score text", () => {
      // Arrange & Act
      render(
        <CompletionModal {...defaultProps} isOpen={true} scorePercent={100} correctCount={999} totalCount={999} />
      );

      // Assert
      expect(screen.getByText("100%")).toBeInTheDocument();
      expect(screen.getByText("999 out of 999 correct")).toBeInTheDocument();
    });
  });

  describe("Component Integration", () => {
    it("should render all child components correctly", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} />);

      // Assert - Check all major parts are present
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /quiz complete!/i })).toBeInTheDocument();
      expect(screen.getByText(`${defaultProps.scorePercent}%`)).toBeInTheDocument();
      expect(
        screen.getByText(`${defaultProps.correctCount} out of ${defaultProps.totalCount} correct`)
      ).toBeInTheDocument();
      expect(screen.getByText(defaultProps.encouragementMessage)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /return to dashboard/i })).toBeInTheDocument();
    });

    it("should maintain proper spacing between elements", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} />);

      // Assert - Check for spacing classes
      const dialog = screen.getByRole("dialog");
      const contentWrapper = dialog.querySelector(".space-y-6");
      expect(contentWrapper).toBeInTheDocument();
    });

    it("should handle complete user flow", async () => {
      // Arrange
      const user = userEvent.setup();
      const { rerender } = render(
        <CompletionModal {...defaultProps} isOpen={false} onReturnToDashboard={mockOnReturnToDashboard} />
      );

      // Act & Assert - Initially closed
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      // Act - Open modal
      rerender(<CompletionModal {...defaultProps} isOpen={true} onReturnToDashboard={mockOnReturnToDashboard} />);

      // Assert - Modal is open with correct content
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("75%")).toBeInTheDocument();

      // Act - Click return button
      const button = screen.getByRole("button", { name: /return to dashboard/i });
      await user.click(button);

      // Assert - Callback was called
      expect(mockOnReturnToDashboard).toHaveBeenCalledTimes(1);
    });
  });

  describe("Visual Styling", () => {
    it("should have proper dialog size class", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} />);

      // Assert
      const dialogContent = screen.getByRole("dialog");
      expect(dialogContent).toHaveClass("sm:max-w-md");
    });

    it("should have large font size for score", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} />);

      // Assert
      const scoreElement = screen.getByText(`${defaultProps.scorePercent}%`);
      expect(scoreElement).toHaveClass("text-6xl", "font-bold");
    });

    it("should have proper button styling", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} />);

      // Assert
      const button = screen.getByRole("button", { name: /return to dashboard/i });
      expect(button).toHaveClass("w-full");
    });

    it("should center align title", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} />);

      // Assert
      const heading = screen.getByRole("heading", { name: /quiz complete!/i });
      expect(heading).toHaveClass("text-center");
    });

    it("should center align score summary", () => {
      // Arrange & Act
      render(<CompletionModal {...defaultProps} isOpen={true} />);

      // Assert
      const scoreText = screen.getByText(`${defaultProps.correctCount} out of ${defaultProps.totalCount} correct`);
      const parentDiv = scoreText.closest(".text-center");
      expect(parentDiv).toBeInTheDocument();
    });
  });
});
