CREATE TABLE release_descriptions (
  id BIGSERIAL NOT NULL PRIMARY KEY,
  git_repository_id BIGINT NOT NULL REFERENCES git_repositories(id),
  package_name TEXT NOT NULL,
  current_version TEXT NOT NULL,
  release_description TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (git_repository_id, package_name, current_version)
);