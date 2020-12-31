ALTER TABLE git_commits
  ADD COLUMN package_manifests_loaded_version INT NULL;

CREATE TABLE package_manifest_records_v2 (
  id BIGSERIAL NOT NULL PRIMARY KEY,
  git_commit_id BIGINT NOT NULL REFERENCES git_commits(id),
  schema_version INT NOT NULL,
  package_name TEXT NOT NULL,
  manifest JSONB NOT NULL,
  UNIQUE (git_commit_id, schema_version, package_name)
);
