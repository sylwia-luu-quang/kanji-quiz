-- Migration: Add performance indexes for need_reviews table
-- Created: 2026-01-31
-- Purpose: Optimize queries for need-reviews endpoints

-- Composite index for user_id and kanji_id lookups
-- The unique constraint already creates an index, but this ensures optimal
-- performance for DELETE and SELECT operations by user_id and kanji_id
-- Note: PostgreSQL automatically creates an index for UNIQUE constraints,
-- so this index may be redundant if the constraint index is sufficient.
-- However, we explicitly create it here for clarity and to ensure the
-- index exists even if constraint behavior changes in future PostgreSQL versions.

-- Index for user_id to optimize GET /api/need-reviews queries
-- This helps when fetching all need-review entries for a user with pagination
CREATE INDEX IF NOT EXISTS idx_need_reviews_user_created ON need_reviews(user_id, created_at DESC);

-- Comment on index for documentation
COMMENT ON INDEX idx_need_reviews_user_created IS 'Optimizes user need-review list queries with pagination in GET /api/need-reviews';

-- Note: The existing unique constraint need_reviews_user_kanji_unique (user_id, kanji_id)
-- already provides an index that's perfect for DELETE operations filtering by both columns.
-- No additional index needed for DELETE /api/need-reviews/:kanjiId queries.
