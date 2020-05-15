CREATE TABLE git_repositories (
  id INT NOT NULL PRIMARY KEY,
  graphql_id TEXT NOT NULL,
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  default_branch_name TEXT NOT NULL
);

COMMENT ON COLUMN git_repositories.id IS 'The databaseId from GitHub';

CREATE TABLE git_commits (
  id BIGSERIAL NOT NULL PRIMARY KEY,
  graphql_id TEXT NOT NULL,
  git_repository_id INT NOT NULL REFERENCES git_repositories(id),
  commit_sha TEXT NOT NULL,
  has_package_info BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (git_repository_id, commit_sha)
);
COMMENT ON COLUMN git_commits.has_package_info IS 'Have we fetched the package_info_records for this commit';

CREATE TABLE git_commit_parents (
  child_git_commit_id BIGINT NOT NULL REFERENCES git_commits(id),
  parent_git_commit_id BIGINT NOT NULL REFERENCES git_commits(id),
  PRIMARY KEY (child_git_commit_id, parent_git_commit_id)
);

CREATE TABLE git_tags (
  id BIGSERIAL NOT NULL PRIMARY KEY,
  graphql_id TEXT NOT NULL,
  git_repository_id INT NOT NULL REFERENCES git_repositories(id),
  name TEXT NOT NULL,
  target_git_commit_id BIGINT NOT NULL REFERENCES git_commits(id),
  UNIQUE (git_repository_id, name)
);

CREATE TABLE git_branches (
  id BIGSERIAL NOT NULL PRIMARY KEY,
  graphql_id TEXT NOT NULL,
  git_repository_id INT NOT NULL REFERENCES git_repositories(id),
  name TEXT NOT NULL,
  target_git_commit_id BIGINT NOT NULL REFERENCES git_commits(id),
  UNIQUE (git_repository_id, name)
);

CREATE TABLE pull_requests (
  id INT NOT NULL PRIMARY KEY,
  graphql_id TEXT NOT NULL,
  git_repository_id INT NOT NULL REFERENCES git_repositories(id),
  pr_number INT NOT NULL,
  title TEXT NOT NULL,
  is_merged BOOLEAN NOT NULL DEFAULT false,
  is_closed BOOLEAN NOT NULL DEFAULT false,

  change_set_submitted_at_git_commit_sha TEXT NULL
);

COMMENT ON COLUMN pull_requests.id IS 'The databaseId from GitHub';

CREATE TABLE git_commit_pull_requests (
  git_commit_id BIGINT NOT NULL REFERENCES git_commits(id),
  pull_request_id INT NOT NULL REFERENCES pull_requests(id),
  PRIMARY KEY (git_commit_id, pull_request_id)
);

CREATE TABLE change_log_entry_kinds (
  id TEXT NOT NULL PRIMARY KEY
);
INSERT INTO change_log_entry_kinds (id) VALUES ('breaking'), ('feat'), ('fix'), ('refactor'), ('perf');

CREATE TABLE change_log_entries (
  id BIGSERIAL NOT NULL PRIMARY KEY,
  pull_request_id INT NOT NULL REFERENCES pull_requests(id),
  package_name TEXT NOT NULL,
  sort_order_weight DOUBLE PRECISION NOT NULL,
  kind TEXT NOT NULL REFERENCES change_log_entry_kinds(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL
);

-- package_info is just a cache and can be re-fetched for a given commit

CREATE TABLE publish_targets (
  id TEXT NOT NULL PRIMARY KEY
);
INSERT INTO publish_targets (id) VALUES ('npm');

CREATE TABLE package_info_records (
  id BIGSERIAL NOT NULL PRIMARY KEY,
  git_commit_id BIGINT NOT NULL REFERENCES git_commits(id),
  file_path TEXT NOT NULL,
  publish_target TEXT NOT NULL REFERENCES publish_targets(id),
  package_name TEXT NOT NULL,
  publish_access TEXT NOT NULL, -- 'restricted' | 'public'
  not_to_be_published BOOLEAN NOT NULL DEFAULT false
);
