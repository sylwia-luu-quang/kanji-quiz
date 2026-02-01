import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import LevelQuizCard from "@/components/LevelQuizCard";
import type { LevelQuizFormState } from "@/components/types/dashboard.types";
import type { JLPTLevel } from "@/types";

/**
 * Unit tests for LevelQuizCard component
 *
 * Tests cover:
 * - Component rendering with different states
 * - User interactions (level selection, question count selection)
 * - Form validation and submission
 * - Loading states and disabled states
 * - Error message display
 * - Accessibility features
 */
describe("LevelQuizCard", () => {
  // Default props for testing
  const defaultFormState: LevelQuizFormState = {
    level: "",
    questionCount: null,
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
      render(<LevelQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      expect(screen.getByText("Level Quiz")).toBeInTheDocument();
      expect(screen.getByText("Practice kanji from a specific JLPT level")).toBeInTheDocument();
    });

    it("should render level select dropdown", () => {
      // Arrange & Act
      render(<LevelQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert - Select trigger should be present
      const selectTrigger = screen.getByRole("combobox", { name: /jlpt level/i });
      expect(selectTrigger).toBeInTheDocument();
      expect(selectTrigger).toHaveAttribute("aria-expanded", "false");
    });

    it("should render all question count options", () => {
      // Arrange & Act
      render(<LevelQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      expect(screen.getByLabelText("1")).toBeInTheDocument();
      expect(screen.getByLabelText("10")).toBeInTheDocument();
      expect(screen.getByLabelText("20")).toBeInTheDocument();
      expect(screen.getByLabelText("50")).toBeInTheDocument();
    });

    it("should render start button with default text", () => {
      // Arrange & Act
      render(<LevelQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const button = screen.getByRole("button", { name: /start level quiz/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Start Quiz");
    });

    it("should display placeholder text when no level is selected", () => {
      // Arrange & Act
      render(<LevelQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      expect(screen.getByText("Select a level")).toBeInTheDocument();
    });

    it("should display selected level value", () => {
      // Arrange
      const formState: LevelQuizFormState = {
        level: "N3",
        questionCount: null,
        isSubmitting: false,
      };

      // Act
      render(<LevelQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const selectTrigger = screen.getByRole("combobox", { name: /jlpt level/i });
      expect(selectTrigger).toHaveTextContent("N3");
    });

    it("should display selected question count", () => {
      // Arrange
      const formState: LevelQuizFormState = {
        level: "",
        questionCount: 20,
        isSubmitting: false,
      };

      // Act
      render(<LevelQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const radio = screen.getByLabelText("20") as HTMLInputElement;
      expect(radio).toBeChecked();
    });
  });

  describe("User Interactions", () => {
    it("should have onChange callback when level is selected", () => {
      // Arrange
      const formState: LevelQuizFormState = {
        level: "N2",
        questionCount: null,
        isSubmitting: false,
      };

      // Act
      render(<LevelQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert - The select should show the selected value
      const selectTrigger = screen.getByRole("combobox", { name: /jlpt level/i });
      expect(selectTrigger).toHaveTextContent("N2");
    });

    it("should call onChange when question count is selected", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LevelQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

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

        // Act
        render(<LevelQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);
        await user.click(screen.getByLabelText(count.toString()));

        // Assert
        expect(mockOnChange).toHaveBeenCalledWith({ questionCount: count });
      }
    });

    it("should call onSubmit when start button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const formState: LevelQuizFormState = {
        level: "N3",
        questionCount: 10,
        isSubmitting: false,
      };

      render(<LevelQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Act
      const button = screen.getByRole("button", { name: /start level quiz/i });
      await user.click(button);

      // Assert
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe("Form Validation", () => {
    it("should disable submit button when level is not selected", () => {
      // Arrange
      const formState: LevelQuizFormState = {
        level: "",
        questionCount: 10,
        isSubmitting: false,
      };

      // Act
      render(<LevelQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const button = screen.getByRole("button", { name: /start level quiz/i });
      expect(button).toBeDisabled();
    });

    it("should disable submit button when question count is not selected", () => {
      // Arrange
      const formState: LevelQuizFormState = {
        level: "N3",
        questionCount: null,
        isSubmitting: false,
      };

      // Act
      render(<LevelQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const button = screen.getByRole("button", { name: /start level quiz/i });
      expect(button).toBeDisabled();
    });

    it("should disable submit button when both level and question count are not selected", () => {
      // Arrange & Act
      render(<LevelQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const button = screen.getByRole("button", { name: /start level quiz/i });
      expect(button).toBeDisabled();
    });

    it("should enable submit button when both level and question count are selected", () => {
      // Arrange
      const formState: LevelQuizFormState = {
        level: "N3",
        questionCount: 10,
        isSubmitting: false,
      };

      // Act
      render(<LevelQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const button = screen.getByRole("button", { name: /start level quiz/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe("Submitting State", () => {
    it("should disable submit button when isSubmitting is true", () => {
      // Arrange
      const formState: LevelQuizFormState = {
        level: "N3",
        questionCount: 10,
        isSubmitting: true,
      };

      // Act
      render(<LevelQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const button = screen.getByRole("button", { name: /start level quiz/i });
      expect(button).toBeDisabled();
    });

    it("should change button text to 'Starting...' when isSubmitting is true", () => {
      // Arrange
      const formState: LevelQuizFormState = {
        level: "N3",
        questionCount: 10,
        isSubmitting: true,
      };

      // Act
      render(<LevelQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const button = screen.getByRole("button", { name: /start level quiz/i });
      expect(button).toHaveTextContent("Starting...");
    });

    it("should disable level select when isSubmitting is true", () => {
      // Arrange
      const formState: LevelQuizFormState = {
        level: "N3",
        questionCount: 10,
        isSubmitting: true,
      };

      // Act
      render(<LevelQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert - The select trigger should have disabled attribute
      const selectTrigger = screen.getByRole("combobox", { name: /jlpt level/i });
      expect(selectTrigger).toBeDisabled();
    });

    it("should disable question count radio group when isSubmitting is true", () => {
      // Arrange
      const formState: LevelQuizFormState = {
        level: "N3",
        questionCount: 10,
        isSubmitting: true,
      };

      // Act
      render(<LevelQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

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

  describe("Error Handling", () => {
    it("should not display error message when errorMessage is undefined", () => {
      // Arrange & Act
      render(<LevelQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("should display error message when provided", () => {
      // Arrange
      const errorMessage = "Failed to create quiz. Please try again.";

      // Act
      render(
        <LevelQuizCard
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
          <LevelQuizCard
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
        <LevelQuizCard
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

  describe("Accessibility", () => {
    it("should have proper label for level select", () => {
      // Arrange & Act
      render(<LevelQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      expect(screen.getByLabelText(/jlpt level/i)).toBeInTheDocument();
      expect(screen.getByText(/number of questions/i)).toBeInTheDocument();
    });

    it("should have aria-label on submit button", () => {
      // Arrange
      const formState: LevelQuizFormState = {
        level: "N3",
        questionCount: 10,
        isSubmitting: false,
      };

      // Act
      render(<LevelQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const button = screen.getByRole("button", { name: /start level quiz/i });
      expect(button).toHaveAttribute("aria-label", "Start level quiz");
    });

    it("should have role='alert' on error message", () => {
      // Arrange
      const errorMessage = "Error occurred";

      // Act
      render(
        <LevelQuizCard
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

    it("should associate radio buttons with their labels", () => {
      // Arrange & Act
      render(<LevelQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const questionCounts = [1, 10, 20, 50];
      for (const count of questionCounts) {
        const radio = screen.getByLabelText(count.toString());
        expect(radio).toHaveAttribute("id", `level-count-${count}`);
      }
    });

    it("should have proper id for select element", () => {
      // Arrange & Act
      render(<LevelQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      const selectTrigger = screen.getByRole("combobox", { name: /jlpt level/i });
      expect(selectTrigger).toHaveAttribute("id", "level-select");
    });

    it("should have proper id for radio group", () => {
      // Arrange & Act
      render(<LevelQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

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

      const handleChange = (partial: Partial<LevelQuizFormState>) => {
        currentFormState = { ...currentFormState, ...partial };
        mockOnChange(partial);
      };

      const { rerender } = render(
        <LevelQuizCard formState={currentFormState} onChange={handleChange} onSubmit={mockOnSubmit} />
      );

      // Act & Assert - Initially button is disabled
      let button = screen.getByRole("button", { name: /start level quiz/i });
      expect(button).toBeDisabled();

      // Simulate level selection by updating state
      currentFormState = { ...currentFormState, level: "N4" };
      rerender(<LevelQuizCard formState={currentFormState} onChange={handleChange} onSubmit={mockOnSubmit} />);

      // Assert - Still disabled (no question count)
      button = screen.getByRole("button", { name: /start level quiz/i });
      expect(button).toBeDisabled();

      // Act - Select question count
      await user.click(screen.getByLabelText("20"));

      // Update form state and rerender
      currentFormState = { ...currentFormState, questionCount: 20 };
      rerender(<LevelQuizCard formState={currentFormState} onChange={handleChange} onSubmit={mockOnSubmit} />);

      // Assert - Now enabled
      button = screen.getByRole("button", { name: /start level quiz/i });
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
      const formState: LevelQuizFormState = {
        level: "N3",
        questionCount: 10,
        isSubmitting: true,
      };

      render(<LevelQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Act - Try to interact with disabled elements
      const button = screen.getByRole("button", { name: /start level quiz/i });
      await user.click(button);

      // Assert - No callbacks should be triggered on disabled button
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid selection changes", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LevelQuizCard formState={defaultFormState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Act - Rapidly change question counts
      await user.click(screen.getByLabelText("10"));
      await user.click(screen.getByLabelText("20"));
      await user.click(screen.getByLabelText("50"));
      await user.click(screen.getByLabelText("1"));

      // Assert - All changes should be captured
      expect(mockOnChange).toHaveBeenCalledTimes(4);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, { questionCount: 10 });
      expect(mockOnChange).toHaveBeenNthCalledWith(2, { questionCount: 20 });
      expect(mockOnChange).toHaveBeenNthCalledWith(3, { questionCount: 50 });
      expect(mockOnChange).toHaveBeenNthCalledWith(4, { questionCount: 1 });
    });

    it("should handle all JLPT levels correctly", () => {
      // Arrange
      const levels: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

      for (const level of levels) {
        // Act
        const formState: LevelQuizFormState = {
          level: level,
          questionCount: null,
          isSubmitting: false,
        };

        const { unmount } = render(
          <LevelQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />
        );

        // Assert
        const selectTrigger = screen.getByRole("combobox", { name: /jlpt level/i });
        expect(selectTrigger).toHaveTextContent(level);

        unmount();
      }
    });

    it("should maintain form state across re-renders", () => {
      // Arrange
      const formState: LevelQuizFormState = {
        level: "N1",
        questionCount: 50,
        isSubmitting: false,
      };

      // Act
      const { rerender } = render(
        <LevelQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />
      );

      // Rerender with same state
      rerender(<LevelQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert - State should be preserved
      const selectTrigger = screen.getByRole("combobox", { name: /jlpt level/i });
      expect(selectTrigger).toHaveTextContent("N1");

      const radio50 = screen.getByLabelText("50") as HTMLInputElement;
      expect(radio50).toBeChecked();
    });

    it("should handle empty string level correctly", () => {
      // Arrange
      const formState: LevelQuizFormState = {
        level: "",
        questionCount: 10,
        isSubmitting: false,
      };

      // Act
      render(<LevelQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

      // Assert
      expect(screen.getByText("Select a level")).toBeInTheDocument();
      const button = screen.getByRole("button", { name: /start level quiz/i });
      expect(button).toBeDisabled();
    });

    it("should handle null question count correctly", () => {
      // Arrange
      const formState: LevelQuizFormState = {
        level: "N3",
        questionCount: null,
        isSubmitting: false,
      };

      // Act
      render(<LevelQuizCard formState={formState} onChange={mockOnChange} onSubmit={mockOnSubmit} />);

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

      const button = screen.getByRole("button", { name: /start level quiz/i });
      expect(button).toBeDisabled();
    });
  });
});
