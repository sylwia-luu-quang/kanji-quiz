import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock environment variables
vi.stubEnv("PUBLIC_SUPABASE_URL", "http://localhost:54321");
vi.stubEnv("PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  disconnect() {
    // Mock implementation - no action needed
  }
  observe() {
    // Mock implementation - no action needed
  }
  takeRecords() {
    return [];
  }
  unobserve() {
    // Mock implementation - no action needed
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;
