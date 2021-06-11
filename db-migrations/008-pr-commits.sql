ALTER TABLE git_refs
  ADD COLUMN pr_number BIGINT NULL,
  ADD COLUMN pr_ref_kind TEXT NULL;

CREATE INDEX git_refs_git_repository_id_pr_number_commit_sha_idx ON git_refs (git_repository_id, pr_number, commit_sha);
CREATE INDEX pull_requests_git_repository_id_idx ON pull_requests (git_repository_id);