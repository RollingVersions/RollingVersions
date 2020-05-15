# Write Methods

# Read Methods

## Read Pull Request State

- check permissions
- get head sha & closed state from GitHub
- run "Update Commits From Head" - with small page size because it should already be up to date because of the events
- return `git_tags`, `change_log_entries` and `package_info_records`

## Read All Unreleased Changes

Input: package name, git tag of last release (or null if not released) & optional branch name

- check permissions
- run "Update Commits From Head" - with small page size because it should already be up to date because of the events
- recursively query all commits from head that are not reachable from the git tag
- join with pull requests -> change log entries (where package name matches)
- return change log entries

## Read package infos

Input: branch name or pull request

- check permissions
- run "Update Commits From Head" - with small page size because it should already be up to date because of the events
- return `package_info_records`

# Events

## On Install

Batch job: once for all repos where this is already installed
On: [installation.created](https://developer.github.com/v3/activity/events/types/#installationevent)
On: [installation_repositories.added](https://developer.github.com/v3/activity/events/types/#installationrepositoriesevent)

- List all Pull Requests (including closed)
  - on initial load, check for the pull request state stored in comments
  - upsert into `pull_requests`
  - upsert into change log entries if state found in comments
- Get head commit for default branch
- Run "Update commits from tail"
- List all tags
  - Run "Update Commits From Head" for each tag, but do not populate `package_info_records`
  - upsert into `git_tags`

## On Branch/Tag Push

On: [create](https://developer.github.com/v3/activity/events/types/#createevent)

- Run "Update Commits From Head"
- upsert into `git_branches` or `git_tags`

## On Branch/Tag Delete

On: [delete](https://developer.github.com/v3/activity/events/types/#deleteevent)

- Delete from `git_branches` or `git_tags`

## On Pull Request Opened/Updated

On: [pull_request.opened](https://developer.github.com/v3/activity/events/types/#pullrequestevent)
On: [pull_request.reopened](https://developer.github.com/v3/activity/events/types/#pullrequestevent)
On: [pull_request.synchronize](https://github.community/t5/GitHub-API-Development-and/What-is-a-pull-request-synchronize-event/td-p/53759) - N.B. branch push may **also** be triggered, but the branch push will not be triggered for forked pull requests

- Run "Update Commits From Head"
- upsert into `pull_requests`

## On Push

On: [push](https://developer.github.com/v3/activity/events/types/#pushevent) - Triggered on branch pushes and tag pushes, but may be omitted if many tags pushed all at once

- Run "Update Commits From Head"
- upsert into `git_branches` or `git_tags`

## On Pull Request Closed

On: [pull_request.closed](https://developer.github.com/v3/activity/events/types/#pullrequestevent)

- Update `pull_requests` to mark as closed

# Procedures

## Update Commits From Head

Input: Repo + Head Commit + page size (defaults to 100)

- read history commits from head commit, starting with the newest
  - if commit already in `git_commits`:
    - if "queue" is empty", break out of loop
    - else continue to next commit
  - add commit to `git_commits`
  - consume any records from "queue" that match this commit's sha in `parent_sha`
    - insert into `git_commit_parents`
  - read commit parents
    - if commit parent is in `git_commits`, insert into `git_commit_parents`
    - else add `[parent_sha, commit_id]` to "queue"
  - read the associated pull requets for the commit
    - run "Load Pull Request"
    - insert into `git_commit_pull_requests`
  - if "queue" is empty, break out of loop
- Commit Transaction
- if head commit's `has_package_info` is `false`:
  - fetch `package_info_records` for the head commit
  - insert into `package_info_records`
  - set `has_package_info` to `true` for head commit

## Update commits from tail

Input: Repo

- read history commits from head commit of default branch, starting with the oldest commit
  - inster into `git_commits`
  - insert parents into `git_commit_parents` - we are reading from oldest to newest, so we have already inserted the parent
  - read the associated pull requets for the commit
    - run "Load Pull Request"
    - insert into `git_commit_pull_requests`
- insert into `git_branches`

## Load Pull Request

Input: Pull Request ID

- if pull request alerady loaded, no-op
- read pull request (pr number, title, open/merged/closed)
- read comments - TODO: this is only needed to read in state created before the db migration. We could do it as a one off job for all existing pull requests.
  - if comment contains state
  - write changes
