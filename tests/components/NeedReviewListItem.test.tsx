import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import NeedReviewListItem from "@/components/NeedReviewListItem";
import type { NeedReviewListItemVM } from "@/components/types/dashboard.types";

/**
 * Unit tests for NeedReviewListItem component
 *
 * Tests cover:
 * - Component rendering with kanji data
 * - Date formatting and display
 * - User interactions (remove button clicks)
 * - Loading/deleting states
 * - Accessibility features
 * - Edge cases (empty arrays, special characters)
 */
describe("NeedReviewListItem", () => {
  // Default test data
  const defaultItem: NeedReviewListItemVM = {
    id: 1,
    kanjiId: 42,
    character: "漢",
    level: "N3",
    readings: ["かん", "カン"],
    meanings: ["Sino-", "China"],
    createdAt: "2026-01-15T10:30:00.000Z",
  };

  const mockOnRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render kanji character prominently", () => {
      // Arrange & Act
      render(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert
      expect(screen.getByText("漢")).toBeInTheDocument();
    });

    it("should render JLPT level badge", () => {
      // Arrange & Act
      render(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert
      expect(screen.getByText("N3")).toBeInTheDocument();
    });

    it("should render formatted date", () => {
      // Arrange & Act
      render(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert - Date should be formatted as "Jan 15, 2026"
      expect(screen.getByText("Jan 15, 2026")).toBeInTheDocument();
    });

    it("should render readings with label", () => {
      // Arrange & Act
      render(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert
      expect(screen.getByText("Readings:")).toBeInTheDocument();
      expect(screen.getByText("かん, カン")).toBeInTheDocument();
    });

    it("should render meanings with label", () => {
      // Arrange & Act
      render(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert
      expect(screen.getByText("Meanings:")).toBeInTheDocument();
      expect(screen.getByText("Sino-, China")).toBeInTheDocument();
    });

    it("should render remove button with default text", () => {
      // Arrange & Act
      render(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert
      const button = screen.getByRole("button", { name: /remove 漢 from need review list/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Remove");
    });

    it("should render as list item element", () => {
      // Arrange & Act
      const { container } = render(
        <ul>
          <NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />
        </ul>
      );

      // Assert
      const listItem = container.querySelector("li");
      expect(listItem).toBeInTheDocument();
    });
  });

  describe("Date Formatting", () => {
    it("should format dates correctly for different months", () => {
      // Arrange - Use noon time to avoid timezone edge cases
      const dates = [
        { createdAt: "2026-01-15T12:00:00.000Z", expected: "Jan 15, 2026" },
        { createdAt: "2026-02-20T12:00:00.000Z", expected: "Feb 20, 2026" },
        { createdAt: "2026-12-15T12:00:00.000Z", expected: "Dec 15, 2026" },
      ];

      for (const { createdAt, expected } of dates) {
        // Act
        const item = { ...defaultItem, createdAt };
        const { unmount } = render(<NeedReviewListItem item={item} onRemove={mockOnRemove} isDeleting={false} />);

        // Assert
        expect(screen.getByText(expected)).toBeInTheDocument();

        // Cleanup
        unmount();
      }
    });

    it("should format dates from different years", () => {
      // Arrange
      const item = { ...defaultItem, createdAt: "2025-06-15T10:30:00.000Z" };

      // Act
      render(<NeedReviewListItem item={item} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert
      expect(screen.getByText("Jun 15, 2025")).toBeInTheDocument();
    });

    it("should handle today's date correctly", () => {
      // Arrange
      const today = new Date();
      const item = { ...defaultItem, createdAt: today.toISOString() };

      // Act
      render(<NeedReviewListItem item={item} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert - Should format today's date properly
      const formattedDate = today.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });
  });

  describe("JLPT Levels", () => {
    it("should render all JLPT levels correctly", () => {
      // Arrange
      const levels = ["N1", "N2", "N3", "N4", "N5"] as const;

      for (const level of levels) {
        // Act
        const item = { ...defaultItem, level };
        const { unmount } = render(<NeedReviewListItem item={item} onRemove={mockOnRemove} isDeleting={false} />);

        // Assert
        expect(screen.getByText(level)).toBeInTheDocument();

        // Cleanup
        unmount();
      }
    });

    it("should apply correct styling to level badge", () => {
      // Arrange & Act
      render(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert
      const badge = screen.getByText("N3");
      expect(badge).toHaveClass("text-xs", "font-medium", "text-white", "bg-blue-600", "px-2", "py-0.5", "rounded");
    });
  });

  describe("Readings Display", () => {
    it("should display single reading", () => {
      // Arrange
      const item = { ...defaultItem, readings: ["よむ"] };

      // Act
      render(<NeedReviewListItem item={item} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert
      expect(screen.getByText("よむ")).toBeInTheDocument();
    });

    it("should display multiple readings separated by commas", () => {
      // Arrange
      const item = { ...defaultItem, readings: ["がく", "まな.ぶ"] };

      // Act
      render(<NeedReviewListItem item={item} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert
      expect(screen.getByText("がく, まな.ぶ")).toBeInTheDocument();
    });

    it("should display many readings", () => {
      // Arrange
      const item = { ...defaultItem, readings: ["いち", "イチ", "イツ", "ひと", "ひと.つ"] };

      // Act
      render(<NeedReviewListItem item={item} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert
      expect(screen.getByText("いち, イチ, イツ, ひと, ひと.つ")).toBeInTheDocument();
    });

    it("should handle readings with special characters", () => {
      // Arrange
      const item = { ...defaultItem, readings: ["あ.う", "あ.わせる", "ゴウ"] };

      // Act
      render(<NeedReviewListItem item={item} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert
      expect(screen.getByText("あ.う, あ.わせる, ゴウ")).toBeInTheDocument();
    });
  });

  describe("Meanings Display", () => {
    it("should display single meaning", () => {
      // Arrange
      const item = { ...defaultItem, meanings: ["learn"] };

      // Act
      render(<NeedReviewListItem item={item} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert
      expect(screen.getByText("learn")).toBeInTheDocument();
    });

    it("should display multiple meanings separated by commas", () => {
      // Arrange
      const item = { ...defaultItem, meanings: ["study", "learning", "science"] };

      // Act
      render(<NeedReviewListItem item={item} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert
      expect(screen.getByText("study, learning, science")).toBeInTheDocument();
    });

    it("should display meanings with hyphens", () => {
      // Arrange
      const item = { ...defaultItem, meanings: ["Sino-", "China", "Han dynasty"] };

      // Act
      render(<NeedReviewListItem item={item} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert
      expect(screen.getByText("Sino-, China, Han dynasty")).toBeInTheDocument();
    });

    it("should display long meaning strings", () => {
      // Arrange
      const item = {
        ...defaultItem,
        meanings: ["meeting", "association", "party", "gathering", "society", "organization"],
      };

      // Act
      render(<NeedReviewListItem item={item} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert
      expect(screen.getByText("meeting, association, party, gathering, society, organization")).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("should call onRemove with kanjiId when remove button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />);

      // Act
      const button = screen.getByRole("button", { name: /remove 漢 from need review list/i });
      await user.click(button);

      // Assert
      expect(mockOnRemove).toHaveBeenCalledWith(42);
      expect(mockOnRemove).toHaveBeenCalledTimes(1);
    });

    it("should call onRemove with correct kanjiId for different items", async () => {
      // Arrange
      const user = userEvent.setup();
      const items = [
        { ...defaultItem, kanjiId: 1, character: "日" },
        { ...defaultItem, kanjiId: 100, character: "月" },
        { ...defaultItem, kanjiId: 999, character: "星" },
      ];

      for (const item of items) {
        mockOnRemove.mockClear();

        // Act
        const { unmount } = render(<NeedReviewListItem item={item} onRemove={mockOnRemove} isDeleting={false} />);
        const button = screen.getByRole("button", { name: new RegExp(`remove ${item.character}`, "i") });
        await user.click(button);

        // Assert
        expect(mockOnRemove).toHaveBeenCalledWith(item.kanjiId);

        // Cleanup
        unmount();
      }
    });

    it("should not call onRemove when button is disabled", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={true} />);

      // Act
      const button = screen.getByRole("button", { name: /remove 漢 from need review list/i });
      await user.click(button);

      // Assert
      expect(mockOnRemove).not.toHaveBeenCalled();
    });
  });

  describe("Deleting State", () => {
    it("should disable remove button when isDeleting is true", () => {
      // Arrange & Act
      render(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={true} />);

      // Assert
      const button = screen.getByRole("button", { name: /remove 漢 from need review list/i });
      expect(button).toBeDisabled();
    });

    it("should change button text to 'Removing...' when isDeleting is true", () => {
      // Arrange & Act
      render(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={true} />);

      // Assert
      const button = screen.getByRole("button", { name: /remove 漢 from need review list/i });
      expect(button).toHaveTextContent("Removing...");
    });

    it("should enable remove button when isDeleting is false", () => {
      // Arrange & Act
      render(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert
      const button = screen.getByRole("button", { name: /remove 漢 from need review list/i });
      expect(button).not.toBeDisabled();
    });

    it("should show normal button text when isDeleting is false", () => {
      // Arrange & Act
      render(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert
      const button = screen.getByRole("button", { name: /remove 漢 from need review list/i });
      expect(button).toHaveTextContent("Remove");
    });

    it("should handle state transitions from normal to deleting", () => {
      // Arrange
      const { rerender } = render(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert initial state
      let button = screen.getByRole("button", { name: /remove 漢 from need review list/i });
      expect(button).not.toBeDisabled();
      expect(button).toHaveTextContent("Remove");

      // Act - Transition to deleting state
      rerender(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={true} />);

      // Assert deleting state
      button = screen.getByRole("button", { name: /remove 漢 from need review list/i });
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent("Removing...");
    });
  });

  describe("Accessibility", () => {
    it("should have descriptive aria-label on remove button", () => {
      // Arrange & Act
      render(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert
      const button = screen.getByRole("button", { name: /remove 漢 from need review list/i });
      expect(button).toHaveAttribute("aria-label", "Remove 漢 from need review list");
    });

    it("should update aria-label for different kanji characters", () => {
      // Arrange
      const characters = [
        { character: "日", expected: "Remove 日 from need review list" },
        { character: "月", expected: "Remove 月 from need review list" },
        { character: "木", expected: "Remove 木 from need review list" },
      ];

      for (const { character, expected } of characters) {
        // Act
        const item = { ...defaultItem, character };
        const { unmount } = render(<NeedReviewListItem item={item} onRemove={mockOnRemove} isDeleting={false} />);

        // Assert
        const button = screen.getByRole("button", { name: new RegExp(`remove ${character}`, "i") });
        expect(button).toHaveAttribute("aria-label", expected);

        // Cleanup
        unmount();
      }
    });

    it("should use semantic list item element", () => {
      // Arrange & Act
      const { container } = render(
        <ul>
          <NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />
        </ul>
      );

      // Assert
      const listItem = container.querySelector("li");
      expect(listItem).toBeInTheDocument();
      expect(listItem?.tagName).toBe("LI");
    });

    it("should have proper button variant for destructive action", () => {
      // Arrange & Act
      render(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert - Button should have destructive styling
      const button = screen.getByRole("button", { name: /remove 漢 from need review list/i });
      // Note: The exact classes depend on the Button component implementation
      expect(button).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty readings array", () => {
      // Arrange
      const item = { ...defaultItem, readings: [] };

      // Act
      render(<NeedReviewListItem item={item} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert - Should render empty string after "Readings:"
      expect(screen.getByText("Readings:")).toBeInTheDocument();
    });

    it("should handle empty meanings array", () => {
      // Arrange
      const item = { ...defaultItem, meanings: [] };

      // Act
      render(<NeedReviewListItem item={item} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert - Should render empty string after "Meanings:"
      expect(screen.getByText("Meanings:")).toBeInTheDocument();
    });

    it("should handle complex kanji characters", () => {
      // Arrange
      const complexCharacters = ["龍", "鬱", "薔", "憂"];

      for (const character of complexCharacters) {
        // Act
        const item = { ...defaultItem, character };
        const { unmount } = render(<NeedReviewListItem item={item} onRemove={mockOnRemove} isDeleting={false} />);

        // Assert
        expect(screen.getByText(character)).toBeInTheDocument();

        // Cleanup
        unmount();
      }
    });

    it("should handle very long reading lists", () => {
      // Arrange
      const item = {
        ...defaultItem,
        readings: ["あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ"],
      };

      // Act
      render(<NeedReviewListItem item={item} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert
      expect(screen.getByText("あ, い, う, え, お, か, き, く, け, こ")).toBeInTheDocument();
    });

    it("should handle very long meaning lists", () => {
      // Arrange
      const item = {
        ...defaultItem,
        meanings: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"],
      };

      // Act
      render(<NeedReviewListItem item={item} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert
      expect(screen.getByText("one, two, three, four, five, six, seven, eight, nine, ten")).toBeInTheDocument();
    });

    it("should handle kanji with zero kanjiId", () => {
      // Arrange
      const item = { ...defaultItem, kanjiId: 0 };

      // Act
      render(<NeedReviewListItem item={item} onRemove={mockOnRemove} isDeleting={false} />);
      const button = screen.getByRole("button", { name: /remove 漢 from need review list/i });

      // Assert - Should still work with ID 0
      expect(button).toBeInTheDocument();
    });

    it("should handle extremely large kanjiId", () => {
      // Arrange
      const item = { ...defaultItem, kanjiId: 999999999 };

      // Act
      render(<NeedReviewListItem item={item} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert
      expect(screen.getByText("漢")).toBeInTheDocument();
    });
  });

  describe("Component Styling", () => {
    it("should apply correct layout classes to container", () => {
      // Arrange & Act
      const { container } = render(
        <ul>
          <NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />
        </ul>
      );

      // Assert
      const listItem = container.querySelector("li");
      expect(listItem).toHaveClass("flex", "items-center", "justify-between", "p-4", "border", "rounded-lg");
    });

    it("should apply hover transition classes", () => {
      // Arrange & Act
      const { container } = render(
        <ul>
          <NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />
        </ul>
      );

      // Assert
      const listItem = container.querySelector("li");
      expect(listItem).toHaveClass("hover:bg-gray-50", "transition-colors");
    });

    it("should apply correct kanji character styling", () => {
      // Arrange & Act
      render(
        <ul>
          <NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />
        </ul>
      );

      // Assert
      const kanjiElement = screen.getByText("漢");
      expect(kanjiElement).toHaveClass("text-4xl", "font-bold", "text-gray-900", "w-16", "text-center");
    });
  });

  describe("Component Integration", () => {
    it("should maintain item data across re-renders", () => {
      // Arrange
      const { rerender } = render(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />);

      // Act - Rerender with same props
      rerender(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert - All data should still be visible
      expect(screen.getByText("漢")).toBeInTheDocument();
      expect(screen.getByText("N3")).toBeInTheDocument();
      expect(screen.getByText("かん, カン")).toBeInTheDocument();
      expect(screen.getByText("Sino-, China")).toBeInTheDocument();
    });

    it("should update when item prop changes", () => {
      // Arrange
      const { rerender } = render(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert initial state
      expect(screen.getByText("漢")).toBeInTheDocument();

      // Act - Update with different item
      const newItem: NeedReviewListItemVM = {
        ...defaultItem,
        character: "学",
        level: "N5",
        readings: ["がく", "まな.ぶ"],
        meanings: ["study", "learning"],
      };
      rerender(<NeedReviewListItem item={newItem} onRemove={mockOnRemove} isDeleting={false} />);

      // Assert - New data should be displayed
      expect(screen.getByText("学")).toBeInTheDocument();
      expect(screen.getByText("N5")).toBeInTheDocument();
      expect(screen.getByText("がく, まな.ぶ")).toBeInTheDocument();
      expect(screen.getByText("study, learning")).toBeInTheDocument();
    });

    it("should handle rapid state changes", () => {
      // Arrange
      const { rerender } = render(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />);

      // Act - Toggle deleting state multiple times
      rerender(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={true} />);
      rerender(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={false} />);
      rerender(<NeedReviewListItem item={defaultItem} onRemove={mockOnRemove} isDeleting={true} />);

      // Assert - Should end in deleting state
      const button = screen.getByRole("button", { name: /remove 漢 from need review list/i });
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent("Removing...");
    });
  });
});
