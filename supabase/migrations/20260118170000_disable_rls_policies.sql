-- migration: disable rls policies for kanji quiz tables
-- purpose: disable row level security so existing policies are not enforced

alter table kanji disable row level security;
alter table quiz disable row level security;
alter table quiz_questions disable row level security;
alter table need_reviews disable row level security;
