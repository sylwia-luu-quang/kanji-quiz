import { vi } from "vitest";

/**
 * Mock Supabase client for testing
 */
export const createMockSupabaseClient = () => {
  return {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn(),
  };
};

/**
 * Mock successful authentication response
 */
export const mockAuthSuccess = {
  data: {
    user: {
      id: "test-user-id",
      email: "test@example.com",
      created_at: "2024-01-01T00:00:00.000Z",
    },
    session: {
      access_token: "test-access-token",
      refresh_token: "test-refresh-token",
    },
  },
  error: null,
};

/**
 * Mock authentication error response
 */
export const mockAuthError = {
  data: { user: null, session: null },
  error: {
    message: "Invalid credentials",
    status: 400,
  },
};
