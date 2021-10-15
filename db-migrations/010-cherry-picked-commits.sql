ALTER TABLE git_commits
  ADD COLUMN cherry_picked_from TEXT[] NULL;

CREATE INDEX git_commits_git_repository_id_cherry_picked_from_idx
  ON git_commits (git_repository_id, cherry_picked_from);
