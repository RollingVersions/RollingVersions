DROP TABLE package_dependency_records;
DROP TABLE package_dependency_records_kinds;
DROP TABLE package_manifest_records;
DROP TABLE package_manifest_records_v2;
DROP TABLE publish_targets;
DROP TABLE git_branches;
DROP TABLE git_tags;
DROP TABLE git_commit_pull_requests;
DROP TABLE git_commit_parents;
DROP TABLE git_commits;

ALTER TABLE git_repositories
  ADD COLUMN remote_git_version BIGINT NOT NULL DEFAULT 1,
  ADD COLUMN local_git_version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE pull_requests
  ADD COLUMN comment_updated_at_commit_sha TEXT NULL,
  ADD COLUMN status_updated_at_commit_sha TEXT NULL,
  ADD COLUMN merge_commit_sha TEXT NULL;

CREATE TABLE git_commits (
  git_repository_id BIGINT NOT NULL REFERENCES git_repositories(id),
  commit_sha TEXT NOT NULL,
  message TEXT NOT NULL,
  parents TEXT[] NOT NULL,
  PRIMARY KEY (git_repository_id, commit_sha)
);

CREATE TABLE git_refs (
  git_repository_id BIGINT NOT NULL REFERENCES git_repositories(id),
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  commit_sha TEXT NOT NULL,
  PRIMARY KEY (git_repository_id, kind, name)
);
