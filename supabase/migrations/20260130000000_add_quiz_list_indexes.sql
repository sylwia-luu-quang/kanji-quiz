-- Migration: Add performance indexes for quiz table
-- Created: 2026-01-30
-- Purpose: Optimize queries for GET /api/quizzes endpoint

-- Index for filtering by user_id and status with sorted pagination
-- Optimizes the most common query pattern: user's quizzes filtered by status
-- This is more specific than the existing quiz_user_created_idx and will be
-- used by the query planner when status filtering is applied
CREATE INDEX IF NOT EXISTS idx_quiz_user_status_created ON quiz(user_id, status, created_at DESC);

-- Index for status filtering alone (useful for analytics or admin queries)
-- Also benefits queries that filter by status across all users
CREATE INDEX IF NOT EXISTS idx_quiz_status ON quiz(status);

-- Comment on indexes for documentation
COMMENT ON INDEX idx_quiz_user_status_created IS 'Optimizes user quiz list with status filtering and pagination in GET /api/quizzes';
COMMENT ON INDEX idx_quiz_status IS 'Optimizes status-based filtering and analytics queries';
