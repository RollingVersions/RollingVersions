ALTER TABLE git_refs
  ADD COLUMN pr_number BIGINT NULL,
  ADD COLUMN pr_ref_kind TEXT NULL;