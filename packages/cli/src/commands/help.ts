export default function printHelp() {
  console.warn(`Usage: rollingversions publish <options>`);
  console.warn(``);
  console.warn(`options:

 -h --help                      View these options
 -d --dry-run                   Run without actually publishing packages
    --supress-errors            Always exit with "0" status code, even
                                if publishing fails
 -r --repo           owner/slug The repo being published, can be detected
                                automatically on most CI systems.
 -g --github-token   token      A GitHub access token with at least "repo"
                                scope. Used to read changelogs and write
                                git tags/releases. You can alternatively
                                just set the GITHUB_TOKEN enviornment variable.
 -b --deploy-branch  branch     The branch to deploy from. This will default
                                to your default branch on GitHub.`);
  console.warn(``);
}
