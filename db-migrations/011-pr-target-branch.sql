ALTER TABLE pull_requests
  ADD COLUMN base_ref_name TEXT NULL,
  ADD COLUMN head_ref_name TEXT NULL;
