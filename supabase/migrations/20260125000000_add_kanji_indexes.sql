-- Migration: Add performance indexes for kanji table
-- Created: 2026-01-25
-- Purpose: Optimize queries for GET /api/kanji endpoint

-- Index for filtering by JLPT level
-- Improves performance when querying with level parameter
CREATE INDEX IF NOT EXISTS idx_kanji_level ON kanji(level);

-- Composite index for level filtering with sorted pagination
-- Optimizes queries that filter by level and order by id
CREATE INDEX IF NOT EXISTS idx_kanji_level_id ON kanji(level, id);

-- Comment on indexes for documentation
COMMENT ON INDEX idx_kanji_level IS 'Optimizes level filtering in GET /api/kanji';
COMMENT ON INDEX idx_kanji_level_id IS 'Optimizes level filtering with id-based pagination in GET /api/kanji';
