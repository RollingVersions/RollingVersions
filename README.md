# Changelog Version

Add changelogs to PRs and use them to determine the version of npm packages

It has no state of its own. The changelog for each PR is stored along with the corresponding PR (in a comment). The CLI tool will require a GitHub API token to read the changelog, and write to releases. It will require an npm token to publish to npm.

## Web Endpoints

Get Logs: `kubectl logs -lapp=changelogversion-staging --namespace changelogversion --tail=100`

### Authentication

1. authenticate to GitHub using OAuth as the user
1. fetch the PR using the user's OAuth token
1. check the user has "admin" or "write" permission
1. fetch the installation ID for the given repository
1. authenticate to GitHub using the installation ID - use this for subsequent requests

### Render Editor

1. read the changelog from as single GitHub comment

### Update

1. write the changelog by upserting a single GitHub comment
1. update a status from pending (no changelog) to success (a changelog is present, even an empty one)

## Events

On pull request open/update:

1. add a comment (if not already present) with a link to edit the changelog and the current status of the changelog
1. add a status that's pending (for no changelog) or success (a changelog is present, even an empty one)

## CLI

### Publish (--dry-run)?

1. get the latest version for each package from npm
1. get the last deployed commit for each package via tags (error if no tag matching latest npm package name with instructions on tagging a specific commit)
1. for each commit between current and the last deployed
1. get the associated pull request
1. get and merge the change logs
1. log out the merged release notes
1. check we have permission to publish the npm package
1. check we have permission to write to GitHub releases
1. abort if the latest commit does not match the currently building commit
1. if not dry run
1. create the GitHub release with changelog
1. publish the npm package
