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
  has_package_info BOOLEAN NOT NULL DEFAULT false
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

  head_git_commit_id BIGINT NULL REFERENCES git_commits(id),

  change_set_submitted_at_git_commit_id BIGINT NULL REFERENCES git_commits(id),
  package_info_fetched_at_commit_id BIGINT NULL REFERENCES git_commits(id)
);

COMMENT ON COLUMN pull_requests.id IS 'The databaseId from GitHub';

CREATE TABLE git_commit_pull_requests (
  git_commit_id BIGINT NOT NULL REFERENCES git_commits(id),
  pull_request_id BIGINT NOT NULL REFERENCES pull_requests(id),
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


INSERT INTO git_repositories (id, graphql_id, owner, name, default_branch)
VALUES (-1, 'FAKE_ID', 'ForbesLindesay', 'non-existent-test-repo', 'master');

INSERT INTO git_commits (id, graphql_id, git_repository_id, commit_sha, has_package_info)
VALUES (1, 'FAKE_ID_1', -1, 'shashasha1', false),
       (2, 'FAKE_ID_2', -1, 'shashasha2', false),
       (3, 'FAKE_ID_3', -1, 'shashasha3', false),
       (4, 'FAKE_ID_4', -1, 'shashasha4', false);

INSERT INTO git_commit_parents (child_git_commit_id, parent_git_commit_id)
VALUES (1, 2),
       (1, 3),
       (2, 4),
       (3, 4);