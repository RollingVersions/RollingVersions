CREATE TABLE git_commit_parent_cursors (
  id BIGSERIAL NOT NULL PRIMARY KEY,
  git_repository_id BIGINT NOT NULL REFERENCES git_repositories(id),
  commit_graph_id TEXT NOT NULL,
  end_cursor TEXT NOT NULL,
  UNIQUE (commit_graph_id, end_cursor)
);

CREATE TABLE git_commit_parent_shas (
  id BIGSERIAL NOT NULL PRIMARY KEY,
  git_repository_id BIGINT NOT NULL REFERENCES git_repositories(id),
  child_git_commit_id BIGINT NOT NULL REFERENCES git_commits(id),
  parent_git_commit_sha TEXT NOT NULL,
  parent_cursor_id BIGINT NOT NULL REFERENCES git_commit_parent_cursors(id),
  UNIQUE (child_git_commit_id, parent_git_commit_sha)
);

ALTER TABLE git_repositories
  ADD COLUMN tags_refreshed_at TIMESTAMPTZ NULL,
  ADD COLUMN pull_requests_refreshed_at TIMESTAMPTZ NULL,
  ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE git_commits
  ADD COLUMN loaded_related_data BOOLEAN NOT NULL DEFAULT true;
-- Once all is deployed:
-- ALTER COLUMN loaded_related_data DROP DEFAULT;

ALTER TABLE pull_requests
  ADD COLUMN head_git_commit_id BIGINT NULL REFERENCES git_commits(id),
  ADD COLUMN comment_body TEXT NULL;

CREATE TABLE git_repository_aliases (
  id BIGSERIAL NOT NULL PRIMARY KEY,
  git_repository_id BIGINT NOT NULL REFERENCES git_repositories(id),
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE (owner, name)
);

INSERT INTO git_repository_aliases (git_repository_id, owner, name)
SELECT id AS git_repository_id, owner, name FROM git_repositories;

CREATE TABLE git_commit_status (
  id BIGSERIAL NOT NULL PRIMARY KEY,
  commit_id BIGINT NOT NULL REFERENCES git_commits (id),
  state TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT NOT NULL,
  UNIQUE (commit_id)
)