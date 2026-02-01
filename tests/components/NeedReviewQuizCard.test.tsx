import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import NeedReviewQuizCard from "@/components/NeedReviewQuizCard";
import type { NeedReviewQuizFormState } from "@/components/types/dashboard.types";

/**
 * Unit tests for NeedReviewQuizCard component
 *
 * Tests cover:
 * - Component rendering with different states
 * - User interactions (question count selection)
 * - Form validation and submission
 * - Available kanji count display and validation
 * - Loading states and disabled states
 * - Error message display
 * - Warning messages for zero availability
 * - Accessibility features
 */
describe("NeedReviewQuizCard", () => {
  // Default props for testing
  const defaultFormState: NeedReviewQuizFormState = {
    questionCount: null,
    availableCount: 25,
    isSubmitting: false,
  };

  const mockOnChange = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render card with title and description", () => {
      // Arrange & Act
      render(<NeedReviewQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      expect(screen.getByText("Need Review Quiz")).toBeInTheDocument();
      expect(screen.getByText("Practice kanji you've marked for review")).toBeInTheDocument();
    });

    it("should display available kanji count", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: null,
        availableCount: 42,
        isSubmitting: false,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      expect(screen.getByText("Available kanji:")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("should render all question count options", () => {
      // Arrange & Act
      render(<NeedReviewQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      expect(screen.getByLabelText("1")).toBeInTheDocument();
      expect(screen.getByLabelText("10")).toBeInTheDocument();
      expect(screen.getByLabelText("20")).toBeInTheDocument();
      expect(screen.getByLabelText("50")).toBeInTheDocument();
    });

    it("should render start button with default text", () => {
      // Arrange & Act
      render(<NeedReviewQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const button = screen.getByRole("button", { name: /start need review quiz/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Start Quiz");
    });

    it("should display Number of Questions label", () => {
      // Arrange & Act
      render(<NeedReviewQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      expect(screen.getByText("Number of Questions")).toBeInTheDocument();
    });

    it("should display selected question count", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: 20,
        availableCount: 25,
        isSubmitting: false,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const radio = screen.getByLabelText("20") as HTMLInputElement;
      expect(radio).toBeChecked();
    });
  });

  describe("User Interactions", () => {
    it("should call onChange when question count is selected", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<NeedReviewQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Act - Click on question count radio button
      await user.click(screen.getByLabelText("10"));

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith({ questionCount: 10 });
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it("should call onChange for each question count option", async () => {
      // Arrange
      const user = userEvent.setup();
      const questionCounts = [1, 10, 20, 50] as const;

      for (const count of questionCounts) {
        mockOnChange.mockClear();

        // Use sufficient available count for all options
        const formState: NeedReviewQuizFormState = {
          questionCount: null,
          availableCount: 100,
          isSubmitting: false,
        };

        // Act
        render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);
        await user.click(screen.getByLabelText(count.toString()));

        // Assert
        expect(mockOnChange).toHaveBeenCalledWith({ questionCount: count });
      }
    });

    it("should call onSubmit when start button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const formState: NeedReviewQuizFormState = {
        questionCount: 10,
        availableCount: 25,
        isSubmitting: false,
      };

      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Act
      const button = screen.getByRole("button", { name: /start need review quiz/i });
      await user.click(button);

      // Assert
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe("Form Validation", () => {
    it("should disable submit button when question count is not selected", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: null,
        availableCount: 25,
        isSubmitting: false,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const button = screen.getByRole("button", { name: /start need review quiz/i });
      expect(button).toBeDisabled();
    });

    it("should enable submit button when question count is selected", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: 10,
        availableCount: 25,
        isSubmitting: false,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const button = screen.getByRole("button", { name: /start need review quiz/i });
      expect(button).not.toBeDisabled();
    });

    it("should disable submit button when question count exceeds available count", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: 50,
        availableCount: 10,
        isSubmitting: false,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const button = screen.getByRole("button", { name: /start need review quiz/i });
      expect(button).toBeDisabled();
    });

    it("should disable submit button when available count is zero", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: 10,
        availableCount: 0,
        isSubmitting: false,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const button = screen.getByRole("button", { name: /start need review quiz/i });
      expect(button).toBeDisabled();
    });

    it("should enable submit button when question count equals available count", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: 10,
        availableCount: 10,
        isSubmitting: false,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const button = screen.getByRole("button", { name: /start need review quiz/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe("Available Count Constraints", () => {
    it("should disable radio options that exceed available count", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: null,
        availableCount: 15,
        isSubmitting: false,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const radio1 = screen.getByLabelText("1") as HTMLInputElement;
      const radio10 = screen.getByLabelText("10") as HTMLInputElement;
      const radio20 = screen.getByLabelText("20") as HTMLInputElement;
      const radio50 = screen.getByLabelText("50") as HTMLInputElement;

      expect(radio1).not.toBeDisabled();
      expect(radio10).not.toBeDisabled();
      expect(radio20).toBeDisabled();
      expect(radio50).toBeDisabled();
    });

    it("should apply gray text styling to unavailable options", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: null,
        availableCount: 15,
        isSubmitting: false,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const label20 = screen.getByText("20", { selector: "label" });
      const label50 = screen.getByText("50", { selector: "label" });

      expect(label20).toHaveClass("text-gray-400");
      expect(label50).toHaveClass("text-gray-400");
    });

    it("should enable all radio options when available count is sufficient", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: null,
        availableCount: 100,
        isSubmitting: false,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const radio1 = screen.getByLabelText("1") as HTMLInputElement;
      const radio10 = screen.getByLabelText("10") as HTMLInputElement;
      const radio20 = screen.getByLabelText("20") as HTMLInputElement;
      const radio50 = screen.getByLabelText("50") as HTMLInputElement;

      expect(radio1).not.toBeDisabled();
      expect(radio10).not.toBeDisabled();
      expect(radio20).not.toBeDisabled();
      expect(radio50).not.toBeDisabled();
    });

    it("should disable all radio options when available count is zero", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: null,
        availableCount: 0,
        isSubmitting: false,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const radio1 = screen.getByLabelText("1") as HTMLInputElement;
      const radio10 = screen.getByLabelText("10") as HTMLInputElement;
      const radio20 = screen.getByLabelText("20") as HTMLInputElement;
      const radio50 = screen.getByLabelText("50") as HTMLInputElement;

      expect(radio1).toBeDisabled();
      expect(radio10).toBeDisabled();
      expect(radio20).toBeDisabled();
      expect(radio50).toBeDisabled();
    });
  });

  describe("Submitting State", () => {
    it("should disable submit button when isSubmitting is true", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: 10,
        availableCount: 25,
        isSubmitting: true,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const button = screen.getByRole("button", { name: /start need review quiz/i });
      expect(button).toBeDisabled();
    });

    it("should change button text to 'Starting...' when isSubmitting is true", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: 10,
        availableCount: 25,
        isSubmitting: true,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const button = screen.getByRole("button", { name: /start need review quiz/i });
      expect(button).toHaveTextContent("Starting...");
    });

    it("should disable question count radio group when isSubmitting is true", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: 10,
        availableCount: 25,
        isSubmitting: true,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const radio1 = screen.getByLabelText("1") as HTMLInputElement;
      const radio10 = screen.getByLabelText("10") as HTMLInputElement;
      const radio20 = screen.getByLabelText("20") as HTMLInputElement;
      const radio50 = screen.getByLabelText("50") as HTMLInputElement;

      expect(radio1).toBeDisabled();
      expect(radio10).toBeDisabled();
      expect(radio20).toBeDisabled();
      expect(radio50).toBeDisabled();
    });

    it("should disable all radio buttons even when available count is sufficient", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: null,
        availableCount: 100,
        isSubmitting: true,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert - All radio buttons should be disabled
      const radio1 = screen.getByLabelText("1") as HTMLInputElement;
      const radio10 = screen.getByLabelText("10") as HTMLInputElement;
      const radio20 = screen.getByLabelText("20") as HTMLInputElement;
      const radio50 = screen.getByLabelText("50") as HTMLInputElement;

      expect(radio1).toBeDisabled();
      expect(radio10).toBeDisabled();
      expect(radio20).toBeDisabled();
      expect(radio50).toBeDisabled();
    });
  });

  describe("Error Handling", () => {
    it("should not display error message when errorMessage is undefined", () => {
      // Arrange & Act
      render(<NeedReviewQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("should display error message when provided", () => {
      // Arrange
      const errorMessage = "Failed to create quiz. Please try again.";

      // Act
      render(
        <NeedReviewQuizCard
          formState={defaultFormState}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          errorMessage={errorMessage}
        />
      );

      // Assert
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(errorMessage);
    });

    it("should display different error messages", () => {
      // Arrange
      const errorMessages = ["Network error occurred", "Invalid quiz parameters", "Server is unavailable"];

      for (const errorMessage of errorMessages) {
        // Act
        const { unmount } = render(
          <NeedReviewQuizCard
            formState={defaultFormState}
            onChange={mockOnChange}
            onSubmit={mockOnSubmit}
            errorMessage={errorMessage}
          />
        );

        // Assert
        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent(errorMessage);

        // Cleanup for next iteration
        unmount();
      }
    });

    it("should have proper styling for error message", () => {
      // Arrange
      const errorMessage = "An error occurred";

      // Act
      render(
        <NeedReviewQuizCard
          formState={defaultFormState}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          errorMessage={errorMessage}
        />
      );

      // Assert
      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("text-sm", "text-destructive");
    });
  });

  describe("Zero Availability Warning", () => {
    it("should display warning message when available count is zero", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: null,
        availableCount: 0,
        isSubmitting: false,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const warning = screen.getByRole("status");
      expect(warning).toBeInTheDocument();
      expect(warning).toHaveTextContent("No kanji marked for review. Add some kanji to your review list first.");
    });

    it("should not display warning when available count is greater than zero", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: null,
        availableCount: 5,
        isSubmitting: false,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("should have proper styling for warning message", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: null,
        availableCount: 0,
        isSubmitting: false,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const warning = screen.getByRole("status");
      expect(warning).toHaveClass("text-sm", "text-gray-600", "bg-gray-50");
    });

    it("should not display both error and warning simultaneously", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: null,
        availableCount: 0,
        isSubmitting: false,
      };

      const errorMessage = "An error occurred";

      // Act
      render(
        <NeedReviewQuizCard
          formState={formState}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          errorMessage={errorMessage}
        />
      );

      // Assert
      expect(screen.getByRole("alert")).toBeInTheDocument(); // Error
      expect(screen.getByRole("status")).toBeInTheDocument(); // Warning
      // Both can coexist - they serve different purposes
    });
  });

  describe("Accessibility", () => {
    it("should have proper label for question count radio group", () => {
      // Arrange & Act
      render(<NeedReviewQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert - Label text should be present
      expect(screen.getByText("Number of Questions")).toBeInTheDocument();

      // Radio group should exist
      const radioGroup = screen.getByRole("radiogroup");
      expect(radioGroup).toBeInTheDocument();
    });

    it("should have aria-label on submit button", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: 10,
        availableCount: 25,
        isSubmitting: false,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const button = screen.getByRole("button", { name: /start need review quiz/i });
      expect(button).toHaveAttribute("aria-label", "Start need review quiz");
    });

    it("should have role='alert' on error message", () => {
      // Arrange
      const errorMessage = "Error occurred";

      // Act
      render(
        <NeedReviewQuizCard
          formState={defaultFormState}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          errorMessage={errorMessage}
        />
      );

      // Assert
      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("role", "alert");
    });

    it("should have role='status' on warning message", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: null,
        availableCount: 0,
        isSubmitting: false,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const warning = screen.getByRole("status");
      expect(warning).toHaveAttribute("role", "status");
    });

    it("should associate radio buttons with their labels", () => {
      // Arrange & Act
      render(<NeedReviewQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const questionCounts = [1, 10, 20, 50];
      for (const count of questionCounts) {
        const radio = screen.getByLabelText(count.toString());
        expect(radio).toHaveAttribute("id", `need-review-count-${count}`);
      }
    });

    it("should have proper id for radio group", () => {
      // Arrange & Act
      render(<NeedReviewQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const radioGroup = screen.getByRole("radiogroup");
      expect(radioGroup).toHaveAttribute("id", "question-count-radio-group");
    });
  });

  describe("Component Integration", () => {
    it("should handle complete user flow from empty to submitted", async () => {
      // Arrange
      const user = userEvent.setup();
      let currentFormState = { ...defaultFormState };

      const handleChange = (partial: Partial<NeedReviewQuizFormState>) => {
        currentFormState = { ...currentFormState, ...partial };
        mockOnChange(partial);
      };

      const { rerender } = render(
        <NeedReviewQuizCard formState={currentFormState} onChange={handleChange} onSubmit={mockOnSubmit} />
      );

      // Act & Assert - Initially button is disabled
      let button = screen.getByRole("button", { name: /start need review quiz/i });
      expect(button).toBeDisabled();

      // Act - Select question count
      await user.click(screen.getByLabelText("20"));

      // Update form state and rerender
      currentFormState = { ...currentFormState, questionCount: 20 };
      rerender(<NeedReviewQuizCard formState={currentFormState} onChange={handleChange} onSubmit={mockOnSubmit} />);

      // Assert - Now enabled
      button = screen.getByRole("button", { name: /start need review quiz/i });
      expect(button).not.toBeDisabled();

      // Act - Submit
      await user.click(button);

      // Assert - onSubmit called
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith({ questionCount: 20 });
    });

    it("should not call onChange or onSubmit when disabled", async () => {
      // Arrange
      const user = userEvent.setup();
      const formState: NeedReviewQuizFormState = {
        questionCount: 10,
        availableCount: 25,
        isSubmitting: true,
      };

      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Act - Try to interact with disabled elements
      const button = screen.getByRole("button", { name: /start need review quiz/i });
      await user.click(button);

      // Assert - No callbacks should be triggered on disabled button
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should handle dynamic available count changes", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: 20,
        availableCount: 30,
        isSubmitting: false,
      };

      const { rerender } = render(
        <NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />
      );

      // Assert - Initially valid
      let button = screen.getByRole("button", { name: /start need review quiz/i });
      expect(button).not.toBeDisabled();

      // Act - Reduce available count below selected question count
      const updatedFormState: NeedReviewQuizFormState = {
        questionCount: 20,
        availableCount: 15,
        isSubmitting: false,
      };

      rerender(<NeedReviewQuizCard formState={updatedFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert - Now invalid
      button = screen.getByRole("button", { name: /start need review quiz/i });
      expect(button).toBeDisabled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid selection changes", async () => {
      // Arrange
      const user = userEvent.setup();
      const formState: NeedReviewQuizFormState = {
        questionCount: null,
        availableCount: 100,
        isSubmitting: false,
      };

      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Act - Rapidly change question counts
      await user.click(screen.getByLabelText("10"));
      await user.click(screen.getByLabelText("20"));
      await user.click(screen.getByLabelText("1"));
      await user.click(screen.getByLabelText("50"));

      // Assert - All changes should be captured
      expect(mockOnChange).toHaveBeenCalledTimes(4);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, { questionCount: 10 });
      expect(mockOnChange).toHaveBeenNthCalledWith(2, { questionCount: 20 });
      expect(mockOnChange).toHaveBeenNthCalledWith(3, { questionCount: 1 });
      expect(mockOnChange).toHaveBeenNthCalledWith(4, { questionCount: 50 });
    });

    it("should maintain form state across re-renders", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: 50,
        availableCount: 100,
        isSubmitting: false,
      };

      // Act
      const { rerender } = render(
        <NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />
      );

      // Rerender with same state
      rerender(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert - State should be preserved
      const radio50 = screen.getByLabelText("50") as HTMLInputElement;
      expect(radio50).toBeChecked();
      expect(screen.getByText("100")).toBeInTheDocument();
    });

    it("should handle null question count correctly", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: null,
        availableCount: 25,
        isSubmitting: false,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const radios = [
        screen.getByLabelText("1"),
        screen.getByLabelText("10"),
        screen.getByLabelText("20"),
        screen.getByLabelText("50"),
      ];

      radios.forEach((radio) => {
        expect(radio).not.toBeChecked();
      });

      const button = screen.getByRole("button", { name: /start need review quiz/i });
      expect(button).toBeDisabled();
    });

    it("should handle boundary case with availableCount of 1", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: 1,
        availableCount: 1,
        isSubmitting: false,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert - Only 1 option should be enabled
      const radio1 = screen.getByLabelText("1") as HTMLInputElement;
      const radio10 = screen.getByLabelText("10") as HTMLInputElement;
      const radio20 = screen.getByLabelText("20") as HTMLInputElement;
      const radio50 = screen.getByLabelText("50") as HTMLInputElement;

      expect(radio1).not.toBeDisabled();
      expect(radio10).toBeDisabled();
      expect(radio20).toBeDisabled();
      expect(radio50).toBeDisabled();

      // Button should be enabled since selection matches available count
      const button = screen.getByRole("button", { name: /start need review quiz/i });
      expect(button).not.toBeDisabled();
    });

    it("should handle large available counts correctly", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: 50,
        availableCount: 999,
        isSubmitting: false,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      expect(screen.getByText("999")).toBeInTheDocument();
      const button = screen.getByRole("button", { name: /start need review quiz/i });
      expect(button).not.toBeDisabled();
    });

    it("should handle exact match between question count and available count", () => {
      // Arrange
      const formState: NeedReviewQuizFormState = {
        questionCount: 20,
        availableCount: 20,
        isSubmitting: false,
      };

      // Act
      render(<NeedReviewQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const button = screen.getByRole("button", { name: /start need review quiz/i });
      expect(button).not.toBeDisabled();

      const radio20 = screen.getByLabelText("20") as HTMLInputElement;
      const radio50 = screen.getByLabelText("50") as HTMLInputElement;
      expect(radio20).not.toBeDisabled();
      expect(radio50).toBeDisabled();
    });
  });
});
