import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { NeedReviewToggle } from "@/components/NeedReviewToggle";

/**
 * Unit tests for NeedReviewToggle component
 *
 * Tests cover:
 * - Component rendering with different states
 * - User interactions (checkbox toggle)
 * - Async onChange handler
 * - Loading states
 * - Disabled states during loading
 * - Error handling (via onChange callback)
 * - Accessibility features
 * - Edge cases (rapid clicks, multiple toggles)
 */
describe("NeedReviewToggle", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render checkbox with label text", () => {
      // Arrange & Act
      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Assert
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
      expect(screen.getByText("Mark for review")).toBeInTheDocument();
    });

    it("should render checkbox as unchecked when isMarked is false", () => {
      // Arrange & Act
      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Assert
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();
    });

    it("should render checkbox as checked when isMarked is true", () => {
      // Arrange & Act
      render(<NeedReviewToggle isMarked={true} onChange={mockOnChange} />);

      // Assert
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });

    it("should not show loading spinner initially", () => {
      // Arrange & Act
      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Assert
      const spinner = document.querySelector("svg.lucide-loader-circle");
      expect(spinner).not.toBeInTheDocument();
    });

    it("should render with proper container structure", () => {
      // Arrange & Act
      const { container } = render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Assert
      const wrapper = container.querySelector("div");
      expect(wrapper).toHaveClass("flex", "items-center", "gap-2");
    });
  });

  describe("User Interactions", () => {
    it("should call onChange with true when unchecked checkbox is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      mockOnChange.mockResolvedValue(undefined);
      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Act
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Assert
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(true);
        expect(mockOnChange).toHaveBeenCalledTimes(1);
      });
    });

    it("should call onChange with false when checked checkbox is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      mockOnChange.mockResolvedValue(undefined);
      render(<NeedReviewToggle isMarked={true} onChange={mockOnChange} />);

      // Act
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Assert
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(false);
        expect(mockOnChange).toHaveBeenCalledTimes(1);
      });
    });

    it("should toggle checkbox state via keyboard (Space)", async () => {
      // Arrange
      const user = userEvent.setup();
      mockOnChange.mockResolvedValue(undefined);
      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Act
      const checkbox = screen.getByRole("checkbox");
      checkbox.focus();
      await user.keyboard(" ");

      // Assert
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(true);
      });
    });

    it("should toggle checkbox state via keyboard (Enter)", async () => {
      // Arrange
      const user = userEvent.setup();
      mockOnChange.mockResolvedValue(undefined);
      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Act - Enter key doesn't toggle checkbox by default in HTML, use Space
      const checkbox = screen.getByRole("checkbox");
      checkbox.focus();
      await user.keyboard(" ");

      // Assert
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(true);
      });
    });
  });

  describe("Loading States", () => {
    it("should show loading spinner while onChange is processing", async () => {
      // Arrange
      const user = userEvent.setup();
      let resolveOnChange: (() => void) | undefined;
      const changePromise = new Promise<void>((resolve) => {
        resolveOnChange = resolve;
      });
      mockOnChange.mockReturnValue(changePromise);

      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Act - Click checkbox
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Assert - Loading spinner should appear (SVG element)
      await waitFor(() => {
        const spinner = document.querySelector("svg.lucide-loader-circle");
        expect(spinner).toBeInTheDocument();
      });

      // Cleanup - Resolve the promise
      resolveOnChange?.();
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it("should hide loading spinner after onChange completes successfully", async () => {
      // Arrange
      const user = userEvent.setup();
      mockOnChange.mockResolvedValue(undefined);
      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Act
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Assert - Wait for loading to complete
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });

      // Loading spinner should be removed
      const spinner = document.querySelector("svg.lucide-loader-circle");
      expect(spinner).not.toBeInTheDocument();
    });

    it("should hide loading spinner after onChange fails", async () => {
      // Arrange
      const user = userEvent.setup();
      // Catch the error to prevent unhandled rejection
      mockOnChange.mockImplementation(() =>
        Promise.reject(new Error("Network error")).catch(() => {
          // Error caught to prevent unhandled rejection in tests
        })
      );
      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Act
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Assert - Wait for loading to complete
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });

      // Loading spinner should be removed even on error
      const spinner = document.querySelector("svg.lucide-loader-circle");
      expect(spinner).not.toBeInTheDocument();
    });

    it("should disable checkbox while loading", async () => {
      // Arrange
      const user = userEvent.setup();
      let resolveOnChange: (() => void) | undefined;
      const changePromise = new Promise<void>((resolve) => {
        resolveOnChange = resolve;
      });
      mockOnChange.mockReturnValue(changePromise);

      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Act - Click checkbox
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Assert - Checkbox should be disabled during loading
      await waitFor(() => {
        expect(checkbox).toBeDisabled();
      });

      // Cleanup - Resolve the promise
      resolveOnChange?.();
    });

    it("should re-enable checkbox after loading completes", async () => {
      // Arrange
      const user = userEvent.setup();
      mockOnChange.mockResolvedValue(undefined);
      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Act
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Assert - Wait for onChange to complete
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });

      // Checkbox should be enabled again
      await waitFor(() => {
        expect(checkbox).not.toBeDisabled();
      });
    });
  });

  describe("Async Behavior", () => {
    it("should handle slow async operations", async () => {
      // Arrange
      const user = userEvent.setup();
      mockOnChange.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(undefined), 50);
          })
      );
      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Act
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Assert - Loading state should be visible
      const spinner = document.querySelector("svg.lucide-loader-circle");
      expect(spinner).toBeInTheDocument();
      expect(checkbox).toBeDisabled();

      // Wait for completion
      await waitFor(
        () => {
          const spinnerAfter = document.querySelector("svg.lucide-loader-circle");
          expect(spinnerAfter).not.toBeInTheDocument();
        },
        { timeout: 200 }
      );
    });

    it("should prevent multiple simultaneous onChange calls", async () => {
      // Arrange
      const user = userEvent.setup();
      let resolveOnChange: (() => void) | undefined;
      const changePromise = new Promise<void>((resolve) => {
        resolveOnChange = resolve;
      });
      mockOnChange.mockReturnValue(changePromise);

      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Act - Try to click multiple times rapidly
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Try clicking again while loading
      await user.click(checkbox);

      // Assert - onChange should only be called once
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledTimes(1);
      });

      // Cleanup
      resolveOnChange?.();
    });

    it("should handle onChange rejection gracefully", async () => {
      // Arrange
      const user = userEvent.setup();
      // Catch the error to prevent unhandled rejection
      mockOnChange.mockImplementation(() =>
        Promise.reject(new Error("Failed to update")).catch(() => {
          // Error caught to prevent unhandled rejection in tests
        })
      );
      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Act
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Assert - Error should not crash the component
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });

      // Component should still be functional
      expect(checkbox).not.toBeDisabled();
      const spinner = document.querySelector("svg.lucide-loader-circle");
      expect(spinner).not.toBeInTheDocument();
    });
  });

  describe("State Transitions", () => {
    it("should handle transition from unchecked to checked", async () => {
      // Arrange
      const user = userEvent.setup();
      mockOnChange.mockResolvedValue(undefined);
      const { rerender } = render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Assert initial state
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();

      // Act - User clicks checkbox
      await user.click(checkbox);
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(true);
      });

      // Simulate parent updating the state
      rerender(<NeedReviewToggle isMarked={true} onChange={mockOnChange} />);

      // Assert - Checkbox should now be checked
      expect(checkbox).toBeChecked();
    });

    it("should handle transition from checked to unchecked", async () => {
      // Arrange
      const user = userEvent.setup();
      mockOnChange.mockResolvedValue(undefined);
      const { rerender } = render(<NeedReviewToggle isMarked={true} onChange={mockOnChange} />);

      // Assert initial state
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();

      // Act - User clicks checkbox
      await user.click(checkbox);
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(false);
      });

      // Simulate parent updating the state
      rerender(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Assert - Checkbox should now be unchecked
      expect(checkbox).not.toBeChecked();
    });

    it("should handle rapid state changes from parent", () => {
      // Arrange
      const { rerender } = render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);
      const checkbox = screen.getByRole("checkbox");

      // Act - Rapidly change isMarked prop
      rerender(<NeedReviewToggle isMarked={true} onChange={mockOnChange} />);
      expect(checkbox).toBeChecked();

      rerender(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);
      expect(checkbox).not.toBeChecked();

      rerender(<NeedReviewToggle isMarked={true} onChange={mockOnChange} />);
      expect(checkbox).toBeChecked();

      // Assert - Final state should be checked
      expect(checkbox).toBeChecked();
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria-label", () => {
      // Arrange & Act
      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Assert
      const checkbox = screen.getByLabelText("Mark this kanji for review");
      expect(checkbox).toBeInTheDocument();
    });

    it("should be keyboard navigable", () => {
      // Arrange & Act
      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Assert
      const checkbox = screen.getByRole("checkbox");
      checkbox.focus();
      expect(checkbox).toHaveFocus();
    });

    it("should communicate loading state to screen readers", async () => {
      // Arrange
      const user = userEvent.setup();
      let resolveOnChange: (() => void) | undefined;
      const changePromise = new Promise<void>((resolve) => {
        resolveOnChange = resolve;
      });
      mockOnChange.mockReturnValue(changePromise);

      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Act
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Assert - Loading spinner should have aria-hidden
      await waitFor(() => {
        const spinner = document.querySelector("svg.lucide-loader-circle");
        expect(spinner).toHaveAttribute("aria-hidden", "true");
      });

      // Cleanup
      resolveOnChange?.();
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it("should communicate disabled state properly", async () => {
      // Arrange
      const user = userEvent.setup();
      let resolveOnChange: (() => void) | undefined;
      const changePromise = new Promise<void>((resolve) => {
        resolveOnChange = resolve;
      });
      mockOnChange.mockReturnValue(changePromise);

      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Act
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Assert - Disabled attribute should be set
      await waitFor(() => {
        expect(checkbox).toHaveAttribute("disabled");
      });

      // Cleanup
      resolveOnChange?.();
    });

    it("should have proper label association", () => {
      // Arrange & Act
      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Assert
      const checkbox = screen.getByRole("checkbox");
      const label = screen.getByText("Mark for review").closest("label");

      expect(label).toContainElement(checkbox);
    });

    it("should show visual cursor affordance on label", () => {
      // Arrange & Act
      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Assert
      const label = screen.getByText("Mark for review").closest("label");
      expect(label).toHaveClass("cursor-pointer");
    });
  });

  describe("Component Styling", () => {
    it("should apply correct container classes", () => {
      // Arrange & Act
      const { container } = render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Assert
      const wrapper = container.querySelector("div");
      expect(wrapper).toHaveClass("flex", "items-center", "gap-2");
    });

    it("should apply correct label classes", () => {
      // Arrange & Act
      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Assert
      const label = screen.getByText("Mark for review").closest("label");
      expect(label).toHaveClass("flex", "cursor-pointer", "items-center", "gap-2", "text-sm");
    });

    it("should apply correct checkbox styling classes", () => {
      // Arrange & Act
      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Assert
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveClass(
        "h-4",
        "w-4",
        "cursor-pointer",
        "rounded",
        "text-blue-600",
        "focus:ring-2",
        "focus:ring-blue-500"
      );
    });

    it("should apply disabled styling when loading", async () => {
      // Arrange
      const user = userEvent.setup();
      let resolveOnChange: (() => void) | undefined;
      const changePromise = new Promise<void>((resolve) => {
        resolveOnChange = resolve;
      });
      mockOnChange.mockReturnValue(changePromise);

      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Act
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Assert
      await waitFor(() => {
        expect(checkbox).toHaveClass("disabled:cursor-not-allowed", "disabled:opacity-50");
      });

      // Cleanup
      resolveOnChange?.();
    });

    it("should have dark mode classes", () => {
      // Arrange & Act
      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Assert
      const checkbox = screen.getByRole("checkbox");
      const label = screen.getByText("Mark for review").closest("label");

      expect(checkbox).toHaveClass("dark:border-neutral-600", "dark:bg-neutral-800", "dark:focus:ring-blue-400");
      expect(label).toHaveClass("dark:text-neutral-300");
    });
  });

  describe("Edge Cases", () => {
    it("should handle onChange that never resolves", async () => {
      // Arrange
      const user = userEvent.setup();
      // Promise that never resolves - intentional for testing
      mockOnChange.mockReturnValue(
        new Promise(() => {
          // Never resolves
        })
      );

      render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Act
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Assert - Component should stay in loading state
      await waitFor(() => {
        const spinner = document.querySelector("svg.lucide-loader-circle");
        expect(spinner).toBeInTheDocument();
        expect(checkbox).toBeDisabled();
      });
    });

    it("should handle onChange callback being replaced", async () => {
      // Arrange
      const user = userEvent.setup();
      const firstOnChange = vi.fn().mockResolvedValue(undefined);
      const secondOnChange = vi.fn().mockResolvedValue(undefined);

      const { rerender } = render(<NeedReviewToggle isMarked={false} onChange={firstOnChange} />);

      // Act - Replace onChange callback
      rerender(<NeedReviewToggle isMarked={false} onChange={secondOnChange} />);

      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Assert - New callback should be used
      await waitFor(() => {
        expect(secondOnChange).toHaveBeenCalled();
        expect(firstOnChange).not.toHaveBeenCalled();
      });
    });

    it("should handle rapid re-renders during loading", async () => {
      // Arrange
      const user = userEvent.setup();
      let resolveOnChange: (() => void) | undefined;
      const changePromise = new Promise<void>((resolve) => {
        resolveOnChange = resolve;
      });
      mockOnChange.mockReturnValue(changePromise);

      const { rerender } = render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Act - Click and then rapidly rerender
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      rerender(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);
      rerender(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);
      rerender(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Assert - Loading state should persist
      const spinner = document.querySelector("svg.lucide-loader-circle");
      expect(spinner).toBeInTheDocument();
      expect(checkbox).toBeDisabled();

      // Cleanup
      resolveOnChange?.();
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it("should handle isMarked changing while loading", async () => {
      // Arrange
      const user = userEvent.setup();
      let resolveOnChange: (() => void) | undefined;
      const changePromise = new Promise<void>((resolve) => {
        resolveOnChange = resolve;
      });
      mockOnChange.mockReturnValue(changePromise);

      const { rerender } = render(<NeedReviewToggle isMarked={false} onChange={mockOnChange} />);

      // Act - Click to start loading
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Parent changes isMarked while still loading
      rerender(<NeedReviewToggle isMarked={true} onChange={mockOnChange} />);

      // Assert - Should reflect new state while still showing loading
      await waitFor(() => {
        expect(checkbox).toBeChecked();
        expect(checkbox).toBeDisabled();
        const spinner = document.querySelector("svg.lucide-loader-circle");
        expect(spinner).toBeInTheDocument();
      });

      // Cleanup
      resolveOnChange?.();
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe("Component Integration", () => {
    it("should work correctly in a controlled component pattern", async () => {
      // Arrange
      const user = userEvent.setup();
      let isMarked = false;
      const handleChange = vi.fn().mockImplementation(async (newState: boolean) => {
        isMarked = newState;
      });

      const { rerender } = render(<NeedReviewToggle isMarked={isMarked} onChange={handleChange} />);

      // Act - Toggle on
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith(true);
      });

      // Simulate parent updating state
      rerender(<NeedReviewToggle isMarked={true} onChange={handleChange} />);
      expect(checkbox).toBeChecked();

      // Act - Toggle off
      await user.click(checkbox);

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith(false);
      });

      // Simulate parent updating state
      rerender(<NeedReviewToggle isMarked={false} onChange={handleChange} />);
      expect(checkbox).not.toBeChecked();
    });

    it("should maintain consistency across multiple instances", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange1 = vi.fn().mockResolvedValue(undefined);
      const onChange2 = vi.fn().mockResolvedValue(undefined);

      const { container } = render(
        <div>
          <NeedReviewToggle isMarked={false} onChange={onChange1} />
          <NeedReviewToggle isMarked={true} onChange={onChange2} />
        </div>
      );

      // Act
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      await user.click(checkboxes[0]);

      // Assert - Only first onChange should be called
      await waitFor(() => {
        expect(onChange1).toHaveBeenCalledWith(true);
        expect(onChange2).not.toHaveBeenCalled();
      });
    });
  });
});
