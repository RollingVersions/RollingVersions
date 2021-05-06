# Backend Refactor & CLI Simplification

1. Test in each of the test repositories (2 hours)
1. Apply db migration to production (30 minutes)
1. Deploy to production (30 minutes)

# Custom Changelog Sections:

The breaking changes/features/fixes setup is great for APIs and libraries, but doesn't always make as much sense for applications. Some users would like to define custom sections

1. Support specifying change types & versioning schema in manifest
1. Use change types from manifest in UI
1. Pass change types from manifest to all versioning API calls

# Version by Branch

For applications, version numbers should almost always be steadily increasing. Some users would like to be able to make the releases from separate release branches. For this reason, we need to consider all previous releases when determining the next number for an app.

For libraries it may be common to release a patch for an old major version. This is often done by having a "main" branch that is used to generate releases for the current major version (e.g. 2.x.x) but have branches for older major versions, from which new patch releases can be created (e.g. a 1.x.x branch). We can support this using a `versionByBranch` flag.

1. Add branch name selector to repository page
1. Pass branch name & commit sha to dispatch hook
1. Update example GitHub script to checkout correct commit/branch
1. Allow a flag to be passed in the CLI? or specified in the manifest? for `versionByBranch`.
1. Pass this flag to the backend APIs for processing changes

Bonus would allow merging back into main branch:

1. Track when one PR includes commits from another PR when searching for unreleased changes & when testing if a PR has been released

# Allow code changes without updating change set

Often the change set is written when the PR is first submitted, and it is unnecessary to ask the dev to update the change set if the code in the PR is updated, because the functionality is likely to be un-changed.

1. Add config option to leave commit status green even if changes are made to a PR
