CREATE TABLE git2_refs (
  id BIGSERIAL NOT NULL PRIMARY KEY,
  git_repository_id BIGINT NOT NULL REFERENCES git_repositories (id),
  kind TEXT NOT NULL, -- "tags" and "heads"
  name TEXT NOT NULL, -- everything after "refs/heads/" or "refs/tags/"
  git_commit_id BIGINT NOT NULL REFERENCES git_commits(id),
  UNIQUE (git_repository_id, kind, name)
);
CREATE TABLE git2_commits (
  id BIGSERIAL NOT NULL PRIMARY KEY,
  git_repository_id BIGINT NOT NULL REFERENCES git_repositories (id),
  object_id TEXT NOT NULL,
  parent_object_ids TEXT[] NOT NULL,
  message TEXT NOT NULL,
  UNIQUE (git_repository_id, object_id)
);