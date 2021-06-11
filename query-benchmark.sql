EXPLAIN WITH RECURSIVE
    
  excluded_commits AS (
    SELECT c.commit_sha, c.parents
    FROM git_commits c
    WHERE c.git_repository_id = 259999622 AND c.commit_sha = 'a3ac79f3116ff28250fc6415d66257aea8bd4b69'
    UNION
    SELECT c.commit_sha, c.parents
    FROM git_commits c
    INNER JOIN excluded_commits ON (c.git_repository_id = 259999622 AND c.commit_sha = ANY(excluded_commits.parents))
  )
,
    
  commits AS (
    SELECT c.*
    FROM git_commits c
    WHERE c.git_repository_id = 259999622 AND c.commit_sha NOT IN (SELECT commit_sha FROM excluded_commits) AND c.commit_sha = 'c44bf105f9cfeebadc8b2150986ef7a64e02ffe0'
    UNION
    SELECT c.*
    FROM git_commits c
    INNER JOIN commits ON (c.git_repository_id = 259999622 AND c.commit_sha NOT IN (SELECT commit_sha FROM excluded_commits) AND c.commit_sha = ANY(commits.parents))
  )

  
  SELECT change.*, pr.pr_number
  FROM change_log_entries AS change
  INNER JOIN pull_requests AS pr ON (
    pr.git_repository_id = 259999622 AND pr.id = change.pull_request_id
  )
  INNER JOIN commits AS c ON (pr.merge_commit_sha = c.commit_sha)
  WHERE change.package_name = '@rollingversions/test-single-npm-package-github-actions'